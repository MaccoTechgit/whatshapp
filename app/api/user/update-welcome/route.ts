import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phoneNumber, welcomeMessage, autoReplies } = body;

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    await connectToDatabase();

    const cleanPhone = phoneNumber.startsWith('Guest_') ? phoneNumber : phoneNumber.replace(/\D/g, '').slice(-10);

    let user = await User.findOneAndUpdate(
      { phoneNumber: cleanPhone },
      { welcomeMessage, autoReplies },
      { returnDocument: 'after' }
    );

    if (!user) {
      user = await User.findOneAndUpdate(
        { phoneNumber: { $regex: new RegExp(cleanPhone + '$') } },
        { welcomeMessage, autoReplies },
        { returnDocument: 'after' }
      );
    }

    if (!user) {
      // If couldn't find by phoneNumber, try chatId (for flexibility)
      user = await User.findOneAndUpdate(
        { chatId: cleanPhone },
        { welcomeMessage, autoReplies },
        { returnDocument: 'after' }
      );
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Welcome message updated successfully!'
    }, { status: 200 });

  } catch (error: any) {
    console.error('Update Welcome Message API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
