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

// Navigation utilities
/**
 * ENHANCED ARROW NAVIGATION - JUMP THROUGH BLACK SQUARES
 *
 * Finds the next white cell in the specified direction, jumping through any black squares
 * encountered along the way. This provides fluid arrow navigation that doesn't get stuck
 * at black squares in the middle of the grid.
 *
 * Navigation behavior:
 * 1. Start from the current position and move in the specified direction
 * 2. If we hit a black square (not an edge), continue searching in the same direction
 * 3. Return the first white square found before reaching the grid edge
 * 4. Return null only if we reach the edge without finding any white squares
 *
 * @param grid - The crossword grid (true = black cell, false = white cell)
 * @param row - Starting row position
 * @param col - Starting column position
 * @param direction - Direction to search ("left", "right", "up", "down")
 * @param rows - Total number of rows in the grid
 * @param columns - Total number of columns in the grid
 * @returns [row, col] of next white cell, or null if none found before edge
 */
export const findNextWhiteCell = (
  grid: boolean[][],
  row: number,
  col: number,
  direction: "left" | "right" | "up" | "down",
  rows: number,
  columns: number,
): [number, number] | null => {
  let nextRow = row;
  let nextCol = col;

  // Continue searching in the specified direction until we find a white cell or hit the edge
  while (true) {
    // Move one step in the specified direction
    switch (direction) {
      case "left":
        nextCol--;
        break;
      case "right":
        nextCol++;
        break;
      case "up":
        nextRow--;
        break;
      case "down":
        nextRow++;
        break;
    }

    // Check if we've reached the edge of the grid
    if (nextRow < 0 || nextRow >= rows || nextCol < 0 || nextCol >= columns) {
      return null; // Reached edge without finding a white cell
    }

    // If we found a white cell, return it
    if (!grid[nextRow][nextCol]) {
      return [nextRow, nextCol];
    }

    // If it's a black cell, continue searching (this implements the "jump through" behavior)
  }
};

export const findClueStartCell = (
  clueNumber: number,
  clueNumbers: number[][],
  rows: number,
  columns: number,
): [number, number] | null => {
  // Find the cell with the given clue number
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      if (clueNumbers[row][col] === clueNumber) {
        return [row, col];
      }
    }
  }
  return null;
};

export const findNextClueNumber = (
  currentClueNumber: number | null,
  orientation: "across" | "down",
  grid: boolean[][],
  clueNumbers: number[][],
  rows: number,
  columns: number,
): number | null => {
  // Get all clue numbers in the current orientation
  const clueNumberList: number[] = [];

  // Collect all clue numbers from the grid
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const number = clueNumbers[row][col];
      if (number > 0) {
        // Check if this cell starts a word in the current orientation
        if (orientation === "across") {
          if (col === 0 || grid[row][col - 1]) {
            clueNumberList.push(number);
          }
        } else {
          if (row === 0 || grid[row - 1][col]) {
            clueNumberList.push(number);
          }
        }
      }
    }
  }

  // Sort the clue numbers
  clueNumberList.sort((a, b) => a - b);

  // If no current clue number, return the first clue
  if (!currentClueNumber) {
    return clueNumberList.length > 0 ? clueNumberList[0] : null;
  }

  // Find the index of the current clue number
  const currentIndex = clueNumberList.indexOf(currentClueNumber);

  // If the current clue number is not found, return the first clue
  if (currentIndex === -1) {
    return clueNumberList.length > 0 ? clueNumberList[0] : null;
  }

  // If we're at the last clue, return null to indicate we should switch orientations
  if (currentIndex === clueNumberList.length - 1) {
    return null;
  }

  // Return the next clue number
  return clueNumberList[currentIndex + 1];
};

export const findPreviousClueNumber = (
  currentClueNumber: number | null,
  orientation: "across" | "down",
  grid: boolean[][],
  clueNumbers: number[][],
  rows: number,
  columns: number,
): number | null => {
  // Get all clue numbers in the current orientation
  const clueNumberList: number[] = [];

  // Collect all clue numbers from the grid
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const number = clueNumbers[row][col];
      if (number > 0) {
        // Check if this cell starts a word in the current orientation
        if (orientation === "across") {
          if (col === 0 || grid[row][col - 1]) {
            clueNumberList.push(number);
          }
        } else {
          if (row === 0 || grid[row - 1][col]) {
            clueNumberList.push(number);
          }
        }
      }
    }
  }

  // Sort the clue numbers
  clueNumberList.sort((a, b) => a - b);

  // If no current clue number, return the last clue
  if (!currentClueNumber) {
    return clueNumberList.length > 0
      ? clueNumberList[clueNumberList.length - 1]
      : null;
  }

  // Find the index of the current clue number
  const currentIndex = clueNumberList.indexOf(currentClueNumber);

  // If the current clue number is not found, return the last clue
  if (currentIndex === -1) {
    return clueNumberList.length > 0
      ? clueNumberList[clueNumberList.length - 1]
      : null;
  }

  // If we're at the first clue, return null to indicate we should switch orientations
  if (currentIndex === 0) {
    return null;
  }

  // Return the previous clue number
  return clueNumberList[currentIndex - 1];
};

export const findFirstEmptyCellInClue = (
  clueNumber: number,
  orientation: "across" | "down",
  grid: boolean[][],
  letters: string[][],
  clueNumbers: number[][],
  rows: number,
  columns: number,
): [number, number] | null => {
  const startCell = findClueStartCell(clueNumber, clueNumbers, rows, columns);
  if (!startCell) return null;

  const [startRow, startCol] = startCell;

  if (orientation === "across") {
    // For across clues, check cells from left to right
    for (let col = startCol; col < columns; col++) {
      // Stop if we hit a black cell
      if (grid[startRow][col]) break;

      // If this cell is empty, return it
      if (!letters[startRow][col]) {
        return [startRow, col];
      }
    }
  } else {
    // For down clues, check cells from top to bottom
    for (let row = startRow; row < rows; row++) {
      // Stop if we hit a black cell
      if (grid[row][startCol]) break;

      // If this cell is empty, return it
      if (!letters[row][startCol]) {
        return [row, startCol];
      }
    }
  }

  // If no empty cell found, return the start cell
  return startCell;
};

