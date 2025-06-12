
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: "usd",
            payment_method_types: ['card'], // Only allow card payments
            metadata: {
                credits: credits.toString(),
                userId: session.user.id
            }
        });

        return NextResponse.json({ 
            clientSecret: paymentIntent.client_secret 
        });
    } catch (error) {
        console.error("Payment Intent Error: ", error);
        return NextResponse.json({
            error: `Internal Server Error: ${error}`
        }, { status: 500 });
    }
}