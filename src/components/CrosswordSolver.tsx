import React, { useState, useEffect, useRef } from "react";
import CrosswordGrid from "./CrosswordGrid";
import { CrosswordState } from "../types";
import Modal from "./Modal";
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
  const [solution, setSolution] = useState<string[][] | null>(null);
  const [validatedCells, setValidatedCells] = useState<boolean[][] | null>(null);
  const [revealedCells, setRevealedCells] = useState<boolean[][] | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [showCondensedView, setShowCondensedView] = useState(false);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);

  // Use a ref to track if we've already loaded from localStorage
  const hasLoadedFromStorage = useRef(false);

  // Refs for clue list containers
  const acrossClueListRef = useRef<HTMLDivElement>(null);
  const downClueListRef = useRef<HTMLDivElement>(null);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  const actionsToggleRef = useRef<HTMLButtonElement>(null);

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isActionsMenuOpen &&
        actionsMenuRef.current &&
        actionsToggleRef.current &&
        !actionsMenuRef.current.contains(event.target as Node) &&
        !actionsToggleRef.current.contains(event.target as Node)) {
        setIsActionsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isActionsMenuOpen]);

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
        const { dimensions, puzzle: ipuzPuzzle, clues, solution: ipuzSolution } = ipuzData;
        const { width, height } = dimensions;

        // Create grid and letters arrays
        const grid: boolean[][] = Array(height)
          .fill(0)
          .map(() => Array(width).fill(false));
        const letters: string[][] = Array(height)
          .fill(0)
          .map(() => Array(width).fill(""));

        // Initialize solution array if available
        let solutionArray: string[][] | null = null;
        if (ipuzSolution) {
          solutionArray = Array(height)
            .fill(0)
            .map(() => Array(width).fill(""));

          // Process the solution data
          for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
              const cell = ipuzSolution[row][col];
              if (cell && cell !== "#" && cell !== null) {
                solutionArray[row][col] = cell;
              }
            }
          }
          setSolution(solutionArray);
        }

        // Initialize validated and revealed cells arrays
        const validatedCellsArray = Array(height)
          .fill(0)
          .map(() => Array(width).fill(false));
        const revealedCellsArray = Array(height)
          .fill(0)
          .map(() => Array(width).fill(false));

        setValidatedCells(validatedCellsArray);
        setRevealedCells(revealedCellsArray);

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

  // Scroll to active clue when it changes
  useEffect(() => {
    if (!crosswordState || !crosswordState.activeClueNumber) return;

    // Find the active clue element
    const clueId = `${crosswordState.clueOrientation}-${crosswordState.activeClueNumber}`;
    const activeClueElement = document.getElementById(clueId);

    if (activeClueElement) {
      // Get the appropriate clue list container
      const clueListRef = crosswordState.clueOrientation === 'across'
        ? acrossClueListRef.current
        : downClueListRef.current;

      if (clueListRef) {
        // Scroll the clue into view at the top of the container
        activeClueElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  }, [crosswordState?.activeClueNumber, crosswordState?.clueOrientation]);

  // Add a useEffect hook to log state changes
  useEffect(() => {
    if (crosswordState) {
      // State changes are now tracked without console logs
    }
  }, [crosswordState]);

  // Add a useEffect to check screen size and update the view mode
  useEffect(() => {
    const handleResize = () => {
      setShowCondensedView(window.innerWidth < 768);
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleLetterChange = (row: number, col: number, letter: string) => {
    if (crosswordState) {
      // Don't allow changes to validated or revealed cells
      if (
        (validatedCells && validatedCells[row] && validatedCells[row][col]) ||
        (revealedCells && revealedCells[row] && revealedCells[row][col])
      ) {
        return;
      }

      const newLetters = [...crosswordState.letters];

      // Check if this is a backspace operation (empty string)
      if (letter === "") {
        // If the current cell is empty, move back one cell and delete that letter
        if (!newLetters[row][col]) {
          // Find the previous cell in the current word
          const prevCell = findPreviousCellInWord(row, col, crosswordState.clueOrientation);

          if (prevCell) {
            const [prevRow, prevCol] = prevCell;
            // Don't allow changes to validated or revealed cells
            if (
              (validatedCells && validatedCells[prevRow] && validatedCells[prevRow][prevCol]) ||
              (revealedCells && revealedCells[prevRow] && revealedCells[prevRow][prevCol])
            ) {
              return;
            }
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

        // Check if the puzzle is completely filled after this letter input
        const isFilled = isPuzzleFilled();
        if (isFilled) {
          // If the puzzle is filled, check if all answers are correct
          const allCorrect = areAllAnswersCorrect();
          if (allCorrect) {
            setShowSuccessModal(true);
            setShowConfetti(true);
            setHasCompleted(true);
          } else {
            setShowErrorModal(true);
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

      // Check if we're clicking the active cell
      if (crosswordState.activeCell &&
        crosswordState.activeCell[0] === row &&
        crosswordState.activeCell[1] === col) {
        // Toggle between across and down
        const newOrientation = crosswordState.clueOrientation === "across" ? "down" : "across";
        handleClueOrientationChange(newOrientation);
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

  // Function to check a single answer
  const checkAnswer = () => {
    if (!crosswordState || !solution) return;

    const newValidatedCells = validatedCells ? validatedCells.map(row => [...row]) : Array(crosswordState.rows).fill(0).map(() => Array(crosswordState.columns).fill(false));
    const newLetters = [...crosswordState.letters];

    // Check the current word
    if (crosswordState.activeClueNumber && crosswordState.activeCell) {
      const [row, col] = crosswordState.activeCell;
      const orientation = crosswordState.clueOrientation;

      // Find the start of the current word
      const [startRow, startCol] = findWordStart(
        crosswordState.grid,
        row,
        col,
        orientation === "across"
      );

      // Check each cell in the word
      if (orientation === "across") {
        for (let c = startCol; c < crosswordState.columns; c++) {
          if (crosswordState.grid[startRow][c]) break; // Stop at black cell

          const isCorrect = newLetters[startRow][c].toUpperCase() === solution[startRow][c].toUpperCase();
          if (isCorrect) {
            newValidatedCells[startRow][c] = true;
          }
        }
      } else {
        for (let r = startRow; r < crosswordState.rows; r++) {
          if (crosswordState.grid[r][startCol]) break; // Stop at black cell

          const isCorrect = newLetters[r][startCol].toUpperCase() === solution[r][startCol].toUpperCase();
          if (isCorrect) {
            newValidatedCells[r][startCol] = true;
          }
        }
      }
    }

    setValidatedCells(newValidatedCells);
  };

  // Function to check the entire puzzle
  const checkPuzzle = () => {
    if (!crosswordState || !solution) return;

    const newValidatedCells = validatedCells ? validatedCells.map(row => [...row]) : Array(crosswordState.rows).fill(0).map(() => Array(crosswordState.columns).fill(false));
    const newLetters = [...crosswordState.letters];

    // Check all cells in the puzzle
    for (let row = 0; row < crosswordState.rows; row++) {
      for (let col = 0; col < crosswordState.columns; col++) {
        if (!crosswordState.grid[row][col] && newLetters[row][col]) {
          const isCorrect = newLetters[row][col].toUpperCase() === solution[row][col].toUpperCase();
          if (isCorrect) {
            newValidatedCells[row][col] = true;
          }
        }
      }
    }

    setValidatedCells(newValidatedCells);
  };

  // Function to reveal a single answer
  const revealAnswer = () => {
    if (!crosswordState || !solution) return;

    const newRevealedCells = [...revealedCells!];
    const newValidatedCells = [...validatedCells!];
    const newLetters = [...crosswordState.letters];

    // Reveal the current word
    if (crosswordState.activeClueNumber && crosswordState.activeCell) {
      const [row, col] = crosswordState.activeCell;
      const orientation = crosswordState.clueOrientation;

      // Find the start of the current word
      const [startRow, startCol] = findWordStart(
        crosswordState.grid,
        row,
        col,
        orientation === "across"
      );

      // Reveal each cell in the word
      if (orientation === "across") {
        for (let c = startCol; c < crosswordState.columns; c++) {
          if (crosswordState.grid[startRow][c]) break; // Stop at black cell

          // Check if the cell already had the correct letter
          const wasCorrect = crosswordState.letters[startRow][c] &&
            crosswordState.letters[startRow][c].toUpperCase() === solution[startRow][c].toUpperCase();

          // Always set the letter to the solution letter
          newLetters[startRow][c] = solution[startRow][c];
          // Always mark as revealed
          newRevealedCells[startRow][c] = true;

          // Only mark as validated if it was already correct
          if (wasCorrect) {
            newValidatedCells[startRow][c] = true;
          }
        }
      } else {
        for (let r = startRow; r < crosswordState.rows; r++) {
          if (crosswordState.grid[r][startCol]) break; // Stop at black cell

          // Check if the cell already had the correct letter
          const wasCorrect = crosswordState.letters[r][startCol] &&
            crosswordState.letters[r][startCol].toUpperCase() === solution[r][startCol].toUpperCase();

          // Always set the letter to the solution letter
          newLetters[r][startCol] = solution[r][startCol];
          // Always mark as revealed
          newRevealedCells[r][startCol] = true;

          // Only mark as validated if it was already correct
          if (wasCorrect) {
            newValidatedCells[r][startCol] = true;
          }
        }
      }
    }

    setRevealedCells(newRevealedCells);
    setValidatedCells(newValidatedCells);
    setCrosswordState({
      ...crosswordState,
      letters: newLetters,
    });
  };

  // Function to reveal the entire puzzle
  const revealPuzzle = () => {
    if (!crosswordState || !solution) return;

    const newRevealedCells = [...revealedCells!];
    const newValidatedCells = [...validatedCells!];
    const newLetters = [...crosswordState.letters];

    // Reveal all cells in the puzzle
    for (let row = 0; row < crosswordState.rows; row++) {
      for (let col = 0; col < crosswordState.columns; col++) {
        if (!crosswordState.grid[row][col]) {
          // Check if the cell already had the correct letter
          const wasCorrect = crosswordState.letters[row][col] &&
            crosswordState.letters[row][col].toUpperCase() === solution[row][col].toUpperCase();

          // Always set the letter to the solution letter
          newLetters[row][col] = solution[row][col];
          // Always mark as revealed
          newRevealedCells[row][col] = true;

          // Only mark as validated if it was already correct
          if (wasCorrect) {
            newValidatedCells[row][col] = true;
          }
        }
      }
    }

    setRevealedCells(newRevealedCells);
    setValidatedCells(newValidatedCells);
    setCrosswordState({
      ...crosswordState,
      letters: newLetters,
    });
  };

  // Function to check if the puzzle is completely filled
  const isPuzzleFilled = () => {
    if (!crosswordState) return false;

    for (let row = 0; row < crosswordState.rows; row++) {
      for (let col = 0; col < crosswordState.columns; col++) {
        if (!crosswordState.grid[row][col] && !crosswordState.letters[row][col]) {
          return false;
        }
      }
    }
    return true;
  };

  // Function to check if all answers are correct
  const areAllAnswersCorrect = () => {
    if (!crosswordState || !solution) return false;

    for (let row = 0; row < crosswordState.rows; row++) {
      for (let col = 0; col < crosswordState.columns; col++) {
        if (!crosswordState.grid[row][col]) {
          const currentLetter = crosswordState.letters[row][col].toUpperCase();
          const solutionLetter = solution[row][col].toUpperCase();
          if (currentLetter !== solutionLetter) {
            return false;
          }
        }
      }
    }
    return true;
  };

  // Function to get the active clue text
  const getActiveClueText = (orientation: "across" | "down") => {
    if (!crosswordState || !crosswordState.activeClueNumber) return null;

    const clueNumber = crosswordState.activeClueNumber;
    return crosswordState.clues[orientation === "across" ? "Across" : "Down"][clueNumber];
  };

  // Function to get the first clue from each orientation
  const getFirstClueFromOrientation = (orientation: "across" | "down") => {
    if (!crosswordState) return null;

    const clues = orientation === "across" ? crosswordState.clues.Across : crosswordState.clues.Down;
    const firstClueNumber = Object.keys(clues)[0];

    if (!firstClueNumber) return null;

    return {
      number: parseInt(firstClueNumber),
      text: clues[parseInt(firstClueNumber)]
    };
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
      {showConfetti && (
        <div className="confetti-container">
          <div className="confetti"></div>
          <div className="confetti"></div>
          <div className="confetti"></div>
          <div className="confetti"></div>
          <div className="confetti"></div>
          <div className="confetti"></div>
          <div className="confetti"></div>
          <div className="confetti"></div>
          <div className="confetti"></div>
          <div className="confetti"></div>
          <div className="confetti"></div>
          <div className="confetti"></div>
          <div className="confetti"></div>
          <div className="confetti"></div>
          <div className="confetti"></div>
          <div className="confetti"></div>
          <div className="confetti"></div>
          <div className="confetti"></div>
          <div className="confetti"></div>
          <div className="confetti"></div>
        </div>
      )}
      <div className="solver-content">
        <div className="solver-grid-container" id="crossword-grid-container">
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
            validatedCells={validatedCells}
            revealedCells={revealedCells}
          />
        </div>

        {!showCondensedView && (
          <div className="solver-clues-container">
            <div className="solver-clue-section">
              <h3>Across</h3>
              <div className="solver-clue-list" ref={acrossClueListRef}>
                {Object.entries(crosswordState.clues.Across).map(
                  ([number, text]) => (
                    <div
                      key={`across-${number}`}
                      id={`across-${number}`}
                      className={`solver-clue-item ${crosswordState.activeClueNumber === parseInt(number) &&
                        crosswordState.clueOrientation === "across"
                        ? "active"
                        : ""
                        }`}
                      onClick={(e) => {
                        e.preventDefault();
                        const cellNumber = parseInt(number);
                        const startCell = findClueStartCell(cellNumber, "across");

                        // Find the first empty cell in the clue
                        const firstEmptyCell = findFirstEmptyCellInClue(cellNumber, "across");

                        // Use the first empty cell if available, otherwise use the start cell
                        navigateToClueAndCell(cellNumber, "across", firstEmptyCell || startCell);
                      }}
                      onFocus={(e) => {
                        // Prevent default focus behavior that might cause zooming
                        e.preventDefault();
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
              <div className="solver-clue-list" ref={downClueListRef}>
                {Object.entries(crosswordState.clues.Down).map(([number, text]) => (
                  <div
                    key={`down-${number}`}
                    id={`down-${number}`}
                    className={`solver-clue-item ${crosswordState.activeClueNumber === parseInt(number) &&
                      crosswordState.clueOrientation === "down"
                      ? "active"
                      : ""
                      }`}
                    onClick={(e) => {
                      e.preventDefault();
                      const cellNumber = parseInt(number);
                      const startCell = findClueStartCell(cellNumber, "down");

                      // Find the first empty cell in the clue
                      const firstEmptyCell = findFirstEmptyCellInClue(cellNumber, "down");

                      // Use the first empty cell if available, otherwise use the start cell
                      navigateToClueAndCell(cellNumber, "down", firstEmptyCell || startCell);
                    }}
                    onFocus={(e) => {
                      // Prevent default focus behavior that might cause zooming
                      e.preventDefault();
                    }}
                  >
                    <span className="solver-clue-number">{number}.</span> {text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {showCondensedView && (
        <div className="solver-footer">
          <div className="solver-actions">
            <button
              ref={actionsToggleRef}
              className="solver-actions-toggle"
              onClick={() => setIsActionsMenuOpen(!isActionsMenuOpen)}
              aria-label="Toggle puzzle actions"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8l-8.2-1.8c-.8-.2-1.6.3-1.8 1.1v0c-.1.4 0 .8.3 1.1l5.3 5.3L3 19.2c-.1.7.4 1.3 1.1 1.4h.2c.3 0 .6-.1.8-.3l5.3-5.3 5.3 5.3c.2.2.5.3.8.3h.2c.7-.1 1.2-.7 1.1-1.4z" />
              </svg>
            </button>
            <div
              ref={actionsMenuRef}
              className={`solver-actions-menu ${isActionsMenuOpen ? 'open' : ''}`}
            >
              <button
                className="solver-action-button"
                onClick={() => {
                  checkAnswer();
                  setIsActionsMenuOpen(false);
                }}
                disabled={!crosswordState.activeClueNumber || hasCompleted}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Check Answer
              </button>
              <button
                className="solver-action-button"
                onClick={() => {
                  checkPuzzle();
                  setIsActionsMenuOpen(false);
                }}
                disabled={hasCompleted}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                  <polyline points="21 3 21 8 16 8" />
                </svg>
                Check Puzzle
              </button>
              <button
                className="solver-action-button"
                onClick={() => {
                  revealAnswer();
                  setIsActionsMenuOpen(false);
                }}
                disabled={!crosswordState.activeClueNumber || hasCompleted}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Reveal Answer
              </button>
              <button
                className="solver-action-button"
                onClick={() => {
                  revealPuzzle();
                  setIsActionsMenuOpen(false);
                }}
                disabled={hasCompleted}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                  <line x1="15" y1="3" x2="15" y2="21" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="3" y1="15" x2="21" y2="15" />
                </svg>
                Reveal Puzzle
              </button>
            </div>
          </div>
          <div className="solver-clues-container">
            <div className="solver-clue-section">
              <div className="solver-clue-list">
                {crosswordState.activeClueNumber ? (
                  <>
                    {crosswordState.clueOrientation === "across" && (
                      <div className="solver-clue-item active" data-orientation="across">
                        <span className="solver-clue-number">{crosswordState.activeClueNumber}.</span>{" "}
                        {getActiveClueText("across")}
                      </div>
                    )}
                    {crosswordState.clueOrientation === "down" && (
                      <div className="solver-clue-item active" data-orientation="down">
                        <span className="solver-clue-number">{crosswordState.activeClueNumber}.</span>{" "}
                        {getActiveClueText("down")}
                      </div>
                    )}
                  </>
                ) : (
                  // Show first clue from each orientation if no active clue
                  <>
                    {(() => {
                      const firstAcrossClue = getFirstClueFromOrientation("across");
                      const firstDownClue = getFirstClueFromOrientation("down");

                      return (
                        <>
                          {firstAcrossClue && (
                            <div className="solver-clue-item" data-orientation="across">
                              <span className="solver-clue-number">{firstAcrossClue.number}.</span>{" "}
                              {firstAcrossClue.text}
                            </div>
                          )}
                          {firstDownClue && (
                            <div className="solver-clue-item" data-orientation="down">
                              <span className="solver-clue-number">{firstDownClue.number}.</span>{" "}
                              {firstDownClue.text}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!showCondensedView && (
        <div className="solver-actions">
          <button
            className="solver-action-button"
            onClick={checkAnswer}
            disabled={!crosswordState.activeClueNumber || hasCompleted}
          >
            Check Answer
          </button>
          <button
            className="solver-action-button"
            onClick={checkPuzzle}
            disabled={hasCompleted}
          >
            Check Puzzle
          </button>
          <button
            className="solver-action-button"
            onClick={revealAnswer}
            disabled={!crosswordState.activeClueNumber || hasCompleted}
          >
            Reveal Answer
          </button>
          <button
            className="solver-action-button"
            onClick={revealPuzzle}
            disabled={hasCompleted}
          >
            Reveal Puzzle
          </button>
        </div>
      )}

      <Modal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
        }}
        title="Congratulations! 🎉"
        message="You've successfully completed the crossword puzzle! All your answers are correct."
        type="success"
      />

      <Modal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Not Quite Right"
        message="The puzzle is filled, but some answers are incorrect. Keep solving!"
        type="error"
      />
    </div>
  );
};

export default CrosswordSolver;
