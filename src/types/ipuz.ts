export interface IPuzDimensions {
    width: number;
    height: number;
}

export interface IPuzCell {
    cell?: number;
    style?: {
        shapebg?: string;
    };
    value?: string;
}

export type IPuzGrid = (IPuzCell | string | number | null)[][];

export interface IPuzClue {
    number: number;
    clue: string;
    answer?: string;
    format?: string;
}

export interface IPuzClues {
    Across: [number, string][];
    Down: [number, string][];
}

export interface IPuzMetadata {
    title?: string;
    author?: string;
    editor?: string;
    copyright?: string;
    publisher?: string;
    date?: string;
    notes?: string;
}

export interface IPuzPuzzle {
    version: string;
    kind: string[];
    dimensions: IPuzDimensions;
    puzzle: IPuzGrid;
    clues: IPuzClues;
    solution?: string[][];
    metadata?: IPuzMetadata;
} 