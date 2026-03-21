import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Message from '@/models/Message';

function normalize(id: string) {
  if (!id) return '';
  if (id.startsWith('Guest_')) return id;
  return id.replace(/\D/g, '').slice(-10);
}

interface IMessage {
  id: string; text?: string; type: string; imageUrl?: string;
  status: string; isDeleted: boolean; time: string; isSentByMe: boolean;
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();

    // 1. SEND MESSAGE
    if (body.action === 'send') {
      const newMsg = await Message.create({
        senderId: normalize(body.senderId),
        receiverId: normalize(body.receiverId),
        senderName: body.senderName,
        receiverName: body.receiverName,
        text: body.text,
        type: body.type || 'text',
        imageUrl: body.imageUrl || null,
        status: 'delivered' 
      });
      return NextResponse.json({ success: true, message: newMsg });
    }

    // 2. SYNC DATA (Ticks & Unread Logic)
    if (body.action === 'sync') {
      const myId = normalize(body.myId);
      const activeChatId = body.activeChatId ? normalize(body.activeChatId) : null;

      // 🔵 STEP 1: Mark active chat messages as SEEN
      if (activeChatId) {
        await Message.updateMany(
          { senderId: activeChatId, receiverId: myId, status: "delivered" },
          { status: "seen" }
        );
      }

      const allMessages = await Message.find({
        $or: [{ senderId: myId }, { receiverId: myId }]
      }).sort({ createdAt: 1 });

      const chatMap = new Map();
      allMessages.forEach(msg => {
        const isMe = normalize(msg.senderId) === myId;
        const otherId = isMe ? normalize(msg.receiverId) : normalize(msg.senderId);
        const otherDisplayName = isMe ? msg.receiverName : msg.senderName;

        const existing = chatMap.get(otherId);
        let unreadCount = existing ? existing.unread : 0;
        
        // 🔴 STEP 2: Only count if status is delivered AND I am the receiver
        if (!isMe && msg.status === 'delivered') {
          unreadCount++;
        }

        chatMap.set(otherId, {
          id: otherId,
          name: otherDisplayName || (otherId.startsWith('Guest') ? otherId : `+91 ${otherId}`),
          lastMessage: msg.isDeleted ? "🚫 Deleted" : (msg.type === 'image' ? "📷 Photo" : msg.text),
          time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: new Date(msg.createdAt).getTime(),
          unread: unreadCount 
        });
      });

      let activeMessages: IMessage[] = [];
      if (activeChatId) {
        activeMessages = allMessages.filter(msg => 
          (normalize(msg.senderId) === myId && normalize(msg.receiverId) === activeChatId) ||
          (normalize(msg.senderId) === activeChatId && normalize(msg.receiverId) === myId)
        ).map(msg => ({
          id: msg._id.toString(),
          text: msg.text,
          type: msg.type,
          imageUrl: msg.imageUrl,
          status: msg.status,
          isDeleted: msg.isDeleted,
          time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSentByMe: normalize(msg.senderId) === myId
        }));
      }

      return NextResponse.json({ 
        chatList: Array.from(chatMap.values()).sort((a:any, b:any) => b.timestamp - a.timestamp), 
        activeMessages 
      });
    }

    if (body.action === 'delete') {
      await Message.findByIdAndUpdate(body.messageId, { isDeleted: true, text: '', imageUrl: null });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}