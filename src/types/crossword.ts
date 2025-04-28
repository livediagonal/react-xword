export interface CrosswordState {
    rows: number;
    columns: number;
    grid: boolean[][];
    letters: string[][];
    validatedCells: (boolean | undefined)[][];
    clueOrientation: "across" | "down";
    activeClueNumber: number | null;
    activeCell: [number, number] | null;
    clues: {
        Across: { [key: number]: string };
        Down: { [key: number]: string };
    };
    clueText: string;
    isAutomaticNavigation: boolean;
} 