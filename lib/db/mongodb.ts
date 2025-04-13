import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

interface Global {
  mongoose: {
    conn: mongoose.Connection | null;
    promise: Promise<mongoose.Mongoose> | null;
  };
}

let cached = (global as unknown as Global).mongoose;

if (!cached) {
  cached = (global as unknown as Global).mongoose = { conn: null, promise: null };
}

async function connectDB(): Promise<mongoose.Connection> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts);
  }

  try {
    const mongooseInstance = await cached.promise;
    cached.conn = mongooseInstance.connection; // Access the connection property
    return cached.conn;
  } catch (error) {
    // Handle connection errors appropriately
    console.error('MongoDB connection error:', error);
    throw error; // Re-throw the error to propagate it
  }
}

export default connectDB;