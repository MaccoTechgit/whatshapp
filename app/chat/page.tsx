'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Send, LogOut, Phone, UserCircle2, Check, CheckCheck, User, Image as ImageIcon, Trash2, ArrowLeft, X, Copy, Search, Smile, Edit2, UserPlus, ChevronDown, Ban, Reply, Heart } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export default function WhatsAppWebFinal() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [links, setLinks] = useState({ anon: '', direct: '' });
  
  const [chatList, setChatList] = useState<any[]>([]); 
  const [activeChat, setActiveChat] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const [copying, setCopying] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); 
  const [showEmoji, setShowEmoji] = useState(false);
  
  const [editingMsg, setEditingMsg] = useState<any | null>(null);
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [reactionMenuId, setReactionMenuId] = useState<string | null>(null);

  // Auto-Reply Modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [welcomeMsgInput, setWelcomeMsgInput] = useState('');
  const [autoReplies, setAutoReplies] = useState<{keyword: string, response: string}[]>([]);
  const [isSavingWelcome, setIsSavingWelcome] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const activeChatRef = useRef(activeChat);
  const userRef = useRef(user);

  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);
  useEffect(() => { userRef.current = user; }, [user]);

  useEffect(() => {
    const stored = localStorage.getItem('whatsapp_user');
    if (stored) {
      const parsed = JSON.parse(stored);
      const raw = parsed.phone || parsed.phoneNumber || parsed.id;
      const cleanId = raw.startsWith('Guest_') ? raw : raw.replace(/\D/g, '').slice(-10);
      setUser({ ...parsed, id: cleanId, name: parsed.name || (raw.startsWith('Guest_') ? raw : `+91 ${cleanId}`) });
      setLinks({ anon: `${window.location.origin}/anon/${cleanId}`, direct: `${window.location.origin}/direct/${cleanId}` });
      const pending = localStorage.getItem('pending_chat');
      if (pending) { handleChatClick(JSON.parse(pending)); localStorage.removeItem('pending_chat'); }
    } else router.replace('/login');
  }, [router]);

  const triggerSync = async () => {
    if (!userRef.current) return;
    try {
      const res = await fetch('/api/chat-data', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync', myId: userRef.current.id, activeChatId: activeChatRef.current?.id })
      });
      if(res.ok) {
        const data = await res.json();
        setChatList(data.chatList?.map((c:any) => c.id === activeChatRef.current?.id ? { ...c, unread: 0 } : c) || []);
        setMessages(data.activeMessages || []);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (!user) return;
    triggerSync();

    const eventSource = new EventSource(`/api/events?userId=${user.id}`);
    
    eventSource.onmessage = (event) => {
      if (event.data === 'update') {
        triggerSync();
      }
    };

    eventSource.onerror = () => {
      // Reconnect handled automatically by browser
    };

    return () => { 
      eventSource.close();
    };
  }, [user?.id]);

  useEffect(() => {
    if (user && activeChat) {
      triggerSync();
      fetch('/api/notify', { method: 'POST', body: JSON.stringify({ receiverId: activeChat.id }) });
    }
  }, [activeChat?.id]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  const handleChatClick = (chat: any) => {
    setActiveChat(chat); setSearchTerm('');
    setChatList(prev => prev.map(c => c.id === chat.id ? { ...c, unread: 0 } : c));
    setEditingMsg(null); setReplyingTo(null); setShowEmoji(false); setMenuOpenId(null); setReactionMenuId(null);
  };

  const scrollToMessage = (msgId: string) => {
    const element = document.getElementById(`msg-${msgId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('bg-[#e2f5ff]', 'transition-colors', 'duration-500');
      setTimeout(() => element.classList.remove('bg-[#e2f5ff]'), 1500);
    }
  };

  const handleSend = async () => {
    if ((!inputText.trim() && !selectedImage) || !activeChat || !user) return;
    
    const msgText = inputText;
    const imgData = selectedImage;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (editingMsg) {
      setMessages(prev => prev.map(m => m.id === editingMsg.id ? { ...m, text: msgText, isEdited: true } : m));
      const payload = { action: 'edit', messageId: editingMsg.id, newText: msgText };
      setEditingMsg(null); setInputText(''); setShowEmoji(false);
      await fetch('/api/chat-data', { method: 'POST', body: JSON.stringify(payload) });
      fetch('/api/notify', { method: 'POST', body: JSON.stringify({ receiverId: activeChat.id }) });
      return;
    }

    const replyTxt = replyingTo ? (replyingTo.text || (replyingTo.imageUrl ? '📷 Photo' : '')) : '';
    const replySndr = replyingTo ? (replyingTo.isSentByMe ? 'You' : activeChat.name) : '';
    const replyId = replyingTo ? replyingTo.id : '';

    setInputText(''); setSelectedImage(null); setShowEmoji(false); setReplyingTo(null);

    const optimisticMsg = {
      id: Date.now().toString(), text: msgText, type: imgData ? 'image' : 'text', imageUrl: imgData,
      status: 'sent', isDeleted: false, isEdited: false, time: timeStr, isSentByMe: true,
      replyToText: replyTxt, replyToSender: replySndr, replyToId: replyId, reactions: []
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setChatList(prev => {
      const existing = prev.find(c => c.id === activeChat.id);
      const updatedChat = { ...(existing || activeChat), lastMessage: imgData ? '📷 Photo' : msgText, time: timeStr, timestamp: Date.now() };
      return [updatedChat, ...prev.filter(c => c.id !== activeChat.id)];
    });

    const payload = {
      action: 'send', senderId: user.id, receiverId: activeChat.id,
      senderName: user.name, receiverName: activeChat.name,
      text: msgText, type: imgData ? 'image' : 'text', imageUrl: imgData,
      replyToText: replyTxt, replyToSender: replySndr, replyToId: replyId
    };
    await fetch('/api/chat-data', { method: 'POST', body: JSON.stringify(payload) });
    fetch('/api/notify', { method: 'POST', body: JSON.stringify({ receiverId: activeChat.id }) });
  };

  const deleteMsg = async (id: string, type: 'me' | 'everyone') => {
    setMenuOpenId(null);
    if(confirm(`Are you sure you want to delete this message for ${type}?`)) {
      if (type === 'everyone') {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, isDeleted: true } : m));
      } else {
        setMessages(prev => prev.filter(m => m.id !== id)); 
      }
      await fetch('/api/chat-data', { method: 'POST', body: JSON.stringify({ action: 'delete', messageId: id, deleteType: type, userId: user.id }) });
      if (type === 'everyone') fetch('/api/notify', { method: 'POST', body: JSON.stringify({ receiverId: activeChat.id }) });
    }
  };

  const handleReact = async (msgId: string, emoji: string) => {
    setReactionMenuId(null); setMenuOpenId(null);
    setMessages(prev => prev.map(m => {
      if (m.id === msgId) {
        let newReactions = m.reactions ? [...m.reactions] : [];
        const existingIdx = newReactions.findIndex((r:any) => r.userId === user.id);
        if (existingIdx !== -1) {
          if (newReactions[existingIdx].emoji === emoji) newReactions.splice(existingIdx, 1); 
          else newReactions[existingIdx].emoji = emoji; 
        } else {
          newReactions.push({ emoji, userId: user.id });
        }
        return { ...m, reactions: newReactions };
      }
      return m;
    }));
    await fetch('/api/chat-data', { method: 'POST', body: JSON.stringify({ action: 'react', messageId: msgId, userId: user.id, emoji }) });
    fetch('/api/notify', { method: 'POST', body: JSON.stringify({ receiverId: activeChat.id }) });
  };

  const handleOpenProfile = async () => {
    setWelcomeMsgInput(user.welcomeMessage || '');
    setAutoReplies(user.autoReplies || []); 
    setShowProfileModal(true);
    try {
      const res = await fetch('/api/user/get-welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: user.id })
      });
      if (res.ok) {
        const data = await res.json();
        setWelcomeMsgInput(data.welcomeMessage || '');
        setAutoReplies(data.autoReplies || []);
        const updatedUser = { ...user, welcomeMessage: data.welcomeMessage, autoReplies: data.autoReplies };
        setUser(updatedUser);
        localStorage.setItem('whatsapp_user', JSON.stringify(updatedUser));
      }
    } catch (e) {}
  };

  const cleanSearchTerm = searchTerm.replace(/\D/g, ''); 
  const isNewNumber = cleanSearchTerm.length === 10;
  const filteredChats = chatList.filter(chat => {
    const safeName = chat?.name?.toLowerCase() || '';
    const safeId = chat?.id || '';
    return safeName.includes(searchTerm.toLowerCase()) || safeId.includes(searchTerm);
  });
  const exactMatchExists = chatList.some(c => c.id === cleanSearchTerm);

  if (!user) return null;

  return (
    <main className="flex h-[100dvh] bg-[#F0F2F5] overflow-hidden font-sans antialiased text-[#111b21]" onClick={() => { setMenuOpenId(null); setReactionMenuId(null); }}>
      
      {/* 🟢 SIDEBAR */}
      <div className={`${activeChat ? 'hidden md:flex' : 'flex'} w-full md:w-[350px] lg:w-[400px] flex-col bg-white border-r border-neutral-300 h-full`}>
        <div className="h-16 px-3 sm:px-4 flex items-center justify-between bg-[#F0F2F5] shrink-0 border-b">
          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:bg-neutral-200 p-1.5 rounded transition-colors" onClick={handleOpenProfile}>
            <div className="w-10 h-10 rounded-full bg-neutral-300 flex items-center justify-center shadow-sm shrink-0"><User className="text-white w-6 h-6"/></div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">{user.name}</p>
              <p className="text-[11px] text-neutral-500 font-medium">ID: {user.id}</p>
            </div>
          </div>
          <button onClick={() => { localStorage.clear(); router.replace('/login'); }} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors shrink-0"><LogOut className="w-5 h-5"/></button>
        </div>

        <div className="p-3 bg-neutral-50 border-b space-y-2 shrink-0 hidden sm:block">
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

        <div className="p-2 border-b border-neutral-100 bg-white shrink-0">
          <div className="bg-[#F0F2F5] rounded-lg px-3 py-1.5 flex items-center">
            <Search className="w-4 h-4 text-neutral-500 mr-2 shrink-0"/>
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search or 10-digit no..." className="bg-transparent text-sm w-full outline-none"/>
            {searchTerm && <button onClick={() => setSearchTerm('')} className="shrink-0"><X className="w-4 h-4 text-neutral-400 hover:text-neutral-600"/></button>}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
          {isNewNumber && !exactMatchExists && (
            <div onClick={() => handleChatClick({ id: cleanSearchTerm, name: `+91 ${cleanSearchTerm}`, isAnon: false, unread: 0 })} className="flex items-center px-4 py-3 cursor-pointer border-b hover:bg-neutral-50 bg-[#e7fce3]/30">
              <div className="w-12 h-12 rounded-full bg-[#25D366] mr-3 shrink-0 flex items-center justify-center shadow-sm"><UserPlus className="text-white w-6 h-6"/></div>
              <div className="flex-1 min-w-0"><h2 className="text-[15.5px] font-bold text-neutral-800">Start new chat</h2><p className="text-sm text-neutral-500 truncate">+91 {cleanSearchTerm}</p></div>
            </div>
          )}

          {filteredChats.length === 0 && !isNewNumber && searchTerm ? <p className="text-center text-neutral-400 mt-10 text-sm italic">No contacts found</p> : 
          filteredChats.map(chat => (
            <div key={chat.id} onClick={() => handleChatClick(chat)} className={`flex items-center px-3 sm:px-4 py-3 cursor-pointer border-b hover:bg-neutral-50 ${activeChat?.id === chat.id ? 'bg-[#f0f2f5]' : ''}`}>
              <div className="w-12 h-12 rounded-full bg-neutral-200 mr-3 shrink-0 flex items-center justify-center shadow-sm">
                {chat.id?.startsWith('Guest_') ? <UserCircle2 className="text-blue-500 w-6 h-6"/> : <Phone className="text-green-600 w-5 h-5"/>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h2 className={`text-[15px] sm:text-[15.5px] truncate ${chat.unread > 0 ? 'font-bold' : 'font-medium'}`}>{chat.name || chat.id}</h2>
                  <span className={`text-[10px] shrink-0 ml-2 ${chat.unread > 0 ? 'text-[#25D366] font-bold' : 'text-neutral-400'}`}>{chat.time}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className={`text-sm truncate pr-2 ${chat.unread > 0 ? 'text-black font-medium' : 'text-neutral-500'}`}>{chat.lastMessage}</p>
                  {chat.unread > 0 && <span className="bg-[#25D366] text-white text-[10px] font-bold h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center shrink-0">{chat.unread}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🟢 CHAT AREA */}
      <div className={`${!activeChat ? 'hidden md:flex' : 'flex'} flex-col flex-1 bg-[#efeae2] relative h-full w-full`} onClick={() => {setMenuOpenId(null); setReactionMenuId(null);}}>
        {activeChat ? (
          <>
            <div className="h-16 px-3 sm:px-4 flex items-center bg-[#F0F2F5] border-b shrink-0 z-20 shadow-sm">
              <button onClick={() => setActiveChat(null)} className="md:hidden mr-2 p-1 rounded-full hover:bg-neutral-200 shrink-0"><ArrowLeft className="w-6 h-6"/></button>
              <div className="w-10 h-10 rounded-full bg-neutral-300 mr-3 shrink-0 flex items-center justify-center"><User className="text-white w-6 h-6"/></div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-[15px] sm:text-[16px] truncate">{activeChat.name}</h2>
                <p className="text-[11px] text-green-600 font-medium">Online</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-5 md:px-8 md:py-6 space-y-1 relative custom-scrollbar flex flex-col" style={{backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundSize: '400px'}}>
              {messages.map((msg) => {
                const hasReactions = msg.reactions && msg.reactions.length > 0 && !msg.isDeleted;
                return (
                  <div key={msg.id} id={`msg-${msg.id}`} className={`flex ${msg.isSentByMe ? 'justify-end' : 'justify-start'} group relative transition-all w-full ${hasReactions ? 'mb-4' : 'mb-1'}`}>
                    
                    <div className={`max-w-[85%] sm:max-w-[75%] md:max-w-[65%] rounded-lg px-2.5 sm:px-3 py-1.5 shadow-sm relative break-words ${msg.isSentByMe ? 'bg-[#d9fdd3] rounded-tr-none' : 'bg-white rounded-tl-none'} ${msg.isDeleted ? 'bg-transparent border border-neutral-300 shadow-none' : ''}`}>
                      
                      {!msg.isDeleted && (
                        <button onClick={(e) => { e.stopPropagation(); setReactionMenuId(null); setMenuOpenId(menuOpenId === msg.id ? null : msg.id); }} className={`absolute top-1 right-1 p-0.5 rounded-full bg-white/50 text-neutral-400 hover:text-neutral-700 transition-opacity z-30 opacity-100 md:opacity-0 md:group-hover:opacity-100`}>
                          <ChevronDown className="w-5 h-5"/>
                        </button>
                      )}

                      {menuOpenId === msg.id && !msg.isDeleted && (
                        <div className={`absolute top-8 ${msg.isSentByMe ? 'right-2' : 'left-2 md:left-8'} bg-white shadow-xl rounded-md border py-1 w-44 z-50 overflow-hidden text-[14px]`}>
                          <button onClick={(e) => { e.stopPropagation(); setReactionMenuId(msg.id); setMenuOpenId(null); }} className="w-full text-left px-4 py-2 hover:bg-neutral-100 flex items-center gap-2 border-b"><Heart className="w-4 h-4 text-red-500"/> React</button>
                          <button onClick={(e) => { e.stopPropagation(); setReplyingTo(msg); setMenuOpenId(null); }} className="w-full text-left px-4 py-2 hover:bg-neutral-100 flex items-center gap-2 border-b"><Reply className="w-4 h-4 text-blue-500"/> Reply</button>
                          {msg.isSentByMe && msg.type === 'text' && <button onClick={(e) => { e.stopPropagation(); setEditingMsg(msg); setInputText(msg.text || ''); setMenuOpenId(null); }} className="w-full text-left px-4 py-2 hover:bg-neutral-100 flex items-center gap-2 border-b"><Edit2 className="w-4 h-4 text-neutral-600"/> Edit</button>}
                          <button onClick={(e) => { e.stopPropagation(); deleteMsg(msg.id, 'me'); }} className="w-full text-left px-4 py-2 hover:bg-neutral-100 flex items-center gap-2 border-b"><Trash2 className="w-4 h-4 text-neutral-600"/> Delete for me</button>
                          {msg.isSentByMe && <button onClick={(e) => { e.stopPropagation(); deleteMsg(msg.id, 'everyone'); }} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2"><Trash2 className="w-4 h-4"/> Delete for everyone</button>}
                        </div>
                      )}

                      {reactionMenuId === msg.id && !msg.isDeleted && (
                        <div className={`absolute -top-12 ${msg.isSentByMe ? 'right-0' : 'left-0'} bg-white shadow-lg rounded-full border px-2 py-1.5 flex gap-2 sm:gap-3 z-50 animate-in slide-in-from-bottom-2`}>
                          {QUICK_REACTIONS.map(emoji => (
                            <button key={emoji} onClick={(e) => { e.stopPropagation(); handleReact(msg.id, emoji); }} className="hover:scale-125 hover:-translate-y-1 transition-all text-lg sm:text-xl">{emoji}</button>
                          ))}
                        </div>
                      )}

                      {msg.replyToText && !msg.isDeleted && (
                        <div onClick={() => msg.replyToId && scrollToMessage(msg.replyToId)} className="bg-black/5 hover:bg-black/10 transition-colors p-2 rounded mb-1.5 border-l-4 border-[#00a884] text-[13px] text-neutral-600 relative overflow-hidden cursor-pointer mt-2">
                          <span className="font-bold text-[#00a884] block truncate">{msg.replyToSender}</span>
                          <span className="line-clamp-2 leading-tight whitespace-pre-wrap">{msg.replyToText}</span>
                        </div>
                      )}

                      {msg.isDeleted ? (
                        <p className="text-[13px] italic text-neutral-500 flex items-center gap-1"><Ban className="w-3.5 h-3.5"/> This message was deleted</p>
                      ) : (
                        <>
                          {msg.type === 'image' && <img src={msg.imageUrl} className="rounded-md mb-1.5 max-w-full max-h-72 object-cover border border-black/5" />}
                          <div className="relative">
                            {msg.text && <p className="text-[14.5px] sm:text-[15px] whitespace-pre-wrap leading-relaxed text-[#111b21] pb-[2px]">{msg.text}</p>}
                            <div className="flex items-center justify-end gap-1 mt-0.5 float-right ml-3">
                              {msg.isEdited && <span className="text-[10px] text-neutral-400 italic mr-1">Edited</span>}
                              <span className="text-[10px] text-neutral-500 uppercase leading-none">{msg.time}</span>
                              {msg.isSentByMe && (
                                msg.status === 'sent' ? <Check className="w-3.5 h-3.5 text-neutral-400"/> :
                                msg.status === 'seen' ? <CheckCheck className="w-3.5 h-3.5 text-[#34B7F1]"/> : 
                                <CheckCheck className="w-3.5 h-3.5 text-neutral-400"/>
                              )}
                            </div>
                            <div className="clear-both"></div>
                          </div>
                        </>
                      )}

                      {hasReactions && (
                        <div className={`absolute -bottom-3.5 ${msg.isSentByMe ? 'right-1 sm:right-2' : 'left-1 sm:left-2'} bg-white shadow-[0_1px_3px_rgba(0,0,0,0.15)] border border-black/5 rounded-full px-1.5 py-[2px] flex items-center justify-center gap-1 z-20 select-none`}>
                          <span className="text-[13px] sm:text-[15px] leading-none flex items-center">
                            {Array.from(new Set(msg.reactions.map((r:any) => r.emoji))).join('')}
                          </span>
                          {msg.reactions.length > 1 && <span className="text-[#00a884] font-bold text-[10px] pr-0.5">{msg.reactions.length}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="bg-[#F0F2F5] px-2 py-2 sm:px-4 sm:py-3 flex flex-col shrink-0 border-t relative z-20">
              {(editingMsg || replyingTo) && (
                <div className="bg-neutral-200 p-2 rounded-t-lg flex justify-between items-center border-l-4 border-[#00a884] mb-2 shadow-sm">
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] sm:text-[13px] text-[#00a884] font-bold flex items-center gap-1 mb-0.5">
                      {editingMsg ? <><Edit2 className="w-3 h-3"/> Edit Message</> : <><Reply className="w-3 h-3"/> Replying to {replyingTo.isSentByMe ? 'Yourself' : activeChat.name}</>}
                    </p>
                    <p className="text-[13px] sm:text-sm truncate text-neutral-600">{editingMsg ? editingMsg.text : (replyingTo.text || '📷 Photo')}</p>
                  </div>
                  <button onClick={() => { setEditingMsg(null); setReplyingTo(null); setInputText(''); }} className="p-1"><X className="w-5 h-5 text-neutral-500 hover:text-neutral-800"/></button>
                </div>
              )}

              {showEmoji && <div className="absolute bottom-full left-0 sm:left-2 z-[100] shadow-2xl mb-2 sm:max-w-sm w-full"><EmojiPicker onEmojiClick={(e) => setInputText(prev => prev + e.emoji)} width="100%" height={350}/></div>}
              {selectedImage && <div className="absolute bottom-full left-4 mb-2 w-20 h-20 sm:w-24 sm:h-24 bg-white p-1 rounded-lg border-2 border-[#25D366] shadow-xl"><img src={selectedImage} className="w-full h-full object-cover rounded"/><button onClick={()=>setSelectedImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X className="w-3 h-3"/></button></div>}

              <div className="flex items-end gap-1 sm:gap-2 w-full">
                <button onClick={() => setShowEmoji(!showEmoji)} className="p-1.5 sm:p-2 hover:bg-neutral-200 rounded-full transition-colors shrink-0 mb-0.5">
                  <Smile className={`w-6 h-6 sm:w-7 sm:h-7 ${showEmoji ? 'text-[#00a884]' : 'text-neutral-500'}`}/>
                </button>
                
                {!editingMsg && (
                  <button onClick={()=>fileRef.current?.click()} className="p-1.5 sm:p-2 hover:bg-neutral-200 rounded-full shrink-0 mb-0.5">
                    <ImageIcon className="text-neutral-500 w-6 h-6 sm:w-6 sm:h-6"/>
                  </button>
                )}
                <input type="file" ref={fileRef} hidden accept="image/*" onChange={(e:any)=>{const f=e.target.files[0];if(f){const r=new FileReader();r.onloadend=()=>setSelectedImage(r.result as string);r.readAsDataURL(f);}}} />
                
                <input 
                  type="text" 
                  value={inputText} 
                  onChange={(e)=>setInputText(e.target.value)} 
                  onKeyDown={(e)=>e.key==='Enter'&&handleSend()} 
                  placeholder="Type a message" 
                  className="flex-1 min-w-0 min-h-[44px] bg-white rounded-2xl sm:rounded-full px-4 py-2.5 sm:px-5 sm:py-3 outline-none text-[14.5px] sm:text-[15px] shadow-sm mb-0.5" 
                />
                
                <button onClick={handleSend} className={`p-2.5 sm:p-3 rounded-full transition-all shrink-0 active:scale-95 mb-0.5 ${inputText.trim() || selectedImage ? 'bg-[#00a884] text-white shadow-md' : 'bg-neutral-300 text-neutral-500'}`}>
                  {editingMsg ? <Check className="w-5 h-5 sm:w-6 sm:h-6"/> : <Send className="w-5 h-5 sm:w-6 sm:h-6 pl-1"/>}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center bg-[#f0f2f5] px-4">
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm"><UserCircle2 className="w-12 h-12 sm:w-16 sm:h-16 text-neutral-300"/></div>
            <h1 className="text-2xl sm:text-3xl font-light text-neutral-700">WhatsApp Web</h1>
            <p className="text-[13px] sm:text-sm mt-3 text-neutral-500 max-w-md px-6">Send and receive messages without keeping your phone online. Search or type a 10-digit number to start a direct chat.</p>
          </div>
        )}
      </div>

      {/* 🟢 PROFILE / WELCOME MESSAGE MODAL */}
      {showProfileModal && (
        <div className="absolute inset-0 z-[200] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-sm relative shrink-0 overflow-y-auto">
            <button onClick={() => setShowProfileModal(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-black"><X className="w-5 h-5"/></button>
            <h2 className="text-xl font-bold mb-4">Your Profile</h2>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-neutral-600 mb-1">Default Welcome Message</label>
              <textarea 
                value={welcomeMsgInput}
                onChange={(e) => setWelcomeMsgInput(e.target.value)}
                placeholder="Message sent on their first text..."
                className="w-full border rounded-lg p-2 text-sm outline-none focus:border-[#25D366] resize-none h-16"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold text-neutral-600 mb-2">Custom Keyword Replies</label>
              <div className="max-h-52 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {autoReplies.map((rule, idx) => (
                  <div key={idx} className="flex gap-2 items-start bg-neutral-50 p-2 rounded border border-neutral-200">
                    <div className="flex-1 space-y-2">
                      <input 
                        value={rule.keyword} 
                        onChange={(e) => { const newArr = [...autoReplies]; newArr[idx].keyword = e.target.value; setAutoReplies(newArr); }}
                        placeholder="Keyword (e.g., Price)" 
                        className="w-full border p-1.5 text-[13px] rounded outline-none focus:border-[#00a884]"
                      />
                      <input 
                        value={rule.response} 
                        onChange={(e) => { const newArr = [...autoReplies]; newArr[idx].response = e.target.value; setAutoReplies(newArr); }}
                        placeholder="Reply message" 
                        className="w-full border p-1.5 text-[13px] rounded outline-none focus:border-[#00a884]"
                      />
                    </div>
                    <button onClick={() => setAutoReplies(autoReplies.filter((_, i) => i !== idx))} className="text-red-500 p-1.5 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4"/></button>
                  </div>
                ))}
              </div>
              {autoReplies.length < 6 && (
                <button onClick={() => setAutoReplies([...autoReplies, { keyword: '', response: '' }])} className="text-[#00a884] text-[13px] font-bold mt-2 hover:underline">
                  + Add Keyword Rule
                </button>
              )}
            </div>

            <button 
              disabled={isSavingWelcome}
              onClick={async () => {
                setIsSavingWelcome(true);
                const validRules = autoReplies.filter(r => r.keyword.trim() && r.response.trim());
                try {
                  const res = await fetch('/api/user/update-welcome', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phoneNumber: user.id, welcomeMessage: welcomeMsgInput, autoReplies: validRules })
                  });
                  if (res.ok) {
                    const updatedUser = { ...user, welcomeMessage: welcomeMsgInput, autoReplies: validRules };
                    setUser(updatedUser);
                    localStorage.setItem('whatsapp_user', JSON.stringify(updatedUser));
                    setShowProfileModal(false);
                  } else {
                    alert('Failed to update settings.');
                  }
                } catch (e) {
                  alert('Error updating settings.');
                }
                setIsSavingWelcome(false);
              }}
              className="w-full bg-[#25D366] text-white font-bold py-2.5 rounded-lg hover:bg-[#1DA851] transition-colors disabled:opacity-50"
            >
              {isSavingWelcome ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}