export const findClueNumberForCell = (
  row: number,
  col: number,
  orientation: "across" | "down",
  grid: boolean[][],
  clueNumbers: number[][],
  rows: number,
  columns: number,
): number | null => {
  // Find the start of the word in the given orientation
  let startRow = row;
  let startCol = col;

  if (orientation === "across") {
    // For across clues, move left until we hit a black cell or the edge
    while (startCol > 0 && !grid[startRow][startCol - 1]) {
      startCol--;
    }
  } else {
    // For down clues, move up until we hit a black cell or the edge
    while (startRow > 0 && !grid[startRow - 1][startCol]) {
      startRow--;
    }
  }

  // Return the clue number at the start of the word
  return clueNumbers[startRow][startCol] || null;
};

export const isPartOfActiveClue = (
  row: number,
  col: number,
  activeClueNumber: number | null,
  clueOrientation: "across" | "down",
  grid: boolean[][],
  clueNumbers: number[][],
  rows: number,
  columns: number,
): boolean => {
  if (!activeClueNumber || grid[row][col]) return false;

  // Check if this cell is part of the active clue in the current orientation
  const clueStartCell = findClueStartCell(
    activeClueNumber,
    clueNumbers,
    rows,
    columns,
  );
  if (!clueStartCell) return false;

  const [startRow, startCol] = clueStartCell;

  if (clueOrientation === "across") {
    // Check if cell is in the same row as the clue start and to the right of it
    // Stop if we encounter a black cell
    if (row === startRow && col >= startCol) {
      // Check all cells from start to current position for black cells
      for (let c = startCol; c <= col; c++) {
        if (grid[row][c]) return false;
      }
      return true;
    }
  } else {
    // Check if cell is in the same column as the clue start and below it
    // Stop if we encounter a black cell
    if (col === startCol && row >= startRow) {
      // Check all cells from start to current position for black cells
      for (let r = startRow; r <= row; r++) {
        if (grid[r][col]) return false;
      }
      return true;
    }
  }

  return false;
};

export const findFirstValidCell = (grid: boolean[][]): [number, number] => {
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      if (!grid[row][col]) {
        return [row, col];
      }
    }
  }
  return [0, 0]; // Fallback to first cell if no white cells found
};

export const findNextCellInWord = (
  grid: boolean[][],
  row: number,
  col: number,
  orientation: "across" | "down",
  rows: number,
  columns: number,
): [number, number] | null => {
  if (orientation === "across") {
    // For across clues, move to the right
    if (col + 1 < columns && !grid[row][col + 1]) {
      return [row, col + 1];
    }
  } else {
    // For down clues, move down
    if (row + 1 < rows && !grid[row + 1][col]) {
      return [row + 1, col];
    }
  }

  // If we're at the end of the word, return null
  return null;
};

export const findPreviousCellInWord = (
  grid: boolean[][],
  row: number,
  col: number,
  orientation: "across" | "down",
): [number, number] | null => {
  if (orientation === "across") {
    // For across clues, move to the left
    if (col > 0 && !grid[row][col - 1]) {
      return [row, col - 1];
    }
  } else {
    // For down clues, move up
    if (row > 0 && !grid[row - 1][col]) {
      return [row - 1, col];
    }
  }

  // If we're at the beginning of the word, return null
  return null;
};

/**
 * Checks if a given cell is the last cell in its word for the specified orientation.
 * This is used to determine navigation behavior when editing filled cells:
 * - If NOT the last cell: advance to next cell in same word
 * - If IS the last cell: jump to next clue
 *
 * @param grid - The crossword grid (true = black cell, false = white cell)
 * @param row - The row index of the cell to check
 * @param col - The column index of the cell to check
 * @param orientation - Whether to check "across" or "down" direction
 * @param rows - Total number of rows in the grid
 * @param columns - Total number of columns in the grid
 * @returns true if this is the last cell in the word, false otherwise
 */
export const isLastCellInWord = (
  grid: boolean[][],
  row: number,
  col: number,
  orientation: "across" | "down",
  rows: number,
  columns: number,
): boolean => {
  if (orientation === "across") {
    // For across clues, check if the next cell to the right is a black cell or edge
    return col + 1 >= columns || grid[row][col + 1];
  } else {
    // For down clues, check if the next cell below is a black cell or edge
    return row + 1 >= rows || grid[row + 1][col];
  }
};

export interface NavigateToClueAndCellParams {
  clueNumber: number;
  orientation: "across" | "down";
  cell: [number, number] | null;
  crosswordState: any; // We'll use any to avoid circular imports
  setCrosswordState: (state: any) => void;
}

export const navigateToClueAndCell = ({
  clueNumber,
  orientation,
  cell,
  crosswordState,
  setCrosswordState,
}: NavigateToClueAndCellParams) => {
  const newState = {
    ...crosswordState,
    activeClueNumber: clueNumber,
    clueOrientation: orientation,
    activeCell: cell,
  };
  setCrosswordState(newState);
};

export interface HandleNextClueParams {
  crosswordState: any;
  setCrosswordState: (state: any) => void;
}

