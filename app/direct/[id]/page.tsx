'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Send, MessageCircle } from 'lucide-react';

export default function DirectChatEntry() {
  const params = useParams(); 
  const rawId = decodeURIComponent(params.id as string);
  const ownerPhoneNumber = rawId.replace(/\D/g, '').slice(-10); 
  const [guestPhone, setGuestPhone] = useState('');
  const router = useRouter();

  const handleStartChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (guestPhone.length === 10) {
      // Create Unified Session for Guest
      localStorage.setItem('whatsapp_user', JSON.stringify({ 
        phone: guestPhone, 
        name: `+91 ${guestPhone}`, 
        isAnon: false 
      }));
      // Auto open owner's chat
      localStorage.setItem('pending_chat', JSON.stringify({
        id: ownerPhoneNumber, 
        name: `+91 ${ownerPhoneNumber}`, 
        isAnon: false
      }));
      
      router.push(`/chat`); 
    } else {
      alert("Please enter a valid 10-digit number");
    }
  };

  return (
    <main className="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 shadow-lg max-w-md w-full text-center border-t-[8px] border-[#25D366]">
        <div className="w-20 h-20 bg-[#e7fce3] rounded-full mx-auto mb-6 flex items-center justify-center"><MessageCircle className="w-10 h-10 text-[#25D366]" /></div>
        <h1 className="text-2xl font-bold mb-2">Direct Message</h1>
        <p className="text-neutral-500 mb-6 text-sm">You are about to chat with <span className="font-bold text-neutral-800">+91 {ownerPhoneNumber}</span></p>
        <form onSubmit={handleStartChat} className="space-y-5">
          <div className="flex items-center border border-neutral-300 rounded-2xl px-4 py-4 bg-neutral-50 focus-within:bg-white focus-within:border-[#25D366]">
            <span className="text-lg pr-3 text-neutral-500 mr-3">+91</span>
            <input type="tel" required maxLength={10} value={guestPhone} onChange={(e) => setGuestPhone(e.target.value.replace(/\D/g, ''))} placeholder="Your Mobile Number" className="bg-transparent flex-1 outline-none text-lg" />
          </div>
          <button type="submit" className="w-full bg-[#25D366] text-white font-bold py-4 rounded-2xl flex justify-center gap-2"><Send className="w-5 h-5" /> Start Chatting</button>
        </form>
      </div>
    </main>
  );
}