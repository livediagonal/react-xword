import React, { useRef, useEffect, useState } from "react";
import { ClueOrientation, CrosswordState } from "../types/crossword";
import "../styles/CrosswordGrid.css";
import {
    calculateClueNumbers,
    findNextWhiteCell,
    findNextClueNumber,
    findPreviousClueNumber,
    findFirstEmptyCellInClue,
    findClueNumberForCell,
    isPartOfActiveClue,
    findFirstValidCell,
    handleTabNavigation,
    handleShiftTabNavigation
} from '../utils';
import { useCrosswordLetterHandler } from "../hooks/useCrosswordLetterHandler";

export interface CrosswordGridProps {
    crosswordState: CrosswordState;
    setCrosswordState: React.Dispatch<React.SetStateAction<CrosswordState | null>>;
    validatedCells?: (boolean | undefined)[][] | null;
    revealedCells?: boolean[][] | null;
    disabled?: boolean;
}

const CrosswordGrid: React.FC<CrosswordGridProps> = ({
    crosswordState,
    setCrosswordState,
    validatedCells,
    revealedCells,
    disabled = false
}) => {
    const gridRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [cellSize, setCellSize] = useState<number>(32); // default fallback

    // Use the centralized letter handling hook - provide dummy values since CrosswordGrid doesn't handle completion
    const { handleLetterChange } = useCrosswordLetterHandler({
        crosswordState,
        setCrosswordState,
        validatedCells: validatedCells || null,
        setValidatedCells: () => { }, // CrosswordGrid doesn't manage this
        revealedCells: revealedCells || [],
        solution: null, // CrosswordGrid doesn't handle puzzle completion
        onPuzzleComplete: () => { }, // Dummy callback
        onShowError: () => { } // Dummy callback
    });

    // Extract values from crosswordState for easier access
    const {
        rows,
        columns,
        grid,
        letters,
        clueOrientation,
        activeClueNumber,
        activeCell
    } = crosswordState;

    // Internal implementation of handleClueOrientationChange
    const handleClueOrientationChange = (orientation: ClueOrientation) => {
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
    };

    // Internal implementation of handleCellClick
    const handleCellClick = (row: number, col: number) => {
        if (disabled) return;

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
    };

    // Internal implementation of navigateToClue
    const handleNavigateToClue = (
        clueNumber: number,
        orientation: ClueOrientation,
        cell: [number, number] | null
    ) => {
        // Create a new state with the updated clue number, orientation, and cell
        const newState: CrosswordState = {
            ...crosswordState,
            activeClueNumber: clueNumber,
            clueOrientation: orientation,
            activeCell: cell,
        };

        // Update the state directly
        setCrosswordState(newState);
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

    const handleKeyDown = (e: React.KeyboardEvent, row: number, col: number) => {
        if (disabled) return;

        // Handle letter input
        if (e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) {
            e.preventDefault();
            handleLetterChange(row, col, e.key.toUpperCase());
        } else if (e.key === "Backspace" || e.key === "Delete") {
            e.preventDefault();
            handleLetterChange(row, col, "");
        } else if (e.key === "Tab") {
            e.preventDefault();

            /**
             * SMART TAB NAVIGATION
             * 
             * Tab and Shift+Tab now use intelligent navigation that prioritizes clues with empty cells.
             * This ensures users always land on clues they can work on when the puzzle is incomplete.
             */
            if (e.shiftKey) {
                // Shift+Tab: Navigate to previous clue with empty cells
                handleShiftTabNavigation({
                    crosswordState,
                    setCrosswordState
                });
            } else {
                // Tab: Navigate to next clue with empty cells
                handleTabNavigation({
                    crosswordState,
                    setCrosswordState
                });
            }
        } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault();

            // Check if we need to change orientation
            if (clueOrientation !== "across") {
                // If we're not in "across" mode, just change the orientation
                handleClueOrientationChange("across");
            } else {
                // If we're already in "across" mode, move to the next cell
                const nextCell = findNextWhiteCell(grid, row, col, e.key === "ArrowLeft" ? "left" : "right", rows, columns);

                if (nextCell) {
                    const [nextRow, nextCol] = nextCell;

                    // Find the clue number for the next cell in the "across" orientation
                    const clueNumber = findClueNumberForCell(nextRow, nextCol, "across", grid, clueNumbers, rows, columns);

                    if (clueNumber) {
                        // Use handleNavigateToClue to update both orientation and active cell
                        handleNavigateToClue(clueNumber, "across", nextCell);
                    }
                } else {
                    // If we can't move further in this direction, switch to the other orientation
                    const newOrientation = "down";
                    handleClueOrientationChange(newOrientation);
                }
            }
        } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();

            // Check if we need to change orientation
            if (clueOrientation !== "down") {
                // If we're not in "down" mode, just change the orientation
                handleClueOrientationChange("down");
            } else {
                // If we're already in "down" mode, move to the next cell
                const nextCell = findNextWhiteCell(grid, row, col, e.key === "ArrowUp" ? "up" : "down", rows, columns);

                if (nextCell) {
                    const [nextRow, nextCol] = nextCell;

                    // Find the clue number for the next cell in the "down" orientation
                    const clueNumber = findClueNumberForCell(nextRow, nextCol, "down", grid, clueNumbers, rows, columns);

                    if (clueNumber) {
                        // Use handleNavigateToClue to update both orientation and active cell
                        handleNavigateToClue(clueNumber, "down", nextCell);
                    }
                } else {
                    // If we can't move further in this direction, switch to the other orientation
                    const newOrientation = "across";
                    handleClueOrientationChange(newOrientation);
                }
            }
        }
    };

    // Calculate clue numbers only once
    const clueNumbers = calculateClueNumbers(grid, rows, columns);

    // Handle touch events for mobile
    const startTouchRef = useRef<{ x: number; y: number } | null>(null);
    const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
    const touchMoveCountRef = useRef<number>(0);

    // Add a flag to prevent double-firing on click after touch
    const ignoreNextClickRef = useRef(false);

    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        startTouchRef.current = { x: touch.clientX, y: touch.clientY };
        lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
        touchMoveCountRef.current = 0;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        e.preventDefault(); // Keep this to prevent scrolling
        if (!startTouchRef.current) return;

        const touch = e.touches[0];
        lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
        touchMoveCountRef.current++;
    };

    const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>, row: number, col: number) => {
        if (disabled) return;
        if (!startTouchRef.current || !lastTouchRef.current) return;

        // Reset touch refs
        const startTouch = startTouchRef.current;
        const lastTouch = lastTouchRef.current;
        startTouchRef.current = null;
        lastTouchRef.current = null;

        // If the touch was essentially a tap (not much movement), treat as click
        const touchMoved =
            Math.abs(startTouch.x - lastTouch.x) > 10 ||
            Math.abs(startTouch.y - lastTouch.y) > 10;

        if (!touchMoved && touchMoveCountRef.current < 5) {
            ignoreNextClickRef.current = true; // Set flag to ignore next click
            handleCellClick(row, col);
        }
    };

    // Function to determine cell class
    const getCellClass = (row: number, col: number): string => {
        let className = "crossword-cell";

        // Add black cell class if the cell is black
        if (grid[row][col]) {
            return className + " black-cell";
        }

        // Add active cell class if this is the active cell
        if (
            activeCell &&
            activeCell[0] === row &&
            activeCell[1] === col
        ) {
            className += " active-cell";
        }
        // Add part of active clue class if this cell is part of the active clue
        else if (
            activeClueNumber &&
            isPartOfActiveClue(row, col, activeClueNumber, clueOrientation, grid, clueNumbers, rows, columns)
        ) {
            className += " part-of-active-clue";
        }

        // Add validated class if this cell has been validated
        if (validatedCells && validatedCells[row] && validatedCells[row][col] !== undefined) {
            className += " validated-cell";
            if (!validatedCells[row][col]) {
                className += " incorrect";
            }
        }

        // Add revealed class if this cell has been revealed
        if (revealedCells && revealedCells[row] && revealedCells[row][col]) {
            className += " revealed-cell";
        }

        return className;
    };

    // Modify the useEffect to focus the active cell but NOT scroll it into view
    useEffect(() => {
        if (!activeCell) {
            // If no active cell, find the first valid cell and set it as active
            const firstValidCell = findFirstValidCell(grid);
            handleCellClick(firstValidCell[0], firstValidCell[1]);
            return;
        }

        if (gridRef.current) {
            // Use requestAnimationFrame to ensure this runs after the grid is fully rendered
            requestAnimationFrame(() => {
                const [row, col] = activeCell;
                const cellElement = gridRef.current?.querySelector(`[data-row="${row}"][data-col="${col}"]`) as HTMLElement;
                if (cellElement) {
                    // Add a small delay to ensure the cell is fully rendered and ready
                    setTimeout(() => {
                        cellElement.focus({ preventScroll: true });
                    }, 0);
                }
            });
        }
    }, [activeCell, grid]);



    // Add effect to prevent viewport scaling on input
    useEffect(() => {
        // Add meta viewport tag to prevent scaling when focusing on inputs
        const metaViewport = document.querySelector('meta[name="viewport"]');
        const originalContent = metaViewport?.getAttribute('content') || '';

        // Update the viewport to disable scaling
        metaViewport?.setAttribute('content',
            originalContent + ', maximum-scale=1.0, user-scalable=0');

        return () => {
            // Restore original viewport settings when component unmounts
            metaViewport?.setAttribute('content', originalContent);
        };
    }, []);

    useEffect(() => {
        function updateSize() {
            if (!wrapperRef.current) return;
            const rect = wrapperRef.current.getBoundingClientRect();
            const gap = 1; // px, must match CSS .grid-container gap
            const padding = 1; // px, must match CSS .grid-container padding
            const totalGapWidth = (columns - 1) * gap;
            const totalGapHeight = (rows - 1) * gap;
            const maxCellWidth = Math.floor((rect.width - totalGapWidth - 2 * padding) / columns);
            const maxCellHeight = Math.floor((rect.height - totalGapHeight - 2 * padding) / rows);
            const n = Math.max(16, Math.floor(Math.min(maxCellWidth, maxCellHeight)));
            setCellSize(n);
        }
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, [rows, columns]);

    // Function to handle cell click is now defined earlier in the component

    // Calculate grid container size to prevent squishing
    const gap = 1; // px, must match CSS .grid-container gap
    const padding = 1; // px, must match CSS .grid-container padding
    const gridWidth = cellSize * columns + (columns - 1) * gap + 2 * padding;
    const gridHeight = cellSize * rows + (rows - 1) * gap + 2 * padding;

    return (
        <div className="crossword-wrapper" ref={wrapperRef} style={{ width: '100%', height: '100%' }}>
            <div
                ref={gridRef}
                className={`crossword-grid ${disabled ? 'disabled completed-puzzle' : ''}`}
                style={{
                    width: gridWidth,
                    height: gridHeight,
                    minWidth: gridWidth,
                    minHeight: gridHeight,
                    maxWidth: gridWidth,
                    maxHeight: gridHeight,
                }}
            >
                <div
                    className="grid-container"
                    ref={gridRef}
                    style={{
                        gridTemplateColumns: `repeat(${columns}, ${cellSize}px)`,
                        gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
                        width: '100%',
                        height: '100%',
                    }}
                >
                    {Array.from({ length: rows }, (_, row) =>
                        Array.from({ length: columns }, (_, col) => {
                            const cellClass = getCellClass(row, col);
                            const letter = letters[row][col];
                            const number = clueNumbers[row][col];

                            return (
                                <div
                                    key={`${row}-${col}`}
                                    className={cellClass}
                                    style={{ width: cellSize, height: cellSize }}
                                    onClick={(e) => {
                                        if (ignoreNextClickRef.current) {
                                            ignoreNextClickRef.current = false;
                                            return;
                                        }
                                        e.preventDefault();
                                        handleCellClick(row, col);
                                    }}
                                    onTouchStart={handleTouchStart}
                                    onTouchMove={handleTouchMove}
                                    onTouchEnd={(e) => handleTouchEnd(e, row, col)}
                                    tabIndex={0}
                                    onKeyDown={(e) => handleKeyDown(e, row, col)}
                                    data-row={row}
                                    data-col={col}
                                    aria-readonly={false}
                                    aria-label={`crossword cell ${row},${col}`}
                                >
                                    {!grid[row][col] && number > 0 && (
                                        <span className="cell-number">{number}</span>
                                    )}
                                    {letter}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default CrosswordGrid;
