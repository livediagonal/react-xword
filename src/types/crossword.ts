export type ClueOrientation = "across" | "down";

export interface CrosswordState {
  rows: number;
  columns: number;
  grid: boolean[][];
  letters: string[][];
  validatedCells: (boolean | undefined)[][] | null;
  clueOrientation: "across" | "down";
  activeClueNumber: number | null;
  activeCell: [number, number] | null;
  clues: {
    Across: { [key: number]: string };
    Down: { [key: number]: string };
  };
  clueText: string;
}
