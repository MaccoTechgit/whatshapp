import mongoose, { Schema, model, models } from 'mongoose';

const MessageSchema = new Schema({
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  senderName: { type: String, required: true },
  receiverName: { type: String, required: true },
  text: { type: String },
  type: { type: String, default: 'text' }, 
  imageUrl: { type: String }, 
  status: { type: String, default: 'delivered' }, // 'delivered' (grey) or 'seen' (blue)
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export default models.Message || model('Message', MessageSchema);