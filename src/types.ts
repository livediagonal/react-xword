export type Orientation = 0 | 1 | 2 | 3;
export type ClueOrientation = "across" | "down";

export interface PuzPuzzle {
  width: number;
  height: number;
  grid: string[];
  solution: string[];
  clues: {
    across: { [key: number]: string };
    down: { [key: number]: string };
  };
}

export interface CrosswordState {
  rows: number;
  columns: number;
  grid: boolean[][];
  letters: string[][];
  clueOrientation: ClueOrientation;
  activeClueNumber: number | null;
  activeCell: [number, number] | null;
  clues: {
    Across: { [key: number]: string };
    Down: { [key: number]: string };
  };
  clueText: string;
  isAutomaticNavigation?: boolean;
}
