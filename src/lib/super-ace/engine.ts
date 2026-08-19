export type SymbolType = 'J' | 'Q' | 'K' | 'A' | 'SPADE' | 'HEART' | 'CLUB' | 'DIAMOND' | 'WILD' | 'SCATTER';

export interface GridCell {
  id: string;
  type: SymbolType;
  isGolden?: boolean; // Some symbols can be golden
}

export type Grid = GridCell[][]; // cols x rows

const ALL_SYMBOLS: SymbolType[] = ['J', 'Q', 'K', 'A', 'SPADE', 'HEART', 'CLUB', 'DIAMOND', 'SCATTER'];

export const SYMBOL_MULTIPLIERS: Record<SymbolType, number> = {
  'J': 0.1,
  'Q': 0.2,
  'K': 0.3,
  'A': 0.4,
  'CLUB': 0.5,
  'DIAMOND': 0.6,
  'HEART': 0.8,
  'SPADE': 1.0,
  'WILD': 0,
  'SCATTER': 0,
};

const getRandomSymbol = (isFreeSpins = false): SymbolType => {
  const rand = Math.random();

  // During free spins, boost WILD rate to 10% and SCATTER to 5%
  if (isFreeSpins) {
    if (rand < 0.05) return 'SCATTER';
    if (rand < 0.15) return 'WILD';
  } else {
    // Normal: 3% Scatter, 4% Wild
    if (rand < 0.03) return 'SCATTER';
    if (rand < 0.07) return 'WILD';
  }

  // 24% for high-paying suits (6% each)
  if (rand < 0.13) return 'SPADE';
  if (rand < 0.19) return 'HEART';
  if (rand < 0.25) return 'CLUB';
  if (rand < 0.31) return 'DIAMOND';

  // 69% for common face cards (weighted towards J and Q for frequent small wins)
  const faceRand = Math.random();
  if (faceRand < 0.35) return 'J';      // Most common
  if (faceRand < 0.65) return 'Q';      // Common
  if (faceRand < 0.85) return 'K';      // Uncommon
  return 'A';                           // Rare face
};

export const generateGrid = (cols = 5, rows = 4, isFreeSpins = false): Grid => {
  const grid: Grid = [];
  for (let c = 0; c < cols; c++) {
    const col: GridCell[] = [];
    for (let r = 0; r < rows; r++) {
      col.push({
        id: `${c}-${r}-${Date.now()}-${Math.random()}`,
        type: getRandomSymbol(isFreeSpins),
        isGolden: Math.random() < 0.15 && !['SCATTER', 'WILD'].includes(getRandomSymbol()),
      });
    }
    grid.push(col);
  }
  return grid;
};

export interface WinResult {
  symbol: SymbolType;
  positions: { col: number; row: number }[];
  payout: number;
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
  const cols = grid.length;
  const rows = grid[0].length;

  const getSymbolAt = (c: number, r: number) => grid[c]?.[r]?.type;

  // For each symbol type in reel 0, check if we can make a chain of >= 3
  const reel0Symbols = new Set(grid[0].map(c => c.type).filter(s => s !== 'SCATTER' && s !== 'WILD'));

  const symbolsToEvaluate = Array.from(reel0Symbols);
  if (grid[0].some(c => c.type === 'WILD')) {
    // If reel 0 has a wild, it can match ANY symbol present in reel 1
    const reel1Symbols = new Set(grid[1].map(c => c.type).filter(s => s !== 'SCATTER' && s !== 'WILD'));
    reel1Symbols.forEach(s => {
      if (!symbolsToEvaluate.includes(s)) symbolsToEvaluate.push(s);
    });
  }

  for (const targetSymbol of symbolsToEvaluate) {
    let currentChainLength = 0;
    const matchingPositions: { col: number; row: number }[] = [];

    // Check consecutive reels
    for (let c = 0; c < cols; c++) {
      const matchInCol = [];
      for (let r = 0; r < rows; r++) {
        const s = getSymbolAt(c, r);
        if (s === targetSymbol || s === 'WILD') {
          matchInCol.push({ col: c, row: r });
        }
      }

      if (matchInCol.length > 0) {
        currentChainLength++;
        matchingPositions.push(...matchInCol);
      } else {
        break; // Chain broken
      }
    }

    if (currentChainLength >= 3) {
      let ways = 1;
      for (let c = 0; c < currentChainLength; c++) {
        const countInCol = matchingPositions.filter(p => p.col === c).length;
        ways *= countInCol;
      }

      const payout = betAmount * SYMBOL_MULTIPLIERS[targetSymbol] * (currentChainLength - 2) * ways;
      wins.push({
        symbol: targetSymbol,
        positions: matchingPositions,
        payout,
      });
    }
  }

  // Scatter evaluation (any 3+ anywhere on grid)
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
        isGolden: Math.random() < 0.15,
      });
    }

    newGrid[c] = survivingCol;
  }

  return newGrid;
};
