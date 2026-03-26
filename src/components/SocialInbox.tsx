import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Filter, 
  MessageSquare, 
  MoreVertical, 
  Send, 
  Facebook, 
  Instagram, 
  Twitter, 
  Youtube,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Smile,
  ImageIcon,
  Paperclip,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { SocialMessage, SocialPlatform } from '../types';
import { cn } from '../lib/utils';

interface SocialInboxProps {
  agencyId: string;
}

export const SocialInbox: React.FC<SocialInboxProps> = ({ agencyId }) => {
  const [messages, setMessages] = useState<SocialMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<SocialMessage | null>(null);
  const [reply, setReply] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock messages for demo
    const mockMessages: SocialMessage[] = [
      {
        id: 'm1',
        agencyId,
        accountId: '1',
        platform: 'facebook',
        senderId: 'u1',
        senderName: 'John Doe',
        content: 'How much is the Santorini package for a family of 4?',
        type: 'comment',
        status: 'unread',
        timestamp: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'm2',
        agencyId,
        accountId: '2',
        platform: 'instagram',
        senderId: 'u2',
        senderName: 'Jane Smith',
        content: 'I love the Bali vlog! Can you send me the itinerary?',
        type: 'dm',
        status: 'read',
        timestamp: new Date(Date.now() - 7200000).toISOString()
      },
      {
        id: 'm3',
        agencyId,
        accountId: '3',
        platform: 'x',
        senderId: 'u3',
        senderName: 'TravelLover_99',
        content: 'Is the flight included in the price?',
        type: 'comment',
        status: 'replied',
        timestamp: new Date(Date.now() - 86400000).toISOString()
      }
    ];

    setMessages(mockMessages);
    setIsLoading(false);
  }, [agencyId]);

  const handleSendReply = () => {
    if (!reply.trim() || !selectedMessage) return;
    
    // In real app, send API call to platform
    console.log(`Replying to ${selectedMessage.senderName}: ${reply}`);
    
    // Update local state for demo
    setMessages(prev => prev.map(m => 
      m.id === selectedMessage.id ? { ...m, status: 'replied' } : m
    ));
    setReply('');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden h-[700px] flex"
    >
      {/* Sidebar: Message List */}
      <div className="w-1/3 border-r border-slate-100 flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search messages..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {messages.map(msg => (
            <button
              key={msg.id}
              onClick={() => setSelectedMessage(msg)}
              className={cn(
                "w-full p-6 text-left hover:bg-slate-50 transition-all flex items-start gap-4",
                selectedMessage?.id === msg.id ? "bg-indigo-50/50" : ""
              )}
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <User size={24} className="text-slate-400" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-white border-2 border-white flex items-center justify-center shadow-sm">
                  {msg.platform === 'facebook' && <Facebook size={12} className="text-blue-600" />}
                  {msg.platform === 'instagram' && <Instagram size={12} className="text-pink-600" />}
                  {msg.platform === 'x' && <Twitter size={12} className="text-slate-900" />}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-slate-900 truncate">{msg.senderName}</h4>
                  <span className="text-[10px] text-slate-400 font-bold">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className={cn(
                  "text-xs truncate",
                  msg.status === 'unread' ? "font-bold text-slate-900" : "text-slate-500"
                )}>
                  {msg.content}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={cn(
                    "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
                    msg.type === 'dm' ? "bg-indigo-50 text-indigo-600" : "bg-amber-50 text-amber-600"
                  )}>
                    {msg.type}
                  </span>
                  {msg.status === 'replied' && (
                    <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 size={10} />
                      Replied
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-50/30">
        {selectedMessage ? (
          <>
            {/* Chat Header */}
            <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <User size={24} className="text-slate-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{selectedMessage.senderName}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 capitalize">
                    {selectedMessage.platform} • {selectedMessage.type}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-all"><Filter size={18} /></button>
                <button className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-all"><MoreVertical size={18} /></button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <User size={20} className="text-slate-400" />
                </div>
                <div className="bg-white p-6 rounded-3xl rounded-tl-none border border-slate-100 shadow-sm max-w-md">
                  <p className="text-sm text-slate-700 leading-relaxed">{selectedMessage.content}</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-4 uppercase tracking-widest">
                    {new Date(selectedMessage.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>

              {selectedMessage.status === 'replied' && (
                <div className="flex items-start gap-4 flex-row-reverse">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 size={20} className="text-white" />
                  </div>
                  <div className="bg-indigo-600 p-6 rounded-3xl rounded-tr-none shadow-lg shadow-indigo-100 max-w-md">
                    <p className="text-sm text-white leading-relaxed">Thank you for reaching out! One of our agents will send you the details shortly.</p>
                    <p className="text-[10px] text-indigo-200 font-bold mt-4 uppercase tracking-widest">
                      Replied by AI Assistant
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-6 bg-white border-t border-slate-100">
              <div className="relative">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder={`Reply to ${selectedMessage.senderName}...`}
                  className="w-full p-6 pr-32 bg-slate-50 border border-slate-100 rounded-3xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none h-24"
                />
                <div className="absolute right-4 bottom-4 flex items-center gap-2">
                  <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 transition-all"><Smile size={18} /></button>
                  <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 transition-all"><ImageIcon size={18} /></button>
                  <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 transition-all"><Paperclip size={18} /></button>
                  <button 
                    onClick={handleSendReply}
                    disabled={!reply.trim()}
                    className="p-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all disabled:opacity-50 disabled:shadow-none"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            <div className="w-24 h-24 bg-indigo-50 rounded-[40px] flex items-center justify-center mb-8">
              <MessageSquare size={48} className="text-indigo-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Select a message</h3>
            <p className="text-slate-500 max-w-xs">Choose a conversation from the sidebar to start replying to your customers.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
