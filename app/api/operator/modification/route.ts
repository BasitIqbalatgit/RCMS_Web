import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import Modification from '@/lib/db/models/Modification';

// POST: Create a new modification
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();

    const {
      operator_id,
      original_image_url,
      modified_image_url,
      modification_type,
      vehicle_part,
      description,
      modification_details,
      status,
      timestamp
    } = body;

    // Validate that the operator_id matches the session user
    if (operator_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: operator_id does not match session user' },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!original_image_url || !modified_image_url || !modification_type || 
        !vehicle_part || !description || !modification_details) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newModification = await Modification.create({
      operator_id,
      original_image_url,
      modified_image_url,
      modification_type,
      vehicle_part,
      description,
      modification_details,
      status: status || 'Saved',
      timestamp: new Date(timestamp),
    });

    return NextResponse.json(newModification, { status: 201 });
  } catch (error) {
    console.error('[MODIFICATION_POST_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to create modification' },
      { status: 500 }
    );
  }
}

// GET: Fetch all modifications for an operator
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const operatorId = searchParams.get('operator_id');

    // Validate that the operator_id matches the session user
    if (operatorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: operator_id does not match session user' },
        { status: 403 }
      );
    }

    const modifications = await Modification.find({ operator_id: operatorId })
      .sort({ timestamp: -1 });
    return NextResponse.json(modifications);
  } catch (error) {
    console.error('[MODIFICATION_GET_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch modifications' },
      { status: 500 }
    );
  }
}
