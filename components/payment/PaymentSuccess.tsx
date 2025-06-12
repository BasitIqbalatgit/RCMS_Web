import React from 'react';

interface PaymentSuccessProps {
    credits: number;
    amount: number;
    onBackToBilling: () => void;
}

const PaymentSuccess = ({ credits, amount, onBackToBilling }: PaymentSuccessProps) => {
    return (
        <div className="max-w-md mx-auto text-center">
            <div className="bg-white p-8 rounded-lg shadow-sm border">
                {/* Success Icon */}
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg 
                        className="w-8 h-8 text-green-600" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M5 13l4 4L19 7" 
                        />
                    </svg>
                </div>

                {/* Success Message */}
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Payment Successful!
                </h2>
                
                <p className="text-gray-600 mb-6">
                    Your payment has been processed successfully and credits have been added to your account.
                </p>

                {/* Purchase Details */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-green-800 mb-2">Purchase Details</h3>
                    <div className="space-y-1 text-sm text-green-700">
                        <div className="flex justify-between">
                            <span>Credits Purchased:</span>
                            <span className="font-semibold">{credits}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Amount Paid:</span>
                            <span className="font-semibold">${amount.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                <button
                    onClick={onBackToBilling}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-semibold hover:bg-blue-700 transition-colors"
                >
                    Continue
                </button>
            </div>
        </div>
    );
};

export default PaymentSuccess;