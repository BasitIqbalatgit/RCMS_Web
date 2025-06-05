import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import Inventory from '@/lib/db/models/Inventory';
import User, { UserRole } from '@/lib/db/models/User';

// GET - Fetch inventory items
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const url = new URL(req.url);
    const adminId = url.searchParams.get('adminId');
    let query = {};
    
    // If user is an operator, they can only see their admin's inventory
    if (session.user.role === UserRole.OPERATOR) {
      const operator = await User.findById(session.user.id);
      if (!operator.adminId) {
        return NextResponse.json(
          { success: false, message: 'Operator is not associated with any admin' }, 
          { status: 400 }
        );
      }
      query = { adminId: operator.adminId };
    } 
    // If user is admin, they can only see their own inventory
    else if (session.user.role === UserRole.ADMIN) {
      query = { adminId: session.user.id };
    }
    // For specific admin ID query (used by SaaS provider)
    else if (adminId && session.user.role === UserRole.SAAS_PROVIDER) {
      query = { adminId };
    }
    // SaaS provider can see all inventory if no specific admin is requested
    
    const inventoryItems = await Inventory.find(query);
    return NextResponse.json({ success: true, data: inventoryItems });
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

// POST - Create new inventory item
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, message: 'Only admins can add inventory items' }, 
        { status: 403 }
      );
    }
    
    const body = await req.json();
    const { name, quantity, available, image, category, price } = body;
    
    // Validate input data
    if (!name || quantity === undefined || available === undefined || !category || price === undefined) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' }, 
        { status: 400 }
      );
    }
    
    if (available > quantity) {
      return NextResponse.json(
        { success: false, message: 'Available cannot exceed quantity' }, 
        { status: 400 }
      );
    }
    
    const newItem = await Inventory.create({
      name,
      quantity,
      available,
      image: image || '/api/placeholder/100/100',
      category,
      price,
      adminId: session.user.id
    });
    
    return NextResponse.json({ success: true, data: newItem }, { status: 201 });
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