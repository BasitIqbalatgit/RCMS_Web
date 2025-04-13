// /api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import connectDB from "@/lib/db/mongodb";
import User, { UserRole } from "@/lib/db/models/User";
import { sendVerificationEmail } from "@/lib/email/sendVerificationEmail";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, role, ...additionalFields } = body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate role
    if (!Object.values(UserRole).includes(role as UserRole)) {
      return NextResponse.json(
        { error: "Invalid user role" },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new user (but don't save yet)
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      verificationToken,
      verificationExpires,
      ...additionalFields
    });

    // Try to send verification email
    await sendVerificationEmail(email, verificationToken, name);

    // If email sent successfully, save the user
    await newUser.save();

    // Return success response
    return NextResponse.json(
      { message: "User registered. Please check your email for verification." },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to register user" },
      { status: 500 }
    );
  }
}