/**
 * SMART NEXT CLUE NAVIGATION
 *
 * This function implements intelligent next clue navigation that prioritizes incomplete clues.
 * When the puzzle is not complete, it will continue searching forward until it finds a clue
 * with at least one empty cell, changing orientation if necessary.
 *
 * Navigation behavior:
 * 1. First, try to find an incomplete clue in the current orientation (moving forward)
 * 2. If no incomplete clues in current orientation, switch to the other orientation and search from the beginning
 * 3. If all clues are complete, fall back to normal next clue cycling
 * 4. Always navigate to the first empty cell in the target clue (or start cell if no empty cells)
 */
export const handleNextClue = ({
  crosswordState,
  setCrosswordState,
}: HandleNextClueParams) => {
  if (!crosswordState) return;

  const currentClueNumber = crosswordState.activeClueNumber;
  const currentOrientation = crosswordState.clueOrientation;
  const visitedClues = new Set<number>();

  // Helper function to check if a clue has any empty cells
  const hasEmptyCells = (
    clueNumber: number,
    orientation: "across" | "down",
  ): boolean => {
    const clueNumbers = calculateClueNumbers(
      crosswordState.grid,
      crosswordState.rows,
      crosswordState.columns,
    );
    const startCell = findClueStartCell(
      clueNumber,
      clueNumbers,
      crosswordState.rows,
      crosswordState.columns,
    );
    if (!startCell) return false;

    const [startRow, startCol] = startCell;
    if (orientation === "across") {
      for (let c = startCol; c < crosswordState.columns; c++) {
        if (crosswordState.grid[startRow][c]) break; // Stop at black cell
        if (!crosswordState.letters[startRow][c]) return true;
      }
    } else {
      for (let r = startRow; r < crosswordState.rows; r++) {
        if (crosswordState.grid[r][startCol]) break; // Stop at black cell
        if (!crosswordState.letters[r][startCol]) return true;
      }
    }
    return false;
  };

  // Helper function to find the next clue with empty cells
  const findNextClueWithEmptyCells = (
    startClueNumber: number | null,
    orientation: "across" | "down",
  ): number | null => {
    const clueNumbers = calculateClueNumbers(
      crosswordState.grid,
      crosswordState.rows,
      crosswordState.columns,
    );
    let nextClueNumber = findNextClueNumber(
      startClueNumber,
      orientation,
      crosswordState.grid,
      clueNumbers,
      crosswordState.rows,
      crosswordState.columns,
    );

    // Keep track of visited clues to prevent infinite loops
    while (nextClueNumber && !visitedClues.has(nextClueNumber)) {
      visitedClues.add(nextClueNumber);
      if (hasEmptyCells(nextClueNumber, orientation)) {
        return nextClueNumber;
      }
      nextClueNumber = findNextClueNumber(
        nextClueNumber,
        orientation,
        crosswordState.grid,
        clueNumbers,
        crosswordState.rows,
        crosswordState.columns,
      );
    }
    return null;
  };

  // First try to find a clue with empty cells in the current orientation
  let nextClueNumber = findNextClueWithEmptyCells(
    currentClueNumber,
    currentOrientation,
  );

  // If no clues with empty cells in current orientation, try the other orientation
  if (!nextClueNumber) {
    const otherOrientation =
      currentOrientation === "across" ? "down" : "across";
    nextClueNumber = findNextClueWithEmptyCells(null, otherOrientation);

    if (nextClueNumber) {
      // Found a clue with empty cells in the other orientation
      const clueNumbers = calculateClueNumbers(
        crosswordState.grid,
        crosswordState.rows,
        crosswordState.columns,
      );
      const startCell = findClueStartCell(
        nextClueNumber,
        clueNumbers,
        crosswordState.rows,
        crosswordState.columns,
      );
      const firstEmptyCell = findFirstEmptyCellInClue(
        nextClueNumber,
        otherOrientation,
        crosswordState.grid,
        crosswordState.letters,
        clueNumbers,
        crosswordState.rows,
        crosswordState.columns,
      );
      navigateToClueAndCell({
        clueNumber: nextClueNumber,
        orientation: otherOrientation,
        cell: firstEmptyCell || startCell,
        crosswordState,
        setCrosswordState,
      });
      return;
    }
  }

  // If we found a clue with empty cells in the current orientation
  if (nextClueNumber) {
    const clueNumbers = calculateClueNumbers(
      crosswordState.grid,
      crosswordState.rows,
      crosswordState.columns,
    );
    const startCell = findClueStartCell(
      nextClueNumber,
      clueNumbers,
      crosswordState.rows,
      crosswordState.columns,
    );
    const firstEmptyCell = findFirstEmptyCellInClue(
      nextClueNumber,
      currentOrientation,
      crosswordState.grid,
      crosswordState.letters,
      clueNumbers,
      crosswordState.rows,
      crosswordState.columns,
    );
    navigateToClueAndCell({
      clueNumber: nextClueNumber,
      orientation: currentOrientation,
      cell: firstEmptyCell || startCell,
      crosswordState,
      setCrosswordState,
    });
    return;
  }

  // If no clues with empty cells found in either orientation, fall back to normal cycling
  const clueNumbers = calculateClueNumbers(
    crosswordState.grid,
    crosswordState.rows,
    crosswordState.columns,
  );
  nextClueNumber = findNextClueNumber(
    currentClueNumber,
    currentOrientation,
    crosswordState.grid,
    clueNumbers,
    crosswordState.rows,
    crosswordState.columns,
  );

  if (nextClueNumber) {
    // Find the start cell for the next clue
    const startCell = findClueStartCell(
      nextClueNumber,
      clueNumbers,
      crosswordState.rows,
      crosswordState.columns,
    );
    // Find the first empty cell in the next clue
    const firstEmptyCell = findFirstEmptyCellInClue(
      nextClueNumber,
      currentOrientation,
      crosswordState.grid,
      crosswordState.letters,
      clueNumbers,
      crosswordState.rows,
      crosswordState.columns,
    );
    // Navigate to the next clue
    navigateToClueAndCell({
      clueNumber: nextClueNumber,
      orientation: currentOrientation,
      cell: firstEmptyCell || startCell,
      crosswordState,
      setCrosswordState,
    });
  } else {
    // If we've reached the end of the current orientation's clues, switch to the other orientation
    const newOrientation = currentOrientation === "across" ? "down" : "across";
    const firstClueNumber = findNextClueNumber(
      null,
      newOrientation,
      crosswordState.grid,
      clueNumbers,
      crosswordState.rows,
      crosswordState.columns,
    );

    if (firstClueNumber) {
      const startCell = findClueStartCell(
        firstClueNumber,
        clueNumbers,
        crosswordState.rows,
        crosswordState.columns,
      );
      const firstEmptyCell = findFirstEmptyCellInClue(
        firstClueNumber,
        newOrientation,
        crosswordState.grid,
        crosswordState.letters,
        clueNumbers,
        crosswordState.rows,
        crosswordState.columns,
      );
      navigateToClueAndCell({
        clueNumber: firstClueNumber,
        orientation: newOrientation,
        cell: firstEmptyCell || startCell,
        crosswordState,
        setCrosswordState,
      });
    }
  }
};

