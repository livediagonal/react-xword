import React, { useState, useEffect, useRef } from "react";
import CrosswordGrid from "./CrosswordGrid";
import { CrosswordState } from "../types/crossword";
import { IPuzPuzzle } from "../types/ipuz";
import Modal from "./Modal";
import "../styles/CrosswordSolver.css";
import VirtualKeyboard from "./VirtualKeyboard";
import Toast from "./Toast";
import {
  calculateClueNumbers,
  findFirstValidCell,
  findClueStartCell,
  findFirstEmptyCellInClue,
  navigateToClueAndCell,
  findWordStart,
} from "../utils";

interface CrosswordSolverProps {
  /** The puzzle data in IPuz format */
  ipuzData: IPuzPuzzle;
  /**
   * Optional callback function that will be called when the puzzle is completed.
   * This fires when the puzzle is solved and the success modal is about to be shown.
   * The callback receives the completion time in seconds and the completed grid.
   */
  onComplete?: (completionTime: number, grid: (string | null)[][]) => void;
  /**
   * Optional React elements to display in the left side of the actions bar.
   * These elements will be displayed opposite the timer and actions buttons.
   */
  leftNavElements?: React.ReactNode;
  /**
   * Optional callback function that will be called when the user starts the puzzle (dismisses the splash modal).
   * Can optionally return a timestamp string (e.g., from SQLite's CURRENT_TIMESTAMP) to be used as the timer start time.
   * If no timestamp is returned, the timer will start from when the callback completes.
   */
  onStart?: () => void | string | Promise<void | string>;
  /**
   * If true, the puzzle is shown as completed and locked (no further editing, timer stopped, and success modal shown).
   */
  isComplete?: boolean;

  /**
   * The title to display in the splash modal.
   */
  splashTitle?: string | React.ReactNode;

  /**
   * The description to display in the splash modal.
   */
  splashDescription?: string | React.ReactNode;

  /**
   * If true, enables dark mode styling for the crossword solver.
   */
  darkMode?: boolean;
}

