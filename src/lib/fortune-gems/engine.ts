export type SymbolType = 'GOLDEN' | 'DIAMOND' | 'AMETHYST' | 'SAPPHIRE' | 'EMERALD' | 'RUBY' | 'A' | 'K' | 'Q' | 'J' | 'WILD' | 'BONUS' | 'LUCKY_GEM';

export interface GridCell {
  id: string;
  type: SymbolType;
}

export type Grid = GridCell[][]; // 3 cols x 3 rows

// 1. Paytable Config
// Using base values that will be multiplied by bet.
export const PAYTABLE: Record<SymbolType, number> = {
  'GOLDEN':   50,
  'DIAMOND':  25,
  'AMETHYST': 15,
  'SAPPHIRE': 10,
  'EMERALD':  8,
  'RUBY':     5,
  'A':        2,
  'K':        1.5,
  'Q':        1,
  'J':        0.5,
  'WILD':     0, // WILD itself doesn't pay, it substitutes
  'BONUS':    0,
  'LUCKY_GEM': 0,
};

// 2. Multiplier Config
export const MULTIPLIERS = [1, 2, 3, 5, 10, 25, 50];

// Probability weights for normal symbols (higher = more common)
// This will need tuning in the simulator to reach ~95% RTP
const SYMBOL_WEIGHTS: Record<SymbolType, number> = {
  'J':        1500,
  'Q':        1000,
  'K':        800,
  'A':        500,
  'RUBY':     200,
  'EMERALD':  120,
  'SAPPHIRE': 80,
  'AMETHYST': 40,
  'DIAMOND':  20,
  'GOLDEN':   5,
  'WILD':     15,
  'BONUS':    3,
  'LUCKY_GEM': 2,
};

const TOTAL_WEIGHT = Object.values(SYMBOL_WEIGHTS).reduce((a, b) => a + b, 0);

const getRandomSymbol = (): SymbolType => {
  let rand = Math.random() * TOTAL_WEIGHT;
  for (const [sym, weight] of Object.entries(SYMBOL_WEIGHTS)) {
    if (rand < weight) return sym as SymbolType;
    rand -= weight;
  }
  return 'J';
};

// Generate 3x3 grid
export const generateGrid = (): Grid => {
  const grid: Grid = [];
  for (let c = 0; c < 3; c++) {
    const col: GridCell[] = [];
    for (let r = 0; r < 3; r++) {
      col.push({
        id: `${c}-${r}-${Date.now()}-${Math.random()}`,
        type: getRandomSymbol(),
      });
    }
    grid.push(col);
  }
  return grid;
};

// 3. Win Evaluation
export interface WinResult {
  symbol: SymbolType;
  positions: { col: number; row: number }[];
  payout: number;
  lineIndex: number;
}

export interface SpinOutcome {
  grid: Grid;
  wins: WinResult[];
  totalWinAmount: number;
  multiplier: number;
  isExTriggered: boolean;
  luckySpinTriggered: boolean;
}

// 5 fixed paylines for a 3x3 slot
// [col, row]
export const PAYLINES = [
  // Horizontal
  [{c:0, r:1}, {c:1, r:1}, {c:2, r:1}], // Middle row (index 0)
  [{c:0, r:0}, {c:1, r:0}, {c:2, r:0}], // Top row (index 1)
  [{c:0, r:2}, {c:1, r:2}, {c:2, r:2}], // Bottom row (index 2)
  // Diagonal
  [{c:0, r:0}, {c:1, r:1}, {c:2, r:2}], // Top-left to bottom-right (index 3)
  [{c:0, r:2}, {c:1, r:1}, {c:2, r:0}], // Bottom-left to top-right (index 4)
];

export const evaluateSpin = (grid: Grid, betAmount: number): SpinOutcome => {
  const wins: WinResult[] = [];
  
  // 1. Check Paylines
  PAYLINES.forEach((line, index) => {
    const types = line.map(p => grid[p.c][p.r].type);
    
    // Scatters/Bonus don't pay on lines
    if (types.some(t => t === 'BONUS' || t === 'LUCKY_GEM')) return;

    // Filter out wilds to find the base symbol
    const realTypes = types.filter(t => t !== 'WILD');
    
    // If all wilds, pay as highest symbol (GOLDEN)
    const dominant = realTypes.length === 0 ? 'GOLDEN' : realTypes[0];
    
    // Check if all non-wild symbols match
    const isWin = realTypes.every(t => t === dominant);
    
    if (isWin) {
      const payout = betAmount * PAYTABLE[dominant];
      wins.push({
        symbol: dominant,
        positions: line.map(p => ({ col: p.c, row: p.r })),
        payout,
        lineIndex: index,
      });
    }
  });

  // 2. Check Triggers
  let bonusCount = 0;
  let luckyGemCount = 0;
  grid.forEach(col => {
    col.forEach(cell => {
      if (cell.type === 'BONUS') bonusCount++;
      if (cell.type === 'LUCKY_GEM') luckyGemCount++;
    });
  });

  const luckySpinTriggered = bonusCount >= 3 || luckyGemCount >= 3;

  // 3. Determine Multiplier (independent RNG for right-side reel)
  // Higher multipliers are progressively rarer
  let multiplier = 1;
  let isExTriggered = false;

  const rand = Math.random();
  if (rand < 0.001) multiplier = 50;
  else if (rand < 0.005) multiplier = 25;
  else if (rand < 0.02) multiplier = 10;
  else if (rand < 0.08) multiplier = 5;
  else if (rand < 0.20) multiplier = 3;
  else if (rand < 0.40) multiplier = 2;
  else multiplier = 1;

  // EX Feature: 2% chance to upgrade multiplier if it's > 1
  if (multiplier > 1 && Math.random() < 0.02) {
    isExTriggered = true;
    const currentIndex = MULTIPLIERS.indexOf(multiplier);
    if (currentIndex < MULTIPLIERS.length - 1) {
      // Upgrade by 1 or 2 steps
      const steps = Math.random() < 0.8 ? 1 : 2;
      multiplier = MULTIPLIERS[Math.min(currentIndex + steps, MULTIPLIERS.length - 1)];
    }
  }

  const baseWin = wins.reduce((sum, w) => sum + w.payout, 0);
  // Apply multiplier ONLY if there is a win, otherwise multiplier is aesthetic
  const totalWinAmount = baseWin > 0 ? baseWin * multiplier : 0;

  return {
    grid,
    wins,
    totalWinAmount,
    multiplier,
    isExTriggered,
    luckySpinTriggered,
  };
};