export interface HandlePreviousClueParams {
  crosswordState: any;
  setCrosswordState: (state: any) => void;
}

/**
 * SMART PREVIOUS CLUE NAVIGATION
 *
 * This function implements intelligent previous clue navigation that prioritizes incomplete clues.
 * When the puzzle is not complete, it will continue searching backwards until it finds a clue
 * with at least one empty cell, changing orientation if necessary.
 *
 * Navigation behavior:
 * 1. First, try to find an incomplete clue in the current orientation (moving backwards)
 * 2. If no incomplete clues in current orientation, switch to the other orientation and search from the end
 * 3. If all clues are complete, fall back to normal previous clue cycling
 * 4. Always navigate to the first empty cell in the target clue (or start cell if no empty cells)
 */
export const handlePreviousClue = ({
  crosswordState,
  setCrosswordState,
}: HandlePreviousClueParams) => {
  if (!crosswordState) return;

  const currentClueNumber = crosswordState.activeClueNumber;
  const currentOrientation = crosswordState.clueOrientation;
  const visitedClues = new Set<number>();

  // Helper function to check if a clue has any empty cells
  const hasEmptyCells = (
    clueNumber: number,
    orientation: "across" | "down",
  ): boolean => {
    const clueNumbers = calculateClueNumbers(
      crosswordState.grid,
      crosswordState.rows,
      crosswordState.columns,
    );
    const startCell = findClueStartCell(
      clueNumber,
      clueNumbers,
      crosswordState.rows,
      crosswordState.columns,
    );
    if (!startCell) return false;

    const [startRow, startCol] = startCell;
    if (orientation === "across") {
      for (let c = startCol; c < crosswordState.columns; c++) {
        if (crosswordState.grid[startRow][c]) break; // Stop at black cell
        if (!crosswordState.letters[startRow][c]) return true;
      }
    } else {
      for (let r = startRow; r < crosswordState.rows; r++) {
        if (crosswordState.grid[r][startCol]) break; // Stop at black cell
        if (!crosswordState.letters[r][startCol]) return true;
      }
    }
    return false;
  };

  // Helper function to find the previous clue with empty cells
  const findPreviousClueWithEmptyCells = (
    startClueNumber: number | null,
    orientation: "across" | "down",
  ): number | null => {
    const clueNumbers = calculateClueNumbers(
      crosswordState.grid,
      crosswordState.rows,
      crosswordState.columns,
    );
    let prevClueNumber = findPreviousClueNumber(
      startClueNumber,
      orientation,
      crosswordState.grid,
      clueNumbers,
      crosswordState.rows,
      crosswordState.columns,
    );

    // Keep track of visited clues to prevent infinite loops
    while (prevClueNumber && !visitedClues.has(prevClueNumber)) {
      visitedClues.add(prevClueNumber);
      if (hasEmptyCells(prevClueNumber, orientation)) {
        return prevClueNumber;
      }
      prevClueNumber = findPreviousClueNumber(
        prevClueNumber,
        orientation,
        crosswordState.grid,
        clueNumbers,
        crosswordState.rows,
        crosswordState.columns,
      );
    }
    return null;
  };

  // First try to find a clue with empty cells in the current orientation (moving backwards)
  let prevClueNumber = findPreviousClueWithEmptyCells(
    currentClueNumber,
    currentOrientation,
  );

  // If no clues with empty cells in current orientation, try the other orientation (from the end)
  if (!prevClueNumber) {
    const otherOrientation =
      currentOrientation === "across" ? "down" : "across";
    prevClueNumber = findPreviousClueWithEmptyCells(null, otherOrientation);

    if (prevClueNumber) {
      // Found a clue with empty cells in the other orientation
      const clueNumbers = calculateClueNumbers(
        crosswordState.grid,
        crosswordState.rows,
        crosswordState.columns,
      );
      const startCell = findClueStartCell(
        prevClueNumber,
        clueNumbers,
        crosswordState.rows,
        crosswordState.columns,
      );
      const firstEmptyCell = findFirstEmptyCellInClue(
        prevClueNumber,
        otherOrientation,
        crosswordState.grid,
        crosswordState.letters,
        clueNumbers,
        crosswordState.rows,
        crosswordState.columns,
      );
      navigateToClueAndCell({
        clueNumber: prevClueNumber,
        orientation: otherOrientation,
        cell: firstEmptyCell || startCell,
        crosswordState,
        setCrosswordState,
      });
      return;
    }
  }

  // If we found a clue with empty cells in the current orientation
  if (prevClueNumber) {
    const clueNumbers = calculateClueNumbers(
      crosswordState.grid,
      crosswordState.rows,
      crosswordState.columns,
    );
    const startCell = findClueStartCell(
      prevClueNumber,
      clueNumbers,
      crosswordState.rows,
      crosswordState.columns,
    );
    const firstEmptyCell = findFirstEmptyCellInClue(
      prevClueNumber,
      currentOrientation,
      crosswordState.grid,
      crosswordState.letters,
      clueNumbers,
      crosswordState.rows,
      crosswordState.columns,
    );
    navigateToClueAndCell({
      clueNumber: prevClueNumber,
      orientation: currentOrientation,
      cell: firstEmptyCell || startCell,
      crosswordState,
      setCrosswordState,
    });
    return;
  }

  // If no clues with empty cells found in either orientation, fall back to normal cycling
  const clueNumbers = calculateClueNumbers(
    crosswordState.grid,
    crosswordState.rows,
    crosswordState.columns,
  );
  prevClueNumber = findPreviousClueNumber(
    currentClueNumber,
    currentOrientation,
    crosswordState.grid,
    clueNumbers,
    crosswordState.rows,
    crosswordState.columns,
  );

  if (prevClueNumber) {
    // Find the start cell for the previous clue
    const startCell = findClueStartCell(
      prevClueNumber,
      clueNumbers,
      crosswordState.rows,
      crosswordState.columns,
    );
    // Find the first empty cell in the previous clue
    const firstEmptyCell = findFirstEmptyCellInClue(
      prevClueNumber,
      currentOrientation,
      crosswordState.grid,
      crosswordState.letters,
      clueNumbers,
      crosswordState.rows,
      crosswordState.columns,
    );
    // Navigate to the previous clue
    navigateToClueAndCell({
      clueNumber: prevClueNumber,
      orientation: currentOrientation,
      cell: firstEmptyCell || startCell,
      crosswordState,
      setCrosswordState,
    });
  } else {
    // If we've reached the beginning of the current orientation's clues, switch to the other orientation
    const newOrientation = currentOrientation === "across" ? "down" : "across";
    const lastClueNumber = findPreviousClueNumber(
      null,
      newOrientation,
      crosswordState.grid,
      clueNumbers,
      crosswordState.rows,
      crosswordState.columns,
    );

    if (lastClueNumber) {
      const startCell = findClueStartCell(
        lastClueNumber,
        clueNumbers,
        crosswordState.rows,
        crosswordState.columns,
      );
      const firstEmptyCell = findFirstEmptyCellInClue(
        lastClueNumber,
        newOrientation,
        crosswordState.grid,
        crosswordState.letters,
        clueNumbers,
        crosswordState.rows,
        crosswordState.columns,
      );
      navigateToClueAndCell({
        clueNumber: lastClueNumber,
        orientation: newOrientation,
        cell: firstEmptyCell || startCell,
        crosswordState,
        setCrosswordState,
      });
    }
  }
};

