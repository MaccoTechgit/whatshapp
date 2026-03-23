import { NextResponse } from 'next/server';
import { emitter } from '@/lib/emitter';

export async function POST(req: Request) {
  try {
    const { receiverId } = await req.json();
    if (receiverId) {
      // Normalize receiverId just in case
      const cleanId = String(receiverId).startsWith('Guest_') ? receiverId : String(receiverId).replace(/\D/g, '').slice(-10);
      emitter.emit('update_received', cleanId);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
