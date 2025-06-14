
// // /app/api/transactions/[id]/route.ts
// import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/lib/auth';
// import connectDB from '@/lib/db/mongodb';
// import Transaction, { TransactionStatus, TransactionType } from '@/lib/db/models/Transaction';
// import { UserRole } from '@/lib/db/models/User';

// export async function GET(
//   request: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     const session = await getServerSession(authOptions);
//     if (!session || session.user?.role !== UserRole.ADMIN) {
//       return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
//     }

//     await connectDB();

//     const transaction = await Transaction.findOne({
//       _id: params.id,
//       userId: session.user.id
//     }).lean();

//     if (!transaction) {
//       return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
//     }

//     return NextResponse.json({ transaction });
//   } catch (error) {
//     console.error('Get transaction error:', error);
//     return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
//   }
// }

// /app/api/transactions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import Transaction, { TransactionStatus, TransactionType } from '@/lib/db/models/Transaction';
import { UserRole } from '@/lib/db/models/User';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || ![UserRole.ADMIN, UserRole.SAAS_PROVIDER].includes(session.user?.role)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Build query based on user role
    const query: any = { _id: params.id };
    
    // Only filter by userId if user is ADMIN (not SAAS_PROVIDER)
    if (session.user.role === UserRole.ADMIN) {
      query.userId = session.user.id;
    }

    const transaction = await Transaction.findOne(query).lean();

    if (!transaction) {
      return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error('Get transaction error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}