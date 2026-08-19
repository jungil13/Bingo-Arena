'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, Smile, Users, Hash } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/auth';

/* ─────────────────────── Types ────────────────────────── */
interface ChatMessage {
  id: string;
  userId: string;
  name: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

/* ─────────────────────── Helpers ──────────────────────── */
const CHAT_COLORS = [
  'from-purple-500 to-violet-600', 'from-pink-500 to-rose-600',
  'from-blue-500 to-cyan-600',     'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-600',  'from-indigo-500 to-blue-600',
  'from-fuchsia-500 to-purple-600','from-red-500 to-orange-600',
];
const BUBBLE_COLORS = [
  'bg-purple-100 text-purple-900', 'bg-pink-100 text-pink-900',
  'bg-blue-100 text-blue-900',     'bg-emerald-100 text-emerald-900',
  'bg-orange-100 text-orange-900', 'bg-indigo-100 text-indigo-900',
  'bg-fuchsia-100 text-fuchsia-900','bg-red-100 text-red-900',
];
function getColorIdx(userId: string) {
  let h = 0;
  for (let i = 0; i < userId.length; i++) h = userId.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h) % CHAT_COLORS.length;
}

const EMOJI_LIST = ['😂','😍','🔥','👏','🎉','💪','🎰','🤑','😎','🍀','🏆','❤️','👍','😢','😮'];
const LS_KEY    = 'bingo_chat_v1';
const MAX_MSGS  = 100;

function load(): ChatMessage[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}
function save(msgs: ChatMessage[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(msgs.slice(-MAX_MSGS))); } catch {}
}

