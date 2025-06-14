// // /app/api/transactions/route.ts
// import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/lib/auth';
// import connectDB from '@/lib/db/mongodb';
// import Transaction, { TransactionStatus, TransactionType } from '@/lib/db/models/Transaction';
// import { UserRole } from '@/lib/db/models/User';

// export async function GET(request: NextRequest) {
//     try {
//         const session = await getServerSession(authOptions);
//         if (!session || ![UserRole.ADMIN, UserRole.SAAS_PROVIDER].includes(session.user?.role)) {
//             return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
//         }

//         const { searchParams } = new URL(request.url);
//         const page = parseInt(searchParams.get('page') || '1');
//         const limit = parseInt(searchParams.get('limit') || '10');
//         const status = searchParams.get('status');
//         const type = searchParams.get('type');

//         await connectDB();

//         // Build query filters
//         const query: any = { userId: session.user.id };

//         if (status && Object.values(TransactionStatus).includes(status as TransactionStatus)) {
//             query.status = status;
//         }

//         if (type && Object.values(TransactionType).includes(type as TransactionType)) {
//             query.type = type;
//         }

//         // Calculate pagination
//         const skip = (page - 1) * limit;

//         // Get transactions with pagination
//         const [transactions, totalCount] = await Promise.all([
//             Transaction.find(query)
//                 .sort({ createdAt: -1 })
//                 .skip(skip)
//                 .limit(limit)
//                 .lean(),
//             Transaction.countDocuments(query)
//         ]);

//         const totalPages = Math.ceil(totalCount / limit);

//         return NextResponse.json({
//             transactions,
//             pagination: {
//                 currentPage: page,
//                 totalPages,
//                 totalCount,
//                 hasNext: page < totalPages,
//                 hasPrev: page > 1
//             }
//         });
//     } catch (error) {
//         console.error('Get transactions error:', error);
//         return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
//     }
// }

// /app/api/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import Transaction, { TransactionStatus, TransactionType } from '@/lib/db/models/Transaction';
import { UserRole } from '@/lib/db/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || ![UserRole.ADMIN, UserRole.SAAS_PROVIDER].includes(session.user?.role)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100'); // Increased default limit
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    await connectDB();

    // Build query filters based on user role
    const query: any = {};
    
    // Only filter by userId if user is ADMIN (SAAS_PROVIDER sees all transactions)
    if (session.user.role === UserRole.ADMIN) {
      query.userId = session.user.id;
    }

    if (status && Object.values(TransactionStatus).includes(status as TransactionStatus)) {
      query.status = status;
    }

    if (type && Object.values(TransactionType).includes(type as TransactionType)) {
      query.type = type;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get transactions with pagination
    const [transactions, totalCount] = await Promise.all([
      Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      transactions,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
