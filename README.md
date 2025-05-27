# React Crossword Solver

A React component for solving crossword puzzles, supporting the iPuz format.

## Features

- Interactive crossword grid
- Support for iPuz format puzzles
- Mobile-friendly with virtual keyboard
- Save progress automatically
- Check answers and reveal solutions
- Responsive design
- Smart navigation that ensures all squares in an answer are filled before moving to the next clue

## Navigation Behavior

The crossword solver includes smart navigation features to help you complete the puzzle efficiently:

- When filling in an answer, the cursor automatically moves to the next empty square
- If you reach the end of a word and there are still empty squares earlier in the answer, the cursor will cycle back to the first empty square
- Only when all squares in the current answer are filled will it automatically advance to the next clue
- When you reach the end of the clue list in one orientation (across/down), it will automatically switch to the other orientation and continue from the beginning

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
  solution?: string[][];
  metadata?: IPuzMetadata;
}
```

## Props

| Prop              | Type                                | Description |
|-------------------|-------------------------------------|-------------|
| `ipuzData`        | `IPuzPuzzle`                        | The puzzle data in IPuz format. |
| `onComplete`      | `(completionTime: number) => void`  | Called when the puzzle is solved and the success modal is about to be shown. Receives the completion time in seconds. |
| `leftNavElements` | `React.ReactNode`                   | Elements to display in the left side of the actions bar. |
| `onStart`         | `() => void`                        | Called when the user starts the puzzle (dismisses the splash modal). |
| `isComplete`      | `boolean`                           | If true, the puzzle is shown as completed and locked. |

### Completion Hooks

- **onComplete**: Fires when the puzzle is solved and the success modal is about to be shown. Receives the completion time in seconds.

## Examples

### Basic Usage
```tsx
<CrosswordSolver ipuzData={puzzle} />
```

### With Completion Callback
```tsx
<CrosswordSolver 
  ipuzData={puzzle} 
  onComplete={(time) => console.log(`Completed in ${time} seconds!`)}
/>
```

### With Left Nav Elements
```tsx
<CrosswordSolver 
  ipuzData={puzzle}
  leftNavElements={
    <div className="custom-nav">
      <button onClick={() => console.log('Custom action')}>
        Custom Button
      </button>
      <span>Custom Text</span>
    </div>
  }
/>
```

### With Start Callback
```tsx
<CrosswordSolver 
  ipuzData={puzzle}
  onStart={() => console.log('Puzzle started!')}
/>
```

### With Complete/Locked State
```tsx
<CrosswordSolver 
  ipuzData={puzzle}
  isComplete={true}
/>
```

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