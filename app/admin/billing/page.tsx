// /app/(dashboard)/billing/page.tsx
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

const BillingPage = () => {
  const { data: session } = useSession();
  const [credits, setCredits] = useState(0);
  const [message, setMessage] = useState('');
  const [balance, setBalance] = useState<number | null>(null);

  const handleBuyCredits = async () => {
    try {
      const res = await fetch('/api/credits/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credits: Number(credits) }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to buy credits');

      setMessage(data.message);
      setBalance(data.creditBalance);
    } catch (error: any) {
      setMessage(error.message);
    }
  };

  if (session?.user?.role !== 'admin') {
    return <div>Unauthorized</div>;
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Buy Credits</h1>
      <input
        type="number"
        value={credits}
        onChange={(e) => setCredits(Number(e.target.value))}
        className="border p-2 rounded w-full mb-4"
        placeholder="Enter number of credits"
        min={1}
      />
      <button
        onClick={handleBuyCredits}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Buy Credits
      </button>
      {message && <p className="mt-4 text-green-600">{message}</p>}
      {balance !== null && (
        <p className="mt-2">New Credit Balance: <strong>{balance}</strong></p>
      )}
    </div>
  );
};

export default BillingPage;
