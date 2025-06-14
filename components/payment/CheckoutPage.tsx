



// 'use client'
// import React, { useEffect, useState } from 'react'
// import {
//     useStripe,
//     useElements,
//     PaymentElement
// } from "@stripe/react-stripe-js";
// import convertToSubcurrency from '@/lib/payment/convertToSubcurrency';

// interface CheckoutPageProps {
//     amount: number;
//     credits: number;
//     onPaymentSuccess: () => void;
// }

// const CheckoutPage = ({ amount, credits, onPaymentSuccess }: CheckoutPageProps) => {
//     const stripe = useStripe();
//     const elements = useElements();
//     const [errorMessage, setErrorMessage] = useState<string>();
//     const [clientSecret, setClientSecret] = useState("");
//     const [loading, setLoading] = useState(false);

//     useEffect(() => {
//         if (amount > 0) {
//             fetch("/api/create-payment-intent", {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json",
//                 }, 
//                 body: JSON.stringify({ 
//                     amount: convertToSubcurrency(amount),
//                     credits: credits 
//                 }),
//             })
//             .then((res) => res.json())
//             .then((data) => setClientSecret(data.clientSecret))
//             .catch((error) => {
//                 console.error("Error creating payment intent:", error);
//                 setErrorMessage("Failed to initialize payment");
//             });
//         }
//     }, [amount, credits]);

//     const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
//         event.preventDefault();
//         setLoading(true);
//         setErrorMessage(undefined);
        
//         if (!stripe || !elements) {
//             setLoading(false);
//             return;
//         }

//         const { error: submitError } = await elements.submit();

//         if (submitError) {
//             setErrorMessage(submitError?.message);
//             setLoading(false);
//             return;
//         }

//         const { error } = await stripe.confirmPayment({
//             elements,
//             clientSecret,
//             confirmParams: {
//                 return_url: `${window.location.origin}/billing`,
//             },
//             redirect: 'if_required',
//         });

//         if (error) {
//             // Check if it's a card error or other type of error
//             if (error.type === 'card_error' || error.type === 'validation_error') {
//                 setErrorMessage(error.message);
//             } else {
//                 setErrorMessage('An unexpected error occurred.');
//             }
//         } else {
//             // Payment succeeded - add credits to user account
//             try {
//                 const response = await fetch('/api/credits/buy', {
//                     method: 'POST',
//                     headers: { 'Content-Type': 'application/json' },
//                     body: JSON.stringify({ credits: credits }),
//                 });

//                 if (response.ok) {
//                     onPaymentSuccess();
//                 } else {
//                     setErrorMessage("Payment successful but failed to add credits. Please contact support.");
//                 }
//             } catch (error) {
//                 setErrorMessage("Payment successful but failed to add credits. Please contact support.");
//             }
//         }

//         setLoading(false);
        
//         setLoading(false);
//     }

//     if (!clientSecret || !stripe || !elements) {
//         return (
//             <div className='flex items-center justify-center p-8'>
//                 <div className='inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-blue-600' role='status'>
//                     <span className='!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]'>Loading...</span>
//                 </div>
//             </div>
//         )
//     }

//     return (
//         <div className="max-w-md mx-auto">
//             <div className="bg-gray-50 p-4 rounded-lg mb-4">
//                 <h3 className="font-semibold text-lg mb-2">Order Summary</h3>
//                 <div className="flex justify-between items-center">
//                     <span>{credits} Credits</span>
//                     <span className="font-bold">${amount.toFixed(2)}</span>
//                 </div>
//             </div>
            
//             <form onSubmit={handleSubmit} className='bg-white p-6 rounded-lg shadow-sm border'>
//                 {errorMessage && (
//                     <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
//                         {errorMessage}
//                     </div>
//                 )}
                
//                 {clientSecret && (
//                     <PaymentElement 
//                         options={{
//                             layout: "tabs",
//                             paymentMethodOrder: ['card']
//                         }}
//                     />
//                 )}
                
