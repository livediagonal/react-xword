import React, { useRef, useEffect } from "react";
import { ClueOrientation } from "../types";
import "./CrosswordGrid.css";

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
    onNavigateToClue: ((clueNumber: number, orientation: ClueOrientation, cell: [number, number] | null) => void) | undefined;
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
    onNavigateToClue,
    activeCell,
}) => {
    const gridRef = useRef<HTMLDivElement>(null);

    const handleKeyDown = (e: React.KeyboardEvent, row: number, col: number) => {
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

                if (onNavigateToClue) {
                    // Use the new navigation function
                    onNavigateToClue(nextClueNumber, clueOrientation, firstEmptyCell);
                } else if (onCellClick) {
                    // Fall back to the old method if the new function is not available
                    const startCell = findClueStartCell(nextClueNumber, clueOrientation);
                    if (startCell) {
                        onCellClick(startCell[0], startCell[1]);
                    }
                }
            }
        }
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
        const clueNumbers = calculateClueNumbers();

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

        // Return the next clue number, or wrap around to the first clue
        const nextIndex = (currentIndex + 1) % clueNumberList.length;
        return clueNumberList[nextIndex];
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

        // Return the previous clue number, or wrap around to the last clue
        const prevIndex = (currentIndex - 1 + clueNumberList.length) % clueNumberList.length;
        return clueNumberList[prevIndex];
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

    // Calculate clue numbers for the grid
    const clueNumbers = calculateClueNumbers();

    // Add a useEffect to focus the active cell when it changes
    useEffect(() => {
        if (activeCell && gridRef.current) {
            const [row, col] = activeCell;
            const cellElement = gridRef.current.querySelector(`[data-row="${row}"][data-col="${col}"]`) as HTMLElement;
            if (cellElement) {
                cellElement.focus();
                // Scroll the cell into view if needed
                cellElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
            }
        }
    }, [activeCell]);

    return (
        <div className="crossword-grid" ref={gridRef}>
            <div
                className="grid-container"
                style={{
                    gridTemplateColumns: `repeat(${columns}, 1fr)`,
                    gridTemplateRows: `repeat(${rows}, 1fr)`,
                    "--grid-aspect-ratio": `${columns} / ${rows}`,
                } as React.CSSProperties}
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
                                className={`grid-cell ${isBlack ? "black" : "white"} ${isActive ? "active" : ""
                                    } ${isInActiveWord ? "in-active-word" : ""}`}
                                onClick={() => onCellClick && onCellClick(row, col)}
                                tabIndex={isBlack ? -1 : 0}
                                onKeyDown={(e) => handleKeyDown(e, row, col)}
                                data-row={row}
                                data-col={col}
                            >
                                {!isBlack && (
                                    <>
                                        {number > 0 && (
                                            <div className="cell-number">{number}</div>
                                        )}
                                        <div className="cell-letter">{letter}</div>
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