/* ─────────────────────── Component ────────────────────── */
export default function ChatPage() {
  const { user } = useAuthStore();

  const [msgs,       setMsgs]       = useState<ChatMessage[]>([]);
  const [input,      setInput]      = useState('');
  const [online,     setOnline]     = useState(0);
  const [showEmoji,  setShowEmoji]  = useState(false);
  const [sending,    setSending]    = useState(false);
  const [ready,      setReady]      = useState(false);

  const listRef     = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLInputElement>(null);
  const channelRef  = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);
  const subscribed  = useRef(false);        // block double-subscribe (React Strict Mode)
  const myId        = useRef('');
  const myName      = useRef('');

  /* Scroll to bottom */
  const scrollBottom = useCallback((instant = false) => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: instant ? 'auto' : 'smooth' });
  }, []);

  /* Load history from localStorage */
  useEffect(() => {
    setMsgs(load());
    setReady(true);
  }, []);

  /* Scroll to bottom after history loads */
  useEffect(() => {
    if (ready) scrollBottom(true);
  }, [ready, scrollBottom]);

  /* Supabase realtime */
  useEffect(() => {
    if (subscribed.current) return;
    subscribed.current = true;

    myName.current = user?.username || `Guest-${Math.random().toString(36).slice(2, 6)}`;
    myId.current   = user?.id       || `guest-${Math.random().toString(36).slice(2, 10)}`;

    const supabase = createClient();
    const ch = supabase.channel('global-chat', {
      config: { broadcast: { self: true }, presence: { key: myId.current } },
    });
    channelRef.current = ch;

    /* Incoming messages */
    ch.on('broadcast', { event: 'msg' }, ({ payload }) => {
      const m = payload as ChatMessage;
      setMsgs(prev => {
        if (prev.some(x => x.id === m.id)) return prev;
        const next = [...prev, m].slice(-MAX_MSGS);
        save(next);
        return next;
      });
      setTimeout(() => scrollBottom(), 60);
    });

    /* Online presence */
    const syncOnline = () => setOnline(Object.keys(ch.presenceState()).length);
    ch.on('presence', { event: 'sync' }, syncOnline);
    ch.on('presence', { event: 'join' }, syncOnline);
    ch.on('presence', { event: 'leave' }, syncOnline);

    ch.subscribe(async status => {
      if (status !== 'SUBSCRIBED') return;
      await ch.track({ name: myName.current, userId: myId.current });

      /* Join announcement (stable id = no dup on remount) */
      const jm: ChatMessage = {
        id:        `join-${myId.current}`,
        userId:    'system',
        name:      'System',
        text:      `${myName.current} joined 👋`,
        timestamp: Date.now(),
        isSystem:  true,
      };
      ch.send({ type: 'broadcast', event: 'msg', payload: jm });
    });

    return () => { supabase.removeChannel(ch); subscribed.current = false; };
  }, [user, scrollBottom]);

  /* Send message */
  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || sending || !channelRef.current) return;
    setSending(true);
    const m: ChatMessage = {
      id:        `msg-${myId.current}-${Date.now()}`,
      userId:    myId.current,
      name:      myName.current,
      text,
      timestamp: Date.now(),
    };
    await channelRef.current.send({ type: 'broadcast', event: 'msg', payload: m });
    setInput('');
    setSending(false);
    inputRef.current?.focus();
  }, [input, sending]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const me = myId.current || user?.id || 'guest';

  /* ─────────────── Render ─────────────── */
  return (
    <div className="flex flex-col h-full bg-[#f3f0ff]">
      {/* Header */}
      <div className="shrink-0 bg-white border-b border-purple-100 px-4 py-3 flex items-center justify-between shadow-sm">
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
          <span className="text-xs font-bold text-green-700">{online}</span>
        </div>
      </div>

      {/* Message list — scroll container */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-3 py-3 space-y-2"
        style={{ overscrollBehavior: 'contain' }}
      >
        {msgs.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center gap-3 opacity-40 select-none">
            <MessageCircle className="w-12 h-12 text-purple-300" />
            <p className="text-sm text-gray-400 font-medium">No messages yet. Say hello! 👋</p>
          </div>
        )}

        {msgs.map(m => {
          if (m.isSystem) return (
            <div key={m.id} className="flex justify-center">
              <span className="text-[10px] bg-purple-50 border border-purple-100 text-purple-500 px-3 py-1 rounded-full font-medium">
                {m.text}
              </span>
            </div>
          );

          const isMe = m.userId === me;
          const ci   = getColorIdx(m.userId);

          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {!isMe && (
                <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${CHAT_COLORS[ci]} flex items-center justify-center text-white font-black text-xs shrink-0 shadow-sm`}>
                  {m.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && <span className="text-[10px] font-bold text-gray-500 mb-0.5 ml-1">{m.name}</span>}
                <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed shadow-sm break-words ${
                  isMe
                    ? 'bg-gradient-to-br from-purple-600 to-violet-700 text-white rounded-br-sm'
                    : `${BUBBLE_COLORS[ci]} rounded-bl-sm`
                }`}>
                  {m.text}
                </div>
                <span className="text-[9px] text-gray-400 mt-0.5 mx-1">
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Emoji picker */}
      <AnimatePresence>
        {showEmoji && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="shrink-0 bg-white border-t border-purple-100 px-3 py-2 flex flex-wrap gap-1.5"
          >
            {EMOJI_LIST.map(e => (
              <button key={e} onClick={() => { setInput(p => p + e); setShowEmoji(false); inputRef.current?.focus(); }}
                className="text-2xl hover:scale-110 active:scale-95 transition-transform">
                {e}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <div className="shrink-0 bg-white border-t border-purple-100 px-3 py-3 shadow-[0_-2px_12px_rgba(139,92,246,0.07)]"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center gap-2 max-w-3xl mx-auto">
          <button
            onClick={() => setShowEmoji(v => !v)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              showEmoji ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500 hover:bg-purple-50 hover:text-purple-500'
            }`}
          >
            <Smile className="w-5 h-5" />
          </button>

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="Type a message…"
            maxLength={280}
            className="flex-1 bg-gray-50 border border-gray-200 focus:border-purple-400 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none transition-colors"
          />

          <motion.button
            onClick={send}
            disabled={!input.trim() || sending}
            whileTap={{ scale: 0.88 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center text-white shadow-md disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
