// /lib/db/models/Transaction.ts
import mongoose from 'mongoose';

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export enum TransactionType {
  CREDIT_PURCHASE = 'credit_purchase',
  CREDIT_USAGE = 'credit_usage',
  REFUND = 'refund'
}

export interface ITransaction {
  _id?: string;
  userId: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number; // Amount in dollars
  credits: number; // Number of credits involved
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  description: string;
  metadata?: {
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new mongoose.Schema<ITransaction>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: Object.values(TransactionType),
    required: true
  },
  status: {
    type: String,
    enum: Object.values(TransactionStatus),
    required: true,
    default: TransactionStatus.PENDING
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  credits: {
    type: Number,
    required: true,
    min: 0
  },
  stripePaymentIntentId: {
    type: String,
    sparse: true,
    index: true
  },
  stripeChargeId: {
    type: String,
    sparse: true
  },
  description: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ status: 1, createdAt: -1 });
TransactionSchema.index({ type: 1, status: 1 });

const Transaction = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);

export default Transaction;