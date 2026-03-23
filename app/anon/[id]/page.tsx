'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function AnonChatAutoEntry() {
  const params = useParams(); 
  const rawId = decodeURIComponent(params.id as string);
  // Agar phone number hai toh 10 digit nikalo, nahi toh Guest ID hi rakho
  const ownerId = rawId.replace(/\D/g, '').slice(-10) || rawId; 
  
  const router = useRouter();

  useEffect(() => {
    // 🔴 Bina click ke automatically Guest ID create karna
    const guestId = `Guest_${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Session create karna
    localStorage.setItem('whatsapp_user', JSON.stringify({ 
      phone: guestId, 
      name: guestId, 
      isAnon: true 
    }));
    
    // Jiska link hai uski chat automatically open karna
    localStorage.setItem('pending_chat', JSON.stringify({
      id: ownerId, 
      name: ownerId.startsWith('Guest') ? ownerId : `+91 ${ownerId}`, 
      isAnon: false
    }));
    
    // Seedha chat panel par redirect karna
    router.replace(`/chat`);
  }, [ownerId, router]);

  // Jab tak redirect ho raha hai, tab tak ek chota sa loading spinner dikhega
  return (
    <main className="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-4">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-[#00a884] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-neutral-600 font-medium text-lg">Connecting securely...</p>
        <p className="text-neutral-400 text-sm mt-2">Setting up your anonymous chat</p>
      </div>
    </main>
  );
}