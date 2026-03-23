import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const MessageSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  senderName: { type: String, required: true },
  receiverName: { type: String, required: true },
  text: { type: String },
  type: { type: String, default: 'text' }, 
  imageUrl: { type: String }, 
  status: { type: String, default: 'delivered' }, 
  isDeleted: { type: Boolean, default: false }, 
  isEdited: { type: Boolean, default: false },  
  deletedFor: { type: [String], default: [] },
  replyToText: { type: String, default: '' }, 
  replyToSender: { type: String, default: '' },
  replyToId: { type: String, default: '' }, 
  reactions: { type: Array, default: [] } 
}, { timestamps: true, strict: false }); 

const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB!");
  const msgs = await Message.find().sort({ createdAt: -1 }).limit(5);
  console.log("Last 5 messages:", JSON.stringify(msgs, null, 2));
  process.exit(0);
}

test().catch(console.error);