/**
 * SMART TAB NAVIGATION (FORWARD)
 *
 * Handles Tab key navigation that prioritizes incomplete clues.
 * Uses the same logic as handleNextClue but is specifically for Tab key presses.
 *
 * @param params - Navigation parameters including crossword state and setter
 */
export const handleTabNavigation = (params: HandleNextClueParams) => {
  handleNextClue(params);
};

/**
 * SMART TAB NAVIGATION (BACKWARD)
 *
 * Handles Shift+Tab key navigation that prioritizes incomplete clues.
 * Uses the same logic as handlePreviousClue but is specifically for Shift+Tab key presses.
 *
 * @param params - Navigation parameters including crossword state and setter
 */
export const handleShiftTabNavigation = (params: HandlePreviousClueParams) => {
  handlePreviousClue(params);
};

/**
 * WORD ANALYSIS UTILITIES
 *
 * These functions help analyze the state of words in the crossword for navigation decisions.
 */

export interface WordAnalysis {
  isComplete: boolean;
  nextEmptyCell: [number, number] | null;
  wordCells: [number, number][];
  emptyCellCount: number;
}

/**
 * Analyzes the current word to determine its completion status and find navigation targets.
 *
 * @param grid - The crossword grid
 * @param letters - Current letter state
 * @param row - Current cell row
 * @param col - Current cell column
 * @param orientation - Current orientation
 * @param rows - Grid height
 * @param columns - Grid width
 * @returns Analysis of the current word state
 */
export const analyzeCurrentWord = (
  grid: boolean[][],
  letters: string[][],
  row: number,
  col: number,
  orientation: "across" | "down",
  rows: number,
  columns: number,
): WordAnalysis => {
  // Find the start of the current word
  const [startRow, startCol] = findWordStart(
    grid,
    row,
    col,
    orientation === "across",
  );

  let isComplete = true;
  let nextEmptyCell: [number, number] | null = null;
  let foundCurrentCell = false;
  let emptyCellCount = 0;
  let wordCells: [number, number][] = [];

  if (orientation === "across") {
    for (let c = startCol; c < columns; c++) {
      if (grid[startRow][c]) break;
      wordCells.push([startRow, c]);

      if (!letters[startRow][c]) {
        isComplete = false;
        emptyCellCount++;
        if (foundCurrentCell && !nextEmptyCell) {
          nextEmptyCell = [startRow, c];
        }
      }

      if (startRow === row && c === col) {
        foundCurrentCell = true;
      }
    }

    // If no next empty cell found after current, search before current
    if (!nextEmptyCell) {
      for (let c = startCol; c < col; c++) {
        if (grid[startRow][c]) break;
        if (!letters[startRow][c]) {
          nextEmptyCell = [startRow, c];
          break;
        }
      }
    }
  } else {
    for (let r = startRow; r < rows; r++) {
      if (grid[r][startCol]) break;
      wordCells.push([r, startCol]);

      if (!letters[r][startCol]) {
        isComplete = false;
        emptyCellCount++;
        if (foundCurrentCell && !nextEmptyCell) {
          nextEmptyCell = [r, startCol];
        }
      }

      if (r === row && startCol === col) {
        foundCurrentCell = true;
      }
    }

    // If no next empty cell found after current, search before current
    if (!nextEmptyCell) {
      for (let r = startRow; r < row; r++) {
        if (grid[r][startCol]) break;
        if (!letters[r][startCol]) {
          nextEmptyCell = [r, startCol];
          break;
        }
      }
    }
  }

  return {
    isComplete,
    nextEmptyCell,
    wordCells,
    emptyCellCount,
  };
};

