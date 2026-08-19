export type BingoNumber = number | 'FREE';
export type BingoColumn = [BingoNumber, BingoNumber, BingoNumber, BingoNumber, BingoNumber];
export type BingoCardGrid = {
  B: BingoColumn;
  I: BingoColumn;
  N: BingoColumn;
  G: BingoColumn;
  O: BingoColumn;
};

// Generate an array of random unique numbers within a range
function getRandomUniqueNumbers(min: number, max: number, count: number): number[] {
  const numbers = new Set<number>();
  while (numbers.size < count) {
    const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
    numbers.add(randomNum);
  }
  return Array.from(numbers);
}

export function generateBingoCard(): BingoCardGrid {
  const bNumbers = getRandomUniqueNumbers(1, 15, 5);
  const iNumbers = getRandomUniqueNumbers(16, 30, 5);
  const nNumbers = getRandomUniqueNumbers(31, 45, 5);
  const gNumbers = getRandomUniqueNumbers(46, 60, 5);
  const oNumbers = getRandomUniqueNumbers(61, 75, 5);

  // Set the FREE space in the center of N column
  const nColumn: BingoColumn = [
    nNumbers[0],
    nNumbers[1],
    'FREE',
    nNumbers[3],
    nNumbers[4]
  ];

  return {
    B: bNumbers as BingoColumn,
    I: iNumbers as BingoColumn,
    N: nColumn,
    G: gNumbers as BingoColumn,
    O: oNumbers as BingoColumn,
  };
}

// Convert grid columns to rows for easier rendering
export function getCardRows(card: BingoCardGrid): BingoNumber[][] {
  const rows: BingoNumber[][] = [];
  for (let i = 0; i < 5; i++) {
    rows.push([
      card.B[i],
      card.I[i],
      card.N[i],
      card.G[i],
      card.O[i]
    ]);
  }
  return rows;
}
