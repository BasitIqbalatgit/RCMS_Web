// /app/api/admin/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import User, { UserRole } from '@/lib/db/models/User';
import connectDB from '@/lib/db/mongodb';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

// Fetch admin by _id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: adminId } = await params;

  try {
    await connectDB();
    console.log(`Received request to fetch admin with ID: ${adminId}`);

    if (!mongoose.isValidObjectId(adminId)) {
      console.log(`Invalid ObjectId format: ${adminId}`);
      return NextResponse.json(
        { error: 'Invalid admin ID format', code: 'INVALID_ID_FORMAT' },
        { status: 400 }
      );
    }

    const objectId = new mongoose.Types.ObjectId(adminId);
    let user = await User.findById(objectId);

    if (!user) {
      console.log(`No user found with ObjectId, trying string ID: ${adminId}`);
      user = await User.findOne({ _id: adminId });

      if (!user) {
        console.log(`No user found with ID: ${adminId} after all attempts`);
        return NextResponse.json(
          { error: 'User not found', code: 'USER_NOT_FOUND' },
          { status: 404 }
        );
      }
    }

    console.log(`Found user: ID=${user._id}, email=${user.email}, role=${user.role}`);

    if (user.role !== UserRole.ADMIN) {
      console.log(`User ${objectId} exists but is not an admin (role: ${user.role})`);
      return NextResponse.json(
        { error: 'User is not an admin', code: 'NOT_ADMIN_ROLE' },
        { status: 403 }
      );
    }

    const response = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      centreName: user.centreName || '',
      location: user.location || '',
      creditBalance: user.creditBalance,
      createdAt: user.createdAt,
      role: user.role,
      emailVerified: user.emailVerified,
    };

    console.log(`Successfully returning admin data for ID: ${objectId}`);
    return NextResponse.json(response);
  } catch (error) {
    console.error(`Database error when fetching admin ${adminId}:`, error);
    return NextResponse.json(
      { error: 'Database error', code: 'DB_ERROR', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Update admin
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id: adminId } = await params;
    const updateData = await request.json();
    console.log(`Received request to update admin ${adminId} with data:`, updateData);

    if (!mongoose.isValidObjectId(adminId)) {
      console.log(`Invalid ObjectId format: ${adminId}`);
      return NextResponse.json(
        { error: 'Invalid admin ID format', code: 'INVALID_ID_FORMAT' },
        { status: 400 }
      );
    }

    const objectId = new mongoose.Types.ObjectId(adminId);
    let existingAdmin = await User.findOne({
      _id: objectId,
      role: UserRole.ADMIN,
    });

    if (!existingAdmin) {
      console.log(`Admin not found with ObjectId, trying string ID: ${adminId}`);
      existingAdmin = await User.findOne({
        _id: adminId,
        role: UserRole.ADMIN,
      });

      if (!existingAdmin) {
        console.log(`Admin not found for _id: ${adminId}`);
        return NextResponse.json(
          { error: 'Admin not found', code: 'ADMIN_NOT_FOUND' },
          { status: 404 }
        );
      }
    }

    // Define allowed fields for update
    const allowedFields = [
      'name',
      'email',
      'location',
      'centreName',
      'creditBalance',
      'emailVerified',
      'password', // Added password
    ];
    const sanitizedData: Record<string, any> = {};

    // Handle password hashing if provided
    if (updateData.password) {
      const hashedPassword = await bcrypt.hash(updateData.password, 10);
      sanitizedData.password = hashedPassword;
    }

    // Copy other allowed fields
    Object.keys(updateData).forEach((key) => {
      if (allowedFields.includes(key) && key !== 'password') {
        sanitizedData[key] = updateData[key];
      }
    });

    // Update the admin
    const updatedAdmin = await User.findByIdAndUpdate(
      existingAdmin._id,
      { $set: sanitizedData },
      { new: true, select: 'name email centreName location creditBalance createdAt role emailVerified' }
    );

    if (!updatedAdmin) {
      console.log(`Failed to update admin _id: ${adminId}`);
      return NextResponse.json(
        { error: 'Failed to update admin', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    console.log(`Successfully updated admin: ${adminId}`);
    return NextResponse.json({
      id: updatedAdmin._id.toString(),
      name: updatedAdmin.name,
      email: updatedAdmin.email,
      centreName: updatedAdmin.centreName || '',
      location: updatedAdmin.location || '',
      creditBalance: updatedAdmin.creditBalance,
      createdAt: updatedAdmin.createdAt,
      role: updatedAdmin.role,
      emailVerified: updatedAdmin.emailVerified,
    });
  } catch (error) {
    const { id: adminId } = await params;
    console.error(`Error updating admin (_id: ${adminId}):`, error);
    return NextResponse.json(
      { error: 'Failed to update admin', code: 'UPDATE_ERROR', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Delete admin
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id: adminId } = await params;
    console.log(`Received request to delete admin: ${adminId}`);

    if (!mongoose.isValidObjectId(adminId)) {
      console.log(`Invalid ObjectId format: ${adminId}`);
      return NextResponse.json(
        { error: 'Invalid admin ID format', code: 'INVALID_ID_FORMAT' },
        { status: 400 }
      );
    }

    const objectId = new mongoose.Types.ObjectId(adminId);
    let existingAdmin = await User.findOne({
      _id: objectId,
      role: UserRole.ADMIN,
    });

    if (!existingAdmin) {
      console.log(`Admin not found with ObjectId, trying string ID: ${adminId}`);
      existingAdmin = await User.findOne({
        _id: adminId,
        role: UserRole.ADMIN,
      });

      if (!existingAdmin) {
        console.log(`Admin not found for _id: ${adminId}`);
        return NextResponse.json(
          { error: 'Admin not found', code: 'ADMIN_NOT_FOUND' },
          { status: 404 }
        );
      }
    }

    await User.findByIdAndDelete(existingAdmin._id);
    console.log(`Admin deleted: _id=${adminId}`);

    return NextResponse.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    const { id: adminId } = await params;
    console.error(`Error deleting admin (_id: ${adminId}):`, error);
    return NextResponse.json(
      { error: 'Failed to delete admin', code: 'DELETE_ERROR', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}