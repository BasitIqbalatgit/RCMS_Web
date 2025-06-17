import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const {
      original_image_url,
      modified_image_url,
      modification_type,
      vehicle_part,
      description,
      modification_details,
      status,
      timestamp
    } = data;

    // Validate required fields
    if (!original_image_url || !modified_image_url || !modification_type || !vehicle_part || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Connect to the database
    const db = await connectDB();

    // Create modification record
    const modification = {
      operator_id: session.user.id,
      original_image_url,
      modified_image_url,
      modification_type,
      vehicle_part,
      description,
      modification_details,
      status,
      timestamp: new Date(timestamp),
      created_at: new Date()
    };

    const result = await db.collection('modifications').insertOne(modification);

    return NextResponse.json({
      success: true,
      modification_id: result.insertedId
    });

  } catch (error) {
    console.error('Save modification error:', error);
    return NextResponse.json(
      { error: 'Failed to save modification' },
      { status: 500 }
    );
  }
}
