'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Volume2, VolumeX, ChevronLeft, ChevronRight, MessageCircle, Users, Grid3x3,
  Trophy, Send, Mic, MicOff, Crown, Star, X, Bot, ArrowRight, Check, Clock
} from 'lucide-react';
import { useGameStore, getBingoLetter } from '@/lib/store/game';
import type { RealPlayer } from '@/lib/store/game';
import { useRoomStore } from '@/lib/store/room';
import { getCardRows } from '@/lib/bingo/generator';
import type { BingoNumber } from '@/lib/bingo/generator';
import { useAudio } from '@/lib/hooks/useAudio';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/auth';
import { markGameAsLeft, hasLeftGame } from '@/lib/utils';

// ─── Mobile tab types ────────────────────────────────────────────────────────
type MobileTab = 'card' | 'numbers' | 'players' | 'chat';

// ─── Letter column colours ────────────────────────────────────────────────────
const LETTER_COLORS: Record<string, string> = {
  B: 'text-blue-400',
  I: 'text-red-400',
  N: 'text-green-400',
  G: 'text-yellow-400',
  O: 'text-purple-400',
};

const LETTER_BG: Record<string, string> = {
  B: 'bg-blue-500',
  I: 'bg-red-500',
  N: 'bg-green-500',
  G: 'bg-yellow-500',
  O: 'bg-purple-500',
};

// ─── Draw-ball animation numbers ─────────────────────────────────────────────
function ShuffleBall({ active }: { active: boolean }) {
  const [display, setDisplay] = useState('??');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (active) {
      intervalRef.current = setInterval(() => {
        setDisplay(String(Math.floor(Math.random() * 75) + 1));
      }, 60);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [active]);

  return (
    <motion.div
      animate={active ? { rotate: [0, 10, -10, 8, -8, 4, -4, 0], scale: [1, 1.05, 0.98, 1.03, 1] } : {}}
      transition={{ duration: 0.6, repeat: active ? Infinity : 0, repeatType: 'loop' }}
      className="w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-primary via-primary/80 to-accent
                 flex items-center justify-center shadow-[0_0_50px_rgba(176,38,255,0.7)] border-4 border-white/10 relative"
    >
      {/* Shine */}
      <div className="absolute top-3 left-5 w-8 h-5 bg-white/20 rounded-full blur-sm rotate-[-30deg]" />
      <span className="font-outfit font-black text-5xl sm:text-6xl text-white drop-shadow-lg select-none">
        {display}
      </span>
    </motion.div>
  );
}