const CrosswordSolver: React.FC<CrosswordSolverProps> = ({
  ipuzData,
  onComplete,
  leftNavElements,
  onStart,
  isComplete,
  splashTitle,
  splashDescription,
  darkMode = false,
}) => {
  const [solution, setSolution] = useState<string[][] | null>(null);
  const [validatedCells, setValidatedCells] = useState<
    (boolean | undefined)[][] | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [showSplashModal, setShowSplashModal] = useState(true);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const [useMobileKeyboard, setUseMobileKeyboard] = useState(false);
  const [crosswordState, setCrosswordState] = useState<CrosswordState | null>(
    null,
  );
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const startTimeRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [, setTimerTick] = useState(0); // Just to force re-renders

  // Refs for clue list containers
  const acrossClueListRef = useRef<HTMLDivElement>(null);
  const downClueListRef = useRef<HTMLDivElement>(null);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  const actionsToggleRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Detect mobile devices on mount and set keyboard mode
  useEffect(() => {
    const isMobile = window.innerWidth <= 767;
    setUseMobileKeyboard(isMobile);

    // Add meta viewport tag to prevent zooming
    const existingViewport = document.querySelector('meta[name="viewport"]');
    if (existingViewport) {
      existingViewport.setAttribute(
        "content",
        "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no",
      );
    } else {
      const viewportMeta = document.createElement("meta");
      viewportMeta.name = "viewport";
      viewportMeta.content =
        "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
      document.getElementsByTagName("head")[0].appendChild(viewportMeta);
    }
  }, []);

  // Timer effect - just triggers re-renders when running
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimerTick((tick) => tick + 1);
      }, 100);
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTimerRunning]);

  // Calculate current timer value based on start time
  const getElapsedSeconds = (): number => {
    if (!startTimeRef.current) return 0;
    return Math.floor((Date.now() - startTimeRef.current) / 1000);
  };

  // Format time as M:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Load puzzle data only once when component mounts
  useEffect(() => {
    const loadPuzzle = async () => {
      try {
        setLoading(true);
        const { dimensions, puzzle, solution: ipuzSolution, clues } = ipuzData;
        const { width, height } = dimensions;

        // Convert puzzle grid to boolean array
        const grid = puzzle.map((row) =>
          row.map((cell) => {
            // Black squares are represented by '#'
            if (cell === "#") {
              return true;
            }
            // Everything else (including 0, null, and cells with numbers) is a white square
            return false;
          }),
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

        // Initialize validated cells array
        const validatedCellsArray = Array(height)
          .fill(0)
          .map(() => Array(width).fill(undefined));
        setValidatedCells(validatedCellsArray);

        // Find the first valid cell (used for initializing crosswordState)
        const firstCell = findFirstValidCell(grid);

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
              const cellElement = document.querySelector(
                `[data-row="${row}"][data-col="${col}"]`,
              ) as HTMLElement;
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
      const clueListRef =
        crosswordState.clueOrientation === "across"
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
          clueListRef.scrollBy({ top: relativeTop, behavior: "smooth" });
        } else if (relativeBottom > containerRect.height) {
          // Element is below the visible area of the container
          clueListRef.scrollBy({
            top: relativeBottom - containerRect.height,
            behavior: "smooth",
          });
        }
      }
    }
  }, [crosswordState?.activeClueNumber, crosswordState?.clueOrientation]);

  // Add effect to handle clue highlighting when active clue changes
  useEffect(() => {
    if (!crosswordState) return;

    const activeClueEl = document.querySelector(".solver-active-clue");
    if (!activeClueEl) return;

    // Add clue-changed class
    activeClueEl.classList.add("clue-changed");

    // Remove the class after animation completes
    const timeout = setTimeout(() => {
      activeClueEl.classList.remove("clue-changed");
    }, 1000);

    return () => clearTimeout(timeout);
  }, [crosswordState?.activeClueNumber, crosswordState?.clueOrientation]);

  // Function to check a single answer
  const checkAnswer = () => {
    console.log("checkAnswer called");
    if (!crosswordState || !solution) {
      console.log("Missing state or solution:", { crosswordState, solution });
      return;
    }

    const newValidatedCells = validatedCells
      ? validatedCells.map((row) => [...row])
      : Array(crosswordState.rows)
          .fill(0)
          .map(() => Array(crosswordState.columns).fill(undefined));
    const newLetters = [...crosswordState.letters];

    // Check the current word
    if (crosswordState.activeClueNumber && crosswordState.activeCell) {
      const [row, col] = crosswordState.activeCell;
      const orientation = crosswordState.clueOrientation;
      console.log("Checking word:", { row, col, orientation });

      // Find the start of the current word
      const [startRow, startCol] = findWordStart(
        crosswordState.grid,
        row,
        col,
        orientation === "across",
      );
      console.log("Word start:", { startRow, startCol });

      // Check each cell in the word
      if (orientation === "across") {
        for (let c = startCol; c < crosswordState.columns; c++) {
          if (crosswordState.grid[startRow][c]) break; // Stop at black cell

          const isCorrect =
            newLetters[startRow][c].toUpperCase() ===
            solution[startRow][c].toUpperCase();
          console.log("Checking cell:", {
            row: startRow,
            col: c,
            letter: newLetters[startRow][c],
            solution: solution[startRow][c],
            isCorrect,
          });
          // Mark the cell as validated (true if correct, false if incorrect)
          newValidatedCells[startRow][c] = isCorrect;
        }
      } else {
        for (let r = startRow; r < crosswordState.rows; r++) {
          if (crosswordState.grid[r][startCol]) break; // Stop at black cell

          const isCorrect =
            newLetters[r][startCol].toUpperCase() ===
            solution[r][startCol].toUpperCase();
          console.log("Checking cell:", {
            row: r,
            col: startCol,
            letter: newLetters[r][startCol],
            solution: solution[r][startCol],
            isCorrect,
          });
          // Mark the cell as validated (true if correct, false if incorrect)
          newValidatedCells[r][startCol] = isCorrect;
        }
      }
    }

    console.log("Setting validated cells:", newValidatedCells);
    setValidatedCells(newValidatedCells);
    setIsActionsMenuOpen(false); // Close the actions menu
  };

  // Function to check the entire puzzle
  const checkPuzzle = () => {
    if (!crosswordState || !solution) return;

    const newValidatedCells = validatedCells
      ? validatedCells.map((row) => [...row])
      : Array(crosswordState.rows)
          .fill(0)
          .map(() => Array(crosswordState.columns).fill(undefined));
    const newLetters = [...crosswordState.letters];

    // Check all cells in the puzzle
    for (let row = 0; row < crosswordState.rows; row++) {
      for (let col = 0; col < crosswordState.columns; col++) {
        if (!crosswordState.grid[row][col] && newLetters[row][col]) {
          const isCorrect =
            newLetters[row][col].toUpperCase() ===
            solution[row][col].toUpperCase();
          // Mark the cell as validated (true if correct, false if incorrect)
          newValidatedCells[row][col] = isCorrect;
        }
      }
    }

    setValidatedCells(newValidatedCells);
    setIsActionsMenuOpen(false); // Close the actions menu
  };

  // Function to handle puzzle completion
  const handlePuzzleCompletion = (completedGrid: (string | null)[][]) => {
    setShowErrorToast(false);
    setShowConfetti(true);
    setHasCompleted(true);
    setIsTimerRunning(false);
    if (onComplete) {
      onComplete(getElapsedSeconds(), completedGrid);
    }
  };

  // Note: The main CrosswordSolver no longer uses the letter handler hook directly
  // Child components (CrosswordGrid, VirtualKeyboard) handle letter changes with proper solution/callbacks

  // Function to check if we have any metadata to show
  const hasMetadata = () => {
    const metadata = ipuzData.metadata;
    return (
      metadata &&
      ((metadata.title && metadata.title.trim() !== "") ||
        (metadata.author && metadata.author.trim() !== "") ||
        (metadata.notes && metadata.notes.trim() !== ""))
    );
  };

  // Effect to handle isComplete prop
  useEffect(() => {
    if (isComplete && solution) {
      setIsTimerRunning(false);
      setHasCompleted(true);
      setShowSplashModal(false); // Hide splash modal if isComplete
      // Do NOT show success modal or confetti, and do NOT call onComplete here
      setCrosswordState((prevState) => {
        if (!prevState) return prevState;
        const newLetters = solution.map((row) => [...row]);
        return {
          ...prevState,
          letters: newLetters,
        };
      });
      setValidatedCells((prev) =>
        prev && crosswordState
          ? crosswordState.grid.map((row) =>
              row.map((cell) => (!cell ? true : undefined)),
            )
          : prev,
      );
    }
  }, [isComplete, solution]);

  if (loading) {
    return <div className="solver-loading">Loading puzzle...</div>;
  }

  if (error) {
    return <div className="solver-error">Error: {error}</div>;
  }

  if (!crosswordState) {
    return <div className="solver-no-data">No puzzle data available</div>;
  }

  return (
    <div
      className={`solver-container ${darkMode ? "dark-mode" : ""}`}
      ref={containerRef}
    >
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
                      className={`solver-clue-item ${
                        crosswordState.activeClueNumber === parseInt(number) &&
                        crosswordState.clueOrientation === "across"
                          ? "active"
                          : ""
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        const cellNumber = parseInt(number);
                        const clueNumbers = calculateClueNumbers(
                          crosswordState.grid,
                          crosswordState.rows,
                          crosswordState.columns,
                        );
                        const startCell = findClueStartCell(
                          cellNumber,
                          clueNumbers,
                          crosswordState.rows,
                          crosswordState.columns,
                        );
                        const firstEmptyCell = findFirstEmptyCellInClue(
                          cellNumber,
                          "across",
                          crosswordState.grid,
                          crosswordState.letters,
                          clueNumbers,
                          crosswordState.rows,
                          crosswordState.columns,
                        );
                        navigateToClueAndCell({
                          clueNumber: cellNumber,
                          orientation: "across",
                          cell: firstEmptyCell || startCell,
                          crosswordState,
                          setCrosswordState,
                        });
                      }}
                    >
                      <span className="solver-clue-number">{number}.</span>{" "}
                      {text}
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="solver-clue-section">
              <h3>Down</h3>
              <div className="solver-clue-list" ref={downClueListRef}>
                {Object.entries(crosswordState.clues.Down).map(
                  ([number, text]) => (
                    <div
                      key={`down-${number}`}
                      id={`down-${number}`}
                      className={`solver-clue-item ${
                        crosswordState.activeClueNumber === parseInt(number) &&
                        crosswordState.clueOrientation === "down"
                          ? "active"
                          : ""
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        const cellNumber = parseInt(number);
                        const clueNumbers = calculateClueNumbers(
                          crosswordState.grid,
                          crosswordState.rows,
                          crosswordState.columns,
                        );
                        const startCell = findClueStartCell(
                          cellNumber,
                          clueNumbers,
                          crosswordState.rows,
                          crosswordState.columns,
                        );
                        const firstEmptyCell = findFirstEmptyCellInClue(
                          cellNumber,
                          "down",
                          crosswordState.grid,
                          crosswordState.letters,
                          clueNumbers,
                          crosswordState.rows,
                          crosswordState.columns,
                        );
                        navigateToClueAndCell({
                          clueNumber: cellNumber,
                          orientation: "down",
                          cell: firstEmptyCell || startCell,
                          crosswordState,
                          setCrosswordState,
                        });
                      }}
                    >
                      <span className="solver-clue-number">{number}.</span>{" "}
                      {text}
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        )}
        {/* Main area: actions, grid, keyboard */}
        <div className="solver-main-area">
          <div className="solver-actions">
            <div className="solver-actions-left">{leftNavElements}</div>
            <div className="solver-actions-group">
              <div className="solver-timer">
                {formatTime(getElapsedSeconds())}
              </div>
              {hasMetadata() && (
                <button
                  className="solver-actions-toggle"
                  onClick={() => setShowInfoModal(true)}
                  aria-label="Show puzzle information"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                </svg>
              </button>
            </div>
            <div
              ref={actionsMenuRef}
              className={`solver-actions-menu ${isActionsMenuOpen ? "open" : ""}`}
            >
              <button
                className="solver-action-button"
                onClick={checkAnswer}
                disabled={
                  !crosswordState?.activeClueNumber ||
                  hasCompleted ||
                  isComplete
                }
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
            </div>
          </div>

          {/* Grid with better touch handling */}
          <div className="solver-grid-container" id="crossword-grid-container">
            <CrosswordGrid
              crosswordState={crosswordState}
              setCrosswordState={setCrosswordState}
              validatedCells={validatedCells}
              setValidatedCells={setValidatedCells}
              disabled={hasCompleted || isComplete}
              solution={solution}
              onShowError={() => setShowErrorToast(true)}
              onPuzzleComplete={handlePuzzleCompletion}
            />
          </div>

          {/* Virtual keyboard for mobile */}
          {useMobileKeyboard && crosswordState && (
            <VirtualKeyboard
              crosswordState={crosswordState}
              setCrosswordState={setCrosswordState}
              validatedCells={validatedCells}
              setValidatedCells={setValidatedCells}
              solution={solution}
              onShowError={() => setShowErrorToast(true)}
              onPuzzleComplete={handlePuzzleCompletion}
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
      {!isComplete && (
        <Modal
          isOpen={showSplashModal}
          onClose={async () => {
            setShowSplashModal(false);

            let timestampStr: string | void | undefined;
            if (onStart) {
              timestampStr = await onStart();
            }

            if (timestampStr) {
              // Use the returned timestamp as the start time
              startTimeRef.current = new Date(timestampStr).getTime();
            } else {
              // Initialize timer to start from now
              startTimeRef.current = Date.now();
            }
            setIsTimerRunning(true);

            // Focus on the first valid cell after modal is dismissed
            requestAnimationFrame(() => {
              if (crosswordState?.activeCell) {
                const [row, col] = crosswordState.activeCell;
                setTimeout(() => {
                  const cellElement = document.querySelector(
                    `[data-row="${row}"][data-col="${col}"]`,
                  ) as HTMLElement;
                  if (cellElement) {
                    cellElement.focus();
                  }
                }, 100); // Slightly longer delay to ensure modal is fully closed
              }
            });
          }}
          title={splashTitle || "Ready to Solve?"}
          message={
            splashDescription ||
            "The timer will start when you begin solving the puzzle."
          }
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
