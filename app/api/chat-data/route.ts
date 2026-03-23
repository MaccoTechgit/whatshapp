import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Message from '@/models/Message';

function normalize(id: string) {
  if (!id) return '';
  if (id.startsWith('Guest_')) return id;
  return id.replace(/\D/g, '').slice(-10);
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();

    // 1. SEND MESSAGE & REPLY
    if (body.action === 'send') {
      await Message.create({
        senderId: normalize(body.senderId),
        receiverId: normalize(body.receiverId),
        senderName: body.senderName,
        receiverName: body.receiverName,
        text: body.text,
        type: body.type || 'text',
        imageUrl: body.imageUrl || null,
        status: 'delivered',
        replyToText: body.replyToText || '',
        replyToSender: body.replyToSender || '',
        replyToId: body.replyToId || ''
      });
      return NextResponse.json({ success: true });
    }

    // 2. EDIT
    if (body.action === 'edit') {
      await Message.findByIdAndUpdate(body.messageId, { text: body.newText, isEdited: true });
      return NextResponse.json({ success: true });
    }

    // 3. DELETE
    if (body.action === 'delete') {
      if (body.deleteType === 'everyone') {
        await Message.findByIdAndUpdate(body.messageId, { isDeleted: true, text: '', imageUrl: null, replyToText: '', reactions: [] });
      } else if (body.deleteType === 'me') {
        await Message.findByIdAndUpdate(body.messageId, { $push: { deletedFor: normalize(body.userId) } });
      }
      return NextResponse.json({ success: true });
    }

    // 🔴 4. REACTION FIX (Permanent Database Save)
    if (body.action === 'react') {
      const msg = await Message.findById(body.messageId);
      if (msg) {
        let currentReactions = Array.isArray(msg.reactions) ? [...msg.reactions] : [];
        const existingIndex = currentReactions.findIndex(r => r.userId === normalize(body.userId));

        if (existingIndex !== -1) {
          // Agar same emoji par dobara click kiya toh usko remove kar do
          if (currentReactions[existingIndex].emoji === body.emoji) {
            currentReactions.splice(existingIndex, 1);
          } else {
            // Emoji change kiya toh update kar do
            currentReactions[existingIndex].emoji = body.emoji;
          }
        } else {
          // Naya reaction add karo
          currentReactions.push({ emoji: body.emoji, userId: normalize(body.userId) });
        }

        msg.reactions = currentReactions;
        msg.markModified('reactions'); // 🔴 Force save to MongoDB
        await msg.save();
      }
      return NextResponse.json({ success: true });
    }

    // 5. SYNC
    if (body.action === 'sync') {
      const myId = normalize(body.myId);
      const activeChatId = body.activeChatId ? normalize(body.activeChatId) : null;

      if (activeChatId) {
        await Message.updateMany({ senderId: activeChatId, receiverId: myId, status: "delivered" }, { status: "seen" });
      }

      let allMessages = await Message.find({ $or: [{ senderId: myId }, { receiverId: myId }] }).sort({ createdAt: 1 });
      allMessages = allMessages.filter(msg => !(msg.deletedFor || []).includes(myId));

      const chatMap = new Map();
      allMessages.forEach(msg => {
        const isMe = normalize(msg.senderId) === myId;
        const otherId = isMe ? normalize(msg.receiverId) : normalize(msg.senderId);
        const existing = chatMap.get(otherId) || { unread: 0, timestamp: 0 };
        let newUnread = existing.unread;

        if (!isMe && msg.status === 'delivered') newUnread++;
        if (otherId === activeChatId) newUnread = 0;

        chatMap.set(otherId, {
          id: otherId,
          name: isMe ? msg.receiverName : msg.senderName,
          lastMessage: msg.isDeleted ? "🚫 Deleted" : (msg.type === 'image' ? "📷 Photo" : msg.text),
          time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: new Date(msg.createdAt).getTime(),
          unread: newUnread
        });
      });

      let activeMessages: any[] = [];
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
          isEdited: msg.isEdited,
          replyToText: msg.replyToText || '',
          replyToSender: msg.replyToSender || '',
          replyToId: msg.replyToId || '',
          reactions: msg.reactions || [],
          time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSentByMe: normalize(msg.senderId) === myId
        }));
      }

      return NextResponse.json({ chatList: Array.from(chatMap.values()).sort((a: any, b: any) => b.timestamp - a.timestamp), activeMessages });
    }

    return NextResponse.json({ error: 'Invalid Action' }, { status: 400 });
  } catch (error) {
    console.error('API Error:', error); // Add logging for debugging
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}