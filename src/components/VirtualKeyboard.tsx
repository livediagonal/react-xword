import React from 'react';
import '../styles/VirtualKeyboard.css';
import { CrosswordState } from '../types/crossword';
import {
    calculateClueNumbers,
    findNextClueNumber,
    findPreviousClueNumber,
    findClueStartCell,
    findFirstEmptyCellInClue,
    findWordStart,
    findNextCellInWord,
    findPreviousCellInWord,
    navigateToClueAndCell,
    handleNextClue,
    handlePreviousClue
} from '../utils';
import { useCrosswordLetterHandler } from "../hooks/useCrosswordLetterHandler";

interface VirtualKeyboardProps {
    crosswordState: CrosswordState;
    setCrosswordState: React.Dispatch<React.SetStateAction<CrosswordState | null>>;
    validatedCells: (boolean | undefined)[][] | null;
    revealedCells: boolean[][];
    solution?: string[][] | null;
    onShowError?: () => void;
    onPuzzleComplete?: () => void;
}

const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
    crosswordState,
    setCrosswordState,
    validatedCells,
    revealedCells,
    solution = null,
    onShowError,
    onPuzzleComplete
}) => {
    // Use the centralized letter handling hook with actual solution and callbacks
    const { handleLetterChange } = useCrosswordLetterHandler({
        crosswordState,
        setCrosswordState,
        validatedCells,
        setValidatedCells: () => { }, // VirtualKeyboard doesn't manage this
        revealedCells,
        solution,
        onPuzzleComplete: onPuzzleComplete || (() => { }),
        onShowError: onShowError || (() => { })
    });
    // Adjusted rows for better layout
    const rows = [
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ''],
        ['', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫', ''],
    ];

    // Function to handle virtual key presses
    const handleVirtualKeyPress = (key: string) => {
        if (crosswordState && crosswordState.activeCell) {
            const [row, col] = crosswordState.activeCell;
            handleLetterChange(row, col, key);
        }
    };

    // Function to handle navigating to the next clue
    const handleNextClueClick = () => {
        handleNextClue({
            crosswordState,
            setCrosswordState
        });
    };

    // Function to handle navigating to the previous clue
    // Uses smart navigation that prioritizes clues with empty cells
    const handlePrevClue = () => {
        handlePreviousClue({
            crosswordState,
            setCrosswordState
        });
    };

    // Function to handle toggling the direction
    const handleToggleDirection = () => {
        if (!crosswordState) return;

        const newOrientation = crosswordState.clueOrientation === "across" ? "down" : "across";

        // Create a new state with the updated orientation
        const newState: CrosswordState = {
            ...crosswordState,
            clueOrientation: newOrientation,
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
            const clueNumbers = calculateClueNumbers(crosswordState.grid, crosswordState.rows, crosswordState.columns);

            // Get the clue numbers for both starting cells
            const horizontalClueNumber =
                clueNumbers[horizontalStartRow][horizontalStartCol];
            const verticalClueNumber =
                clueNumbers[verticalStartRow][verticalStartCol];

            // Always set the active clue number based on the new orientation
            if (newOrientation === "across" && horizontalClueNumber > 0) {
                newState.activeClueNumber = horizontalClueNumber;
            } else if (newOrientation === "down" && verticalClueNumber > 0) {
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

    // Function to get the active clue text
    const getActiveClueText = (orientation: "across" | "down") => {
        if (!crosswordState || !crosswordState.activeClueNumber) return null;

        const clueNumber = crosswordState.activeClueNumber;
        return crosswordState.clues[orientation === "across" ? "Across" : "Down"][clueNumber];
    };

    const handleKeyPress = (key: string) => {
        if (key === '⌫') {
            // Handle backspace
            handleVirtualKeyPress('');
        } else if (key === '' || key === ' ') {
            // Ignore spacer keys
            return;
        } else {
            handleVirtualKeyPress(key);
        }
    };

    const handleTouchStart = (e: React.TouchEvent, key: string) => {
        // Prevent default to avoid any unwanted behavior
        e.preventDefault();

        // Skip for spacer keys
        if (key === '' || key === ' ') return;

        // Get the element
        const el = e.currentTarget;
        // Add active class
        el.classList.add('key-active');
    };

    const handleTouchEnd = (e: React.TouchEvent, key: string) => {
        // Prevent default
        e.preventDefault();

        // Skip for spacer keys
        if (key === '' || key === ' ') return;

        // Get the element
        const el = e.currentTarget;
        // Remove active class
        el.classList.remove('key-active');

        // Trigger the key press
        handleKeyPress(key);
    };

    const activeClueText = crosswordState?.activeClueNumber ? getActiveClueText(crosswordState.clueOrientation) : null;

    return (
        <div className="virtual-keyboard">
            <div className="keyboard-controls">
                <button
                    className="control-button prev-clue"
                    onClick={handlePrevClue}
                    aria-label="Previous clue"
                    title="Previous clue"
                >
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#222" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="18 6 10 14 18 22" />
                    </svg>
                </button>
                <div
                    className="control-button active-clue"
                    onClick={handleToggleDirection}
                    aria-label="Toggle direction"
                    title={`Switch to ${crosswordState?.clueOrientation === 'across' ? 'down' : 'across'}`}
                >
                    {crosswordState?.activeClueNumber && activeClueText ? (
                        <>
                            <span className="clue-text">{activeClueText}</span>
                        </>
                    ) : (
                        <span className="no-clue">No active clue</span>
                    )}
                </div>
                <button
                    className="control-button next-clue"
                    onClick={handleNextClueClick}
                    aria-label="Next clue"
                    title="Next clue"
                >
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#222" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="10 6 18 14 10 22" />
                    </svg>
                </button>
            </div>

            {rows.map((row, rowIndex) => (
                <div key={rowIndex} className="keyboard-row">
                    {row.map((key, keyIndex) => (
                        <button
                            key={`${key}-${keyIndex}`}
                            className={`keyboard-key ${key === '⌫' ? 'backspace-key' : ''} ${key === '' || key === ' ' ? 'spacer-key' : ''}`}
                            onClick={() => handleKeyPress(key)}
                            onTouchStart={(e) => handleTouchStart(e, key)}
                            onTouchEnd={(e) => handleTouchEnd(e, key)}
                            onTouchCancel={(e) => e.currentTarget.classList.remove('key-active')}
                            disabled={key === '' || key === ' '}
                            aria-hidden={key === '' || key === ' '}
                        >
                            {key}
                        </button>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default VirtualKeyboard; 