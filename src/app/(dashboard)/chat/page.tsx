'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, Smile, Users, Hash, Crown } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/auth';

interface ChatMessage {
  id: string;
  userId: string;
  name: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

const CHAT_COLORS = [
  'from-purple-500 to-violet-600',
  'from-pink-500 to-rose-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-600',
  'from-indigo-500 to-blue-600',
  'from-fuchsia-500 to-purple-600',
  'from-red-500 to-orange-600',
];

const BUBBLE_COLORS = [
  'bg-purple-100 text-purple-900',
  'bg-pink-100 text-pink-900',
  'bg-blue-100 text-blue-900',
  'bg-emerald-100 text-emerald-900',
  'bg-orange-100 text-orange-900',
  'bg-indigo-100 text-indigo-900',
  'bg-fuchsia-100 text-fuchsia-900',
  'bg-red-100 text-red-900',
];

function getColorIndex(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % CHAT_COLORS.length;
}

const EMOJI_LIST = ['😂', '😍', '🔥', '👏', '🎉', '💪', '🎰', '🤑', '😎', '🍀', '🏆', '❤️', '👍', '😢', '😮'];

export default function ChatPage() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [onlineCount, setOnlineCount] = useState(0);
  const [showEmoji, setShowEmoji] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<any>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const myName = user?.username || `Guest-${Math.random().toString(36).slice(2, 6)}`;
    const myId = user?.id || `guest-${Math.random().toString(36).slice(2, 10)}`;

    const channel = supabase.channel('global-chat', {
      config: {
        broadcast: { self: true },
        presence: { key: myId },
      },
    });
    channelRef.current = channel;

    // Listen to broadcasts (chat messages)
    channel.on('broadcast', { event: 'message' }, ({ payload }) => {
      const msg = payload as ChatMessage;
      setMessages(prev => {
        // Deduplicate
        if (prev.find(m => m.id === msg.id)) return prev;
        const updated = [...prev, msg].slice(-100); // keep last 100
        return updated;
      });
      scrollToBottom();
    });

    // Presence for online count
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      setOnlineCount(Object.keys(state).length);
    });
    channel.on('presence', { event: 'join' }, () => {
      const state = channel.presenceState();
      setOnlineCount(Object.keys(state).length);
    });
    channel.on('presence', { event: 'leave' }, () => {
      const state = channel.presenceState();
      setOnlineCount(Object.keys(state).length);
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ name: myName, userId: myId });
        // Send join system message
        const joinMsg: ChatMessage = {
          id: `join-${myId}-${Date.now()}`,
          userId: 'system',
          name: 'System',
          text: `${myName} joined the chat 👋`,
          timestamp: Date.now(),
          isSystem: true,
        };
        channel.send({ type: 'broadcast', event: 'message', payload: joinMsg });
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, scrollToBottom]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || sending || !channelRef.current) return;
    setSending(true);

    const myName = user?.username || 'Guest';
    const myId = user?.id || 'guest';

    const msg: ChatMessage = {
      id: `msg-${myId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId: myId,
      name: myName,
      text,
      timestamp: Date.now(),
    };

    await channelRef.current.send({ type: 'broadcast', event: 'message', payload: msg });
    setInput('');
    setSending(false);
    inputRef.current?.focus();
  }, [input, sending, user]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const myId = user?.id || 'guest';

  return (
    <div className="flex flex-col h-screen md:h-[calc(100vh-0px)] bg-[#f3f0ff] overflow-hidden pb-16 md:pb-0">

      {/* Header */}
      <div className="bg-white border-b border-purple-100 px-4 py-3 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center shadow">
            <Hash className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-800 text-sm leading-tight">Global Chat</h1>
            <p className="text-[10px] text-purple-500 font-semibold">Bingo Arena Community</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-green-50 border border-green-100 px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <Users className="w-3.5 h-3.5 text-green-600" />
          <span className="text-xs font-bold text-green-700">{onlineCount}</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40 select-none">
            <MessageCircle className="w-14 h-14 text-purple-300" />
            <p className="text-sm text-gray-400 font-medium">No messages yet. Say hello! 👋</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            if (msg.isSystem) {
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex justify-center"
                >
                  <span className="text-[10px] bg-purple-50 border border-purple-100 text-purple-500 px-3 py-1 rounded-full font-medium">
                    {msg.text}
                  </span>
                </motion.div>
              );
            }

            const isMe = msg.userId === myId;
            const colorIdx = getColorIndex(msg.userId);

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', bounce: 0.3, duration: 0.3 }}
                className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                {!isMe && (
                  <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${CHAT_COLORS[colorIdx]} flex items-center justify-center text-white font-black text-xs shrink-0 shadow-sm`}>
                    {msg.name.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className={`max-w-[75%] sm:max-w-[65%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && (
                    <span className="text-[10px] font-bold text-gray-500 mb-1 ml-1">{msg.name}</span>
                  )}
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl text-sm font-medium leading-relaxed shadow-sm ${
                      isMe
                        ? 'bg-gradient-to-br from-purple-600 to-violet-700 text-white rounded-br-md'
                        : `${BUBBLE_COLORS[colorIdx]} rounded-bl-md`
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-gray-400 mt-1 mx-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* Emoji Picker */}
      <AnimatePresence>
        {showEmoji && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-white border border-purple-100 shadow-lg rounded-2xl mx-3 mb-2 p-3 shrink-0"
          >
            <div className="flex flex-wrap gap-2">
              {EMOJI_LIST.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => {
                    setInput(prev => prev + emoji);
                    setShowEmoji(false);
                    inputRef.current?.focus();
                  }}
                  className="text-xl hover:scale-125 transition-transform active:scale-95"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Bar */}
      <div className="bg-white border-t border-purple-100 px-3 py-3 shrink-0 shadow-[0_-4px_20px_rgba(139,92,246,0.08)]">
        <div className="flex items-center gap-2 max-w-4xl mx-auto">
          <button
            onClick={() => setShowEmoji(v => !v)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors shrink-0 ${showEmoji ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500 hover:bg-purple-50 hover:text-purple-500'}`}
          >
            <Smile className="w-4.5 h-4.5" />
          </button>

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            maxLength={280}
            className="flex-1 bg-gray-50 border border-gray-200 focus:border-purple-400 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none transition-colors"
          />

          <motion.button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            whileTap={{ scale: 0.92 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center text-white shadow-md disabled:opacity-40 disabled:cursor-not-allowed shrink-0 transition-opacity"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
