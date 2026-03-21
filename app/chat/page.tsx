'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Send, LogOut, Phone, UserCircle2, Check, CheckCheck, User, Image as ImageIcon, Trash2, ArrowLeft, X, Copy, Search } from 'lucide-react';

export default function WhatsAppFinal() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [links, setLinks] = useState({ anon: '', direct: '' });
  const [chatList, setChatList] = useState<any[]>([]); 
  const [activeChat, setActiveChat] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [copying, setCopying] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('whatsapp_user');
    if (stored) {
      const parsed = JSON.parse(stored);
      const raw = parsed.phone || parsed.phoneNumber || parsed.id;
      const cleanId = raw.startsWith('Guest_') ? raw : raw.replace(/\D/g, '').slice(-10);
      setUser({ ...parsed, id: cleanId, name: parsed.name || (raw.startsWith('Guest_') ? raw : `+91 ${cleanId}`) });
      setLinks({ anon: `${window.location.origin}/anon/${cleanId}`, direct: `${window.location.origin}/direct/${cleanId}` });
      const pending = localStorage.getItem('pending_chat');
      if (pending) { setActiveChat(JSON.parse(pending)); localStorage.removeItem('pending_chat'); }
    } else router.replace('/login');
  }, [router]);

  useEffect(() => {
    if(!user) return;
    const syncData = async () => {
      try {
        const res = await fetch('/api/chat-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'sync', myId: user.id, activeChatId: activeChat?.id })
        });
        const data = await res.json();
        setChatList(data.chatList || []);
        setMessages(data.activeMessages || []);
      } catch (e) {}
    };
    syncData();
    const timer = setInterval(syncData, 2000);
    return () => clearInterval(timer);
  }, [user, activeChat]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async () => {
    if ((!inputText.trim() && !selectedImage) || !activeChat || !user) return;
    const payload = {
      action: 'send', senderId: user.id, receiverId: activeChat.id,
      senderName: user.name, receiverName: activeChat.name,
      text: inputText, type: selectedImage ? 'image' : 'text', imageUrl: selectedImage
    };
    setInputText(''); setSelectedImage(null);
    await fetch('/api/chat-data', { method: 'POST', body: JSON.stringify(payload) });
  };

  const deleteMsg = async (id: string) => {
    if(confirm("Delete message?")) await fetch('/api/chat-data', { method: 'POST', body: JSON.stringify({ action: 'delete', messageId: id }) });
  };

  if (!user) return null;

  return (
    <main className="flex h-screen bg-[#F0F2F5] overflow-hidden font-sans antialiased text-[#111b21]">
      {/* 🟢 SIDEBAR */}
      <div className={`${activeChat ? 'hidden md:flex' : 'flex'} w-full md:w-[400px] flex-col bg-white border-r border-neutral-300 h-full`}>
        <div className="h-16 px-4 flex items-center justify-between bg-[#F0F2F5] border-b border-neutral-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-neutral-300 flex items-center justify-center border-2 border-white shadow-sm"><User className="text-white w-6 h-6"/></div>
            <div><p className="text-sm font-bold truncate max-w-[150px]">{user.name}</p><p className="text-[11px] text-neutral-500 font-medium">ID: {user.id}</p></div>
          </div>
          <button onClick={() => { localStorage.clear(); router.replace('/login'); }} className="p-2 text-red-500 hover:bg-red-50 rounded-full"><LogOut className="w-5 h-5"/></button>
        </div>

        {/* Share Links */}
        <div className="p-3 bg-neutral-50 border-b border-neutral-200 space-y-2 shrink-0">
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest px-1">My Links</p>
          <div className="flex gap-2">
            <div className="flex-1 bg-white border rounded px-2 py-1 flex items-center justify-between overflow-hidden">
              <span className="text-[10px] text-blue-600 truncate">{links.anon}</span>
              <button onClick={() => { navigator.clipboard.writeText(links.anon); setCopying('anon'); setTimeout(()=>setCopying(''), 1500); }}>{copying === 'anon' ? <Check className="w-3 h-3 text-green-500"/> : <Copy className="w-3 h-3 text-neutral-400"/>}</button>
            </div>
            <div className="flex-1 bg-white border rounded px-2 py-1 flex items-center justify-between overflow-hidden">
              <span className="text-[10px] text-green-600 truncate">{links.direct}</span>
              <button onClick={() => { navigator.clipboard.writeText(links.direct); setCopying('phone'); setTimeout(()=>setCopying(''), 1500); }}>{copying === 'phone' ? <Check className="w-3 h-3 text-green-500"/> : <Copy className="w-3 h-3 text-neutral-400"/>}</button>
            </div>
          </div>
        </div>

        {/* Chat List with Unread Badge */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {chatList.length === 0 ? <p className="text-center text-neutral-400 mt-10 text-sm italic">No conversations yet</p> : chatList.map(chat => (
            <div key={chat.id} onClick={() => setActiveChat(chat)} className={`flex items-center px-4 py-3 cursor-pointer border-b hover:bg-neutral-50 ${activeChat?.id === chat.id ? 'bg-[#f0f2f5]' : ''}`}>
              <div className="w-12 h-12 rounded-full bg-neutral-200 mr-4 flex items-center justify-center">
                {chat.id.startsWith('Guest_') ? <UserCircle2 className="text-blue-500 w-6 h-6"/> : <Phone className="text-green-600 w-5 h-5"/>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h2 className={`text-[15.5px] truncate ${chat.unread > 0 ? 'font-bold' : 'font-medium'}`}>{chat.name}</h2>
                  <span className={`text-[10px] ${chat.unread > 0 ? 'text-[#25D366] font-bold' : 'text-neutral-400'}`}>{chat.time}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className={`text-sm truncate pr-2 ${chat.unread > 0 ? 'text-[#111b21] font-medium' : 'text-neutral-500'}`}>{chat.lastMessage}</p>
                  {/* UNREAD COUNT BADGE */}
                  {chat.unread > 0 && <span className="bg-[#25D366] text-white text-[11px] font-bold h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center shadow-sm">{chat.unread}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🟢 CHAT AREA */}
      <div className={`${!activeChat ? 'hidden md:flex' : 'flex'} flex-col flex-1 bg-[#efeae2] relative h-full`}>
        {activeChat ? (
          <>
            <div className="h-16 px-4 flex items-center bg-[#F0F2F5] border-b border-neutral-300 z-10 shrink-0">
              <button onClick={() => setActiveChat(null)} className="md:hidden mr-3 p-1 rounded-full hover:bg-neutral-200"><ArrowLeft className="w-6 h-6"/></button>
              <div className="w-10 h-10 rounded-full bg-neutral-300 mr-3 flex items-center justify-center border border-white"><User className="text-white w-6 h-6"/></div>
              <h2 className="font-bold text-[15.5px] truncate">{activeChat.name}</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar relative" style={{backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundSize: '400px'}}>
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.isSentByMe ? 'justify-end' : 'justify-start'} group`}>
                  <div className={`max-w-[85%] rounded-lg px-2.5 py-1.5 shadow-sm relative ${msg.isSentByMe ? 'bg-[#d9fdd3] rounded-tr-none' : 'bg-white rounded-tl-none'}`}>
                    {msg.isDeleted ? <p className="text-[13px] italic text-neutral-400">🚫 This message was deleted</p> : (
                      <>
                        {msg.type === 'image' && <img src={msg.imageUrl} className="rounded-md mb-1.5 max-h-72 object-cover border border-black/5" />}
                        {msg.text && <p className="text-[14.2px] whitespace-pre-wrap pr-10 leading-normal">{msg.text}</p>}
                        {msg.isSentByMe && <button onClick={() => deleteMsg(msg.id)} className="absolute -left-7 top-0 opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4"/></button>}
                      </>
                    )}
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      <span className="text-[9px] text-neutral-500 uppercase">{msg.time}</span>
                      {msg.isSentByMe && !msg.isDeleted && (
                        // 🔵 BLUE TICK LOGIC
                        msg.status === 'seen' ? <CheckCheck className="w-3.5 h-3.5 text-[#34B7F1]"/> : <CheckCheck className="w-3.5 h-3.5 text-neutral-400"/>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="bg-[#F0F2F5] p-2.5 flex items-center gap-2 shrink-0 border-t">
              <button onClick={()=>fileRef.current?.click()} className="p-2 hover:bg-neutral-200 rounded-full transition-colors"><ImageIcon className="text-neutral-600 w-6 h-6"/></button>
              <input type="file" ref={fileRef} hidden accept="image/*" onChange={(e:any)=>{const f=e.target.files[0];if(f){const r=new FileReader();r.onloadend=()=>setSelectedImage(r.result as string);r.readAsDataURL(f);}}} />
              {selectedImage && <div className="absolute bottom-20 left-4 w-24 h-24 bg-white p-1 rounded-lg border-2 border-[#25D366] shadow-xl animate-in fade-in zoom-in duration-200"><img src={selectedImage} className="w-full h-full object-cover rounded"/><button onClick={()=>setSelectedImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X className="w-3 h-3"/></button></div>}
              <input type="text" value={inputText} onChange={(e)=>setInputText(e.target.value)} onKeyDown={(e)=>e.key==='Enter'&&sendMessage()} placeholder="Type a message..." className="flex-1 bg-white rounded-xl px-4 py-2.5 outline-none text-sm border-none shadow-sm" />
              <button onClick={sendMessage} className={`p-3 rounded-full transition-all active:scale-95 ${inputText.trim() || selectedImage ? 'bg-[#00a884] text-white shadow-md' : 'bg-neutral-300 text-neutral-500'}`}><Send className="w-5 h-5"/></button>
            </div>
          </>
        ) : <div className="flex flex-col items-center justify-center h-full text-center opacity-50 p-10"><UserCircle2 className="w-20 h-20 mb-4"/><h1 className="text-2xl font-light">WhatsApp Web</h1><p className="text-sm mt-2">Select a chat to view messages.</p></div>}
      </div>
    </main>
  );
}