/**
 * Determines where to navigate after typing a letter in a completed word.
 *
 * @param wasEmpty - Whether the cell was empty before typing
 * @param row - Current cell row
 * @param col - Current cell column
 * @param orientation - Current orientation
 * @param grid - The crossword grid
 * @param rows - Grid height
 * @param columns - Grid width
 * @returns Navigation target: "next-clue", "next-cell", or "stay"
 */
export const determineCompletedWordNavigation = (
  wasEmpty: boolean,
  row: number,
  col: number,
  orientation: "across" | "down",
  grid: boolean[][],
  rows: number,
  columns: number,
): "next-clue" | "next-cell" | "stay" => {
  if (!wasEmpty) {
    // SCENARIO 1: Editing a filled cell in a filled answer
    const isLastCell = isLastCellInWord(
      grid,
      row,
      col,
      orientation,
      rows,
      columns,
    );

    if (isLastCell) {
      return "next-clue"; // Jump to next clue from last cell
    } else {
      return "next-cell"; // Move to next cell in same word
    }
  } else {
    // SCENARIO 2: Filling an empty cell that completed the word
    return "next-clue"; // Always jump to next clue
  }
};

/**
 * Handles letter input navigation for incomplete words.
 *
 * @param wasEmpty - Whether the cell was empty before typing
 * @param nextEmptyCell - Next empty cell in the word (if any)
 * @returns Navigation target: "next-cell", "next-empty", or "stay"
 */
export const determineIncompleteWordNavigation = (
  wasEmpty: boolean,
  nextEmptyCell: [number, number] | null,
): "next-cell" | "next-empty" | "stay" => {
  if (!wasEmpty) {
    // Editing a filled cell in incomplete word - move to next cell
    return "next-cell";
  } else if (nextEmptyCell) {
    // Filling empty cell in incomplete word - jump to next empty cell
    return "next-empty";
  } else {
    // Fallback
    return "stay";
  }
};

/**
 * NAVIGATION EXECUTION UTILITIES
 *
 * These functions execute navigation decisions consistently.
 */

export interface NavigationParams {
  crosswordState: any;
  setCrosswordState: (state: any) => void;
  newLetters: string[][];
  validatedCells: (boolean | undefined)[][];
  setValidatedCells: (cells: (boolean | undefined)[][]) => void;
  row: number;
  col: number;
}

/**
 * Executes a navigation decision after letter input.
 *
 * @param decision - The navigation decision to execute
 * @param params - Navigation parameters and state setters
 * @param analysis - Word analysis result (for next-empty navigation)
 */
export const executeLetterInputNavigation = (
  decision: "next-clue" | "next-cell" | "next-empty" | "stay",
  params: NavigationParams,
  analysis?: WordAnalysis,
) => {
  const {
    crosswordState,
    setCrosswordState,
    newLetters,
    validatedCells,
    setValidatedCells,
    row,
    col,
  } = params;

  switch (decision) {
    case "next-clue":
      setCrosswordState({
        ...crosswordState,
        letters: newLetters,
        activeCell: [row, col],
      });
      setValidatedCells(validatedCells);

      // Use the smart next clue navigation
      handleNextClue({
        crosswordState: { ...crosswordState, letters: newLetters },
        setCrosswordState,
      });
      break;

    case "next-cell":
      const nextCell = findNextCellInWord(
        crosswordState.grid,
        row,
        col,
        crosswordState.clueOrientation,
        crosswordState.rows,
        crosswordState.columns,
      );
      setCrosswordState({
        ...crosswordState,
        letters: newLetters,
        activeCell: nextCell || [row, col],
      });
      setValidatedCells(validatedCells);
      break;

    case "next-empty":
      if (analysis?.nextEmptyCell) {
        setCrosswordState({
          ...crosswordState,
          letters: newLetters,
          activeCell: analysis.nextEmptyCell,
        });
      } else {
        setCrosswordState({
          ...crosswordState,
          letters: newLetters,
          activeCell: [row, col],
        });
      }
      setValidatedCells(validatedCells);
      break;

    case "stay":
    default:
      setCrosswordState({
        ...crosswordState,
        letters: newLetters,
        activeCell: [row, col],
      });
      setValidatedCells(validatedCells);
      break;
  }
};

/**
 * CENTRALIZED LETTER HANDLING SYSTEM
 *
 * This system provides reusable letter handling logic that can be used by any component
 * without requiring prop drilling or tight coupling to specific React components.
 */

export interface LetterChangeResult {
  newLetters: string[][];
  newValidatedCells: (boolean | undefined)[][];
  newActiveCell: [number, number] | null;
  actions: Array<{
    type: "SET_STATE" | "HANDLE_NEXT_CLUE" | "CHECK_COMPLETION" | "SHOW_ERROR";
    payload?: any;
  }>;
}

