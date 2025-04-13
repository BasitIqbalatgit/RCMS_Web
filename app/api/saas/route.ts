import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findOne({ 
      email: session.user.email,
      role: 'saas_provider'
    }).select('name email revenue emailVerified createdAt');

    if (!user) {
      return NextResponse.json(
        { error: 'SaaS Provider not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        name: user.name,
        email: user.email,
        revenue: user.revenue,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching SaaS provider:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, email, currentPassword, newPassword } = body;

    await connectDB();

    const user = await User.findOne({ 
      email: session.user.email,
      role: 'saas_provider'
    });

    if (!user) {
      return NextResponse.json(
        { error: 'SaaS Provider not found' },
        { status: 404 }
      );
    }

    // Handle password change if provided
    if (currentPassword && newPassword) {
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        );
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
    }

    // Update profile fields if provided
    if (name) user.name = name;
    if (email && email !== session.user.email) {
      user.email = email;
      user.emailVerified = false;
      // You might want to trigger email verification here
    }

    await user.save();

    return NextResponse.json({
      success: true,
      data: {
        name: user.name,
        email: user.email,
        revenue: user.revenue,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Error updating SaaS provider:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}