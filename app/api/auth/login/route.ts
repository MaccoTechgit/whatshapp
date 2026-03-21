import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phoneNumber, password } = body;

    if (!phoneNumber || !password) {
      return NextResponse.json({ error: 'Phone number and password are required' }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return NextResponse.json({ error: 'Account not found. Please register first.' }, { status: 404 });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return NextResponse.json({ error: 'Invalid password. Please try again.' }, { status: 401 });
    }

    // 🔴 NAYA: Login success hone par user ka asli data bhej rahe hain
    return NextResponse.json({ 
      success: true, 
      message: 'Login successful!',
      user: { 
        name: user.name, 
        phoneNumber: user.phoneNumber,
        chatId: user.chatId // Ye anonymous link ke kaam aayega
      } 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Login API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}