export interface LetterChangeInput {
  grid: boolean[][];
  letters: string[][];
  validatedCells: (boolean | undefined)[][] | null;
  revealedCells: boolean[][];
  activeClueNumber: number | null;
  clueOrientation: "across" | "down";
  rows: number;
  columns: number;
  row: number;
  col: number;
  letter: string;
}

/**
 * CORE LETTER HANDLING LOGIC
 *
 * This is a pure function that handles all letter change logic without React dependencies.
 * It can be used by any component or even non-React code.
 *
 * IMPROVED DELETION BEHAVIOR:
 * 1. Filled cell + delete: Clear current cell, don't move
 * 2. Empty cell + delete (not at word start): Move back one cell in word and clear it
 * 3. Empty cell + delete (at word start): Jump to last cell of previous incomplete answer and clear it
 *
 * @param input - All the input parameters needed for letter handling
 * @returns Result containing new state and actions to perform
 */
export const processLetterChange = (
  input: LetterChangeInput,
): LetterChangeResult | null => {
  const {
    grid,
    letters,
    validatedCells,
    revealedCells,
    activeClueNumber,
    clueOrientation,
    rows,
    columns,
    row,
    col,
    letter,
  } = input;

  // Don't allow changes to revealed cells or cells that were validated as correct
  if (
    (revealedCells && revealedCells[row] && revealedCells[row][col]) ||
    (validatedCells && validatedCells[row] && validatedCells[row][col] === true)
  ) {
    return null;
  }

  const newLetters = letters.map((row) => [...row]);
  const wasEmpty = !letters[row][col];
  newLetters[row][col] = letter;

  // Clear validation state for this cell
  const newValidatedCells = validatedCells
    ? validatedCells.map((row) => [...row])
    : Array(rows)
        .fill(0)
        .map(() => Array(columns).fill(undefined));
  newValidatedCells[row][col] = undefined;

  const actions: LetterChangeResult["actions"] = [];
  let newActiveCell: [number, number] | null = [row, col];

  if (letter) {
    // LETTER INPUT: Always check for puzzle completion when entering a letter
    actions.push({ type: "CHECK_COMPLETION" });

    // Analyze word and determine navigation
    const analysis = analyzeCurrentWord(
      grid,
      newLetters,
      row,
      col,
      clueOrientation,
      rows,
      columns,
    );

    if (analysis.isComplete) {
      // Determine and execute navigation for completed word
      const decision = determineCompletedWordNavigation(
        wasEmpty,
        row,
        col,
        clueOrientation,
        grid,
        rows,
        columns,
      );

      switch (decision) {
        case "next-clue":
          actions.push({ type: "HANDLE_NEXT_CLUE" });
          break;
        case "next-cell":
          const nextCell = findNextCellInWord(
            grid,
            row,
            col,
            clueOrientation,
            rows,
            columns,
          );
          newActiveCell = nextCell || [row, col];
          break;
        case "stay":
        default:
          newActiveCell = [row, col];
          break;
      }
    } else {
      // Word is not complete - determine navigation for incomplete word
      const decision = determineIncompleteWordNavigation(
        wasEmpty,
        analysis.nextEmptyCell,
      );

      switch (decision) {
        case "next-cell":
          const nextCell = findNextCellInWord(
            grid,
            row,
            col,
            clueOrientation,
            rows,
            columns,
          );
          newActiveCell = nextCell || [row, col];
          break;
        case "next-empty":
          newActiveCell = analysis.nextEmptyCell || [row, col];
          break;
        case "stay":
        default:
          newActiveCell = [row, col];
          break;
      }
    }
  } else {
    // LETTER DELETION: Handle backspace/delete with improved behavior
    const currentCellIsEmpty = !letters[row][col];

    if (currentCellIsEmpty) {
      // SCENARIO 1: Empty cell + delete
      const clueNumbers = calculateClueNumbers(grid, rows, columns);
      const isAtStartOfWord = isStartOfWord(grid, row, col, clueOrientation);

      if (isAtStartOfWord) {
        // SCENARIO 1a: At start of answer + empty cell + delete
        // Move to the final cell of the previous answer and clear it
        const lastCellOfPrevAnswer = findLastCellOfPreviousAnswer(
          grid,
          letters,
          clueNumbers,
          activeClueNumber,
          clueOrientation,
          rows,
          columns,
          true, // Skip completed answers
        );

        if (lastCellOfPrevAnswer) {
          const [targetRow, targetCol] = lastCellOfPrevAnswer;
          // Clear the target cell
          newLetters[targetRow][targetCol] = "";
          newValidatedCells[targetRow][targetCol] = undefined;
          newActiveCell = lastCellOfPrevAnswer;

          // Find the clue number for the target cell
          const targetClueNumber = findClueNumberForCell(
            targetRow,
            targetCol,
            clueOrientation,
            grid,
            clueNumbers,
            rows,
            columns,
          );

          if (targetClueNumber) {
            actions.push({
              type: "SET_STATE",
              payload: {
                activeClueNumber: targetClueNumber,
                clueOrientation,
                activeCell: lastCellOfPrevAnswer,
              },
            });
          }
        } else {
          // No previous answer found, stay in current cell
          newActiveCell = [row, col];
        }
      } else {
        // SCENARIO 1b: Not at start + empty cell + delete
        // Move one letter back in current answer and clear that cell
        const prevCell = findPreviousCellInWord(
          grid,
          row,
          col,
          clueOrientation,
        );

        if (prevCell) {
          const [prevRow, prevCol] = prevCell;
          // Clear the previous cell
          newLetters[prevRow][prevCol] = "";
          newValidatedCells[prevRow][prevCol] = undefined;
          newActiveCell = prevCell;

          const clueNumber = clueNumbers[prevRow][prevCol];
          if (clueNumber) {
            actions.push({
              type: "SET_STATE",
              payload: {
                activeClueNumber: activeClueNumber || clueNumber,
                clueOrientation,
                activeCell: prevCell,
              },
            });
          }
        } else {
          // No previous cell in word, stay in current cell
          newActiveCell = [row, col];
        }
      }
    } else {
      // SCENARIO 2: Filled cell + delete
      // Clear the current cell and don't move
      newActiveCell = [row, col];
    }
  }

  return {
    newLetters,
    newValidatedCells,
    newActiveCell,
    actions,
  };
};

