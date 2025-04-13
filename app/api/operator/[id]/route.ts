import { NextRequest, NextResponse } from 'next/server';
import User, { UserRole } from '@/lib/db/models/User';
import connectDB from '@/lib/db/mongodb';
import bcrypt from 'bcryptjs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const operatorId = params.id;

    // Validate that this is an operator record
    const operator = await User.findOne({
      _id: operatorId,
      role: UserRole.OPERATOR,
    }).select('name email password emailVerified createdAt location centreName adminId');

    if (!operator) {
      return NextResponse.json(
        { error: 'Operator not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(operator);
  } catch (error) {
    console.error('Error fetching operator:', error);
    return NextResponse.json(
      { error: 'Failed to fetch operator' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const operatorId = params.id;
    const updateData = await request.json();
    const { name, email, password, adminId } = updateData;

    // Validate that this is an operator record
    const existingOperator = await User.findOne({
      _id: operatorId,
      role: UserRole.OPERATOR,
    });

    if (!existingOperator) {
      return NextResponse.json(
        { error: 'Operator not found' },
        { status: 404 }
      );
    }

    // Fetch the admin to get centreName and location
    const admin = await User.findOne({
      _id: adminId,
      role: UserRole.ADMIN,
    });

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    // Ensure only appropriate fields can be updated
    const allowedFields = ['name', 'email', 'password'];
    const sanitizedData: Record<string, any> = {
      centreName: admin.centreName,
      location: admin.location,
    };

    Object.keys(updateData).forEach((key) => {
      if (allowedFields.includes(key)) {
        sanitizedData[key] = updateData[key];
      }
    });

    // If password is provided, hash it
    if (password) {
      sanitizedData.password = await bcrypt.hash(password, 10);
    }

    // Update the operator in the database
    const updatedOperator = await User.findByIdAndUpdate(
      operatorId,
      { $set: sanitizedData },
      { new: true }
    ).select('name email centreName location adminId createdAt');

    if (!updatedOperator) {
      return NextResponse.json(
        { error: 'Operator not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedOperator);
  } catch (error) {
    console.error('Error updating operator:', error);
    return NextResponse.json(
      { error: 'Failed to update operator' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const operatorId = params.id;

    // Validate that this is an operator record
    const existingOperator = await User.findOne({
      _id: operatorId,
      role: UserRole.OPERATOR,
    });

    if (!existingOperator) {
      return NextResponse.json(
        { error: 'Operator not found' },
        { status: 404 }
      );
    }

    // Delete the operator
    await User.findByIdAndDelete(operatorId);

    return NextResponse.json({ message: 'Operator deleted successfully' });
  } catch (error) {
    console.error('Error deleting operator:', error);
    return NextResponse.json(
      { error: 'Failed to delete operator' },
      { status: 500 }
    );
  }
}