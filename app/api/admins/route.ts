// /api/admins/route.ts
import { NextRequest, NextResponse } from 'next/server';
import User, { UserRole } from '@/lib/db/models/User';
import connectDB from '@/lib/db/mongodb';


export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Fetch only admin users
    const admins = await User.find({ role: UserRole.ADMIN })
      .select('name email emailVerified location centreName creditBalance createdAt')
      .sort({ createdAt: -1 });
    
    return NextResponse.json(admins);
  } catch (error) {
    console.error('Error fetching admins:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admins' },
      { status: 500 }
    );
  }
}