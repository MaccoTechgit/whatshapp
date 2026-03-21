import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  phoneNumber: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  // 🔴 NAYA: Direct chat link ke liye unique ID
  chatId: { type: String, unique: true, required: true } 
}, { 
  timestamps: true,
  collection: 'whatsapp_users' // Purane errors se bachne ke liye nayi table
});

const User = models.User || model('User', UserSchema, 'whatsapp_users');

export default User;