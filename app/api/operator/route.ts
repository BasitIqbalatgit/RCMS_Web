// api/operator/route.ts
import { NextRequest, NextResponse } from 'next/server';
import User, { UserRole } from '@/lib/db/models/User';
import connectDB from '@/lib/db/mongodb';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get adminId from query parameters
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('adminId');

    if (!adminId) {
      return NextResponse.json(
        { error: 'adminId is required' },
        { status: 400 }
      );
    }

    // Fetch operators for the given adminId
    const operators = await User.find({
      role: UserRole.OPERATOR,
      adminId,
    })
      .select('name email centreName location adminId createdAt emailVerified')
      .sort({ createdAt: -1 });

    return NextResponse.json(operators);
  } catch (error) {
    console.error('Error fetching operators:', error);
    return NextResponse.json(
      { error: 'Failed to fetch operators' },
      { status: 500 }
    );
  }
}
