import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phoneNumber, password } = body;

    if (!name || !phoneNumber || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    await connectToDatabase();

    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // 🔴 NAYA: 10-digit random ID generate karna
    const generatedChatId = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      phoneNumber,
      password: hashedPassword,
      chatId: generatedChatId // Database me save karna
    });

    return NextResponse.json({ success: true, message: 'Account created successfully!' }, { status: 201 });

  } catch (error: any) {
    console.error('Registration API Error:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Database conflict. Please try a different number.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}