/**
 * Helper function to check if a puzzle is complete (all white cells filled)
 */
export const isPuzzleComplete = (
  grid: boolean[][],
  letters: string[][],
): boolean => {
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      // If it's a white cell and it's empty, puzzle is not complete
      if (!grid[row][col] && !letters[row][col]) {
        return false;
      }
    }
  }
  return true;
};

/**
 * Helper function to check if all answers are correct
 */
export const areAllAnswersCorrect = (
  grid: boolean[][],
  letters: string[][],
  solution: string[][] | null,
): boolean => {
  if (!solution) return false;

  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      // Check white cells only
      if (!grid[row][col]) {
        const userLetter = letters[row][col].toUpperCase();
        const solutionLetter = solution[row][col].toUpperCase();
        if (userLetter !== solutionLetter) {
          return false;
        }
      }
    }
  }
  return true;
};

/**
 * Checks if a cell is at the start of its word in the given orientation
 */
export const isStartOfWord = (
  grid: boolean[][],
  row: number,
  col: number,
  orientation: "across" | "down",
): boolean => {
  if (orientation === "across") {
    return col === 0 || grid[row][col - 1];
  } else {
    return row === 0 || grid[row - 1][col];
  }
};

/**
 * Finds the last cell of the previous answer, skipping completed answers if specified
 */
export const findLastCellOfPreviousAnswer = (
  grid: boolean[][],
  letters: string[][],
  clueNumbers: number[][],
  activeClueNumber: number | null,
  orientation: "across" | "down",
  rows: number,
  columns: number,
  skipCompleted: boolean = true,
): [number, number] | null => {
  if (!activeClueNumber) return null;

  // Find the previous clue number
  let prevClueNumber = findPreviousClueNumber(
    activeClueNumber,
    orientation,
    grid,
    clueNumbers,
    rows,
    columns,
  );

  // If no previous clue in current orientation, try the other orientation
  if (!prevClueNumber) {
    const otherOrientation = orientation === "across" ? "down" : "across";
    prevClueNumber = findPreviousClueNumber(
      null, // Get the last clue in the other orientation
      otherOrientation,
      grid,
      clueNumbers,
      rows,
      columns,
    );

    if (prevClueNumber) {
      // Find the last cell of this clue in the other orientation
      const startCell = findClueStartCell(
        prevClueNumber,
        clueNumbers,
        rows,
        columns,
      );
      if (!startCell) return null;

      const [startRow, startCol] = startCell;
      let lastCell: [number, number] = startCell;

      if (otherOrientation === "across") {
        for (let c = startCol; c < columns; c++) {
          if (grid[startRow][c]) break;
          lastCell = [startRow, c];
        }
      } else {
        for (let r = startRow; r < rows; r++) {
          if (grid[r][startCol]) break;
          lastCell = [r, startCol];
        }
      }

      // If skipCompleted is true, check if this answer is complete
      if (skipCompleted) {
        const isComplete = isAnswerComplete(
          grid,
          letters,
          prevClueNumber,
          otherOrientation,
          clueNumbers,
          rows,
          columns,
        );
        if (isComplete) {
          // Recursively find the previous incomplete answer
          return findLastCellOfPreviousAnswer(
            grid,
            letters,
            clueNumbers,
            prevClueNumber,
            otherOrientation,
            rows,
            columns,
            skipCompleted,
          );
        }
      }

      return lastCell;
    }
    return null;
  }

  // Find the last cell of the previous clue in the current orientation
  const startCell = findClueStartCell(
    prevClueNumber,
    clueNumbers,
    rows,
    columns,
  );
  if (!startCell) return null;

  const [startRow, startCol] = startCell;
  let lastCell: [number, number] = startCell;

  if (orientation === "across") {
    for (let c = startCol; c < columns; c++) {
      if (grid[startRow][c]) break;
      lastCell = [startRow, c];
    }
  } else {
    for (let r = startRow; r < rows; r++) {
      if (grid[r][startCol]) break;
      lastCell = [r, startCol];
    }
  }

  // If skipCompleted is true, check if this answer is complete
  if (skipCompleted) {
    const isComplete = isAnswerComplete(
      grid,
      letters,
      prevClueNumber,
      orientation,
      clueNumbers,
      rows,
      columns,
    );
    if (isComplete) {
      // Recursively find the previous incomplete answer
      return findLastCellOfPreviousAnswer(
        grid,
        letters,
        clueNumbers,
        prevClueNumber,
        orientation,
        rows,
        columns,
        skipCompleted,
      );
    }
  }

  return lastCell;
};

/**
 * Checks if an answer is completely filled
 */
export const isAnswerComplete = (
  grid: boolean[][],
  letters: string[][],
  clueNumber: number,
  orientation: "across" | "down",
  clueNumbers: number[][],
  rows: number,
  columns: number,
): boolean => {
  const startCell = findClueStartCell(clueNumber, clueNumbers, rows, columns);
  if (!startCell) return false;

  const [startRow, startCol] = startCell;

  if (orientation === "across") {
    for (let c = startCol; c < columns; c++) {
      if (grid[startRow][c]) break;
      if (!letters[startRow][c]) return false;
    }
  } else {
    for (let r = startRow; r < rows; r++) {
      if (grid[r][startCol]) break;
      if (!letters[r][startCol]) return false;
    }
  }

  return true;
};
