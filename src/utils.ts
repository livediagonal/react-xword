import { Orientation, PuzPuzzle } from "./types";

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

export const parsePuzFile = (dataView: DataView): PuzPuzzle => {
  const width = dataView.getUint8(0x2c);
  const height = dataView.getUint8(0x2d);
  const grid: string[] = [];
  const solution: string[] = [];
  const clues: {
    across: { [key: number]: string };
    down: { [key: number]: string };
  } = {
    across: {},
    down: {},
  };

  // Read grid and solution
  for (let i = 0; i < width * height; i++) {
    const cell = dataView.getUint8(0x2e + i);
    const solutionCell = dataView.getUint8(0x2e + width * height + i);

    grid.push(cell === 0 ? "." : "#");
    solution.push(String.fromCharCode(solutionCell));
  }

  // Read clues
  let offset = 0x2e + 2 * width * height;
  let clueNumber = 1;
  let isAcross = true;

  while (offset < dataView.byteLength) {
    const clueText = readNullTerminatedString(dataView, offset);
    if (!clueText) break;

    if (isAcross) {
      clues.across[clueNumber] = clueText;
    } else {
      clues.down[clueNumber] = clueText;
      clueNumber++;
    }

    offset += clueText.length + 1;
    isAcross = !isAcross;
  }

  return {
    width,
    height,
    grid,
    solution,
    clues,
  };
};

const readNullTerminatedString = (
  dataView: DataView,
  offset: number,
): string => {
  let result = "";
  let i = 0;
  let byte = dataView.getUint8(offset + i);

  while (byte !== 0 && offset + i < dataView.byteLength) {
    result += String.fromCharCode(byte);
    i++;
    byte = dataView.getUint8(offset + i);
  }

  return result;
};
