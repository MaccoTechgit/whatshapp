'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Send } from 'lucide-react';

export default function AnonChatEntry() {
  const params = useParams(); 
  const rawId = decodeURIComponent(params.id as string);
  const ownerId = rawId.replace(/\D/g, '').slice(-10) || rawId; // Phone ya anon id kuch bhi ho sakta hai
  
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleStartAnonChat = () => {
    setIsLoading(true);
    const guestId = `Guest_${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Create Unified Session for Anon Guest
    localStorage.setItem('whatsapp_user', JSON.stringify({ 
      phone: guestId, 
      name: guestId, 
      isAnon: true 
    }));
    
    // Auto open owner's chat
    localStorage.setItem('pending_chat', JSON.stringify({
      id: ownerId, 
      name: `+91 ${ownerId}`, 
      isAnon: false
    }));
    
    setTimeout(() => { router.push(`/chat`); }, 800);
  };

  return (
    <main className="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 shadow-lg max-w-md w-full text-center border-t-[8px] border-blue-600">
        <div className="w-20 h-20 bg-blue-50 rounded-full mx-auto mb-6 flex items-center justify-center"><span className="text-3xl">🕵️</span></div>
        <h1 className="text-2xl font-bold mb-2">Anonymous Chat</h1>
        <p className="text-neutral-500 mb-8 text-sm">Chat securely with <span className="font-bold">{ownerId}</span>. Your identity stays hidden.</p>
        <button onClick={handleStartAnonChat} disabled={isLoading} className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl flex justify-center gap-2">
          {isLoading ? 'Connecting...' : <><Send className="w-5 h-5" /> Start Anonymous Chat</>}
        </button>
      </div>
    </main>
  );
}