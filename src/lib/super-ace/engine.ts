export type SymbolType = 'J' | 'Q' | 'K' | 'A' | 'SPADE' | 'HEART' | 'CLUB' | 'DIAMOND' | 'WILD' | 'SCATTER';

export interface GridCell {
  id: string;
  type: SymbolType;
  isGolden?: boolean; // Some symbols can be golden
}

export type Grid = GridCell[][]; // cols x rows

const ALL_SYMBOLS: SymbolType[] = ['J', 'Q', 'K', 'A', 'SPADE', 'HEART', 'CLUB', 'DIAMOND', 'SCATTER'];

export const SYMBOL_MULTIPLIERS: Record<SymbolType, number> = {
  'J': 0.05,
  'Q': 0.08,
  'K': 0.10,
  'A': 0.15,
  'CLUB': 0.20,
  'DIAMOND': 0.25,
  'HEART': 0.30,  // Wins 30% of bet
  'SPADE': 0.50,  // Wins 50% of bet
  'WILD': 0,
  'SCATTER': 0,
};

/**
 * @param isFreeSpins - boosts scatter/wild slightly during free spin rounds
 * @param wildBoost   - when true, wilds appear ~15% of the time (used on winning spins
 *                      so they act as BINGO-card fillers and help complete lines)
 */
const getRandomSymbol = (isFreeSpins = false, wildBoost = false): SymbolType => {
  const rand = Math.random();

  // Wild boost mode — 15% chance of wild so they meaningfully fill BINGO lines
  if (wildBoost) {
    if (rand < 0.15) return 'WILD';
  } else if (isFreeSpins) {
    if (rand < 0.005) return 'SCATTER';   // 0.5% scatter
    if (rand < 0.015) return 'WILD';      // 1.5% wild
  } else {
    if (rand < 0.002) return 'SCATTER';   // 0.2% scatter
    if (rand < 0.005) return 'WILD';      // 0.5% wild
  }

  // ~5% for high-paying suits
  if (rand < 0.02) return 'SPADE';
  if (rand < 0.035) return 'HEART';
  if (rand < 0.05) return 'CLUB';
  if (rand < 0.065) return 'DIAMOND';

  // ~93% for common face cards (overwhelmingly J)
  const faceRand = Math.random();
  if (faceRand < 0.70) return 'J';       // 70%
  if (faceRand < 0.90) return 'Q';       // 20%
  if (faceRand < 0.98) return 'K';       // 8%
  return 'A';                            // 2%
};

/**
 * @param wildBoost - pass true on normal winning spins to get ~15% wilds per cell,
 *                    giving the player a real chance of completing BINGO lines.
 */
export const generateGrid = (cols = 5, rows = 4, isFreeSpins = false, wildBoost = false): Grid => {
  const grid: Grid = [];
  for (let c = 0; c < cols; c++) {
    const col: GridCell[] = [];
    for (let r = 0; r < rows; r++) {
      const type = getRandomSymbol(isFreeSpins, wildBoost);
      col.push({
        id: `${c}-${r}-${Date.now()}-${Math.random()}`,
        type,
        // 1% chance of golden — extremely rare cascade bonus (not on wilds/scatters)
        isGolden: Math.random() < 0.01 && type !== 'SCATTER' && type !== 'WILD',
      });
    }
    grid.push(col);
  }
  return grid;
};

export const generateDudGrid = (cols = 5, rows = 4): Grid => {
  const grid: Grid = [];
  for (let c = 0; c < cols; c++) {
    const col: GridCell[] = [];
    for (let r = 0; r < rows; r++) {
      let type: SymbolType;
      if (c === 0) {
        type = Math.random() < 0.5 ? 'J' : 'Q';
      } else if (c === 1) {
        type = Math.random() < 0.5 ? 'K' : 'A';
      } else {
        const s = getRandomSymbol();
        type = (s === 'WILD' || s === 'SCATTER') ? 'J' : s; 
      }
      col.push({
        id: `${c}-${r}-${Date.now()}-${Math.random()}`,
        type,
        isGolden: false, // No golden symbols on dud spins
      });
    }
    grid.push(col);
  }
  return grid;
};

/**
 * Generates a grid guaranteed to have 3+ scatters placed randomly,
 * triggering the free spins bonus (used for the 20% scatter spin outcome).
 */
export const generateScatterGrid = (cols = 5, rows = 4): Grid => {
  // First build a normal grid (no wilds, no scatters)
  const grid: Grid = [];
  for (let c = 0; c < cols; c++) {
    const col: GridCell[] = [];
    for (let r = 0; r < rows; r++) {
      const s = getRandomSymbol();
      col.push({
        id: `${c}-${r}-${Date.now()}-${Math.random()}`,
        type: (s === 'WILD' || s === 'SCATTER') ? 'J' : s,
        isGolden: false,
      });
    }
    grid.push(col);
  }

  // Randomly place exactly 3 scatters in distinct positions
  const allPositions: { c: number; r: number }[] = [];
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) allPositions.push({ c, r });

  // Shuffle and pick first 3
  for (let i = allPositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allPositions[i], allPositions[j]] = [allPositions[j], allPositions[i]];
  }
  allPositions.slice(0, 3).forEach(({ c, r }) => {
    grid[c][r] = {
      id: `${c}-${r}-SCATTER-${Date.now()}`,
      type: 'SCATTER',
      isGolden: false,
    };
  });

  return grid;
};

export interface WinResult {
  symbol: SymbolType;
  positions: { col: number; row: number }[];
  payout: number;
  lineType?: 'row' | 'col' | 'diag';
}

