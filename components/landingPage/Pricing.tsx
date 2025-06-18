'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Credit packages from billing page
const creditPackages = [
    { credits: 100, price: 9.99, popular: false, savings: '0%' },
    { credits: 500, price: 39.99, popular: true, savings: '20%' },
    { credits: 1000, price: 69.99, popular: false, savings: '30%' },
];

const Pricing = () => {
    const [hoveredPackage, setHoveredPackage] = useState<number | null>(null);

    return (
        <section id="pricing" className="w-full py-20 bg-gradient-to-b from-gray-50 to-white">
            <div className="container px-6 xs:px-8 sm:px-0 sm:mx-8 lg:mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold leading-tight sm:text-4xl xl:text-5xl mb-6">
                        Simple, Transparent Pricing
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Choose the perfect credit package for your car modification needs. 
                        <span className="font-semibold text-blue-600"> No hidden fees, no surprises.</span>
                    </p>
                </div>

                {/* Credit Packages */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {creditPackages.map((pkg, index) => (
                        <div 
                            key={index}
                            className={`relative bg-white rounded-2xl shadow-xl border-2 p-8 transition-all duration-300 ${
                                pkg.popular 
                                    ? 'border-blue-500 ring-4 ring-blue-100 scale-105' 
                                    : 'border-gray-200 hover:border-blue-300 hover:shadow-2xl'
                            } ${
                                hoveredPackage === index ? 'transform -translate-y-3 shadow-2xl' : ''
                            }`}
                            onMouseEnter={() => setHoveredPackage(index)}
                            onMouseLeave={() => setHoveredPackage(null)}
                        >
                            {pkg.popular && (
                                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                                    <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                                        ⭐ Most Popular
                                    </span>
                                </div>
                            )}
                            
                            {pkg.savings !== '0%' && (
                                <div className="absolute -top-3 -right-3">
                                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                                        Save {pkg.savings}
                                    </span>
                                </div>
                            )}
                            
                            <div className="text-center">
                                <h3 className="text-4xl font-bold text-gray-900 mb-2">
                                    {pkg.credits.toLocaleString()}
                                </h3>
                                <p className="text-gray-600 mb-6 text-lg font-medium">Credits</p>
                                
                                <div className="mb-4">
                                    <span className="text-5xl font-bold text-gray-900">
                                        ${pkg.price}
                                    </span>
                                </div>
                                
                                <div className="text-sm text-gray-500 mb-8">
                                    ${(pkg.price / pkg.credits * 100).toFixed(2)} per 100 credits
                                </div>

                                {/* Features */}
                                <div className="space-y-4 mb-8 text-left">
                                    <div className="flex items-center">
                                        <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-gray-700">AI Car Classification</span>
                                    </div>
                                    <div className="flex items-center">
                                        <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-gray-700">Part Detection & Segmentation</span>
                                    </div>
                                    <div className="flex items-center">
                                        <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-gray-700">Image Stitching & Modifications</span>
                                    </div>
                                    <div className="flex items-center">
                                        <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-gray-700">Unlimited Reference Images</span>
                                    </div>
                                    <div className="flex items-center">
                                        <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-gray-700">Priority Support</span>
                                    </div>
                                </div>
                                
                                <Link href="/signup">
                                    <Button 
                                        className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 ${
                                            pkg.popular 
                                                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl' 
                                                : 'bg-gray-100 text-gray-900 hover:bg-gray-200 hover:shadow-lg'
                                        }`}
                                    >
                                        {pkg.popular ? '🚀 Get Started Now' : 'Choose Package'}
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Additional Info */}
                <div className="text-center mt-16">
                    <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">
                            Why Choose RCMS Credits?
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                            <div className="flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span className="text-gray-700 font-medium">Credits Never Expire</span>
                            </div>
                            <div className="flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span className="text-gray-700 font-medium">No Hidden Fees</span>
                            </div>
                            <div className="flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span className="text-gray-700 font-medium">Cancel Anytime</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Pricing; 