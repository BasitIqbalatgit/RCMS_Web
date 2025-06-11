// /app/api/credits/buy/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import User, { UserRole } from '@/lib/db/models/User';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== UserRole.ADMIN) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { credits } = await req.json();
    if (!credits || credits <= 0) {
      return NextResponse.json({ message: 'Invalid credit amount' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    user.creditBalance += credits;
    await user.save();

    return NextResponse.json({ message: 'Credits added successfully', creditBalance: user.creditBalance });
  } catch (error) {
    console.error('Buy credits error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
