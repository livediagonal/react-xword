# React Crossword Solver

A React component for solving crossword puzzles, supporting the iPuz format.

## Features

- Interactive crossword grid
- Support for iPuz format puzzles
- Mobile-friendly with virtual keyboard
- Save progress automatically
- Check answers and reveal solutions
- Responsive design

## Installation

```bash
npm install react-xword
```

## Usage

```tsx
import React from 'react';
import CrosswordSolver from 'react-xword';
import { IPuzPuzzle } from 'react-xword/types';

const puzzle: IPuzPuzzle = {
  version: "http://ipuz.org/v1",
  kind: ["http://ipuz.org/crossword#1"],
  dimensions: {
    width: 5,
    height: 5
  },
  puzzle: [
    [{ cell: 1 }, { cell: 2 }, { cell: 3 }, { cell: 4 }, { cell: 5 }],
    [{ cell: 6 }, null, null, null, { cell: 7 }],
    [{ cell: 8 }, null, null, null, { cell: 9 }],
    [{ cell: 10 }, null, null, null, { cell: 11 }],
    [{ cell: 12 }, { cell: 13 }, { cell: 14 }, { cell: 15 }, { cell: 16 }]
  ],
  clues: {
    Across: [
      { number: 1, clue: "First across clue" },
      { number: 6, clue: "Second across clue" },
      { number: 8, clue: "Third across clue" },
      { number: 10, clue: "Fourth across clue" },
      { number: 12, clue: "Fifth across clue" }
    ],
    Down: [
      { number: 1, clue: "First down clue" },
      { number: 2, clue: "Second down clue" },
      { number: 3, clue: "Third down clue" },
      { number: 4, clue: "Fourth down clue" },
      { number: 5, clue: "Fifth down clue" }
    ]
  },
  solution: {
    grid: [
      ["H", "E", "L", "L", "O"],
      ["W", "", "", "", "O"],
      ["R", "", "", "", "R"],
      ["L", "", "", "", "L"],
      ["D", "W", "O", "R", "D"]
    ]
  },
  metadata: {
    title: "Example Crossword",
    author: "Crossword Creator",
    date: "2024-03-20"
  }
};

const App: React.FC = () => {
  return <CrosswordSolver ipuzData={puzzle} />;
};

export default App;
```

## iPuz Format

The component accepts puzzles in the iPuz format. The `IPuzPuzzle` type is defined as follows:

```typescript
interface IPuzDimensions {
  width: number;
  height: number;
}

interface IPuzCell {
  cell?: number;
  style?: {
    shapebg?: string;
  };
  value?: string;
}

type IPuzGrid = (IPuzCell | string | null)[][];

interface IPuzClue {
  number: number;
  clue: string;
  answer?: string;
  format?: string;
}

interface IPuzClues {
  Across: IPuzClue[];
  Down: IPuzClue[];
}

interface IPuzSolution {
  grid: string[][];
}

interface IPuzMetadata {
  title?: string;
  author?: string;
  editor?: string;
  copyright?: string;
  publisher?: string;
  date?: string;
  notes?: string;
}

interface IPuzPuzzle {
  version: string;
  kind: string[];
  dimensions: IPuzDimensions;
  puzzle: IPuzGrid;
  clues: IPuzClues;
  solution?: IPuzSolution;
  metadata?: IPuzMetadata;
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| ipuzData | IPuzPuzzle | Yes | The crossword puzzle data in iPuz format |

## Styling

The component uses CSS modules for styling. You can override the default styles by importing the CSS file and modifying the classes:

```css
.solver-container {
  /* Your custom styles */
}

.solver-grid {
  /* Your custom styles */
}

/* ... other classes ... */
```

## License

MIT
