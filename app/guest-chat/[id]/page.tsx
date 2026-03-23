'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Send, User, LogOut, Check, Phone } from 'lucide-react';

export default function GuestPanel() {
  const params = useParams();
  const rawId = params?.id ? decodeURIComponent(params.id as string) : '';
  const ownerPhoneNumber = rawId ? rawId.replace(/\D/g, '').slice(-10) : ''; 
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [guest, setGuest] = useState<{id: string, name: string, isAnon: boolean} | null>(null);
  
  // Owner pehle se hi active chat ban jayega
  const [activeOwner, setActiveOwner] = useState({ id: ownerPhoneNumber, name: `+91 ${ownerPhoneNumber}` });
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const guestData = localStorage.getItem('whatsapp_guest');
    if (guestData) {
      setGuest(JSON.parse(guestData));
      setIsLoading(false);
    } else {
      router.replace(`/direct/${ownerPhoneNumber}`);
    }
  }, [ownerPhoneNumber, router]);

  useEffect(() => {
    if(!guest) return;
    const fetchUpdates = async () => {
      try {
        const res = await fetch('/api/chat-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'sync', myId: guest.id, activeChatId: activeOwner.id })
        });
        const data = await res.json();
        if(data.activeMessages) setMessages(data.activeMessages);
      } catch (err) {}
    };
    
    fetchUpdates();
    const interval = setInterval(fetchUpdates, 1500); 
    return () => clearInterval(interval);
  }, [guest, activeOwner]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleExit = () => {
    localStorage.removeItem('whatsapp_guest');
    router.replace(`/direct/${ownerPhoneNumber}`);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !guest) return;
    const msgText = inputText;
    setInputText('');

    await fetch('/api/chat-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'send',
        senderId: guest.id,
        receiverId: activeOwner.id, 
        senderName: guest.name,     
        receiverName: activeOwner.name, 
        text: msgText,
        isAnon: guest.isAnon
      })
    });
  };

  if (isLoading || !guest) return <div className="flex h-screen items-center justify-center bg-[#F0F2F5]"><p className="text-[#25D366] font-bold">Connecting...</p></div>;

  return (
    <main className="flex h-screen bg-[#EAE6DF] overflow-hidden font-sans">
      <div className="hidden md:flex w-[350px] flex-col bg-white border-r border-neutral-300 h-full">
        <div className="bg-[#F0F2F5] h-16 px-4 flex items-center justify-between border-b border-neutral-200 shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-neutral-300 rounded-full flex items-center justify-center"><User className="text-neutral-500 w-6 h-6"/></div>
             <div><p className="text-xs text-neutral-500">My Panel</p><p className="font-bold text-sm">+91 {guest.id}</p></div>
          </div>
          <button onClick={handleExit} className="text-red-500"><LogOut className="w-5 h-5" /></button>
        </div>

        {/* Guest ko list mein sirf Owner dikhega */}
        <div className="flex-1 bg-white p-4">
           <div className="bg-[#F0F2F5] p-4 rounded-xl text-center border border-neutral-200 shadow-sm cursor-pointer hover:bg-neutral-100">
             <Phone className="w-8 h-8 mx-auto text-[#25D366] mb-2" />
             <h2 className="font-bold text-lg text-neutral-800">+91 {ownerPhoneNumber}</h2>
             <p className="text-sm text-neutral-500 mt-1">Chat Owner</p>
           </div>
        </div>
      </div>

      <div className="flex flex-col flex-1 bg-[#EFEAE2] relative h-full">
        <div className="bg-[#F0F2F5] h-16 px-4 flex items-center border-b border-neutral-200 shrink-0">
           <div className="w-10 h-10 bg-[#25D366] rounded-full mr-4 flex justify-center items-center"><User className="text-white"/></div>
           <div><h2 className="text-base font-medium">+91 {ownerPhoneNumber}</h2><p className="text-xs text-neutral-500">Owner</p></div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-2" style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundSize: 'contain' }}>
          {messages.length === 0 ? <p className="text-center text-neutral-500 mt-10">Say Hi to start chatting!</p> : null}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isSentByMe ? 'justify-end' : 'justify-start'} mb-2`}>
              <div className={`px-3 py-2 rounded-lg shadow-sm max-w-[85%] sm:max-w-md relative ${msg.isSentByMe ? 'bg-[#D9FDD3] rounded-tr-none' : 'bg-white rounded-tl-none'}`}>
                <p className="text-[14.5px] pb-3">{msg.text}</p>
                <span className="text-[11px] text-neutral-500 absolute bottom-1 right-2">{msg.time} {msg.isSentByMe && <Check className="w-3 h-3 text-[#53bdeb] inline"/>}</span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="bg-[#F0F2F5] p-3 flex items-center gap-2 shrink-0">
          <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') sendMessage() }} placeholder="Type a message..." className="flex-1 bg-white rounded-lg px-4 py-3 outline-none" />
          <button onClick={sendMessage} className="p-3 bg-[#25D366] text-white rounded-full"><Send className="w-5 h-5" /></button>
        </div>
      </div>
    </main>
  );
}