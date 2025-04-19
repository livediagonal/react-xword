import React, { useRef } from "react";
import { ClueOrientation } from "../types";

export interface CrosswordGridProps {
  rows: number;
  columns: number;
  grid: boolean[][];
  letters: string[][];
  onLetterChange: (row: number, col: number, letter: string) => void;
  clueOrientation: ClueOrientation;
  activeClueNumber: number | null;
  onClueOrientationChange: ((orientation: ClueOrientation) => void) | undefined;
  onCellClick: ((row: number, col: number) => void) | undefined;
  activeCell: [number, number] | null | undefined;
}

const CrosswordGrid: React.FC<CrosswordGridProps> = ({
  rows,
  columns,
  grid,
  letters,
  onLetterChange,
  clueOrientation,
  activeClueNumber,
  onClueOrientationChange,
  onCellClick,
  activeCell,
}) => {
  const gridRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent, row: number, col: number) => {
    // Handle letter input
    if (e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) {
      e.preventDefault();
      onLetterChange(row, col, e.key.toUpperCase());

      // Find the next cell in the word
      const nextCell = findNextCellInWord(row, col);
      if (nextCell && onCellClick) {
        onCellClick(nextCell[0], nextCell[1]);
      }
    }

    // Handle navigation
    if (e.key === "ArrowRight" || e.key === "Tab") {
      e.preventDefault();
      const nextCell = findNextCellInWord(row, col);
      if (nextCell && onCellClick) {
        onCellClick(nextCell[0], nextCell[1]);
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prevCell = findPreviousCellInWord(row, col);
      if (prevCell && onCellClick) {
        onCellClick(prevCell[0], prevCell[1]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (onClueOrientationChange) {
        onClueOrientationChange("down");
      }
      const nextCell = findNextClue(row, col);
      if (nextCell && onCellClick) {
        onCellClick(nextCell[0], nextCell[1]);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (onClueOrientationChange) {
        onClueOrientationChange("across");
      }
      const prevCell = findPreviousClue(row, col);
      if (prevCell && onCellClick) {
        onCellClick(prevCell[0], prevCell[1]);
      }
    } else if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      onLetterChange(row, col, "");

      // Find the previous cell in the word
      const prevCell = findPreviousCellInWord(row, col);
      if (prevCell && onCellClick) {
        onCellClick(prevCell[0], prevCell[1]);
      }
    } else if (e.key === " ") {
      e.preventDefault();
      if (onClueOrientationChange) {
        onClueOrientationChange(
          clueOrientation === "across" ? "down" : "across",
        );
      }
    }
  };

  // Helper function to find the next cell in the current word
  const findNextCellInWord = (
    row: number,
    col: number,
  ): [number, number] | null => {
    const isHorizontal = clueOrientation === "across";

    if (isHorizontal) {
      // Move right until we hit a black cell or the edge
      let nextCol = col + 1;
      while (nextCol < columns && !grid[row][nextCol]) {
        nextCol++;
      }

      // If we found a white cell, return it
      if (nextCol < columns && !grid[row][nextCol]) {
        return [row, nextCol];
      }
    } else {
      // Move down until we hit a black cell or the edge
      let nextRow = row + 1;
      while (nextRow < rows && !grid[nextRow][col]) {
        nextRow++;
      }

      // If we found a white cell, return it
      if (nextRow < rows && !grid[nextRow][col]) {
        return [nextRow, col];
      }
    }

    return null;
  };

  // Helper function to find the previous cell in the current word
  const findPreviousCellInWord = (
    row: number,
    col: number,
  ): [number, number] | null => {
    const isHorizontal = clueOrientation === "across";

    if (isHorizontal) {
      // Move left until we hit a black cell or the edge
      let prevCol = col - 1;
      while (prevCol >= 0 && !grid[row][prevCol]) {
        prevCol--;
      }

      // If we found a white cell, return it
      if (prevCol >= 0 && !grid[row][prevCol]) {
        return [row, prevCol];
      }
    } else {
      // Move up until we hit a black cell or the edge
      let prevRow = row - 1;
      while (prevRow >= 0 && !grid[prevRow][col]) {
        prevRow--;
      }

      // If we found a white cell, return it
      if (prevRow >= 0 && !grid[prevRow][col]) {
        return [prevRow, col];
      }
    }

    return null;
  };

  // Helper function to find the next clue
  const findNextClue = (row: number, col: number): [number, number] | null => {
    const isHorizontal = clueOrientation === "across";
    const clueNumbers = calculateClueNumbers();

    if (isHorizontal) {
      // Move to the next row
      let nextRow = row + 1;
      let nextCol = 0;

      // Find the next white cell with a clue number
      while (nextRow < rows) {
        while (nextCol < columns) {
          if (!grid[nextRow][nextCol] && clueNumbers[nextRow][nextCol] > 0) {
            return [nextRow, nextCol];
          }
          nextCol++;
        }
        nextCol = 0;
        nextRow++;
      }
    } else {
      // Move to the next column
      let nextRow = 0;
      let nextCol = col + 1;

      // Find the next white cell with a clue number
      while (nextCol < columns) {
        while (nextRow < rows) {
          if (!grid[nextRow][nextCol] && clueNumbers[nextRow][nextCol] > 0) {
            return [nextRow, nextCol];
          }
          nextRow++;
        }
        nextRow = 0;
        nextCol++;
      }
    }

    return null;
  };

  // Helper function to find the previous clue
  const findPreviousClue = (
    row: number,
    col: number,
  ): [number, number] | null => {
    const isHorizontal = clueOrientation === "across";
    const clueNumbers = calculateClueNumbers();

    if (isHorizontal) {
      // Move to the previous row
      let prevRow = row - 1;
      let prevCol = columns - 1;

      // Find the previous white cell with a clue number
      while (prevRow >= 0) {
        while (prevCol >= 0) {
          if (!grid[prevRow][prevCol] && clueNumbers[prevRow][prevCol] > 0) {
            return [prevRow, prevCol];
          }
          prevCol--;
        }
        prevCol = columns - 1;
        prevRow--;
      }
    } else {
      // Move to the previous column
      let prevRow = rows - 1;
      let prevCol = col - 1;

      // Find the previous white cell with a clue number
      while (prevCol >= 0) {
        while (prevRow >= 0) {
          if (!grid[prevRow][prevCol] && clueNumbers[prevRow][prevCol] > 0) {
            return [prevRow, prevCol];
          }
          prevRow--;
        }
        prevRow = rows - 1;
        prevCol--;
      }
    }

    return null;
  };

  // Helper function to calculate clue numbers
  const calculateClueNumbers = (): number[][] => {
    const clueNumbers: number[][] = Array(rows)
      .fill(0)
      .map(() => Array(columns).fill(0));
    let currentNumber = 1;

    const isWhiteCell = (row: number, col: number): boolean => {
      return (
        row >= 0 && row < rows && col >= 0 && col < columns && !grid[row][col]
      );
    };

    const startsHorizontal = (row: number, col: number): boolean => {
      if (!isWhiteCell(row, col)) return false;
      return col === 0 || !isWhiteCell(row, col - 1);
    };

    const startsVertical = (row: number, col: number): boolean => {
      if (!isWhiteCell(row, col)) return false;
      return row === 0 || !isWhiteCell(row - 1, col);
    };

    const hasHorizontalWord = (row: number, col: number): boolean => {
      if (!startsHorizontal(row, col)) return false;
      // Check if there's at least one more white cell to the right
      return col + 1 < columns && isWhiteCell(row, col + 1);
    };

    const hasVerticalWord = (row: number, col: number): boolean => {
      if (!startsVertical(row, col)) return false;
      // Check if there's at least one more white cell below
      return row + 1 < rows && isWhiteCell(row + 1, col);
    };

    // First pass: identify cells that start words
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        if (isWhiteCell(row, col)) {
          // Check if this cell starts a horizontal word with at least 2 cells
          if (hasHorizontalWord(row, col)) {
            clueNumbers[row][col] = -1; // Mark as potential clue start
          }

          // Check if this cell starts a vertical word with at least 2 cells
          if (hasVerticalWord(row, col)) {
            clueNumbers[row][col] = -1; // Mark as potential clue start
          }
        }
      }
    }

    // Second pass: assign numbers to cells that start words
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        if (clueNumbers[row][col] === -1) {
          clueNumbers[row][col] = currentNumber++;
        }
      }
    }

    return clueNumbers;
  };

  // Function to check if a cell is part of the active clue
  const isPartOfActiveClue = (row: number, col: number): boolean => {
    if (!activeClueNumber || grid[row][col]) return false;

    // Check if this cell is part of the active clue in the current orientation
    const clueStartCell = findClueStartCell(activeClueNumber, clueOrientation);
    if (!clueStartCell) return false;

    const [startRow, startCol] = clueStartCell;

    if (clueOrientation === "across") {
      // Check if cell is in the same row as the clue start and to the right of it
      return row === startRow && col >= startCol;
    } else {
      // Check if cell is in the same column as the clue start and below it
      return col === startCol && row >= startRow;
    }
  };

  // Function to find the start cell of a clue
  const findClueStartCell = (
    clueNumber: number,
    orientation: ClueOrientation,
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

  // Calculate clue numbers for the grid
  const clueNumbers = calculateClueNumbers();

  return (
    <div className="crossword-grid" ref={gridRef}>
      <div
        className="grid-container"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          gap: "1px",
          background: "#000",
          padding: "1px",
          width: "100%",
          maxWidth: "600px",
          aspectRatio: `${columns} / ${rows}`,
        }}
      >
        {Array.from({ length: rows }, (_, row) =>
          Array.from({ length: columns }, (_, col) => {
            const isBlack = grid[row][col];
            const letter = letters[row][col];
            const number = clueNumbers[row][col];
            const isActive =
              activeCell && activeCell[0] === row && activeCell[1] === col;
            const isInActiveWord = isPartOfActiveClue(row, col);

            return (
              <div
                key={`${row}-${col}`}
                className={`grid-cell ${isBlack ? "black" : "white"} ${
                  isActive ? "active" : ""
                } ${isInActiveWord ? "in-active-word" : ""}`}
                style={{
                  background: isBlack ? "#000" : "#fff",
                  color: isBlack ? "#fff" : "#000",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  cursor: "default",
                  userSelect: "none",
                }}
                onClick={() => onCellClick && onCellClick(row, col)}
                tabIndex={isBlack ? -1 : 0}
                onKeyDown={(e) => handleKeyDown(e, row, col)}
              >
                {!isBlack && (
                  <>
                    {number > 0 && (
                      <div
                        className="cell-number"
                        style={{
                          position: "absolute",
                          top: "2px",
                          left: "2px",
                          fontSize: "0.6em",
                        }}
                      >
                        {number}
                      </div>
                    )}
                    <div
                      className="cell-letter"
                      style={{
                        fontSize: "1.2em",
                        fontWeight: "bold",
                      }}
                    >
                      {letter}
                    </div>
                  </>
                )}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
};

export default CrosswordGrid;