//                 <button
//                     disabled={!stripe || loading}
//                     className='text-white w-full p-4 bg-blue-600 mt-6 rounded-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors'
//                     type="submit"
//                 >
//                     {loading ? "Processing..." : `Pay $${amount.toFixed(2)}`}
//                 </button>
//             </form>
//         </div>
//     )
// }

// export default CheckoutPage;


'use client'
import React, { useEffect, useState } from 'react'
import {
    useStripe,
    useElements,
    PaymentElement
} from "@stripe/react-stripe-js";
import convertToSubcurrency from '@/lib/payment/convertToSubcurrency';

interface CheckoutPageProps {
    amount: number;
    credits: number;
    onPaymentSuccess: () => void;
}

const CheckoutPage = ({ amount, credits, onPaymentSuccess }: CheckoutPageProps) => {
    const stripe = useStripe();
    const elements = useElements();
    const [errorMessage, setErrorMessage] = useState<string>();
    const [clientSecret, setClientSecret] = useState("");
    const [transactionId, setTransactionId] = useState<string>("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (amount > 0) {
            fetch("/api/create-payment-intent", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                }, 
                body: JSON.stringify({ 
                    amount: convertToSubcurrency(amount),
                    credits: credits 
                }),
            })
            .then((res) => res.json())
            .then((data) => {
                setClientSecret(data.clientSecret);
                setTransactionId(data.transactionId);
            })
            .catch((error) => {
                console.error("Error creating payment intent:", error);
                setErrorMessage("Failed to initialize payment");
            });
        }
    }, [amount, credits]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setErrorMessage(undefined);
        
        if (!stripe || !elements) {
            setLoading(false);
            return;
        }

        const { error: submitError } = await elements.submit();

        if (submitError) {
            setErrorMessage(submitError?.message);
            setLoading(false);
            return;
        }

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            clientSecret,
            confirmParams: {
                return_url: `${window.location.origin}/billing`,
            },
            redirect: 'if_required',
        });

        if (error) {
            // Check if it's a card error or other type of error
            if (error.type === 'card_error' || error.type === 'validation_error') {
                setErrorMessage(error.message);
            } else {
                setErrorMessage('An unexpected error occurred.');
            }
            setLoading(false);
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
            // Payment succeeded - add credits to user account
            try {
                const response = await fetch('/api/credits/buy', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        credits: credits,
                        paymentIntentId: paymentIntent.id,
                        transactionId: transactionId
                    }),
                });

                const data = await response.json();

                if (response.ok) {
                    onPaymentSuccess();
                } else {
                    setErrorMessage(data.message || "Payment successful but failed to add credits. Please contact support.");
                }
            } catch (error) {
                console.error('Error adding credits:', error);
                setErrorMessage("Payment successful but failed to add credits. Please contact support.");
            }
            setLoading(false);
        } else {
            setErrorMessage('Payment was not completed successfully.');
            setLoading(false);
        }
    }

    if (!clientSecret || !stripe || !elements) {
        return (
            <div className='flex items-center justify-center p-8'>
                <div className='inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-blue-600' role='status'>
                    <span className='!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]'>Loading...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-md mx-auto">
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 className="font-semibold text-lg mb-2">Order Summary</h3>
                <div className="flex justify-between items-center">
                    <span>{credits} Credits</span>
                    <span className="font-bold">${amount.toFixed(2)}</span>
                </div>
            </div>
            
            <form onSubmit={handleSubmit} className='bg-white p-6 rounded-lg shadow-sm border'>
                {errorMessage && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                        {errorMessage}
                    </div>
                )}
                
                {clientSecret && (
                    <PaymentElement 
                        options={{
                            layout: "tabs",
                            paymentMethodOrder: ['card']
                        }}
                    />
                )}
                
                <button
                    disabled={!stripe || loading}
                    className='text-white w-full p-4 bg-blue-600 mt-6 rounded-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors'
                    type="submit"
                >
                    {loading ? "Processing..." : `Pay $${amount.toFixed(2)}`}
                </button>
            </form>
        </div>
    )
}

export default CheckoutPage;