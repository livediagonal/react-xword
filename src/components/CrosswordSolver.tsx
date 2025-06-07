import React, { useState, useEffect, useRef } from "react";
import CrosswordGrid from "./CrosswordGrid";
import { CrosswordState } from "../types/crossword";
import { IPuzPuzzle } from "../types/ipuz";
import Modal from "./Modal";
import "../styles/CrosswordSolver.css";
import VirtualKeyboard from "./VirtualKeyboard";
import Toast from "./Toast";

interface CrosswordSolverProps {
  /** The puzzle data in IPuz format */
  ipuzData: IPuzPuzzle;
  /** 
   * Optional callback function that will be called when the puzzle is completed.
   * This fires when the puzzle is solved and the success modal is about to be shown.
   * The callback receives the completion time in seconds.
   */
  onComplete?: (completionTime: number) => void;
  /**
   * Optional React elements to display in the left side of the actions bar.
   * These elements will be displayed opposite the timer and actions buttons.
   */
  leftNavElements?: React.ReactNode;
  /**
   * Optional callback function that will be called when the user starts the puzzle (dismisses the splash modal).
   */
  onStart?: () => void;
  /**
   * If true, the puzzle is shown as completed and locked (no further editing, all answers revealed, timer stopped, and success modal shown).
   */
  isComplete?: boolean;

  /**
   * If true, the reveal buttons will not be shown.
   */
  hideRevealButtons?: boolean;

  /**
   * The title to display in the splash modal.
   */
  splashTitle?: string | React.ReactNode;

  /**
   * The description to display in the splash modal.
   */
  splashDescription?: string | React.ReactNode;
}