export interface EvaluateResult {
  wins: WinResult[];
  scatterCount: number;
  freeSpinsAwarded: number; // 0 if no scatter trigger
}

/** Count scatter symbols anywhere on the full grid */
export const countScatters = (grid: Grid): number => {
  let count = 0;
  for (const col of grid) {
    for (const cell of col) {
      if (cell.type === 'SCATTER') count++;
    }
  }
  return count;
};

/** How many free spins are awarded for a given scatter count */
export const freeSpinsForScatters = (scatterCount: number): number => {
  if (scatterCount >= 5) return 20;
  if (scatterCount === 4) return 15;
  if (scatterCount === 3) return 10;
  return 0;
};

export const evaluateWins = (grid: Grid, betAmount: number): EvaluateResult => {
  const wins: WinResult[] = [];
  const cols = grid.length;    // 5
  const rows = grid[0].length; // 4

  const getType = (c: number, r: number) => grid[c]?.[r]?.type;

  // ── BINGO-style line definitions ──────────────────────────────────
  // A win = same symbol (or WILD as joker) fills an ENTIRE line.
  const LINE_MULTIPLIERS: Record<'row' | 'col' | 'diag', number> = {
    row:  2.0,   // horizontal  — easiest, lower payout
    col:  3.0,   // vertical    — harder,  medium payout
    diag: 5.0,   // diagonal    — hardest, highest payout
  };

  // Symbol base values (fixed points per bet unit)
  const SYMBOL_BASE: Record<SymbolType, number> = {
    'J':       1,
    'Q':       2,
    'K':       3,
    'A':       5,
    'CLUB':    8,
    'DIAMOND': 10,
    'HEART':   15,
    'SPADE':   25,
    'WILD':    0,
    'SCATTER': 0,
  };

  // Helper: check if all positions on a line share the same symbol (wilds fill in)
  const checkLine = (
    positions: { col: number; row: number }[],
    lineType: 'row' | 'col' | 'diag',
  ): WinResult | null => {
    const types = positions.map(p => getType(p.col, p.row));
    if (types.some(t => t === undefined || t === 'SCATTER')) return null;

    // Find the real (non-wild) symbol on this line
    const realTypes = types.filter(t => t !== 'WILD') as SymbolType[];
    if (realTypes.length === 0) return null; // all wilds — skip

    const dominant = realTypes[0];
    if (!realTypes.every(t => t === dominant)) return null; // mixed symbols = no win

    const payout = Math.floor(betAmount * SYMBOL_BASE[dominant] * LINE_MULTIPLIERS[lineType]);
    return { symbol: dominant, positions, payout, lineType };
  };

  // ── Horizontal rows (4 rows × all 5 cols) ────────────────────────
  for (let r = 0; r < rows; r++) {
    const positions = Array.from({ length: cols }, (_, c) => ({ col: c, row: r }));
    const result = checkLine(positions, 'row');
    if (result) wins.push(result);
  }

  // ── Vertical columns (5 cols × all 4 rows) ───────────────────────
  for (let c = 0; c < cols; c++) {
    const positions = Array.from({ length: rows }, (_, r) => ({ col: c, row: r }));
    const result = checkLine(positions, 'col');
    if (result) wins.push(result);
  }

  // ── Diagonals (4-cell diagonals on 5×4 grid) ─────────────────────
  // Top-left → bottom-right
  for (let startC = 0; startC <= cols - rows; startC++) {
    const positions = Array.from({ length: rows }, (_, i) => ({ col: startC + i, row: i }));
    const result = checkLine(positions, 'diag');
    if (result) wins.push(result);
  }
  // Top-right → bottom-left
  for (let startC = rows - 1; startC < cols; startC++) {
    const positions = Array.from({ length: rows }, (_, i) => ({ col: startC - i, row: i }));
    const result = checkLine(positions, 'diag');
    if (result) wins.push(result);
  }

  // ── Scatter evaluation (any 3+ anywhere on grid) ──────────────────
  const scatterCount = countScatters(grid);
  const freeSpinsAwarded = freeSpinsForScatters(scatterCount);

  return { wins, scatterCount, freeSpinsAwarded };
};

// Cascades the grid, returning a new grid with replaced symbols
export const cascadeGrid = (grid: Grid, wins: WinResult[], isFreeSpins = false): Grid => {
  const newGrid = JSON.parse(JSON.stringify(grid)) as Grid;
  const cols = newGrid.length;
  const rows = newGrid[0].length;

  const positionsToRemove = new Set<string>();
  wins.forEach(win => {
    win.positions.forEach(p => positionsToRemove.add(`${p.col},${p.row}`));
  });

  for (let c = 0; c < cols; c++) {
    // Collect surviving cells
    const survivingCol: GridCell[] = [];
    for (let r = rows - 1; r >= 0; r--) {
      if (!positionsToRemove.has(`${c},${r}`)) {
        survivingCol.unshift(newGrid[c][r]);
      } else if (newGrid[c][r].isGolden) {
        // Golden symbol turns to WILD instead of disappearing
        survivingCol.unshift({
          id: `${c}-${r}-WILD-${Date.now()}`,
          type: 'WILD',
          isGolden: false,
        });
      }
    }

    // Fill the rest with new random symbols at the top
    while (survivingCol.length < rows) {
      survivingCol.unshift({
        id: `${c}-new-${Date.now()}-${Math.random()}`,
        type: getRandomSymbol(isFreeSpins),
        isGolden: Math.random() < 0.03,
      });
    }

    newGrid[c] = survivingCol;
  }

  return newGrid;
};
