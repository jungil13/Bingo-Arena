import { create } from 'zustand';
import { generateBingoCard, BingoCardGrid, BingoNumber, getCardRows } from '../bingo/generator';

export type GameState = 'WAITING' | 'STARTING' | 'IN_PROGRESS' | 'WINNER_PENDING' | 'COMPLETED';

export interface ChatMessage {
  id: string;
  sender: string;
  senderId?: string;
  text: string;
  timestamp: number;
  isAI: boolean;
  isSystem: boolean;
}

export interface AIPlayer {
  id: string;
  name: string;
  avatar: string; // emoji
  card: BingoCardGrid;
  markedNumbers: Set<BingoNumber>;
  hasWon: boolean;
  markedCount: number;
}

/** A real human player tracked via Supabase Presence */
export interface RealPlayer {
  id: string;       // user/guest id
  name: string;     // display name / username
  isReady: boolean;
  isHost: boolean;
}

export interface RoomConfig {
  id: string;
  name: string;
  drawSpeed: number; // milliseconds between draws
  aiCount: number;
  maxPlayers: number;
  entry: number;
  prize: number;
}

const AI_NAMES = [
  'LuckyLucy', 'BingoBob', 'NumberNinja', 'CardQueen', 'SpeedDaisy',
  'JackpotJoe', 'NeonNancy', 'QuickQuinn', 'StarSam', 'DazzleDan',
  'MysticMia', 'FlashFred', 'BoldBetty', 'CleverCal', 'SwiftSue'
];

const AI_AVATARS = ['🐯', '🦊', '🐺', '🦁', '🐻', '🦝', '🐼', '🦄', '🐸', '🦋', '🐧', '🦅', '🐉', '🦈', '🐬'];

const AI_CHAT_MESSAGES = [
  "Good luck everyone! 🍀",
  "B-I-N-G-O let's gooo!",
  "Come on numbers!!! 🎱",
  "SO CLOSE!! 😤",
  "This is my round! 💪",
  "Ugh, not the number I needed 😩",
  "Who else is one number away?? 👀",
  "Let's gooo!! 🔥",
  "Almost there... 🤞",
  "My card is looking great! 😎",
  "Anyone else nervous? 😅",
  "BINGO soon I can feel it!",
  "The suspense is killing me 😂",
];

function getBingoLetter(num: number): string {
  if (num <= 15) return 'B';
  if (num <= 30) return 'I';
  if (num <= 45) return 'N';
  if (num <= 60) return 'G';
  return 'O';
}

