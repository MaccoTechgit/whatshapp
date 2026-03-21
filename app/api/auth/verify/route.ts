import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phoneNumber, otp } = body;

    if (!phoneNumber || !otp) {
      return NextResponse.json({ error: 'Phone number and OTP are required' }, { status: 400 });
    }

    await connectToDatabase();

    // 1. Find the user
    const user = await User.findOne({ phoneNumber });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. Check if OTP is correct and not expired
    const isOtpValid = user.otp === otp;
    const isOtpNotExpired = new Date() < new Date(user.otpExpiry);

    if (!isOtpValid) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    if (!isOtpNotExpired) {
      return NextResponse.json({ error: 'OTP has expired' }, { status: 400 });
    }

    // 3. OTP verified! Update user status and clear OTP
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Aage chal kar yahan hum JWT token ya NextAuth session create karenge.
    return NextResponse.json({ 
      success: true, 
      message: 'Phone number verified successfully!' 
    }, { status: 200 });

  } catch (error) {
    console.error('Verify API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