// ─── Called numbers board ─────────────────────────────────────────────────────
function CalledBoard({ calledNumbers }: { calledNumbers: number[] }) {
  const letters = ['B', 'I', 'N', 'G', 'O'];
  const ranges: Record<string, [number, number]> = {
    B: [1, 15], I: [16, 30], N: [31, 45], G: [46, 60], O: [61, 75],
  };

  return (
    <div className="grid grid-cols-5 gap-1 text-center">
      {letters.map(l => (
        <div key={l}>
          <div className={`${LETTER_BG[l]} text-white font-black text-sm py-1 rounded-t-lg`}>{l}</div>
          <div className="space-y-1 pt-1">
            {Array.from({ length: 15 }, (_, i) => {
              const num = ranges[l][0] + i;
              const called = calledNumbers.includes(num);
              return (
                <div
                  key={num}
                  className={cn(
                    'w-full aspect-square flex items-center justify-center text-xs font-bold rounded transition-all duration-300',
                    called ? `${LETTER_BG[l]} text-white shadow-sm` : 'bg-white/5 text-white/20'
                  )}
                >
                  {num}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Bingo card ───────────────────────────────────────────────────────────────
function BingoCard({
  card,
  markedNumbers,
  calledNumbers,
  onTap,
  winnerLines,
}: {
  card: ReturnType<typeof getCardRows>;
  markedNumbers: Set<BingoNumber>;
  calledNumbers: number[];
  onTap: (num: BingoNumber) => void;
  winnerLines: number[][];
}) {
  const winSet = new Set(winnerLines.flat());

  return (
    <div className="w-full select-none">
      {/* BINGO Header */}
      <div className="grid grid-cols-5 mb-2">
        {['B', 'I', 'N', 'G', 'O'].map(l => (
          <div key={l} className={`text-center font-outfit font-black text-2xl sm:text-4xl ${LETTER_COLORS[l]} drop-shadow py-1`}>{l}</div>
        ))}
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5">
        {card.map((row, rIndex) =>
          row.map((num, cIndex) => {
            const isFree = num === 'FREE';
            const isMarked = markedNumbers.has(num);
            const isCalled = typeof num === 'number' && calledNumbers.includes(num);
            const isWin = winSet.has(num as number);
            const canTap = (isCalled && !isMarked) || isMarked;

            return (
              <motion.button
                key={`${rIndex}-${cIndex}`}
                whileTap={{ scale: 0.88 }}
                onClick={() => !isFree && onTap(num)}
                disabled={isFree}
                className={cn(
                  'aspect-square flex items-center justify-center rounded-xl sm:rounded-2xl font-bold text-base sm:text-xl transition-all duration-200 relative overflow-hidden border-2',
                  isFree
                    ? 'bg-gold/20 border-gold/30 text-gold cursor-default'
                    : isMarked && isWin
                    ? 'bg-gradient-to-br from-yellow-400 to-amber-500 border-yellow-300 text-black shadow-[0_0_16px_rgba(255,215,0,0.8)] scale-105'
                    : isMarked
                    ? 'bg-primary border-primary/60 text-white shadow-[0_0_12px_rgba(176,38,255,0.6)]'
                    : isCalled
                    ? 'bg-white/10 border-white/30 text-white hover:bg-white/15 cursor-pointer'
                    : 'bg-white/5 border-white/5 text-white/40 cursor-not-allowed'
                )}
              >
                {/* Stamp overlay */}
                {isMarked && !isFree && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <div className="w-full h-full rounded-xl sm:rounded-2xl bg-primary/30 flex items-center justify-center">
                      <Star className="w-4 h-4 text-white/60 fill-white/30" />
                    </div>
                  </motion.div>
                )}
                {isFree ? (
                  <span className="text-xs sm:text-base font-black tracking-widest text-gold z-10">FREE</span>
                ) : (
                  <span className="z-10">{num}</span>
                )}
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Player list ──────────────────────────────────────────────────────────────
function PlayerList({ players, realPlayers, myId, myDisplayName, myMarkedCount }: {
  players: { id: string; name: string; avatar: string; markedCount: number; hasWon: boolean }[];
  realPlayers: RealPlayer[];
  myId?: string;
  myDisplayName: string;
  myMarkedCount: number;
}) {
  // Build unified list: real humans first, then AI bots
  const humanEntries = [
    { id: myId || 'me', name: myDisplayName, avatar: '🎮', markedCount: myMarkedCount, hasWon: false, isReal: true },
    ...realPlayers.filter(p => p.id !== myId).map(p => ({
      id: p.id, name: p.name, avatar: '👤', markedCount: 0, hasWon: false, isReal: true,
    })),
  ];
  const aiEntries = players.map(p => ({ ...p, isReal: false }));
  const allPlayers = [...humanEntries, ...aiEntries].sort((a, b) => b.markedCount - a.markedCount);

  return (
    <div className="space-y-2">
      {allPlayers.map((p, i) => (
        <div key={p.id} className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl',
          p.id === (myId || 'me') ? 'bg-primary/10 border border-primary/20' : 'bg-white/5'
        )}>
          <span className="text-xl">{p.avatar}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              {i === 0 && <Crown className="w-3 h-3 text-yellow-400" />}
              <p className="text-sm font-bold truncate">{p.name}{p.id === (myId || 'me') ? ' (You)' : ''}</p>
              {!p.isReal && <span className="text-[9px] bg-white/10 text-muted-foreground px-1.5 py-0.5 rounded-full">AI</span>}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((p.markedCount / 25) * 100, 100)}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{p.markedCount}</span>
            </div>
          </div>
          {p.hasWon && (
            <span className="text-xs font-bold bg-yellow-400/20 text-yellow-300 px-2 py-0.5 rounded-full">BINGO!</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Chat sub-components ──────────────────────────────────────────────────────
const CHAT_COLORS = [
  'text-emerald-400', 'text-sky-400', 'text-amber-400', 'text-pink-400', 'text-orange-400',
  'text-teal-400', 'text-violet-400', 'text-rose-400', 'text-lime-400', 'text-cyan-400',
];
const CHAT_BG_COLORS = [
  'bg-emerald-500/20', 'bg-sky-500/20', 'bg-amber-500/20', 'bg-pink-500/20', 'bg-orange-500/20',
  'bg-teal-500/20', 'bg-violet-500/20', 'bg-rose-500/20', 'bg-lime-500/20', 'bg-cyan-500/20',
];

function getSenderColor(sender: string) {
  let hash = 0;
  for (let i = 0; i < sender.length; i++) hash = sender.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % CHAT_COLORS.length;
}

function SenderAvatar({ name, isAI }: { name: string; isAI: boolean }) {
  const idx = getSenderColor(name);
  return (
    <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 border border-white/10', CHAT_BG_COLORS[idx])}>
      {isAI ? name[0].toUpperCase() : name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function ChatMessages({ messages, myName }: {
  messages: { id: string; sender: string; text: string; isAI: boolean; isSystem: boolean }[];
  myName?: string;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <>
      {messages.map(msg => {
        const isMe = msg.sender === 'You' || (myName && msg.sender === myName);
        const colorIdx = getSenderColor(msg.sender);
        return (
          <div key={msg.id} className={cn('text-sm', msg.isSystem && 'text-center')}>
            {msg.isSystem ? (
              <span className="text-xs text-muted-foreground bg-white/5 px-3 py-1 rounded-full">{msg.text}</span>
            ) : (
              <div className={cn('flex gap-2 items-end', isMe && 'flex-row-reverse')}>
                {!isMe && <SenderAvatar name={msg.sender} isAI={msg.isAI} />}
                <div className={cn(
                  'max-w-[75%] px-3 py-2 rounded-2xl text-xs leading-relaxed',
                  isMe
                    ? 'bg-primary text-white rounded-br-sm'
                    : 'bg-white/10 text-white rounded-bl-sm'
                )}>
                  {!isMe && (
                    <p className={cn('font-bold text-[10px] mb-0.5', CHAT_COLORS[colorIdx])}>{msg.sender}</p>
                  )}
                  {msg.text}
                </div>
                {isMe && (
                  <div className="w-7 h-7 rounded-full bg-primary/30 flex items-center justify-center text-[10px] font-black shrink-0 border border-primary/30">
                    {(myName || 'Yo').slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      <div ref={endRef} />
    </>
  );
}

function ChatInput({ onSend }: { onSend: (text: string) => void }) {
  const [input, setInput] = useState('');
  const send = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setInput('');
  };
  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && send()}
        placeholder="Say something..."
        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors"
      />
      <button
        onClick={send}
        className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors shrink-0"
      >
        <Send className="w-4 h-4 text-white" />
      </button>
    </div>
  );
}

// ─── Chat Toast ───────────────────────────────────────────────────────────────
interface ToastMsg { id: string; sender: string; text: string }
function ChatToast({ toast, onOpen, onDismiss }: { toast: ToastMsg; onOpen: () => void; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [toast.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.button
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.92 }}
      onClick={() => { onOpen(); onDismiss(); }}
      className="flex items-center gap-2 bg-card/95 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 shadow-2xl max-w-[260px] text-left"
    >
      <MessageCircle className="w-4 h-4 text-primary shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-primary truncate">{toast.sender}</p>
        <p className="text-xs text-white/80 truncate">{toast.text}</p>
      </div>
    </motion.button>
  );
}

// ─── Lobby Waiting Room ───────────────────────────────────────────────────────
interface LobbyPlayer { id: string; name: string; isReady: boolean; isHost: boolean }
interface JoinNotification { id: string; name: string }

function LobbyWaitingRoom({
  roomName,
  players,
  myId,
  isHost,
  isReady,
  onToggleReady,
  onStartGame,
}: {
  roomName: string;
  players: LobbyPlayer[];
  myId: string;
  isHost: boolean;
  isReady: boolean;
  onToggleReady: () => void;
  onStartGame: () => void;
}) {
  const readyCount = players.filter(p => p.isReady).length;
  // Host does not need to be ready, but all other real players do
  const canStart = players.length >= 1 && players.every(p => p.isHost || p.isReady);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md space-y-5"
      >
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full text-xs font-bold text-primary mb-4">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Waiting for players…
          </div>
          <h2 className="font-outfit text-3xl font-black mb-1">{roomName}</h2>
          <p className="text-muted-foreground text-sm">{players.length} player{players.length !== 1 ? 's' : ''} joined · {readyCount} ready</p>
        </div>

        {/* Player List */}
        <div className="bg-card/60 border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Players in Room</span>
            <span className="text-xs font-bold text-primary">{players.length}</span>
          </div>
          <div className="divide-y divide-white/5 max-h-64 overflow-y-auto">
            {players.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">Waiting for players to join…</div>
            ) : (
              players.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center font-black text-primary text-sm border border-primary/20">
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm truncate">{p.name}</p>
                      {p.id === myId && <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold">You</span>}
                      {p.isHost && <Crown className="w-3.5 h-3.5 text-yellow-400" />}
                    </div>
                  </div>
                  {p.isReady ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                      <Check className="w-3 h-3" /> Ready
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-muted-foreground bg-white/5 px-2.5 py-1 rounded-full">Waiting</span>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {!isHost && (
            <button
              onClick={onToggleReady}
              className={cn(
                'w-full py-4 rounded-xl font-bold text-base transition-all',
                isReady
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30'
                  : 'bg-primary text-white shadow-[0_0_20px_rgba(176,38,255,0.3)] hover:shadow-[0_0_30px_rgba(176,38,255,0.5)]'
              )}
            >
              {isReady ? (
                <span className="flex items-center justify-center gap-2"><Check className="w-5 h-5" /> I&apos;m Ready!</span>
              ) : (
                <span className="flex items-center justify-center gap-2"><Clock className="w-5 h-5" /> Tap to Ready Up</span>
              )}
            </button>
          )}

          {isHost && (
            <button
              onClick={onStartGame}
              disabled={!canStart}
              className={cn(
                'w-full py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2',
                canStart
                  ? 'bg-primary text-white shadow-[0_0_20px_rgba(176,38,255,0.3)] hover:shadow-[0_0_30px_rgba(176,38,255,0.5)]'
                  : 'bg-white/5 text-muted-foreground cursor-not-allowed border border-white/10'
              )}
            >
              Start Game <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          {isHost ? 'Start whenever you\'re ready. AI bots will fill in automatically.' : 'Wait for the host to start the game.'}
        </p>
      </motion.div>
    </div>
  );
}

// ─── Main Game Page ───────────────────────────────────────────────────────────
export default function GameRoomPage() {
  const { id } = useParams();
  const router = useRouter();
  const { pendingRoom } = useRoomStore();
  const roomName = pendingRoom?.name ?? 'Bingo Arena';

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [mobileTab, setMobileTab] = useState<MobileTab>('card');
  const [winnerLines] = useState<number[][]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [playersOpen, setPlayersOpen] = useState(false);
  const prevNumber = useRef<number | null>(null);

  // Lobby state
  const [lobbyPlayers, setLobbyPlayers] = useState<LobbyPlayer[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [joinNotifs, setJoinNotifs] = useState<JoinNotification[]>([]);

  // Chat toast state
  const [chatToast, setChatToast] = useState<ToastMsg | null>(null);
  const prevChatLen = useRef(0);

  const audio = useAudio(soundEnabled);

  const {
    status, myCard, markedNumbers, aiPlayers, realPlayers,
    calledNumbers, currentNumber, isDrawing,
    chatMessages, winner,
    joinGame, leaveGame, tapCell, sendChat,
    clientSyncState, setBroadcaster, startGame,
    setRealPlayers,
  } = useGameStore();

  const authUser = useAuthStore(state => state.user);
  const authUserId = authUser?.id;
  const displayName = authUser?.username;
  const [userId, setUserId] = useState<string | undefined>();
  // isHost: either they're the designated host, or the room has no hostId (preset room → self-host)
  const isHost = userId && (pendingRoom?.hostId === userId || !pendingRoom?.hostId);

  // Redirect if they previously abandoned this game
  useEffect(() => {
    if (typeof id === 'string' && hasLeftGame(id)) {
      router.replace('/lobby');
    }
  }, [id, router]);

  const handleLeaveGame = useCallback(() => {
    if (typeof id === 'string') markGameAsLeft(id);
    leaveGame();
    router.push('/lobby');
  }, [id, leaveGame, router]);

  useEffect(() => {
    if (authUserId) {
      setUserId(authUserId);
    } else {
      let guestId = sessionStorage.getItem('bingo-guest-id');
      if (!guestId) {
        guestId = 'guest-' + Math.random().toString(36).slice(2, 9);
        sessionStorage.setItem('bingo-guest-id', guestId);
      }
      setUserId(guestId);
    }
  }, [authUserId]);

  // Join game and setup Supabase Channel
  useEffect(() => {
    if (userId === undefined) return; // wait for auth

    const roomId = typeof id === 'string' ? id : 'default-room';
    const config = pendingRoom ?? {
      id: roomId,
      name: 'Standard Room',
      drawSpeed: 6000,
      aiCount: 8,
      maxPlayers: 30,
      entry: 500,
      prize: 2500,
    };
    joinGame(config, !!isHost);

    const supabase = createClient();
    const channel = supabase.channel(`room-${roomId}`);
    presenceChannelRef.current = channel;

    channel.on('broadcast', { event: 'SYNC' }, ({ payload }: any) => {
      // For aiPlayers, reconstruct Sets
      if (payload.aiPlayers) {
        payload.aiPlayers = payload.aiPlayers.map((ai: any) => ({
          ...ai,
          markedNumbers: new Set(ai.markedNumbers)
        }));
      }
      clientSyncState(payload);
    });

    channel.on('broadcast', { event: 'CHAT' }, ({ payload }: any) => {
      clientSyncState({ chatMessages: [...useGameStore.getState().chatMessages, payload].slice(-80) });
    });

    // Presence for real-time lobby player tracking
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState() as Record<string, { userId: string; name: string; isReady: boolean; isHost: boolean }[]>;
      const players: LobbyPlayer[] = [];
      for (const key in state) {
        for (const p of state[key] as any[]) {
          players.push({ id: p.userId, name: p.name, isReady: p.isReady, isHost: p.isHost });
        }
      }
      setLobbyPlayers(players);
      // Also update game store's realPlayers for in-game use
      setRealPlayers(players.map(p => ({ id: p.id, name: p.name, isReady: p.isReady, isHost: p.isHost })));
    });

    channel.on('presence', { event: 'join' }, ({ newPresences }: any) => {
      for (const p of newPresences) {
        if (p.userId && p.userId !== userId) {
          const notifId = Math.random().toString(36).slice(2);
          setJoinNotifs(prev => [...prev, { id: notifId, name: p.name || 'A player' }]);
          setTimeout(() => {
            setJoinNotifs(prev => prev.filter(n => n.id !== notifId));
          }, 4000);
        }
      }
    });

    channel.subscribe(async (status: any) => {
      if (status === 'SUBSCRIBED') {
        setBroadcaster((type, payload) => {
          channel.send({ type: 'broadcast', event: type, payload });
        });

        // Track our presence in this room
        const myName = displayName || `Guest-${userId?.slice(-4)}`;
        await channel.track({
          userId,
          name: myName,
          isReady: false,
          isHost: !!isHost,
        });
      }
    });

    return () => {
      leaveGame();
      setBroadcaster(null);
      supabase.removeChannel(channel);
    };
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Effect to re-track lobby presence when game status changes
  const lobbyChannelRef = useRef<any>(null);
  useEffect(() => {
    if (isHost) {
      if (!lobbyChannelRef.current) {
        const supabase = createClient();
        lobbyChannelRef.current = supabase.channel('global-lobby', {
          config: { presence: { key: 'lobby' } },
        });
        lobbyChannelRef.current.subscribe();
      }
      const config = pendingRoom;
      if (config) {
        lobbyChannelRef.current.track({
          room: {
            ...config,
            status,
            activePlayers: realPlayers.map((p) => p.name),
          },
        });
      }
    }
    return () => {
      if (lobbyChannelRef.current && status === 'COMPLETED') {
        // Clean up when game is done
        lobbyChannelRef.current.untrack();
      }
    };
  }, [isHost, status, pendingRoom, realPlayers]);

  // Update our presence when ready state changes (for non-host)
  const presenceChannelRef = useRef<any>(null);
  useEffect(() => {
    if (presenceChannelRef.current && userId) {
      presenceChannelRef.current.track({
        userId,
        name: displayName || `Guest-${userId.slice(-4)}`,
        isReady,
        isHost: !!isHost,
      });
    }
  }, [isReady, userId, displayName, isHost]);

  // Start music when game starts
  useEffect(() => {
    if (status === 'IN_PROGRESS') {
      audio.startMusic();
    }
    if (status === 'COMPLETED') {
      audio.stopMusic();
    }
    return () => audio.stopMusic();
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  // React to new number drawn
  useEffect(() => {
    if (currentNumber && currentNumber !== prevNumber.current) {
      prevNumber.current = currentNumber;
      audio.playNumberDrawn();
      if (voiceEnabled) {
        const letter = getBingoLetter(currentNumber);
        setTimeout(() => audio.announce(`${letter}... ${currentNumber}`), 900);
      }
    }
  }, [currentNumber]); // eslint-disable-line react-hooks/exhaustive-deps

  // Shuffle sound
  useEffect(() => {
    if (!isDrawing) return;
    const interval = setInterval(audio.playShuffleBeep, 70);
    return () => clearInterval(interval);
  }, [isDrawing]); // eslint-disable-line react-hooks/exhaustive-deps

  // Winner effects
  useEffect(() => {
    if (status === 'COMPLETED') {
      if (winner === 'You') audio.playBingo();
      else audio.playLose();
    }
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Chat toast: show popup when chat panel is closed and new message arrives
  useEffect(() => {
    const msgs = chatMessages;
    if (msgs.length > prevChatLen.current) {
      const latest = msgs[msgs.length - 1];
      if (!chatOpen && latest && !latest.isSystem) {
        setChatToast({ id: latest.id, sender: latest.sender, text: latest.text });
      }
      prevChatLen.current = msgs.length;
    }
  }, [chatMessages, chatOpen]);

  const handleTap = useCallback((num: BingoNumber) => {
    if (num === 'FREE') return;
    const wasCalled = calledNumbers.includes(num as number);
    if (!wasCalled) return;
    tapCell(num, myDisplayName);
    audio.playMark();
  }, [calledNumbers, tapCell, audio]); // eslint-disable-line react-hooks/exhaustive-deps

  const myDisplayName = displayName || 'You';
  const handleSendChat = useCallback((text: string) => {
    sendChat(text, myDisplayName, userId);
  }, [sendChat, myDisplayName, userId]);

  const rows = myCard ? getCardRows(myCard) : [];
  const myMarkedCount = markedNumbers.size;

  // Handle ready toggle — update presence
  const handleToggleReady = useCallback(() => {
    setIsReady(prev => {
      // We'd re-track in presence here; simplified since we rely on store + lobby state
      return !prev;
    });
  }, []);

  // ── Waiting / Starting screen ──
  if (status === 'WAITING') {
    return (
      <>
        <LobbyWaitingRoom
          roomName={roomName}
          players={lobbyPlayers}
          myId={userId || ''}
          isHost={!!isHost}
          isReady={isReady}
          onToggleReady={handleToggleReady}
          onStartGame={startGame}
        />

        {/* Join notifications */}
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
          <AnimatePresence>
            {joinNotifs.map(n => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: 40, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.9 }}
                className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-md rounded-2xl px-4 py-3 shadow-xl"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <p className="text-sm font-bold text-emerald-300">
                  <span className="text-white">{n.name}</span> joined the room!
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </>
    );
  }

  if (status === 'STARTING') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 max-w-md w-full"
        >
          <div className="relative mx-auto w-24 h-24">
            <div className="w-24 h-24 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <div className="absolute inset-3 border-4 border-accent border-b-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
          </div>
          <h2 className="text-2xl font-bold font-outfit">🎱 Game is starting!</h2>
          <p className="text-muted-foreground">Get ready! Numbers are about to be drawn...</p>
          <div className="flex gap-2 justify-center mt-6">
            {['B','I','N','G','O'].map((l, i) => (
              <motion.span
                key={l}
                initial={{ y: 0 }}
                animate={{ y: [-8, 0] }}
                transition={{ delay: i * 0.15, repeat: Infinity, repeatType: 'reverse', duration: 0.5 }}
                className={`font-outfit font-black text-3xl ${LETTER_COLORS[l]}`}
              >{l}</motion.span>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Main game layout (unified responsive) ────────────────────────────────────
  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">

      {/* ── Sticky Header ── */}
      <header className="flex items-center justify-between px-3 sm:px-4 py-2.5 border-b border-white/5 bg-card/60 backdrop-blur-sm z-30 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={handleLeaveGame}
            className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="hidden sm:block">
            <h1 className="font-outfit font-bold text-sm leading-none">{roomName}</h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">{calledNumbers.length}/75 drawn</p>
          </div>
        </div>

        {/* ── Current number badge (always visible) ── */}
        <div className="flex items-center gap-2">
          {isDrawing ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full border border-primary/20">
              <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-bold text-primary">Drawing…</span>
            </div>
          ) : currentNumber ? (
            <motion.div
              key={currentNumber}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${LETTER_BG[getBingoLetter(currentNumber)]} border-white/10`}
            >
              <span className="text-xs font-black text-white/70">{getBingoLetter(currentNumber)}</span>
              <span className="font-outfit font-black text-lg text-white leading-none">{currentNumber}</span>
            </motion.div>
          ) : (
            <div className="px-3 py-1.5 rounded-full bg-white/5 text-xs text-muted-foreground">Waiting…</div>
          )}
          <span className="hidden sm:inline text-xs text-muted-foreground">{calledNumbers.length}/75</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Players button */}
          <button
            onClick={() => { setPlayersOpen(v => !v); setChatOpen(false); }}
            className={cn('w-9 h-9 rounded-full flex items-center justify-center transition-colors relative',
              playersOpen ? 'bg-primary/20 text-primary' : 'bg-white/5 text-muted-foreground hover:text-white')}
            title="Players"
          >
            <Users className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-[9px] font-bold text-white flex items-center justify-center">
              {aiPlayers.length + realPlayers.length + 1}
            </span>
          </button>
          {/* Chat button */}
          <button
            onClick={() => { setChatOpen(v => !v); setPlayersOpen(false); setChatToast(null); }}
            className={cn('w-9 h-9 rounded-full flex items-center justify-center transition-colors relative',
              chatOpen ? 'bg-primary/20 text-primary' : 'bg-white/5 text-muted-foreground hover:text-white')}
            title="Chat"
          >
            <MessageCircle className="w-4 h-4" />
          </button>
          {/* Voice */}
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={cn('hidden sm:flex w-9 h-9 rounded-full items-center justify-center transition-colors',
              voiceEnabled ? 'bg-primary/20 text-primary' : 'bg-white/5 text-muted-foreground')}
          >
            {voiceEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>
          {/* Sound */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={cn('hidden sm:flex w-9 h-9 rounded-full items-center justify-center transition-colors',
              soundEnabled ? 'bg-primary/20 text-primary' : 'bg-white/5 text-muted-foreground')}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ── Body: card + side panels ── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* ── LEFT: Called numbers (desktop only) ── */}
        <aside className="hidden lg:flex flex-col w-56 xl:w-64 border-r border-white/5 overflow-hidden shrink-0">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-4 pt-4 pb-2">Called Numbers</p>
          <div className="flex-1 overflow-y-auto px-3 pb-4">
            <CalledBoard calledNumbers={calledNumbers} />
          </div>
        </aside>

        {/* ── CENTER: Bingo card (sticky, top-aligned) ── */}
        <main className="flex-1 flex flex-col items-center overflow-y-auto">
          <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg px-3 sm:px-4 pt-4 pb-6">

            {/* Card wrapper */}
            <div className="bg-card/60 rounded-2xl sm:rounded-3xl border border-white/10 p-3 sm:p-5 shadow-2xl backdrop-blur-sm relative">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-400 via-primary to-purple-400 rounded-t-2xl sm:rounded-t-3xl" />
              <BingoCard
                card={rows}
                markedNumbers={markedNumbers}
                calledNumbers={calledNumbers}
                onTap={handleTap}
                winnerLines={winnerLines}
              />
              <p className="text-center text-[11px] text-muted-foreground mt-3">
                Tap <span className="text-white/60">highlighted</span> numbers to mark them
              </p>
            </div>

            {/* Mobile: called numbers accordion (shown below card on small screens) */}
            <div className="lg:hidden mt-4">
              <details className="group">
                <summary className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 cursor-pointer list-none text-sm font-bold select-none">
                  <span>Called Numbers ({calledNumbers.length})</span>
                  <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
                </summary>
                <div className="mt-2 px-2 py-3 bg-card/40 rounded-xl border border-white/5">
                  <CalledBoard calledNumbers={calledNumbers} />
                </div>
              </details>
            </div>
          </div>
        </main>

        {/* ── RIGHT: Players drawer (floating overlay) ── */}
        <AnimatePresence>
          {playersOpen && (
            <>
              {/* Backdrop on mobile */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setPlayersOpen(false)}
                className="fixed inset-0 bg-black/40 z-30 lg:hidden"
              />
              <motion.aside
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="fixed top-[53px] right-0 bottom-0 w-72 bg-card/95 backdrop-blur-md border-l border-white/10 z-40 flex flex-col shadow-2xl"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Players ({aiPlayers.length + realPlayers.length + 1})
                  </p>
                  <button onClick={() => setPlayersOpen(false)} className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <PlayerList
                    players={aiPlayers}
                    realPlayers={realPlayers}
                    myId={userId}
                    myDisplayName={myDisplayName}
                    myMarkedCount={myMarkedCount}
                  />
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ── RIGHT: Chat drawer (floating overlay, desktop from right, mobile from bottom) ── */}
        <AnimatePresence>
          {chatOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setChatOpen(false)}
                className="fixed inset-0 bg-black/40 z-30"
              />

              {/* Desktop: slide from right */}
              <motion.aside
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="hidden sm:flex fixed top-[53px] right-0 bottom-0 w-80 bg-card/95 backdrop-blur-md border-l border-white/10 z-40 flex-col shadow-2xl"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Chat</p>
                  <button onClick={() => setChatOpen(false)} className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                  <ChatMessages messages={chatMessages} myName={myDisplayName} />
                </div>
                <div className="p-4 border-t border-white/5 shrink-0">
                  <ChatInput onSend={handleSendChat} />
                </div>
              </motion.aside>

              {/* Mobile: slide from bottom */}
              <motion.aside
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="sm:hidden fixed left-0 right-0 bottom-0 h-[70vh] bg-card/95 backdrop-blur-md border-t border-white/10 z-40 flex flex-col rounded-t-3xl shadow-2xl"
              >
                {/* Pull handle */}
                <div className="flex justify-center pt-3 pb-1 shrink-0">
                  <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 shrink-0">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Chat</p>
                  <button onClick={() => setChatOpen(false)} className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                  <ChatMessages messages={chatMessages} myName={myDisplayName} />
                </div>
                <div className="p-4 border-t border-white/5 shrink-0 pb-safe">
                  <ChatInput onSend={handleSendChat} />
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* ── Chat Toast ── */}
      <div className="fixed bottom-6 left-4 z-50 pointer-events-auto">
        <AnimatePresence>
          {chatToast && !chatOpen && (
            <ChatToast
              toast={chatToast}
              onOpen={() => { setChatOpen(true); setPlayersOpen(false); }}
              onDismiss={() => setChatToast(null)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* ── Winner / Loser Modal ── */}
      <AnimatePresence>
        {status === 'COMPLETED' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
          >
            <motion.div
              initial={{ scale: 0.8, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', bounce: 0.4 }}
              className="bg-card border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center shadow-[0_0_80px_rgba(176,38,255,0.3)] relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-primary/20 to-transparent pointer-events-none" />

              {winner === 'You' ? (
                <>
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 rounded-full"
                      style={{ background: ['#b026ff','#00f0ff','#ffd700','#39ff14'][i % 4] }}
                      initial={{ x: '50%', y: '50%', opacity: 1, scale: 1 }}
                      animate={{
                        x: `${40 + Math.cos(i / 12 * Math.PI * 2) * 120}%`,
                        y: `${40 + Math.sin(i / 12 * Math.PI * 2) * 120}%`,
                        opacity: 0, scale: 0,
                      }}
                      transition={{ delay: 0.1, duration: 1.2 }}
                    />
                  ))}
                  <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(176,38,255,0.6)] z-10 relative">
                    <Trophy className="w-10 h-10 text-gold" />
                  </div>
                  <h2 className="font-outfit text-5xl font-black mb-2 neon-text-purple z-10 relative">BINGO!</h2>
                  <p className="text-2xl font-bold text-white mb-1 z-10 relative">
                    🎉 {myDisplayName} wins!
                  </p>
                  <p className="text-muted-foreground text-sm mb-6">Congratulations!</p>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">😢</span>
                  </div>
                  <h2 className="font-outfit text-4xl font-black mb-2 text-white/80">Oh no!</h2>
                  <p className="text-lg text-muted-foreground mb-2">
                    <span className="text-white font-bold">{winner}</span> got BINGO first!
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">Better luck next time! 🍀</p>
                </>
              )}

              <div className="flex flex-col gap-3 z-10 relative">
                <button
                  onClick={handleLeaveGame}
                  className="w-full py-4 rounded-2xl font-bold bg-primary text-white hover:bg-primary/90 transition-colors shadow-[0_0_20px_rgba(176,38,255,0.3)]"
                >
                  Back to Lobby
                </button>
                <button
                  onClick={() => {
                    const cfg = useRoomStore.getState().pendingRoom;
                    if (cfg) { leaveGame(); setTimeout(() => joinGame(cfg, !!isHost), 100); }
                  }}
                  className="w-full py-4 rounded-2xl font-bold bg-white/5 text-white hover:bg-white/10 transition-colors border border-white/10"
                >
                  Play Again
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