function generateSequence(): number[] {
  const nums = Array.from({ length: 75 }, (_, i) => i + 1);
  for (let i = nums.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  return nums;
}

function checkBingo(card: BingoCardGrid, marked: Set<BingoNumber>): boolean {
  const rows = getCardRows(card);
  // Check horizontal
  for (let r = 0; r < 5; r++) {
    if (rows[r].every(n => marked.has(n))) return true;
  }
  // Check vertical
  for (let c = 0; c < 5; c++) {
    if (rows.every(row => marked.has(row[c]))) return true;
  }
  // Check diagonals
  if ([0,1,2,3,4].every(i => marked.has(rows[i][i]))) return true;
  if ([0,1,2,3,4].every(i => marked.has(rows[i][4 - i]))) return true;
  return false;
}

function createAIPlayers(count: number): AIPlayer[] {
  const shuffled = [...AI_NAMES].sort(() => Math.random() - 0.5).slice(0, count);
  const shuffledAvatars = [...AI_AVATARS].sort(() => Math.random() - 0.5).slice(0, count);
  return shuffled.map((name, i) => ({
    id: `ai-${i}`,
    name,
    avatar: shuffledAvatars[i],
    card: generateBingoCard(),
    markedNumbers: new Set<BingoNumber>(['FREE']),
    hasWon: false,
    markedCount: 1,
  }));
}

interface GameStore {
  roomConfig: RoomConfig | null;
  status: GameState;
  winner: string | null; // player name who won

  // Player state
  myCard: BingoCardGrid | null;
  markedNumbers: Set<BingoNumber>;

  // AI state
  aiPlayers: AIPlayer[];

  // Real player state (presence-based)
  realPlayers: RealPlayer[];

  // Draw state
  fullNumberSequence: number[];
  calledNumbers: number[];
  currentNumber: number | null;
  isDrawing: boolean; // shuffle animation in progress
  drawIntervalId: ReturnType<typeof setInterval> | null;

  // Chat
  chatMessages: ChatMessage[];

  joinGame: (config: RoomConfig, isHost: boolean) => void;
  leaveGame: () => void;
  startGame: () => void;
  drawNextNumber: () => void;
  tapCell: (num: BingoNumber, displayName?: string) => void;
  claimBingo: () => boolean;
  sendChat: (text: string, senderName?: string, senderId?: string, isAI?: boolean) => void;
  setIsDrawing: (v: boolean) => void;
  hostFillBots: () => void;
  clientSyncState: (payload: any) => void;
  setBroadcaster: (fn: ((type: string, payload: any) => void) | null) => void;
  broadcaster: ((type: string, payload: any) => void) | null;

  // Real player management
  addRealPlayer: (player: RealPlayer) => void;
  removeRealPlayer: (id: string) => void;
  setPlayerReady: (id: string, isReady: boolean) => void;
  setRealPlayers: (players: RealPlayer[]) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  roomConfig: null,
  status: 'WAITING',
  winner: null,
  myCard: null,
  markedNumbers: new Set<BingoNumber>(['FREE']),
  aiPlayers: [],
  realPlayers: [],
  fullNumberSequence: [],
  calledNumbers: [],
  currentNumber: null,
  isDrawing: false,
  drawIntervalId: null,
  chatMessages: [],
  broadcaster: null,

  setBroadcaster: (fn) => set({ broadcaster: fn }),

  clientSyncState: (payload) => {
    set(state => ({ ...state, ...payload }));
  },

  sendChat: (text, senderName = 'You', senderId, isAI = false) => {
    const msg: ChatMessage = {
      id: Math.random().toString(36).slice(2),
      sender: senderName,
      senderId,
      text,
      timestamp: Date.now(),
      isAI: isAI || (!senderId && senderName !== 'You' && senderName !== 'System'),
      isSystem: senderName === 'System',
    };
    set(state => ({ chatMessages: [...state.chatMessages, msg].slice(-80) }));
    
    const { broadcaster } = get();
    // Broadcast if it's sent by a real user
    if (broadcaster && senderId) {
      broadcaster('CHAT', msg);
    }
  },

  setIsDrawing: (v) => set({ isDrawing: v }),

  joinGame: (config, isHost) => {
    set({
      roomConfig: config,
      status: 'WAITING',
      winner: null,
      myCard: generateBingoCard(),
      markedNumbers: new Set<BingoNumber>(['FREE']),
      aiPlayers: [],
      realPlayers: [],
      calledNumbers: [],
      currentNumber: null,
      isDrawing: false,
      drawIntervalId: null,
      chatMessages: [
        {
          id: 'sys-join',
          sender: 'System',
          text: `Welcome to ${config.name}! Waiting for players...`,
          timestamp: Date.now(),
          isAI: false,
          isSystem: true,
        }
      ],
    });
  },

  addRealPlayer: (player) => {
    set(state => {
      const exists = state.realPlayers.find(p => p.id === player.id);
      if (exists) return state;
      return { realPlayers: [...state.realPlayers, player] };
    });
  },

  removeRealPlayer: (id) => {
    set(state => ({
      realPlayers: state.realPlayers.filter(p => p.id !== id),
    }));
  },

  setPlayerReady: (id, isReady) => {
    set(state => ({
      realPlayers: state.realPlayers.map(p =>
        p.id === id ? { ...p, isReady } : p
      ),
    }));
  },

  setRealPlayers: (players) => {
    set({ realPlayers: players });
  },

  hostFillBots: () => {
    const { roomConfig, broadcaster } = get();
    if (!roomConfig) return;
    const aiPlayers = createAIPlayers(roomConfig.aiCount);
    set({ aiPlayers });
    if (broadcaster) broadcaster('SYNC', { aiPlayers });

    // AI greeting messages
    setTimeout(() => {
      const ai = aiPlayers[Math.floor(Math.random() * aiPlayers.length)];
      get().sendChat('Hey everyone! Ready to play? 🎉', ai.name);
    }, 1200);
  },

  leaveGame: () => {
    const { drawIntervalId } = get();
    if (drawIntervalId) clearInterval(drawIntervalId);
    set({
      roomConfig: null,
      status: 'WAITING',
      myCard: null,
      drawIntervalId: null,
      chatMessages: [],
      winner: null,
      realPlayers: [],
      aiPlayers: [],
    });
  },

  startGame: () => {
    const { roomConfig } = get();
    // Spawn AI players silently when game starts
    const aiPlayers = roomConfig ? createAIPlayers(roomConfig.aiCount) : [];
    const fullNumberSequence = generateSequence();
    set({ status: 'STARTING', fullNumberSequence, aiPlayers });
    
    const { broadcaster } = get();
    const safeAIPlayers = aiPlayers.map(ai => ({ ...ai, markedNumbers: Array.from(ai.markedNumbers) }));
    if (broadcaster) broadcaster('SYNC', { status: 'STARTING', aiPlayers: safeAIPlayers });

    get().sendChat('🎱 The game is starting!', 'System');

    setTimeout(() => {
      set({ status: 'IN_PROGRESS' });
      if (get().broadcaster) get().broadcaster!('SYNC', { status: 'IN_PROGRESS' });
      
      const { roomConfig } = get();
      const speed = roomConfig?.drawSpeed ?? 6000;

      const interval = setInterval(() => {
        get().drawNextNumber();
      }, speed);

      set({ drawIntervalId: interval });
      // Draw first number immediately
      setTimeout(() => get().drawNextNumber(), 800);
    }, 2000);
  },

  drawNextNumber: () => {
    const { status, fullNumberSequence, calledNumbers, drawIntervalId, aiPlayers } = get();
    if (status !== 'IN_PROGRESS') return;

    if (calledNumbers.length >= 75) {
      if (drawIntervalId) clearInterval(drawIntervalId);
      set({ status: 'COMPLETED', winner: 'No Winner' });
      return;
    }

    const nextNum = fullNumberSequence[calledNumbers.length];
    const letter = getBingoLetter(nextNum);

    // Show shuffle animation
    set({ isDrawing: true });

    setTimeout(() => {
      set({ isDrawing: false });

      // Update AI players
      const updatedAI = aiPlayers.map(ai => {
        if (ai.hasWon) return ai;
        const newMarked = new Set(ai.markedNumbers);
        // Check if AI card has this number
        const rows = getCardRows(ai.card);
        for (const row of rows) {
          if (row.includes(nextNum)) {
            newMarked.add(nextNum);
            break;
          }
        }
        const hasWon = checkBingo(ai.card, newMarked);
        return { ...ai, markedNumbers: newMarked, markedCount: newMarked.size, hasWon };
      });

      // Check if any AI won
      const freshWinner = updatedAI.find(ai => ai.hasWon && !aiPlayers.find(old => old.id === ai.id)?.hasWon);

      const newState = {
        currentNumber: nextNum,
        calledNumbers: [nextNum, ...get().calledNumbers],
        aiPlayers: updatedAI,
        ...(freshWinner ? { status: 'COMPLETED' as GameState, winner: freshWinner.name } : {})
      };

      set(newState);
      
      const { broadcaster } = get();
      if (broadcaster) {
        // Strip out 'markedNumbers' Set for JSON serialization for clients
        const safeAIPlayers = updatedAI.map(ai => ({ ...ai, markedNumbers: Array.from(ai.markedNumbers) }));
        broadcaster('SYNC', {
          currentNumber: newState.currentNumber,
          calledNumbers: newState.calledNumbers,
          aiPlayers: safeAIPlayers,
          ...(freshWinner ? { status: 'COMPLETED', winner: freshWinner.name } : {})
        });
      }

      if (freshWinner) {
        if (drawIntervalId) clearInterval(drawIntervalId);
        get().sendChat(`🎉 BINGO! I WON!!! 🥳`, freshWinner.name);
        return;
      }

      // Random AI chat occasionally
      if (Math.random() < 0.25) {
        const ai = updatedAI[Math.floor(Math.random() * updatedAI.length)];
        const msg = AI_CHAT_MESSAGES[Math.floor(Math.random() * AI_CHAT_MESSAGES.length)];
        setTimeout(() => get().sendChat(msg, ai.name), 500 + Math.random() * 1500);
      }

      // Announce in chat
      get().sendChat(`📢 ${letter} - ${nextNum}`, 'System');
    }, 800); // shuffle duration
  },

  tapCell: (num, displayName) => {
    if (num === 'FREE') return;
    const { calledNumbers, markedNumbers, myCard, status, drawIntervalId } = get();
    if (status !== 'IN_PROGRESS') return;
    if (!calledNumbers.includes(num as number)) return;

    const newMarked = new Set(markedNumbers);
    if (newMarked.has(num)) {
      newMarked.delete(num); // allow un-marking
    } else {
      newMarked.add(num);
    }

    set({ markedNumbers: newMarked });

    // Check bingo after mark
    if (myCard && checkBingo(myCard, newMarked)) {
      if (drawIntervalId) clearInterval(drawIntervalId);
      const winnerName = displayName || 'You';
      set({ status: 'COMPLETED', winner: 'You' });
      get().sendChat(`🎉 BINGO! I WON!!! 🥳`, winnerName);
      const { broadcaster } = get();
      // Broadcast the actual player display name so other clients see it
      if (broadcaster) broadcaster('SYNC', { status: 'COMPLETED', winner: winnerName });
    }
  },

  claimBingo: () => {
    const { myCard, markedNumbers, drawIntervalId } = get();
    if (!myCard) return false;
    if (checkBingo(myCard, markedNumbers)) {
      if (drawIntervalId) clearInterval(drawIntervalId);
      set({ status: 'COMPLETED', winner: 'You' });
      return true;
    }
    return false;
  },
}));

export { getBingoLetter };
