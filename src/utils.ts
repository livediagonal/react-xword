export const calculateClueNumbers = (
  grid: boolean[][],
  rows: number,
  columns: number,
): number[][] => {
  const clueNumbers: number[][] = Array(rows)
    .fill(0)
    .map(() => Array(columns).fill(0));
  let currentNumber = 1;

  const isWhiteCell = (row: number, col: number): boolean => {
    return (
      row >= 0 && row < rows && col >= 0 && col < columns && !grid[row][col]
    );
  };

  const shouldGetNumber = (row: number, col: number): boolean => {
    if (!isWhiteCell(row, col)) return false;
    const startsHorizontal = col === 0 || !isWhiteCell(row, col - 1);
    const startsVertical = row === 0 || !isWhiteCell(row - 1, col);
    return startsHorizontal || startsVertical;
  };

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      if (shouldGetNumber(row, col)) {
        clueNumbers[row][col] = currentNumber++;
      }
    }
  }

  return clueNumbers;
};

export const findWordStart = (
  grid: boolean[][],
  row: number,
  col: number,
  isHorizontal: boolean,
): [number, number] => {
  if (isHorizontal) {
    while (col > 0 && !grid[row][col - 1]) {
      col--;
    }
  } else {
    while (row > 0 && !grid[row - 1][col]) {
      row--;
    }
  }
  return [row, col];
};