const CrosswordSolver: React.FC<CrosswordSolverProps> = ({
  ipuzData,
  onComplete,
  leftNavElements,
  onStart,
  isComplete,
  hideRevealButtons,
  splashTitle,
  splashDescription,
}) => {
  const [grid, setGrid] = useState<boolean[][]>([]);
  const [letters, setLetters] = useState<string[][]>([]);
  const [solution, setSolution] = useState<string[][] | null>(null);
  const [validatedCells, setValidatedCells] = useState<(boolean | undefined)[][] | null>(null);
  const [revealedCells, setRevealedCells] = useState<boolean[][]>([]);
  const [clueNumbers, setClueNumbers] = useState<number[][]>([]);
  const [activeCell, setActiveCell] = useState<[number, number] | null>(null);
  const [activeClueNumber, setActiveClueNumber] = useState<number | null>(null);
  const [activeOrientation, setActiveOrientation] = useState<"across" | "down">("across");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [showSplashModal, setShowSplashModal] = useState(true);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const [useMobileKeyboard, setUseMobileKeyboard] = useState(false);
  const [crosswordState, setCrosswordState] = useState<CrosswordState | null>(null);
  const [timer, setTimer] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Refs for clue list containers
  const acrossClueListRef = useRef<HTMLDivElement>(null);
  const downClueListRef = useRef<HTMLDivElement>(null);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  const actionsToggleRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Function to handle touchmove events
  const handleTouchMove = (e: React.TouchEvent) => {
    // Prevent default touchmove behavior to stop unwanted scrolling
    e.preventDefault();
  };

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        actionsMenuRef.current &&
        actionsToggleRef.current &&
        !actionsMenuRef.current.contains(event.target as Node) &&
        !actionsToggleRef.current.contains(event.target as Node)
      ) {
        setIsActionsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Detect mobile devices on mount and set keyboard mode
  useEffect(() => {
    const isMobile = window.innerWidth <= 767;
    setUseMobileKeyboard(isMobile);

    // Add meta viewport tag to prevent zooming
    const existingViewport = document.querySelector('meta[name="viewport"]');
    if (existingViewport) {
      existingViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    } else {
      const viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.getElementsByTagName('head')[0].appendChild(viewportMeta);
    }
  }, []);

  // Timer effect
  useEffect(() => {
    if (isTimerRunning) {
      startTimeRef.current = Date.now() - (timer * 1000); // Account for existing time
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - (startTimeRef.current || 0)) / 1000);
        setTimer(elapsed);
      }, 100);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      startTimeRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning, timer]);

  // Format time as M:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Helper function to find the first valid cell in the grid
  function findFirstValidCell(grid: boolean[][]): [number, number] {
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        if (!grid[row][col]) {
          return [row, col];
        }
      }
    }
    return [0, 0]; // Fallback to first cell if no white cells found
  }

  // Load puzzle data only once when component mounts
  useEffect(() => {
    const loadPuzzle = async () => {
      try {
        setLoading(true);
        const { dimensions, puzzle, solution: ipuzSolution, clues } = ipuzData;
        const { width, height } = dimensions;

        // Convert puzzle grid to boolean array
        const grid = puzzle.map(row =>
          row.map(cell => {
            // Black squares are represented by '#'
            if (cell === '#') {
              return true;
            }
            // Everything else (including 0, null, and cells with numbers) is a white square
            return false;
          })
        );

        // Process the solution data
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
        } else {
          // If no solution is provided, create an empty solution array
          solutionArray = Array(height)
            .fill(0)
            .map(() => Array(width).fill(""));
        }

        // Set the solution
        setSolution(solutionArray);

        // Initialize validated and revealed cells arrays
        const validatedCellsArray = Array(height)
          .fill(0)
          .map(() => Array(width).fill(undefined));
        setValidatedCells(validatedCellsArray);

        const revealedCellsArray = Array(height)
          .fill(0)
          .map(() => Array(width).fill(false));
        setRevealedCells(revealedCellsArray);

        // Calculate clue numbers
        const clueNumbers = calculateClueNumbers(grid);
        setClueNumbers(clueNumbers);

        // Set the grid
        setGrid(grid);

        // Initialize letters array
        setLetters(Array(height)
          .fill(0)
          .map(() => Array(width).fill("")));

        // Find the first valid cell and set it as active
        const firstCell = findFirstValidCell(grid);
        if (firstCell) {
          setActiveCell(firstCell);
        }

        // Set the first clue as active
        const firstAcrossClue = clues.Across[0]?.[0] ?? null;
        const firstDownClue = clues.Down[0]?.[0] ?? null;
        if (firstAcrossClue) {
          setActiveClueNumber(firstAcrossClue);
          setActiveOrientation("across");
        } else if (firstDownClue) {
          setActiveClueNumber(firstDownClue);
          setActiveOrientation("down");
        }

        // Process clues
        const processedClues = {
          Across: {} as { [key: number]: string },
          Down: {} as { [key: number]: string },
        };

        if (clues && clues.Across) {
          clues.Across.forEach(([number, clue]) => {
            processedClues.Across[number] = clue;
          });
        }

        if (clues && clues.Down) {
          clues.Down.forEach(([number, clue]) => {
            processedClues.Down[number] = clue;
          });
        }

        // Initialize the crossword state
        const initialState: CrosswordState = {
          rows: height,
          columns: width,
          grid,
          letters: Array(height)
            .fill(0)
            .map(() => Array(width).fill("")),
          validatedCells: null,
          clueOrientation: "across",
          activeClueNumber: clues.Across[0]?.[0] ?? 1,
          activeCell: firstCell,
          clues: processedClues,
          clueText: "",
          isAutomaticNavigation: true,
        };

        // Set the state once with all the data
        setCrosswordState(initialState);
        setLoading(false);

        // Use requestAnimationFrame to ensure this runs after the grid is fully rendered
        requestAnimationFrame(() => {
          if (initialState.activeCell) {
            const [row, col] = initialState.activeCell;
            // Add a small delay to ensure the grid is fully rendered before focusing
            setTimeout(() => {
              const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`) as HTMLElement;
              if (cellElement) {
                cellElement.focus();
              }
            }, 0);
          }
        });
      } catch (error) {
        console.error("Error loading puzzle:", error);
        setError(error instanceof Error ? error.message : "Unknown error");
        setLoading(false);
      }
    };

    loadPuzzle();
  }, [ipuzData]);

  // Scroll to active clue when it changes, but only for desktop
  useEffect(() => {
    // Don't scroll on mobile devices to maintain fixed position UI
    if (window.innerWidth <= 767) return;

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
        // Instead of using scrollIntoView which might scroll the whole page,
        // manually scroll only the clue list container
        const containerRect = clueListRef.getBoundingClientRect();
        const elementRect = activeClueElement.getBoundingClientRect();

        // Calculate the scroll position to bring the element into view within its container
        const relativeTop = elementRect.top - containerRect.top;
        const relativeBottom = elementRect.bottom - containerRect.top;

        if (relativeTop < 0) {
          // Element is above the visible area of the container
          clueListRef.scrollBy({ top: relativeTop, behavior: 'smooth' });
        } else if (relativeBottom > containerRect.height) {
          // Element is below the visible area of the container
          clueListRef.scrollBy({ top: relativeBottom - containerRect.height, behavior: 'smooth' });
        }
      }
    }
  }, [crosswordState?.activeClueNumber, crosswordState?.clueOrientation]);

  // Add effect to handle clue highlighting when active clue changes
  useEffect(() => {
    if (!crosswordState) return;

    const activeClueEl = document.querySelector('.solver-active-clue');
    if (!activeClueEl) return;

    // Add clue-changed class
    activeClueEl.classList.add('clue-changed');

    // Remove the class after animation completes
    const timeout = setTimeout(() => {
      activeClueEl.classList.remove('clue-changed');
    }, 1000);

    return () => clearTimeout(timeout);
  }, [crosswordState?.activeClueNumber, crosswordState?.clueOrientation]);

  const handleLetterChange = (row: number, col: number, letter: string) => {
    if (crosswordState) {
      // Don't allow changes to revealed cells or cells that were validated as correct
      if (
        (revealedCells && revealedCells[row] && revealedCells[row][col]) ||
        (validatedCells && validatedCells[row] && validatedCells[row][col] === true)
      ) {
        return;
      }

      const newLetters = [...crosswordState.letters];
      const wasEmpty = !crosswordState.letters[row][col];
      newLetters[row][col] = letter;

      // Clear validation state for this cell
      const newValidatedCells = validatedCells ? validatedCells.map(row => [...row]) : Array(crosswordState.rows).fill(0).map(() => Array(crosswordState.columns).fill(undefined));
      newValidatedCells[row][col] = undefined;

      if (letter) {
        // Find the start of the current word
        const [startRow, startCol] = findWordStart(
          crosswordState.grid,
          row,
          col,
          crosswordState.clueOrientation === "across"
        );

        // Check if the current word is complete and find the next empty cell
        let isCurrentWordComplete = true;
        let nextEmptyCell: [number, number] | null = null;
        let foundCurrentCell = false;
        let emptyCellCount = 0;
        let wordCells: [number, number][] = [];
        let currentCellIndex = -1;

        if (crosswordState.clueOrientation === "across") {
          for (let c = startCol; c < crosswordState.columns; c++) {
            if (crosswordState.grid[startRow][c]) break;
            wordCells.push([startRow, c]);
            if (!newLetters[startRow][c]) {
              isCurrentWordComplete = false;
              emptyCellCount++;
              if (foundCurrentCell) {
                nextEmptyCell = [startRow, c];
                break;
              }
            }
            if (startRow === row && c === col) {
              foundCurrentCell = true;
              currentCellIndex = wordCells.length - 1;
            }
          }
          if (!nextEmptyCell) {
            for (let c = startCol; c < col; c++) {
              if (crosswordState.grid[startRow][c]) break;
              if (!newLetters[startRow][c]) {
                nextEmptyCell = [startRow, c];
                break;
              }
            }
          }
        } else {
          for (let r = startRow; r < crosswordState.rows; r++) {
            if (crosswordState.grid[r][startCol]) break;
            wordCells.push([r, startCol]);
            if (!newLetters[r][startCol]) {
              isCurrentWordComplete = false;
              emptyCellCount++;
              if (foundCurrentCell) {
                nextEmptyCell = [r, startCol];
                break;
              }
            }
            if (r === row && startCol === col) {
              foundCurrentCell = true;
              currentCellIndex = wordCells.length - 1;
            }
          }
          if (!nextEmptyCell) {
            for (let r = startRow; r < row; r++) {
              if (crosswordState.grid[r][startCol]) break;
              if (!newLetters[r][startCol]) {
                nextEmptyCell = [r, startCol];
                break;
              }
            }
          }
        }

        // If the word is now complete (no empty cells), advance to the next clue
        if (isCurrentWordComplete) {
          setCrosswordState({
            ...crosswordState,
            letters: newLetters,
            activeCell: [row, col],
            isAutomaticNavigation: true
          });
          setValidatedCells(newValidatedCells);

          // Check if the puzzle is complete
          const isComplete = isPuzzleFilled();
          if (isComplete) {
            const allCorrect = areAllAnswersCorrect();
            if (allCorrect) {
              handlePuzzleCompletion();
            } else {
              setShowErrorToast(true);
            }
          }

          // Always advance to the next clue when the word is complete
          handleNextClue();
          return;
        }

        // If not complete and replacing a letter, move to the next cell in the word
        if (!wasEmpty) {
          let nextCell: [number, number] | null = null;
          if (currentCellIndex !== -1 && currentCellIndex < wordCells.length - 1) {
            nextCell = wordCells[currentCellIndex + 1];
          }
          setCrosswordState({
            ...crosswordState,
            letters: newLetters,
            activeCell: nextCell || [row, col],
            isAutomaticNavigation: !!nextCell
          });
          setValidatedCells(newValidatedCells);
          return;
        }

        // If not complete and just filled an empty cell, jump cyclically to the next empty cell
        if (nextEmptyCell) {
          setCrosswordState({
            ...crosswordState,
            letters: newLetters,
            activeCell: nextEmptyCell,
            isAutomaticNavigation: true
          });
          setValidatedCells(newValidatedCells);
          return;
        }

        // Fallback: stay in current cell
        setCrosswordState({
          ...crosswordState,
          letters: newLetters,
          activeCell: [row, col],
          isAutomaticNavigation: false
        });
        setValidatedCells(newValidatedCells);
      } else {
        // If deleting (letter is empty)
        const currentCellIsEmpty = !crosswordState.letters[row][col];

        if (currentCellIsEmpty) {
          // If the current cell was already empty, move to previous cell
          const prevCell = findPreviousCellInWord(row, col, crosswordState.clueOrientation);

          setCrosswordState({
            ...crosswordState,
            letters: newLetters,
            activeCell: prevCell || [row, col],
            isAutomaticNavigation: !!prevCell
          });
          setValidatedCells(newValidatedCells);

          if (prevCell) {
            const clueNumbers = calculateClueNumbers(crosswordState.grid);
            const [prevRow, prevCol] = prevCell;
            const clueNumber = clueNumbers[prevRow][prevCol];

            if (clueNumber) {
              navigateToClueAndCell(
                crosswordState.activeClueNumber || clueNumber,
                crosswordState.clueOrientation,
                prevCell
              );
            }
          }
        } else {
          // If the current cell had a letter, just clear it and stay in the current cell
          setCrosswordState({
            ...crosswordState,
            letters: newLetters
          });
          setValidatedCells(newValidatedCells);
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

    // If we're at the last clue, return null to indicate we should switch orientations
    if (currentIndex === clueNumberList.length - 1) {
      return null;
    }

    // Return the next clue number
    return clueNumberList[currentIndex + 1];
  };

  // Helper function to find the previous clue number in the current orientation
  const findPreviousClueNumber = (
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
      const isActiveCell = crosswordState.activeCell &&
        crosswordState.activeCell[0] === row &&
        crosswordState.activeCell[1] === col;

      if (isActiveCell) {
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
      let newOrientation = crosswordState.clueOrientation;
      let newClueNumber: number | null = null;

      if (crosswordState.clueOrientation === "across" && horizontalClueNumber > 0) {
        newClueNumber = horizontalClueNumber;
      } else if (crosswordState.clueOrientation === "down" && verticalClueNumber > 0) {
        newClueNumber = verticalClueNumber;
      } else if (horizontalClueNumber > 0) {
        newOrientation = "across";
        newClueNumber = horizontalClueNumber;
      } else if (verticalClueNumber > 0) {
        newOrientation = "down";
        newClueNumber = verticalClueNumber;
      } else {
        newClueNumber = null;
      }

      setCrosswordState({
        ...crosswordState,
        activeCell: [row, col] as [number, number],
        clueOrientation: newOrientation,
        activeClueNumber: newClueNumber,
      });
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
        isAutomaticNavigation: true, // Mark this as automatic navigation
      };

      // Update the state directly
      setCrosswordState(newState);

      // Reset the automatic navigation flag after a short delay
      setTimeout(() => {
        setCrosswordState(prevState => {
          if (!prevState) return prevState;
          return {
            ...prevState,
            isAutomaticNavigation: false,
          };
        });
      }, 100);
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
    console.log('checkAnswer called');
    if (!crosswordState || !solution) {
      console.log('Missing state or solution:', { crosswordState, solution });
      return;
    }

    const newValidatedCells = validatedCells ? validatedCells.map(row => [...row]) : Array(crosswordState.rows).fill(0).map(() => Array(crosswordState.columns).fill(undefined));
    const newLetters = [...crosswordState.letters];

    // Check the current word
    if (crosswordState.activeClueNumber && crosswordState.activeCell) {
      const [row, col] = crosswordState.activeCell;
      const orientation = crosswordState.clueOrientation;
      console.log('Checking word:', { row, col, orientation });

      // Find the start of the current word
      const [startRow, startCol] = findWordStart(
        crosswordState.grid,
        row,
        col,
        orientation === "across"
      );
      console.log('Word start:', { startRow, startCol });

      // Check each cell in the word
      if (orientation === "across") {
        for (let c = startCol; c < crosswordState.columns; c++) {
          if (crosswordState.grid[startRow][c]) break; // Stop at black cell

          const isCorrect = newLetters[startRow][c].toUpperCase() === solution[startRow][c].toUpperCase();
          console.log('Checking cell:', { row: startRow, col: c, letter: newLetters[startRow][c], solution: solution[startRow][c], isCorrect });
          // Mark the cell as validated (true if correct, false if incorrect)
          newValidatedCells[startRow][c] = isCorrect;
        }
      } else {
        for (let r = startRow; r < crosswordState.rows; r++) {
          if (crosswordState.grid[r][startCol]) break; // Stop at black cell

          const isCorrect = newLetters[r][startCol].toUpperCase() === solution[r][startCol].toUpperCase();
          console.log('Checking cell:', { row: r, col: startCol, letter: newLetters[r][startCol], solution: solution[r][startCol], isCorrect });
          // Mark the cell as validated (true if correct, false if incorrect)
          newValidatedCells[r][startCol] = isCorrect;
        }
      }
    }

    console.log('Setting validated cells:', newValidatedCells);
    setValidatedCells(newValidatedCells);
    setIsActionsMenuOpen(false); // Close the actions menu
  };

  // Function to check the entire puzzle
  const checkPuzzle = () => {
    if (!crosswordState || !solution) return;

    const newValidatedCells = validatedCells ? validatedCells.map(row => [...row]) : Array(crosswordState.rows).fill(0).map(() => Array(crosswordState.columns).fill(undefined));
    const newLetters = [...crosswordState.letters];

    // Check all cells in the puzzle
    for (let row = 0; row < crosswordState.rows; row++) {
      for (let col = 0; col < crosswordState.columns; col++) {
        if (!crosswordState.grid[row][col] && newLetters[row][col]) {
          const isCorrect = newLetters[row][col].toUpperCase() === solution[row][col].toUpperCase();
          // Mark the cell as validated (true if correct, false if incorrect)
          newValidatedCells[row][col] = isCorrect;
        }
      }
    }

    setValidatedCells(newValidatedCells);
    setIsActionsMenuOpen(false); // Close the actions menu
  };

  // Function to reveal a single answer
  const revealAnswer = () => {
    console.log('revealAnswer called');
    if (!crosswordState || !solution) {
      console.log('Missing state or solution:', { crosswordState, solution });
      return;
    }

    const newRevealedCells = revealedCells.map(row => [...row]);
    const newValidatedCells = validatedCells ? validatedCells.map(row => [...row]) : Array(crosswordState.rows).fill(0).map(() => Array(crosswordState.columns).fill(undefined));
    const newLetters = crosswordState.letters.map(row => [...row]);

    // Reveal the current word
    if (crosswordState.activeClueNumber && crosswordState.activeCell) {
      const [row, col] = crosswordState.activeCell;
      const orientation = crosswordState.clueOrientation;
      console.log('Revealing word:', { row, col, orientation });

      // Find the start of the current word
      const [startRow, startCol] = findWordStart(
        crosswordState.grid,
        row,
        col,
        orientation === "across"
      );
      console.log('Word start:', { startRow, startCol });

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
          console.log('Revealing cell:', { row: startRow, col: c, letter: newLetters[startRow][c], wasCorrect });
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
          console.log('Revealing cell:', { row: r, col: startCol, letter: newLetters[r][startCol], wasCorrect });
        }
      }
    }

    console.log('Setting revealed cells:', newRevealedCells);
    console.log('Setting validated cells:', newValidatedCells);
    console.log('Setting letters:', newLetters);
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

    const newRevealedCells = revealedCells.map(row => [...row]);
    const newValidatedCells = validatedCells ? validatedCells.map(row => [...row]) : Array(crosswordState.rows).fill(0).map(() => Array(crosswordState.columns).fill(undefined));
    const newLetters = crosswordState.letters.map(row => [...row]);

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

  // Updated function to handle key presses from virtual keyboard
  const handleVirtualKeyPress = (key: string) => {
    if (crosswordState && crosswordState.activeCell) {
      const [row, col] = crosswordState.activeCell;
      handleLetterChange(row, col, key);
    }
  };

  // Function to handle navigating to the next clue
  const handleNextClue = () => {
    if (!crosswordState) return;

    const currentClueNumber = crosswordState.activeClueNumber;
    const currentOrientation = crosswordState.clueOrientation;
    const visitedClues = new Set<number>();

    // Helper function to check if a clue has any empty cells
    const hasEmptyCells = (clueNumber: number, orientation: "across" | "down"): boolean => {
      const startCell = findClueStartCell(clueNumber, orientation);
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
      let nextClueNumber = findNextClueNumber(startClueNumber, orientation);

      // Keep track of visited clues to prevent infinite loops
      while (nextClueNumber && !visitedClues.has(nextClueNumber)) {
        visitedClues.add(nextClueNumber);
        if (hasEmptyCells(nextClueNumber, orientation)) {
          return nextClueNumber;
        }
        nextClueNumber = findNextClueNumber(nextClueNumber, orientation);
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
        const startCell = findClueStartCell(nextClueNumber, otherOrientation);
        const firstEmptyCell = findFirstEmptyCellInClue(nextClueNumber, otherOrientation);
        navigateToClueAndCell(nextClueNumber, otherOrientation, firstEmptyCell || startCell);
        return;
      }
    }

    // If we found a clue with empty cells in the current orientation
    if (nextClueNumber) {
      const startCell = findClueStartCell(nextClueNumber, currentOrientation);
      const firstEmptyCell = findFirstEmptyCellInClue(nextClueNumber, currentOrientation);
      navigateToClueAndCell(nextClueNumber, currentOrientation, firstEmptyCell || startCell);
      return;
    }

    // If no clues with empty cells found in either orientation, fall back to normal cycling
    nextClueNumber = findNextClueNumber(currentClueNumber, currentOrientation);

    if (nextClueNumber) {
      // Find the start cell for the next clue
      const startCell = findClueStartCell(nextClueNumber, currentOrientation);
      // Find the first empty cell in the next clue
      const firstEmptyCell = findFirstEmptyCellInClue(nextClueNumber, currentOrientation);
      // Navigate to the next clue
      navigateToClueAndCell(nextClueNumber, currentOrientation, firstEmptyCell || startCell);
    } else {
      // If we've reached the end of the current orientation's clues, switch to the other orientation
      const newOrientation = currentOrientation === "across" ? "down" : "across";
      const firstClueNumber = findNextClueNumber(null, newOrientation);

      if (firstClueNumber) {
        const startCell = findClueStartCell(firstClueNumber, newOrientation);
        const firstEmptyCell = findFirstEmptyCellInClue(firstClueNumber, newOrientation);
        navigateToClueAndCell(firstClueNumber, newOrientation, firstEmptyCell || startCell);
      }
    }
  };

  // Function to handle navigating to the previous clue
  const handlePrevClue = () => {
    if (!crosswordState) return;

    const currentClueNumber = crosswordState.activeClueNumber;
    const currentOrientation = crosswordState.clueOrientation;

    // Find the previous clue
    const prevClueNumber = findPreviousClueNumber(currentClueNumber, currentOrientation);

    if (prevClueNumber) {
      // Find the start cell for the previous clue
      const startCell = findClueStartCell(prevClueNumber, currentOrientation);
      // Find the first empty cell in the previous clue
      const firstEmptyCell = findFirstEmptyCellInClue(prevClueNumber, currentOrientation);
      // Navigate to the previous clue
      navigateToClueAndCell(prevClueNumber, currentOrientation, firstEmptyCell || startCell);
    } else {
      // If we're at the first clue, switch to the last clue of the other orientation
      const newOrientation = currentOrientation === "across" ? "down" : "across";
      const lastClueNumber = findPreviousClueNumber(null, newOrientation);

      if (lastClueNumber) {
        const startCell = findClueStartCell(lastClueNumber, newOrientation);
        const firstEmptyCell = findFirstEmptyCellInClue(lastClueNumber, newOrientation);
        navigateToClueAndCell(lastClueNumber, newOrientation, firstEmptyCell || startCell);
      }
    }
  };

  // Function to handle toggling the direction
  const handleToggleDirection = () => {
    if (crosswordState) {
      const newOrientation = crosswordState.clueOrientation === "across" ? "down" : "across";
      handleClueOrientationChange(newOrientation);
    }
  };

  // Function to handle puzzle completion
  const handlePuzzleCompletion = () => {
    setShowErrorToast(false);
    setShowConfetti(true);
    setHasCompleted(true);
    setIsTimerRunning(false);
    if (onComplete) {
      onComplete(timer);
    }
  };

  // Function to check if we have any metadata to show
  const hasMetadata = () => {
    const metadata = ipuzData.metadata;
    return metadata && (
      (metadata.title && metadata.title.trim() !== '') ||
      (metadata.author && metadata.author.trim() !== '') ||
      (metadata.notes && metadata.notes.trim() !== '')
    );
  };

  // Effect to handle isComplete prop
  useEffect(() => {
    if (isComplete && solution) {
      setIsTimerRunning(false);
      setHasCompleted(true);
      setShowSplashModal(false); // Hide splash modal if isComplete
      // Do NOT show success modal or confetti, and do NOT call onComplete here
      setCrosswordState(prevState => {
        if (!prevState) return prevState;
        const newLetters = solution.map(row => [...row]);
        return {
          ...prevState,
          letters: newLetters,
        };
      });
      setRevealedCells(prev =>
        prev && crosswordState
          ? crosswordState.grid.map(row => row.map(cell => !cell))
          : prev
      );
      setValidatedCells(prev =>
        prev && crosswordState
          ? crosswordState.grid.map(row => row.map(cell => !cell ? true : undefined))
          : prev
      );
    }
  }, [isComplete, solution]);

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
    <div className={`solver-container`} ref={containerRef}>
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
        {/* Only show clues list if not using the mobile keyboard */}
        {!useMobileKeyboard && (
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
                        const firstEmptyCell = findFirstEmptyCellInClue(cellNumber, "across");
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
                      const firstEmptyCell = findFirstEmptyCellInClue(cellNumber, "down");
                      navigateToClueAndCell(cellNumber, "down", firstEmptyCell || startCell);
                    }}
                  >
                    <span className="solver-clue-number">{number}.</span> {text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* Main area: actions, grid, keyboard */}
        <div className="solver-main-area">
          <div className="solver-actions">
            <div className="solver-actions-left">
              {leftNavElements}
            </div>
            <div className="solver-actions-group">
              <div className="solver-timer">{formatTime(timer)}</div>
              {hasMetadata() && (
                <button
                  className="solver-actions-toggle"
                  onClick={() => setShowInfoModal(true)}
                  aria-label="Show puzzle information"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                </button>
              )}
              <button
                ref={actionsToggleRef}
                className="solver-actions-toggle"
                onClick={() => setIsActionsMenuOpen(!isActionsMenuOpen)}
                aria-label="Toggle actions menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                </svg>
              </button>
            </div>
            <div ref={actionsMenuRef} className={`solver-actions-menu ${isActionsMenuOpen ? 'open' : ''}`}>
              <button
                className="solver-action-button"
                onClick={checkAnswer}
                disabled={!crosswordState?.activeClueNumber || hasCompleted || isComplete}
              >
                Check Answer
              </button>
              <button
                className="solver-action-button"
                onClick={checkPuzzle}
                disabled={hasCompleted || isComplete}
              >
                Check Puzzle
              </button>
              {!hideRevealButtons && (<><button
                className="solver-action-button"
                onClick={revealAnswer}
                disabled={!crosswordState?.activeClueNumber || hasCompleted || isComplete}
              >
                Reveal Answer
              </button>
                <button
                  className="solver-action-button"
                  onClick={revealPuzzle}
                  disabled={hasCompleted || isComplete}
                >
                  Reveal Puzzle
                </button></>)}
            </div>
          </div>

          {/* Grid with better touch handling */}
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
              useMobileKeyboard={useMobileKeyboard}
              disabled={hasCompleted || isComplete}
            />
          </div>

          {/* Virtual keyboard for mobile */}
          {useMobileKeyboard && (
            <VirtualKeyboard
              onKeyPress={handleVirtualKeyPress}
              onToggleDirection={handleToggleDirection}
              onNextClue={handleNextClue}
              onPrevClue={handlePrevClue}
              currentDirection={crosswordState?.clueOrientation}
              activeClueNumber={crosswordState?.activeClueNumber}
              activeClueText={crosswordState?.activeClueNumber ? getActiveClueText(crosswordState.clueOrientation) : null}
            />
          )}
        </div>
      </div>

      {/* Toast notification for incorrect puzzle */}
      <Toast
        isVisible={showErrorToast}
        message="Not quite right. Keep solving!"
        type="error"
        onClose={() => setShowErrorToast(false)}
        duration={1000}
      />

      {/* Splash modal: only show if not isComplete */}
      {(!isComplete) && (
        <Modal
          isOpen={showSplashModal}
          onClose={() => {
            setShowSplashModal(false);
            if (!isComplete) {
              setIsTimerRunning(true);
            }
            if (onStart) {
              onStart();
            }
          }}
          title={splashTitle || "Ready to Solve?"}
          message={splashDescription || "The timer will start when you begin solving the puzzle."}
          type="start"
        />
      )}

      <Modal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        title="Puzzle Information"
        message={
          <div className="puzzle-info">
            {ipuzData.metadata?.title && (
              <div className="puzzle-info-item">
                <strong>Title:</strong> {ipuzData.metadata.title}
              </div>
            )}
            {ipuzData.metadata?.author && (
              <div className="puzzle-info-item">
                <strong>Author:</strong> {ipuzData.metadata.author}
              </div>
            )}
            {ipuzData.metadata?.notes && (
              <div className="puzzle-info-item">
                <strong>Notes:</strong> {ipuzData.metadata.notes}
              </div>
            )}
          </div>
        }
        type="info"
      />
    </div>
  );
};

export default CrosswordSolver;
