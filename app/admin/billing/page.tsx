


'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import CheckoutPage from "@/components/payment/CheckoutPage";
import PaymentSuccess from "@/components/payment/PaymentSuccess";
import convertToSubcurrency from '@/lib/payment/convertToSubcurrency';
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from '@stripe/stripe-js';

if (process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY === undefined) {
    throw new Error("Stripe public key not defined");
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);

// Credit packages - you can modify these as needed
const creditPackages = [
    { credits: 100, price: 9.99, popular: false },
    { credits: 500, price: 39.99, popular: true },
    { credits: 1000, price: 69.99, popular: false },
];

const BillingPage = () => {
    const { data: session } = useSession();
    const [selectedCredits, setSelectedCredits] = useState(0);
    const [selectedAmount, setSelectedAmount] = useState(0);
    const [showPayment, setShowPayment] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [currentBalance, setCurrentBalance] = useState<number | null>(null);

    // Fetch current balance on component mount
    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const response = await fetch('/api/credits/balance');
                if (response.ok) {
                    const data = await response.json();
                    setCurrentBalance(data.balance);
                }
            } catch (error) {
                console.error('Failed to fetch balance:', error);
            }
        };

        if (session?.user?.role === 'admin') {
            fetchBalance();
        }
    }, [session]);

    const handlePackageSelect = (credits: number, price: number) => {
        setSelectedCredits(credits);
        setSelectedAmount(price);
        setShowPayment(true);
        setShowSuccess(false);
    };

    const handlePaymentSuccess = () => {
        setShowPayment(false);
        setShowSuccess(true);
        // Update balance
        if (currentBalance !== null) {
            setCurrentBalance(currentBalance + selectedCredits);
        }
    };

    const handleBackToBilling = () => {
        setShowPayment(false);
        setShowSuccess(false);
        setSelectedCredits(0);
        setSelectedAmount(0);
    };

    if (session?.user?.role !== 'admin') {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Unauthorized</h2>
                    <p className="text-gray-600">You don't have permission to access this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {!showPayment && !showSuccess && (
                    <>
                        {/* Header */}
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Buy Credits</h1>
                            <p className="text-gray-600">Choose a credit package that fits your needs</p>
                            {currentBalance !== null && (
                                <div className="mt-4 inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full">
                                    <span className="font-semibold">Current Balance: {currentBalance} credits</span>
                                </div>
                            )}
                        </div>

                        {/* Credit Packages */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {creditPackages.map((pkg, index) => (
                                <div 
                                    key={index}
                                    className={`relative bg-white rounded-lg shadow-sm border-2 p-6 cursor-pointer transition-all hover:shadow-md ${
                                        pkg.popular ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-300'
                                    }`}
                                    onClick={() => handlePackageSelect(pkg.credits, pkg.price)}
                                >
                                    {pkg.popular && (
                                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                            <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                                Most Popular
                                            </span>
                                        </div>
                                    )}
                                    
                                    <div className="text-center">
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                            {pkg.credits.toLocaleString()}
                                        </h3>
                                        <p className="text-gray-600 mb-4">Credits</p>
                                        
                                        <div className="mb-6">
                                            <span className="text-3xl font-bold text-gray-900">
                                                ${pkg.price}
                                            </span>
                                        </div>
                                        
                                        <div className="text-sm text-gray-500 mb-6">
                                            ${(pkg.price / pkg.credits * 100).toFixed(2)} per 100 credits
                                        </div>
                                        
                                        <button 
                                            className={`w-full py-3 px-4 rounded-md font-semibold transition-colors ${
                                                pkg.popular 
                                                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                            }`}
                                        >
                                            Select Package
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Payment Section */}
                {showPayment && !showSuccess && (
                    <div>
                        <div className="mb-6">
                            <button
                                onClick={handleBackToBilling}
                                className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Back to Packages
                            </button>
                        </div>

                        <h2 className="text-2xl font-bold text-center mb-8">Complete Your Purchase</h2>
                        
                        <Elements 
                            stripe={stripePromise} 
                            options={{ 
                                mode: "payment",
                                amount: convertToSubcurrency(selectedAmount),
                                currency: "usd",
                                payment_method_types: ['card']
                            }}
                        >
                            <CheckoutPage 
                                amount={selectedAmount}
                                credits={selectedCredits}
                                onPaymentSuccess={handlePaymentSuccess}
                            />
                        </Elements>
                    </div>
                )}

                {/* Success Section */}
                {showSuccess && (
                    <div>
                        <PaymentSuccess
                            credits={selectedCredits}
                            amount={selectedAmount}
                            onBackToBilling={handleBackToBilling}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default BillingPage;