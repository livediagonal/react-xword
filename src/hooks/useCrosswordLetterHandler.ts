import { useCallback } from 'react';
import { CrosswordState } from '../types/crossword';
import {
    processLetterChange,
    LetterChangeInput,
    handleNextClue,
    navigateToClueAndCell,
    isPuzzleComplete,
    areAllAnswersCorrect
} from '../utils';

interface UseCrosswordLetterHandlerProps {
    crosswordState: CrosswordState | null;
    setCrosswordState: React.Dispatch<React.SetStateAction<CrosswordState | null>>;
    validatedCells: (boolean | undefined)[][] | null;
    setValidatedCells: (cells: (boolean | undefined)[][]) => void;
    revealedCells: boolean[][];
    solution: string[][] | null;
    onPuzzleComplete?: (completedLetters: (string | null)[][]) => void;
    onShowError?: () => void;
}

/**
 * CENTRALIZED LETTER HANDLING HOOK
 * 
 * This hook provides a clean, reusable interface for letter handling that can be used
 * by any component without prop drilling. It encapsulates all the complex letter
 * handling logic and provides a simple `handleLetterChange` function.
 * 
 * Benefits:
 * - No prop drilling required
 * - Consistent behavior across all components
 * - Easy to test and maintain
 * - Reusable across different components
 */
export const useCrosswordLetterHandler = ({
    crosswordState,
    setCrosswordState,
    validatedCells,
    setValidatedCells,
    revealedCells,
    solution,
    onPuzzleComplete,
    onShowError
}: UseCrosswordLetterHandlerProps) => {

    const handleLetterChange = useCallback((row: number, col: number, letter: string) => {
        if (!crosswordState) return;

        // Prepare input for the pure function
        const input: LetterChangeInput = {
            grid: crosswordState.grid,
            letters: crosswordState.letters,
            validatedCells,
            revealedCells,
            activeClueNumber: crosswordState.activeClueNumber,
            clueOrientation: crosswordState.clueOrientation,
            rows: crosswordState.rows,
            columns: crosswordState.columns,
            row,
            col,
            letter
        };

        // Process the letter change using the pure function
        const result = processLetterChange(input);
        if (!result) return; // Change was blocked (e.g., revealed cell)

        const { newLetters, newValidatedCells, newActiveCell, actions } = result;

        // Apply the basic state changes
        const newState = {
            ...crosswordState,
            letters: newLetters,
            activeCell: newActiveCell
        };

        // Process actions
        let shouldCheckCompletion = false;
        let shouldHandleNextClue = false;
        let finalState = newState;

        for (const action of actions) {
            switch (action.type) {
                case 'CHECK_COMPLETION':
                    shouldCheckCompletion = true;
                    break;

                case 'HANDLE_NEXT_CLUE':
                    shouldHandleNextClue = true;
                    break;

                case 'SET_STATE':
                    if (action.payload) {
                        finalState = { ...finalState, ...action.payload };
                    }
                    break;

                case 'SHOW_ERROR':
                    onShowError?.();
                    break;
            }
        }

        // Update states first
        setCrosswordState(finalState);
        setValidatedCells(newValidatedCells);

        // Handle completion check with the updated state
        if (shouldCheckCompletion) {
            const isComplete = isPuzzleComplete(finalState.grid, newLetters);
            if (isComplete) {
                const allCorrect = areAllAnswersCorrect(finalState.grid, newLetters, solution);
                if (allCorrect) {
                    // Convert letters to (string | null)[][] format and pass to completion
                    const completedGrid: (string | null)[][] = newLetters.map(row =>
                        row.map(cell => cell === '' ? null : cell)
                    );
                    onPuzzleComplete!(completedGrid);
                } else {
                    onShowError?.();
                }
            }
        }

        // Handle next clue navigation with the final state
        if (shouldHandleNextClue) {
            handleNextClue({
                crosswordState: finalState,
                setCrosswordState
            });
        }
    }, [
        crosswordState,
        setCrosswordState,
        validatedCells,
        setValidatedCells,
        revealedCells,
        solution,
        onPuzzleComplete,
        onShowError
    ]);

    return { handleLetterChange };
}; 