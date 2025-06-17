import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import Inventory from '@/lib/db/models/Inventory';
import User, { UserRole } from '@/lib/db/models/User';
import mongoose from 'mongoose';

// GET - Fetch specific inventory item
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const { id } = await params;
    
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid inventory ID' }, 
        { status: 400 }
      );
    }
    
    const inventoryItem = await Inventory.findById(id);
    
    if (!inventoryItem) {
      return NextResponse.json(
        { success: false, message: 'Inventory item not found' }, 
        { status: 404 }
      );
    }
    
    // Authorization check - ensure users can only access appropriate inventory
    if (session.user.role === UserRole.ADMIN && inventoryItem.adminId.toString() !== session.user.id) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }
    
    if (session.user.role === UserRole.OPERATOR) {
      const operator = await User.findById(session.user.id);
      if (!operator.adminId || operator.adminId.toString() !== inventoryItem.adminId.toString()) {
        return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
      }
    }
    
    return NextResponse.json({ success: true, data: inventoryItem });
  } catch (error) {
    console.error('Inventory API error:', error);
  
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, message: 'Server error', error: error.message }, 
        { status: 500 }
      );
    }
  
    return NextResponse.json(
      { success: false, message: 'Server error', error: 'Unknown error' }, 
      { status: 500 }
    );
  }
}

// PUT - Update inventory item
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const { id } = await params;
    
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid inventory ID' }, 
        { status: 400 }
      );
    }
    
    const inventoryItem = await Inventory.findById(id);
    
    if (!inventoryItem) {
      return NextResponse.json(
        { success: false, message: 'Inventory item not found' }, 
        { status: 404 }
      );
    }
    
    if (session.user.role !== UserRole.ADMIN || inventoryItem.adminId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Only the owner admin can update inventory items' }, 
        { status: 403 }
      );
    }
    
    const body = await req.json();
    const { name, quantity, available, image, category, price } = body;
    
    console.log("Received update data:", { name, quantity, available, image, category, price });
    console.log("Current inventory item:", { 
      currentQuantity: inventoryItem.quantity, 
      currentAvailable: inventoryItem.available 
    });
    
    // Validate input data
    if (!name || quantity === undefined || available === undefined || !category || price === undefined) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' }, 
        { status: 400 }
      );
    }
    
    // Validate quantity and available values
    if (quantity < 0) {
      return NextResponse.json(
        { success: false, message: 'Quantity cannot be negative' }, 
        { status: 400 }
      );
    }
    
    if (available < 0) {
      return NextResponse.json(
        { success: false, message: 'Available cannot be negative' }, 
        { status: 400 }
      );
    }
    console.log("Available Amount is : ", available, " and total quatnity is : ", quantity)
    if (available > quantity) {
      return NextResponse.json(
        { success: false, message: 'Available amount cannot exceed total quantity' }, 
        { status: 400 }
      );
    }
    
    const updatedItem = await Inventory.findByIdAndUpdate(
      id,
      {
        name,
        quantity,
        available,
        image: image || inventoryItem.image,
        category,
        price,
        updatedAt: Date.now()
      },
      { new: true, runValidators: false }
    );
    
    return NextResponse.json({ success: true, data: updatedItem });
  } catch (error) {
    console.error('Inventory API error:', error);
  
    if (error instanceof Error) {
      // Handle Mongoose validation errors specifically
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values((error as any).errors).map((err: any) => err.message);
        return NextResponse.json(
          { success: false, message: 'Validation failed', errors: validationErrors }, 
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { success: false, message: 'Server error', error: error.message }, 
        { status: 500 }
      );
    }
  
    return NextResponse.json(
      { success: false, message: 'Server error', error: 'Unknown error' }, 
      { status: 500 }
    );
  }
}

// DELETE - Remove inventory item
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const { id } = await params;
    
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid inventory ID' }, 
        { status: 400 }
      );
    }
    
    const inventoryItem = await Inventory.findById(id);
    
    if (!inventoryItem) {
      return NextResponse.json(
        { success: false, message: 'Inventory item not found' }, 
        { status: 404 }
      );
    }
    
    if (session.user.role !== UserRole.ADMIN || inventoryItem.adminId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Only the owner admin can delete inventory items' }, 
        { status: 403 }
      );
    }
    
    await Inventory.findByIdAndDelete(id);
    return NextResponse.json(
      { success: true, message: 'Inventory item deleted successfully' }
    );
  } catch (error) {
    console.error('Inventory API error:', error);
  
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, message: 'Server error', error: error.message }, 
        { status: 500 }
      );
    }
  
    return NextResponse.json(
      { success: false, message: 'Server error', error: 'Unknown error' }, 
      { status: 500 }
    );
  }
}