import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: Request) {
  try {
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    await connectToDatabase();

    const cleanPhone = phoneNumber.startsWith('Guest_') ? phoneNumber : phoneNumber.replace(/\D/g, '').slice(-10);

    const user = await User.findOne({ 
      $or: [
        { phoneNumber: { $regex: new RegExp(cleanPhone + '$') } }, 
        { chatId: cleanPhone }
      ] 
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      welcomeMessage: user.welcomeMessage || '',
      autoReplies: user.autoReplies || []
    }, { status: 200 });

  } catch (error: any) {
    console.error('Get Welcome Message API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
