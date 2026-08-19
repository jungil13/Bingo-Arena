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

const getRandomSymbol = (): SymbolType => {
  // Simple weighted random: less scatters, more J/Q/K/A
  const rand = Math.random();
  if (rand < 0.05) return 'SCATTER'; // 5%
  if (rand < 0.25) return 'SPADE'; // 5% each for suits (20% total)
  if (rand < 0.30) return 'HEART';
  if (rand < 0.35) return 'CLUB';
  if (rand < 0.40) return 'DIAMOND';
  
  // Remaining 60% for face cards
  const faceRand = Math.random();
  if (faceRand < 0.25) return 'J';
  if (faceRand < 0.50) return 'Q';
  if (faceRand < 0.75) return 'K';
  return 'A';
};

export const generateGrid = (cols = 5, rows = 4): Grid => {
  const grid: Grid = [];
  for (let c = 0; c < cols; c++) {
    const col: GridCell[] = [];
    for (let r = 0; r < rows; r++) {
      col.push({
        id: `${c}-${r}-${Date.now()}-${Math.random()}`,
        type: getRandomSymbol(),
        isGolden: Math.random() < 0.1 && !['SCATTER', 'WILD'].includes(getRandomSymbol()), // 10% chance to be golden
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

export const evaluateWins = (grid: Grid, betAmount: number): WinResult[] => {
  const wins: WinResult[] = [];
  const cols = grid.length;
  const rows = grid[0].length;

  const getSymbolAt = (c: number, r: number) => grid[c]?.[r]?.type;

  // For each symbol type in reel 0, check if we can make a chain of >= 3
  const reel0Symbols = new Set(grid[0].map(c => c.type).filter(s => s !== 'SCATTER' && s !== 'WILD'));
  
  // Also, a wild on reel 0 could start a chain of anything, but let's just evaluate all base symbols.
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
      // Calculate payout: base symbol multiplier * chain length multiplier * ways * bet
      // "Ways" = number of matching symbols in each column of the chain multiplied
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

  return wins;
};

// Cascades the grid, returning a new grid with replaced symbols
export const cascadeGrid = (grid: Grid, wins: WinResult[]): Grid => {
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
        type: getRandomSymbol(),
        isGolden: Math.random() < 0.1,
      });
    }

    newGrid[c] = survivingCol;
  }

  return newGrid;
};
