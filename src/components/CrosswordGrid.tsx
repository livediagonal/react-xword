import React, { useRef, useEffect, useState } from "react";
import { ClueOrientation, CrosswordState } from "../types/crossword";
import "../styles/CrosswordGrid.css";
import { calculateClueNumbers } from '../utils';

export interface CrosswordGridProps {
    crosswordState: CrosswordState;
    setCrosswordState: React.Dispatch<React.SetStateAction<CrosswordState | null>>;
    onLetterChange: (row: number, col: number, letter: string) => void;
    validatedCells?: (boolean | undefined)[][] | null;
    revealedCells?: boolean[][] | null;
    disabled?: boolean;
}

const CrosswordGrid: React.FC<CrosswordGridProps> = ({
    crosswordState,
    setCrosswordState,
    onLetterChange,
    validatedCells,
    revealedCells,
    disabled = false
}) => {
    const gridRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [cellSize, setCellSize] = useState<number>(32); // default fallback

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
            onLetterChange(row, col, e.key.toUpperCase());
        } else if (e.key === "Backspace" || e.key === "Delete") {
            e.preventDefault();
            onLetterChange(row, col, "");
        } else if (e.key === "Tab") {
            e.preventDefault();
            // Find the next or previous clue in the current orientation based on Shift key
            const nextClueNumber = e.shiftKey
                ? findPreviousClueNumber(activeClueNumber, clueOrientation)
                : findNextClueNumber(activeClueNumber, clueOrientation);

            if (nextClueNumber) {
                // Find the first empty cell in the next clue
                const firstEmptyCell = findFirstEmptyCellInClue(nextClueNumber, clueOrientation);

                // Use the new navigation function
                handleNavigateToClue(nextClueNumber, clueOrientation, firstEmptyCell);
            } else {
                // If we've reached the end of the current orientation's clues, switch to the other orientation
                const newOrientation = clueOrientation === "across" ? "down" : "across";
                const firstClueNumber = e.shiftKey
                    ? findPreviousClueNumber(null, newOrientation) // Get last clue of new orientation
                    : findNextClueNumber(null, newOrientation); // Get first clue of new orientation

                if (firstClueNumber) {
                    const firstEmptyCell = findFirstEmptyCellInClue(firstClueNumber, newOrientation);
                    handleNavigateToClue(firstClueNumber, newOrientation, firstEmptyCell);
                }
            }
        } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault();

            // Check if we need to change orientation
            if (clueOrientation !== "across") {
                // If we're not in "across" mode, just change the orientation
                handleClueOrientationChange("across");
            } else {
                // If we're already in "across" mode, move to the next cell
                const nextCell = findNextWhiteCell(row, col, e.key === "ArrowLeft" ? "left" : "right");

                if (nextCell) {
                    const [nextRow, nextCol] = nextCell;

                    // Find the clue number for the next cell in the "across" orientation
                    const clueNumber = findClueNumberForCell(nextRow, nextCol, "across");

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
                const nextCell = findNextWhiteCell(row, col, e.key === "ArrowUp" ? "up" : "down");

                if (nextCell) {
                    const [nextRow, nextCol] = nextCell;

                    // Find the clue number for the next cell in the "down" orientation
                    const clueNumber = findClueNumberForCell(nextRow, nextCol, "down");

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
            isPartOfActiveClue(row, col)
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

    // Helper function to find the next white cell in a given direction
    const findNextWhiteCell = (
        row: number,
        col: number,
        direction: "left" | "right" | "up" | "down"
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

    // Function to check if a cell is part of the active clue
    const isPartOfActiveClue = (row: number, col: number): boolean => {
        if (!activeClueNumber || grid[row][col]) return false;

        // Check if this cell is part of the active clue in the current orientation
        const clueStartCell = findClueStartCell(activeClueNumber, clueOrientation);
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

    // Function to find the next clue number in the current orientation
    const findNextClueNumber = (
        currentClueNumber: number | null,
        orientation: ClueOrientation
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

    // Function to find the previous clue number in the current orientation
    const findPreviousClueNumber = (
        currentClueNumber: number | null,
        orientation: ClueOrientation
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

    // Function to find the first empty cell in a clue
    const findFirstEmptyCellInClue = (
        clueNumber: number,
        orientation: ClueOrientation
    ): [number, number] | null => {
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

    // Helper function to find the clue number for a cell in a given orientation
    const findClueNumberForCell = (
        row: number,
        col: number,
        orientation: ClueOrientation
    ): number | null => {
        const clueNumbers = calculateClueNumbers(grid, rows, columns);

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
