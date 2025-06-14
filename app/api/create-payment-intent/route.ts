
// import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";

// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// export async function POST(request: NextRequest) {
//     try {
//         // Verify user session
//         const session = await getServerSession(authOptions);
//         if (!session || session.user?.role !== 'admin') {
//             return NextResponse.json(
//                 { error: 'Unauthorized' },
//                 { status: 401 }
//             );
//         }

//         const { amount, credits } = await request.json();
        
//         // Validate input
//         if (!amount || amount <= 0) {
//             return NextResponse.json(
//                 { error: 'Invalid amount' },
//                 { status: 400 }
//             );
//         }

//         if (!credits || credits <= 0) {
//             return NextResponse.json(
//                 { error: 'Invalid credits amount' },
//                 { status: 400 }
//             );
//         }

//         const paymentIntent = await stripe.paymentIntents.create({
//             amount: amount,
//             currency: "usd",
//             payment_method_types: ['card'], // Only allow card payments
//             metadata: {
//                 credits: credits.toString(),
//                 userId: session.user.id
//             }
//         });

//         return NextResponse.json({ 
//             clientSecret: paymentIntent.client_secret 
//         });
//     } catch (error) {
//         console.error("Payment Intent Error: ", error);
//         return NextResponse.json({
//             error: `Internal Server Error: ${error}`
//         }, { status: 500 });
//     }
// }



// /app/api/create-payment-intent/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Transaction, { TransactionType, TransactionStatus } from "@/lib/db/models/Transaction";

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export async function POST(request: NextRequest) {
    try {
        // Verify user session
        const session = await getServerSession(authOptions);
        if (!session || session.user?.role !== 'admin') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { amount, credits } = await request.json();
        
        // Validate input
        if (!amount || amount <= 0) {
            return NextResponse.json(
                { error: 'Invalid amount' },
                { status: 400 }
            );
        }

        if (!credits || credits <= 0) {
            return NextResponse.json(
                { error: 'Invalid credits amount' },
                { status: 400 }
            );
        }

        // Connect to database
        await connectDB();

        // Create Stripe payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: "usd",
            payment_method_types: ['card'],
            metadata: {
                credits: credits.toString(),
                userId: session.user.id
            }
        });

        // Create transaction record in database
        const transaction = new Transaction({
            userId: session.user.id,
            type: TransactionType.CREDIT_PURCHASE,
            status: TransactionStatus.PENDING,
            amount: amount / 100, // Convert from cents to dollars
            credits: credits,
            stripePaymentIntentId: paymentIntent.id,
            description: `Purchase of ${credits} credits for $${(amount / 100).toFixed(2)}`,
            metadata: {
                packageInfo: {
                    credits,
                    pricePerCredit: (amount / 100) / credits
                }
            }
        });

        await transaction.save();

        return NextResponse.json({ 
            clientSecret: paymentIntent.client_secret,
            transactionId: transaction._id
        });
    } catch (error) {
        console.error("Payment Intent Error: ", error);
        return NextResponse.json({
            error: `Internal Server Error: ${error}`
        }, { status: 500 });
    }
}