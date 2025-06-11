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
export const findNextWhiteCell = (
  grid: boolean[][],
  row: number,
  col: number,
  direction: "left" | "right" | "up" | "down",
  rows: number,
  columns: number
): [number, number] | null => {
  let nextRow = row;
  let nextCol = col;

  switch (direction) {
    case "left":
      nextCol = col - 1;
      break;
    case "right":
      nextCol = col + 1;
      break;
    case "up":
      nextRow = row - 1;
      break;
    case "down":
      nextRow = row + 1;
      break;
  }

  // Check if the next position is within bounds and is a white cell
  if (
    nextRow >= 0 && nextRow < rows &&
    nextCol >= 0 && nextCol < columns &&
    !grid[nextRow][nextCol]
  ) {
    return [nextRow, nextCol];
  }

  return null;
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
  columns: number
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
  columns: number
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
    return clueNumberList.length > 0 ? clueNumberList[clueNumberList.length - 1] : null;
  }

  // Find the index of the current clue number
  const currentIndex = clueNumberList.indexOf(currentClueNumber);

  // If the current clue number is not found, return the last clue
  if (currentIndex === -1) {
    return clueNumberList.length > 0 ? clueNumberList[clueNumberList.length - 1] : null;
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
  columns: number
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
  columns: number
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
  columns: number
): boolean => {
  if (!activeClueNumber || grid[row][col]) return false;

  // Check if this cell is part of the active clue in the current orientation
  const clueStartCell = findClueStartCell(activeClueNumber, clueNumbers, rows, columns);
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
  columns: number
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
  orientation: "across" | "down"
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
  columns: number
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
  setCrosswordState
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
  setCrosswordState
}: HandleNextClueParams) => {
  if (!crosswordState) return;

  const currentClueNumber = crosswordState.activeClueNumber;
  const currentOrientation = crosswordState.clueOrientation;
  const visitedClues = new Set<number>();

  // Helper function to check if a clue has any empty cells
  const hasEmptyCells = (clueNumber: number, orientation: "across" | "down"): boolean => {
    const clueNumbers = calculateClueNumbers(crosswordState.grid, crosswordState.rows, crosswordState.columns);
    const startCell = findClueStartCell(clueNumber, clueNumbers, crosswordState.rows, crosswordState.columns);
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
  const findNextClueWithEmptyCells = (startClueNumber: number | null, orientation: "across" | "down"): number | null => {
    const clueNumbers = calculateClueNumbers(crosswordState.grid, crosswordState.rows, crosswordState.columns);
    let nextClueNumber = findNextClueNumber(startClueNumber, orientation, crosswordState.grid, clueNumbers, crosswordState.rows, crosswordState.columns);

    // Keep track of visited clues to prevent infinite loops
    while (nextClueNumber && !visitedClues.has(nextClueNumber)) {
      visitedClues.add(nextClueNumber);
      if (hasEmptyCells(nextClueNumber, orientation)) {
        return nextClueNumber;
      }
      nextClueNumber = findNextClueNumber(nextClueNumber, orientation, crosswordState.grid, clueNumbers, crosswordState.rows, crosswordState.columns);
    }
    return null;
  };

  // First try to find a clue with empty cells in the current orientation
  let nextClueNumber = findNextClueWithEmptyCells(currentClueNumber, currentOrientation);

  // If no clues with empty cells in current orientation, try the other orientation
  if (!nextClueNumber) {
    const otherOrientation = currentOrientation === "across" ? "down" : "across";
    nextClueNumber = findNextClueWithEmptyCells(null, otherOrientation);

    if (nextClueNumber) {
      // Found a clue with empty cells in the other orientation
      const clueNumbers = calculateClueNumbers(crosswordState.grid, crosswordState.rows, crosswordState.columns);
      const startCell = findClueStartCell(nextClueNumber, clueNumbers, crosswordState.rows, crosswordState.columns);
      const firstEmptyCell = findFirstEmptyCellInClue(nextClueNumber, otherOrientation, crosswordState.grid, crosswordState.letters, clueNumbers, crosswordState.rows, crosswordState.columns);
      navigateToClueAndCell({
        clueNumber: nextClueNumber,
        orientation: otherOrientation,
        cell: firstEmptyCell || startCell,
        crosswordState,
        setCrosswordState
      });
      return;
    }
  }

  // If we found a clue with empty cells in the current orientation
  if (nextClueNumber) {
    const clueNumbers = calculateClueNumbers(crosswordState.grid, crosswordState.rows, crosswordState.columns);
    const startCell = findClueStartCell(nextClueNumber, clueNumbers, crosswordState.rows, crosswordState.columns);
    const firstEmptyCell = findFirstEmptyCellInClue(nextClueNumber, currentOrientation, crosswordState.grid, crosswordState.letters, clueNumbers, crosswordState.rows, crosswordState.columns);
    navigateToClueAndCell({
      clueNumber: nextClueNumber,
      orientation: currentOrientation,
      cell: firstEmptyCell || startCell,
      crosswordState,
      setCrosswordState
    });
    return;
  }

  // If no clues with empty cells found in either orientation, fall back to normal cycling
  const clueNumbers = calculateClueNumbers(crosswordState.grid, crosswordState.rows, crosswordState.columns);
  nextClueNumber = findNextClueNumber(currentClueNumber, currentOrientation, crosswordState.grid, clueNumbers, crosswordState.rows, crosswordState.columns);

  if (nextClueNumber) {
    // Find the start cell for the next clue
    const startCell = findClueStartCell(nextClueNumber, clueNumbers, crosswordState.rows, crosswordState.columns);
    // Find the first empty cell in the next clue
    const firstEmptyCell = findFirstEmptyCellInClue(nextClueNumber, currentOrientation, crosswordState.grid, crosswordState.letters, clueNumbers, crosswordState.rows, crosswordState.columns);
    // Navigate to the next clue
    navigateToClueAndCell({
      clueNumber: nextClueNumber,
      orientation: currentOrientation,
      cell: firstEmptyCell || startCell,
      crosswordState,
      setCrosswordState
    });
  } else {
    // If we've reached the end of the current orientation's clues, switch to the other orientation
    const newOrientation = currentOrientation === "across" ? "down" : "across";
    const firstClueNumber = findNextClueNumber(null, newOrientation, crosswordState.grid, clueNumbers, crosswordState.rows, crosswordState.columns);

    if (firstClueNumber) {
      const startCell = findClueStartCell(firstClueNumber, clueNumbers, crosswordState.rows, crosswordState.columns);
      const firstEmptyCell = findFirstEmptyCellInClue(firstClueNumber, newOrientation, crosswordState.grid, crosswordState.letters, clueNumbers, crosswordState.rows, crosswordState.columns);
      navigateToClueAndCell({
        clueNumber: firstClueNumber,
        orientation: newOrientation,
        cell: firstEmptyCell || startCell,
        crosswordState,
        setCrosswordState
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
  setCrosswordState
}: HandlePreviousClueParams) => {
  if (!crosswordState) return;

  const currentClueNumber = crosswordState.activeClueNumber;
  const currentOrientation = crosswordState.clueOrientation;
  const visitedClues = new Set<number>();

  // Helper function to check if a clue has any empty cells
  const hasEmptyCells = (clueNumber: number, orientation: "across" | "down"): boolean => {
    const clueNumbers = calculateClueNumbers(crosswordState.grid, crosswordState.rows, crosswordState.columns);
    const startCell = findClueStartCell(clueNumber, clueNumbers, crosswordState.rows, crosswordState.columns);
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
  const findPreviousClueWithEmptyCells = (startClueNumber: number | null, orientation: "across" | "down"): number | null => {
    const clueNumbers = calculateClueNumbers(crosswordState.grid, crosswordState.rows, crosswordState.columns);
    let prevClueNumber = findPreviousClueNumber(startClueNumber, orientation, crosswordState.grid, clueNumbers, crosswordState.rows, crosswordState.columns);

    // Keep track of visited clues to prevent infinite loops
    while (prevClueNumber && !visitedClues.has(prevClueNumber)) {
      visitedClues.add(prevClueNumber);
      if (hasEmptyCells(prevClueNumber, orientation)) {
        return prevClueNumber;
      }
      prevClueNumber = findPreviousClueNumber(prevClueNumber, orientation, crosswordState.grid, clueNumbers, crosswordState.rows, crosswordState.columns);
    }
    return null;
  };

  // First try to find a clue with empty cells in the current orientation (moving backwards)
  let prevClueNumber = findPreviousClueWithEmptyCells(currentClueNumber, currentOrientation);

  // If no clues with empty cells in current orientation, try the other orientation (from the end)
  if (!prevClueNumber) {
    const otherOrientation = currentOrientation === "across" ? "down" : "across";
    prevClueNumber = findPreviousClueWithEmptyCells(null, otherOrientation);

    if (prevClueNumber) {
      // Found a clue with empty cells in the other orientation
      const clueNumbers = calculateClueNumbers(crosswordState.grid, crosswordState.rows, crosswordState.columns);
      const startCell = findClueStartCell(prevClueNumber, clueNumbers, crosswordState.rows, crosswordState.columns);
      const firstEmptyCell = findFirstEmptyCellInClue(prevClueNumber, otherOrientation, crosswordState.grid, crosswordState.letters, clueNumbers, crosswordState.rows, crosswordState.columns);
      navigateToClueAndCell({
        clueNumber: prevClueNumber,
        orientation: otherOrientation,
        cell: firstEmptyCell || startCell,
        crosswordState,
        setCrosswordState
      });
      return;
    }
  }

  // If we found a clue with empty cells in the current orientation
  if (prevClueNumber) {
    const clueNumbers = calculateClueNumbers(crosswordState.grid, crosswordState.rows, crosswordState.columns);
    const startCell = findClueStartCell(prevClueNumber, clueNumbers, crosswordState.rows, crosswordState.columns);
    const firstEmptyCell = findFirstEmptyCellInClue(prevClueNumber, currentOrientation, crosswordState.grid, crosswordState.letters, clueNumbers, crosswordState.rows, crosswordState.columns);
    navigateToClueAndCell({
      clueNumber: prevClueNumber,
      orientation: currentOrientation,
      cell: firstEmptyCell || startCell,
      crosswordState,
      setCrosswordState
    });
    return;
  }

  // If no clues with empty cells found in either orientation, fall back to normal cycling
  const clueNumbers = calculateClueNumbers(crosswordState.grid, crosswordState.rows, crosswordState.columns);
  prevClueNumber = findPreviousClueNumber(currentClueNumber, currentOrientation, crosswordState.grid, clueNumbers, crosswordState.rows, crosswordState.columns);

  if (prevClueNumber) {
    // Find the start cell for the previous clue
    const startCell = findClueStartCell(prevClueNumber, clueNumbers, crosswordState.rows, crosswordState.columns);
    // Find the first empty cell in the previous clue
    const firstEmptyCell = findFirstEmptyCellInClue(prevClueNumber, currentOrientation, crosswordState.grid, crosswordState.letters, clueNumbers, crosswordState.rows, crosswordState.columns);
    // Navigate to the previous clue
    navigateToClueAndCell({
      clueNumber: prevClueNumber,
      orientation: currentOrientation,
      cell: firstEmptyCell || startCell,
      crosswordState,
      setCrosswordState
    });
  } else {
    // If we've reached the beginning of the current orientation's clues, switch to the other orientation
    const newOrientation = currentOrientation === "across" ? "down" : "across";
    const lastClueNumber = findPreviousClueNumber(null, newOrientation, crosswordState.grid, clueNumbers, crosswordState.rows, crosswordState.columns);

    if (lastClueNumber) {
      const startCell = findClueStartCell(lastClueNumber, clueNumbers, crosswordState.rows, crosswordState.columns);
      const firstEmptyCell = findFirstEmptyCellInClue(lastClueNumber, newOrientation, crosswordState.grid, crosswordState.letters, clueNumbers, crosswordState.rows, crosswordState.columns);
      navigateToClueAndCell({
        clueNumber: lastClueNumber,
        orientation: newOrientation,
        cell: firstEmptyCell || startCell,
        crosswordState,
        setCrosswordState
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
