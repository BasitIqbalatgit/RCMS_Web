// /app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import connectDB from '@/lib/db/mongodb';
import Transaction, { TransactionStatus } from '@/lib/db/models/Transaction';
import User from '@/lib/db/models/User';
import mongoose from 'mongoose';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = (await headers()).get('stripe-signature');

    if (!signature || !endpointSecret) {
      console.error('Missing stripe signature or endpoint secret');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    await connectDB();

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      
      case 'charge.dispute.created':
        await handleChargeDispute(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handlePaymentSucceeded(paymentIntent: any) {
  try {
    const transaction = await Transaction.findOne({
      stripePaymentIntentId: paymentIntent.id
    });

    if (!transaction) {
      console.error(`Transaction not found for payment intent: ${paymentIntent.id}`);
      return;
    }

    // Only process if transaction status has actually changed
    if (transaction.status === TransactionStatus.COMPLETED) {
      console.log(`Transaction ${transaction._id} already completed, skipping`);
      return;
    }

    // Only process if currently pending (avoid processing failed/refunded transactions)
    if (transaction.status !== TransactionStatus.PENDING) {
      console.log(`Transaction ${transaction._id} has status ${transaction.status}, cannot complete`);
      return;
    }

    // Start database transaction for atomicity
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Prepare update data - only change what's necessary
      const updateData: any = {
        status: TransactionStatus.COMPLETED,
        'metadata.webhookProcessedAt': new Date().toISOString(),
        'metadata.processedBy': 'webhook'
      };

      // Add charge ID if available and not already set
      if (paymentIntent.charges?.data?.[0]?.id && !transaction.stripeChargeId) {
        updateData.stripeChargeId = paymentIntent.charges.data[0].id;
      }

      // Add payment method if available and not already set
      if (paymentIntent.payment_method_types?.[0]) {
        updateData['metadata.paymentMethod'] = paymentIntent.payment_method_types[0];
      }

      // Get user and update credit balance
      const user = await User.findById(transaction.userId);
      if (!user) {
        throw new Error(`User not found: ${transaction.userId}`);
      }

      const previousBalance = user.creditBalance || 0;
      const newBalance = previousBalance + transaction.credits;
      
      // Add balance tracking to update
      updateData['metadata.previousBalance'] = previousBalance;
      updateData['metadata.newBalance'] = newBalance;

      // Update user balance
      user.creditBalance = newBalance;

      // Perform atomic updates
      await Transaction.findByIdAndUpdate(transaction._id, updateData, { session });
      await user.save({ session });

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      console.log(`Transaction ${transaction._id} completed successfully via webhook. Credits added: ${transaction.credits}, New balance: ${newBalance}`);
    } catch (error) {
      // Rollback on error
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

async function handlePaymentFailed(paymentIntent: any) {
  try {
    const transaction = await Transaction.findOne({
      stripePaymentIntentId: paymentIntent.id
    });

    if (!transaction) {
      console.log(`Transaction not found for failed payment intent: ${paymentIntent.id}`);
      return;
    }

    // Only update if status has changed
    if (transaction.status === TransactionStatus.FAILED) {
      console.log(`Transaction ${transaction._id} already marked as failed, skipping`);
      return;
    }

    // Only update specific fields that changed
    const updateData = {
      status: TransactionStatus.FAILED,
      'metadata.failureReason': paymentIntent.last_payment_error?.message || 'Payment failed',
      'metadata.webhookProcessedAt': new Date().toISOString()
    };

    await Transaction.findByIdAndUpdate(transaction._id, updateData);
    console.log(`Transaction ${transaction._id} marked as failed`);
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

async function handleChargeDispute(dispute: any) {
  try {
    const transaction = await Transaction.findOne({
      stripeChargeId: dispute.charge
    });

    if (!transaction) {
      console.log(`Transaction not found for disputed charge: ${dispute.charge}`);
      return;
    }

    // Only update if not already disputed
    if (transaction.metadata?.disputed) {
      console.log(`Transaction ${transaction._id} already marked as disputed, skipping`);
      return;
    }

    // Update only dispute-related metadata
    const updateData = {
      'metadata.disputed': true,
      'metadata.disputeId': dispute.id,
      'metadata.disputeReason': dispute.reason,
      'metadata.disputeAmount': dispute.amount,
      'metadata.disputeCreatedAt': new Date().toISOString()
    };

    await Transaction.findByIdAndUpdate(transaction._id, updateData);
    console.log(`Dispute created for transaction ${transaction._id}: ${dispute.reason}`);
    
    // TODO: Consider deducting credits or flagging account based on your business logic
  } catch (error) {
    console.error('Error handling charge dispute:', error);
  }
}