import React, { useState, useEffect, useRef } from "react";
import CrosswordGrid from "./CrosswordGrid";
import { CrosswordState } from "../types";
import "./CrosswordSolver.css";

interface CrosswordSolverProps {
  ipuzPath: string;
}

// Storage key for the solver state
const SOLVER_STORAGE_KEY = "xword_solver_state";

const CrosswordSolver: React.FC<CrosswordSolverProps> = ({ ipuzPath }) => {
  const [crosswordState, setCrosswordState] = useState<CrosswordState | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use a ref to track if we've already loaded from localStorage
  const hasLoadedFromStorage = useRef(false);

  // Load puzzle data only once when component mounts
  useEffect(() => {
    const loadPuzzle = async () => {
      try {
        setLoading(true);
        let ipuzData;

        try {
          // First try to parse as JSON in case it's raw data
          ipuzData = JSON.parse(ipuzPath);
        } catch (e) {
          // If parsing fails, try to fetch as URL
          const response = await fetch(ipuzPath);
          if (!response.ok) {
            throw new Error(`Failed to load puzzle: ${response.statusText}`);
          }
          ipuzData = await response.json();
        }

        // Convert ipuz data to our internal format
        const { dimensions, puzzle: ipuzPuzzle, clues } = ipuzData;
        const { width, height } = dimensions;

        // Create grid and letters arrays
        const grid: boolean[][] = Array(height)
          .fill(0)
          .map(() => Array(width).fill(false));
        const letters: string[][] = Array(height)
          .fill(0)
          .map(() => Array(width).fill(""));

        // Process the puzzle data
        for (let row = 0; row < height; row++) {
          for (let col = 0; col < width; col++) {
            const cell = ipuzPuzzle[row][col];

            // If cell is "#" or null, it's a black cell
            if (cell === "#" || cell === null) {
              grid[row][col] = true;
            } else if (typeof cell === "object" && cell.cell !== undefined) {
              // This is a white cell with a number
              grid[row][col] = false;
            } else if (typeof cell === "number") {
              // This is a white cell with a number
              grid[row][col] = false;
            }
          }
        }

        // Process clues
        const processedClues = {
          Across: {} as { [key: number]: string },
          Down: {} as { [key: number]: string },
        };

        if (clues && clues.Across) {
          clues.Across.forEach(([number, text]: [number, string]) => {
            processedClues.Across[number] = text;
          });
        }

        if (clues && clues.Down) {
          clues.Down.forEach(([number, text]: [number, string]) => {
            processedClues.Down[number] = text;
          });
        }

        // Initialize the crossword state
        const initialState: CrosswordState = {
          rows: height,
          columns: width,
          grid,
          letters,
          clueOrientation: "across",
          activeClueNumber: null,
          activeCell: null,
          clues: processedClues,
          clueText: "",
        };

        // Try to load saved state from localStorage
        if (!hasLoadedFromStorage.current) {
          const savedState = localStorage.getItem(SOLVER_STORAGE_KEY);
          if (savedState) {
            try {
              const parsedState = JSON.parse(savedState);
              // Only use saved letters if the puzzle dimensions match
              if (
                parsedState.rows === height &&
                parsedState.columns === width
              ) {
                // We'll use the saved letters from the user's progress
                initialState.letters = parsedState.letters;
              }
            } catch (e) {
              console.error("Error parsing saved state:", e);
            }
          }
          hasLoadedFromStorage.current = true;
        }

        // Set the state once with all the data
        setCrosswordState(initialState);
        setLoading(false);
      } catch (err) {
        console.error("Error loading puzzle:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      }
    };

    loadPuzzle();
  }, [ipuzPath]);

  // Save state to localStorage when it changes, but only if we've already loaded from storage
  useEffect(() => {
    if (crosswordState && hasLoadedFromStorage.current) {
      localStorage.setItem(SOLVER_STORAGE_KEY, JSON.stringify(crosswordState));
    }
  }, [crosswordState]);

  // Add a useEffect hook to log state changes
  useEffect(() => {
    if (crosswordState) {
      // State changes are now tracked without console logs
    }
  }, [crosswordState]);

  const handleLetterChange = (row: number, col: number, letter: string) => {
    if (crosswordState) {
      const newLetters = [...crosswordState.letters];

      // Check if this is a backspace operation (empty string)
      if (letter === "") {
        // If the current cell is empty, move back one cell and delete that letter
        if (!newLetters[row][col]) {
          // Find the previous cell in the current word
          const prevCell = findPreviousCellInWord(row, col, crosswordState.clueOrientation);

          if (prevCell) {
            const [prevRow, prevCol] = prevCell;
            // Clear the letter in the previous cell
            newLetters[prevRow][prevCol] = "";

            // Update the state with the cleared letter
            setCrosswordState({
              ...crosswordState,
              letters: newLetters,
              activeCell: [prevRow, prevCol],
            });
          }
        } else {
          // If the current cell has a letter, just clear it and stay in the current cell
          newLetters[row][col] = "";

          // Update the state with the cleared letter
          setCrosswordState({
            ...crosswordState,
            letters: newLetters,
          });
        }
      } else {
        // Normal letter input
        newLetters[row][col] = letter;

        setCrosswordState({
          ...crosswordState,
          letters: newLetters,
        });

        // After updating the letter, move to the next cell or clue
        // Find the next cell in the current word
        const nextCell = findNextCellInWord(row, col, crosswordState.clueOrientation);

        if (nextCell) {
          // If there's a next cell in the current word, move to it
          const [nextRow, nextCol] = nextCell;

          // Update the active cell
          setCrosswordState(prevState => {
            if (!prevState) return prevState;
            return {
              ...prevState,
              activeCell: [nextRow, nextCol],
            };
          });
        } else {
          // If there's no next cell (we're at the end of the word), move to the next clue
          const nextClueNumber = findNextClueNumber(crosswordState.activeClueNumber, crosswordState.clueOrientation);

          if (nextClueNumber) {
            // Find the first empty cell in the next clue
            const firstEmptyCell = findFirstEmptyCellInClue(nextClueNumber, crosswordState.clueOrientation);

            // Navigate to the next clue and cell
            navigateToClueAndCell(nextClueNumber, crosswordState.clueOrientation, firstEmptyCell);
          }
        }
      }
    }
  };

  // Helper function to find the next cell in the current word
  const findNextCellInWord = (
    row: number,
    col: number,
    orientation: "across" | "down"
  ): [number, number] | null => {
    if (!crosswordState) return null;

    const { grid, rows, columns } = crosswordState;

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

  // Helper function to find the previous cell in the current word
  const findPreviousCellInWord = (
    row: number,
    col: number,
    orientation: "across" | "down"
  ): [number, number] | null => {
    if (!crosswordState) return null;

    const { grid, rows, columns } = crosswordState;

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

  // Helper function to find the next clue number in the current orientation
  const findNextClueNumber = (
    currentClueNumber: number | null,
    orientation: "across" | "down"
  ): number | null => {
    if (!crosswordState) return null;

    const clueNumbers = calculateClueNumbers(crosswordState.grid);
    const clueNumberList: number[] = [];

    // Collect all clue numbers from the grid
    for (let row = 0; row < crosswordState.rows; row++) {
      for (let col = 0; col < crosswordState.columns; col++) {
        const number = clueNumbers[row][col];
        if (number > 0) {
          // Check if this cell starts a word in the current orientation
          if (orientation === "across") {
            if (col === 0 || crosswordState.grid[row][col - 1]) {
              clueNumberList.push(number);
            }
          } else {
            if (row === 0 || crosswordState.grid[row - 1][col]) {
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

    // Return the next clue number, or wrap around to the first clue
    const nextIndex = (currentIndex + 1) % clueNumberList.length;
    return clueNumberList[nextIndex];
  };

  const handleClueOrientationChange = (orientation: "across" | "down") => {
    if (crosswordState) {
      // Create a new state with the updated orientation
      const newState: CrosswordState = {
        ...crosswordState,
        clueOrientation: orientation,
      };

      // If we have an active cell, find the clue number for the new orientation
      if (crosswordState.activeCell) {
        const [row, col] = crosswordState.activeCell;

        // Find the starting cells for both horizontal and vertical words
        const [horizontalStartRow, horizontalStartCol] = findWordStart(
          crosswordState.grid,
          row,
          col,
          true,
        );
        const [verticalStartRow, verticalStartCol] = findWordStart(
          crosswordState.grid,
          row,
          col,
          false,
        );

        // Calculate clue numbers
        const clueNumbers = calculateClueNumbers(crosswordState.grid);

        // Get the clue numbers for both starting cells
        const horizontalClueNumber =
          clueNumbers[horizontalStartRow][horizontalStartCol];
        const verticalClueNumber =
          clueNumbers[verticalStartRow][verticalStartCol];

        // Always set the active clue number based on the new orientation
        if (orientation === "across" && horizontalClueNumber > 0) {
          newState.activeClueNumber = horizontalClueNumber;
        } else if (orientation === "down" && verticalClueNumber > 0) {
          newState.activeClueNumber = verticalClueNumber;
        } else {
          // If no clue exists for the new orientation, keep the current orientation
          // but update the active clue number if possible
          if (horizontalClueNumber > 0) {
            newState.activeClueNumber = horizontalClueNumber;
          } else if (verticalClueNumber > 0) {
            newState.activeClueNumber = verticalClueNumber;
          } else {
            // If no clue exists for this cell, clear the active clue
            newState.activeClueNumber = null;
          }
        }
      }

      setCrosswordState(newState);
    }
  };

  const handleCellClick = (row: number, col: number) => {
    if (crosswordState) {
      // Skip if the clicked cell is a black cell
      if (crosswordState.grid[row][col]) {
        return;
      }

      // Find the starting cells for both horizontal and vertical words
      const [horizontalStartRow, horizontalStartCol] = findWordStart(
        crosswordState.grid,
        row,
        col,
        true,
      );
      const [verticalStartRow, verticalStartCol] = findWordStart(
        crosswordState.grid,
        row,
        col,
        false,
      );

      // Calculate clue numbers
      const clueNumbers = calculateClueNumbers(crosswordState.grid);

      // Get the clue numbers for both starting cells
      const horizontalClueNumber =
        clueNumbers[horizontalStartRow][horizontalStartCol];
      const verticalClueNumber =
        clueNumbers[verticalStartRow][verticalStartCol];

      // Set the active cell to the clicked cell
      const newState: CrosswordState = {
        ...crosswordState,
        activeCell: [row, col] as [number, number],
      };

      // Determine which clue to activate based on the current orientation
      if (
        crosswordState.clueOrientation === "across" &&
        horizontalClueNumber > 0
      ) {
        newState.activeClueNumber = horizontalClueNumber;
      } else if (
        crosswordState.clueOrientation === "down" &&
        verticalClueNumber > 0
      ) {
        newState.activeClueNumber = verticalClueNumber;
      } else {
        // If the current orientation's clue doesn't exist, try the other orientation
        if (horizontalClueNumber > 0) {
          newState.clueOrientation = "across";
          newState.activeClueNumber = horizontalClueNumber;
        } else if (verticalClueNumber > 0) {
          newState.clueOrientation = "down";
          newState.activeClueNumber = verticalClueNumber;
        } else {
          // If no clue exists for this cell, clear the active clue
          newState.activeClueNumber = null;
        }
      }

      setCrosswordState(newState);
    }
  };

  // Function to navigate to a specific clue and cell
  const navigateToClueAndCell = (
    clueNumber: number,
    orientation: "across" | "down",
    cell: [number, number] | null
  ) => {
    if (crosswordState) {
      // Create a new state with the updated clue number, orientation, and cell
      const newState: CrosswordState = {
        ...crosswordState,
        activeClueNumber: clueNumber,
        clueOrientation: orientation,
        activeCell: cell,
      };

      // Update the state
      setCrosswordState(newState);

      // Force a re-render by updating the state again with the same values
      // This ensures the UI updates properly
      setTimeout(() => {
        setCrosswordState(prevState => {
          if (prevState) {
            return {
              ...prevState,
              activeClueNumber: clueNumber,
              clueOrientation: orientation,
              activeCell: cell,
            };
          }
          return prevState;
        });
      }, 0);
    }
  };

  // Helper function to find the start of a word
  const findWordStart = (
    grid: boolean[][],
    row: number,
    col: number,
    isHorizontal: boolean,
  ): [number, number] => {
    if (isHorizontal) {
      // For horizontal words, move left until we hit a black cell or the edge
      while (col > 0 && !grid[row][col - 1]) {
        col--;
      }
    } else {
      // For vertical words, move up until we hit a black cell or the edge
      while (row > 0 && !grid[row - 1][col]) {
        row--;
      }
    }
    return [row, col];
  };

  // Helper function to calculate clue numbers
  const calculateClueNumbers = (grid: boolean[][]): number[][] => {
    const rows = grid.length;
    const columns = grid[0].length;
    const clueNumbers: number[][] = Array(rows)
      .fill(0)
      .map(() => Array(columns).fill(0));
    let currentNumber = 1;

    // Helper function to check if a cell is white
    const isWhiteCell = (row: number, col: number): boolean => {
      return (
        row >= 0 && row < rows && col >= 0 && col < columns && !grid[row][col]
      );
    };

    // Helper function to check if a cell starts a horizontal word
    const startsHorizontal = (row: number, col: number): boolean => {
      if (!isWhiteCell(row, col)) return false;
      return col === 0 || !isWhiteCell(row, col - 1);
    };

    // Helper function to check if a cell starts a vertical word
    const startsVertical = (row: number, col: number): boolean => {
      if (!isWhiteCell(row, col)) return false;
      return row === 0 || !isWhiteCell(row - 1, col);
    };

    // Helper function to check if a horizontal word has at least 2 cells
    const hasHorizontalWord = (row: number, col: number): boolean => {
      if (!startsHorizontal(row, col)) return false;
      // Check if there's at least one more white cell to the right
      return col + 1 < columns && isWhiteCell(row, col + 1);
    };

    // Helper function to check if a vertical word has at least 2 cells
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

  // Helper function to find the starting cell for a given clue number
  const findClueStartCell = (
    clueNumber: number,
    orientation: "across" | "down",
  ): [number, number] | null => {
    if (!crosswordState) return null;

    const { grid, rows, columns } = crosswordState;
    const clueNumbers = calculateClueNumbers(grid);

    // Search for the cell with the given clue number
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        if (clueNumbers[row][col] === clueNumber) {
          // Check if this cell starts a word in the requested orientation
          if (orientation === "across") {
            // For across clues, check if this cell starts a horizontal word
            if (col === 0 || grid[row][col - 1]) {
              return [row, col];
            }
          } else {
            // For down clues, check if this cell starts a vertical word
            if (row === 0 || grid[row - 1][col]) {
              return [row, col];
            }
          }
        }
      }
    }

    return null;
  };

  // Helper function to find the first empty cell in a clue
  const findFirstEmptyCellInClue = (
    clueNumber: number,
    orientation: "across" | "down",
  ): [number, number] | null => {
    if (!crosswordState) return null;

    const { grid, rows, columns, letters } = crosswordState;
    const clueNumbers = calculateClueNumbers(grid);

    // Find the start cell of the clue
    const startCell = findClueStartCell(clueNumber, orientation);
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

  if (loading) {
    return (
      <div className="solver-loading">
        Loading puzzle...
      </div>
    );
  }

  if (error) {
    return (
      <div className="solver-error">
        Error: {error}
      </div>
    );
  }

  if (!crosswordState) {
    return (
      <div className="solver-no-data">
        No puzzle data available
      </div>
    );
  }

  return (
    <div className="solver-container">
      <div className="solver-controls">
        <button
          onClick={() => handleClueOrientationChange("across")}
          className={`solver-button ${crosswordState.clueOrientation === "across" ? "active" : ""}`}
        >
          Across
        </button>
        <button
          onClick={() => handleClueOrientationChange("down")}
          className={`solver-button ${crosswordState.clueOrientation === "down" ? "active" : ""}`}
        >
          Down
        </button>
      </div>

      <div className="solver-content">
        <div className="solver-grid-container">
          <CrosswordGrid
            rows={crosswordState.rows}
            columns={crosswordState.columns}
            grid={crosswordState.grid}
            letters={crosswordState.letters}
            onLetterChange={handleLetterChange}
            clueOrientation={crosswordState.clueOrientation}
            activeClueNumber={crosswordState.activeClueNumber}
            onClueOrientationChange={handleClueOrientationChange}
            onCellClick={handleCellClick}
            onNavigateToClue={navigateToClueAndCell}
            activeCell={crosswordState.activeCell}
          />
        </div>

        <div className="solver-clues-container">
          <div className="solver-clue-section">
            <h3>Across</h3>
            <div className="solver-clue-list">
              {Object.entries(crosswordState.clues.Across).map(
                ([number, text]) => (
                  <div
                    key={`across-${number}`}
                    className={`solver-clue-item ${crosswordState.activeClueNumber === parseInt(number) &&
                      crosswordState.clueOrientation === "across"
                      ? "active"
                      : ""
                      }`}
                    onClick={() => {
                      const cellNumber = parseInt(number);
                      const startCell = findClueStartCell(cellNumber, "across");

                      // Find the first empty cell in the clue
                      const firstEmptyCell = findFirstEmptyCellInClue(cellNumber, "across");

                      // Use the first empty cell if available, otherwise use the start cell
                      navigateToClueAndCell(cellNumber, "across", firstEmptyCell || startCell);
                    }}
                  >
                    <span className="solver-clue-number">{number}.</span> {text}
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="solver-clue-section">
            <h3>Down</h3>
            <div className="solver-clue-list">
              {Object.entries(crosswordState.clues.Down).map(([number, text]) => (
                <div
                  key={`down-${number}`}
                  className={`solver-clue-item ${crosswordState.activeClueNumber === parseInt(number) &&
                    crosswordState.clueOrientation === "down"
                    ? "active"
                    : ""
                    }`}
                  onClick={() => {
                    const cellNumber = parseInt(number);
                    const startCell = findClueStartCell(cellNumber, "down");

                    // Find the first empty cell in the clue
                    const firstEmptyCell = findFirstEmptyCellInClue(cellNumber, "down");

                    // Use the first empty cell if available, otherwise use the start cell
                    navigateToClueAndCell(cellNumber, "down", firstEmptyCell || startCell);
                  }}
                >
                  <span className="solver-clue-number">{number}.</span> {text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrosswordSolver;
