// // /app/api/credits/buy/route.ts
// import { NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/lib/auth';
// import connectDB from '@/lib/db/mongodb';
// import User, { UserRole } from '@/lib/db/models/User';

// export async function POST(req: Request) {
//   try {
//     const session = await getServerSession(authOptions);
//     if (!session || session.user?.role !== UserRole.ADMIN) {
//       return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
//     }

//     const { credits } = await req.json();
//     if (!credits || credits <= 0) {
//       return NextResponse.json({ message: 'Invalid credit amount' }, { status: 400 });
//     }

//     await connectDB();
//     const user = await User.findById(session.user.id);
//     if (!user) {
//       return NextResponse.json({ message: 'User not found' }, { status: 404 });
//     }

//     user.creditBalance += credits;
//     await user.save();

//     return NextResponse.json({ message: 'Credits added successfully', creditBalance: user.creditBalance });
//   } catch (error) {
//     console.error('Buy credits error:', error);
//     return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
//   }
// }


// /app/api/credits/buy/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import User, { UserRole } from '@/lib/db/models/User';
import Transaction, { TransactionStatus } from '@/lib/db/models/Transaction';
import mongoose from 'mongoose';

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== UserRole.ADMIN) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { credits, paymentIntentId, transactionId } = await req.json();
    
    if (!credits || credits <= 0) {
      return NextResponse.json({ message: 'Invalid credit amount' }, { status: 400 });
    }

    await connectDB();

    // Find the user
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Find the transaction record
    let transaction = null;
    if (transactionId) {
      transaction = await Transaction.findById(transactionId);
    } else if (paymentIntentId) {
      transaction = await Transaction.findOne({ stripePaymentIntentId: paymentIntentId });
    }

    if (!transaction) {
      return NextResponse.json({ message: 'Transaction record not found' }, { status: 404 });
    }

    // Check if transaction is already completed (avoid duplicate processing)
    if (transaction.status === TransactionStatus.COMPLETED) {
      return NextResponse.json({ 
        message: 'Transaction already processed',
        creditBalance: user.creditBalance 
      });
    }

    // Verify the transaction belongs to the current user
    if (transaction.userId !== session.user.id) {
      return NextResponse.json({ message: 'Unauthorized transaction access' }, { status: 403 });
    }

    // Verify the payment with Stripe only if status changed
    let paymentIntent = null;
    if (transaction.stripePaymentIntentId) {
      try {
        paymentIntent = await stripe.paymentIntents.retrieve(transaction.stripePaymentIntentId);
        
        if (paymentIntent.status !== 'succeeded') {
          return NextResponse.json({ 
            message: 'Payment not confirmed by Stripe' 
          }, { status: 400 });
        }
      } catch (stripeError) {
        console.error('Stripe verification error:', stripeError);
        return NextResponse.json({ 
          message: 'Failed to verify payment with Stripe' 
        }, { status: 500 });
      }
    }

    // Use database transaction to ensure atomicity
    const session_db = await mongoose.startSession();
    session_db.startTransaction();

    try {
      // Calculate new balance
      const previousBalance = user.creditBalance || 0;
      const newBalance = previousBalance + credits;

      // Prepare transaction update data - only update what's necessary
      const transactionUpdateData: any = {
        status: TransactionStatus.COMPLETED,
        'metadata.completedAt': new Date().toISOString(),
        'metadata.previousBalance': previousBalance,
        'metadata.newBalance': newBalance,
        'metadata.processedBy': 'api'
      };

      // Add charge ID only if available and not already set
      if (paymentIntent?.charges?.data?.[0]?.id && !transaction.stripeChargeId) {
        transactionUpdateData.stripeChargeId = paymentIntent.charges.data[0].id;
      }

      // Update user balance
      await User.findByIdAndUpdate(
        user._id, 
        { creditBalance: newBalance }, 
        { session: session_db }
      );

      // Update transaction status and metadata
      await Transaction.findByIdAndUpdate(
        transaction._id,
        transactionUpdateData,
        { session: session_db }
      );

      // Commit the transaction
      await session_db.commitTransaction();
      session_db.endSession();

      console.log(`Transaction ${transaction._id} completed via API. Credits added: ${credits}, New balance: ${newBalance}`);

      return NextResponse.json({ 
        message: 'Credits added successfully', 
        creditBalance: newBalance,
        transactionId: transaction._id,
        creditsAdded: credits
      });
    } catch (error) {
      // Rollback on error
      await session_db.abortTransaction();
      session_db.endSession();
      throw error;
    }
  } catch (error) {
    console.error('Buy credits error:', error);
    
    // Mark transaction as failed if we have the ID - only update status and error info
    if (req.body && typeof req.body === 'string') {
      try {
        const body = JSON.parse(req.body);
        if (body.transactionId) {
          await connectDB();
          await Transaction.findByIdAndUpdate(body.transactionId, {
            status: TransactionStatus.FAILED,
            'metadata.error': error instanceof Error ? error.message : 'Unknown error',
            'metadata.failedAt': new Date().toISOString()
          });
        }
      } catch (parseError) {
        console.error('Failed to parse request body for transaction update:', parseError);
      }
    }
    
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}