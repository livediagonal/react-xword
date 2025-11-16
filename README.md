# React Crossword Solver

A React component for solving crossword puzzles, supporting the iPuz format.

## Features

- Interactive crossword grid with keyboard and mouse support
- Mobile-friendly with virtual keyboard
- Smart navigation that automatically moves to the next empty cell
- Support for checking answers and revealing solutions
- Timer functionality
- Responsive design that works on all devices
- Support for iPuz format puzzles

## Navigation Behavior

The crossword solver features intelligent navigation that helps you move through the puzzle efficiently:

1. **Filling Empty Cells**:
   - When you fill in the last empty cell of an answer, the cursor automatically advances to the next clue
   - If you fill in a cell but there are still other empty cells in the answer, the cursor moves to the next cell in the current answer

2. **Replacing Letters**:
   - When you replace a letter in the middle of an answer, you stay in the current answer
   - If you replace a letter in the last cell and the answer becomes complete, the cursor advances to the next clue

3. **End of Answer Behavior**:
   - If you reach the end of an incomplete answer, the cursor cycles back to the first empty cell in that answer
   - If you reach the end of a complete answer, the cursor advances to the next clue

4. **Orientation Changes**:
   - When you complete the last answer in one orientation (across/down), the cursor automatically switches to the other orientation
   - The cursor always moves to the first empty cell of the next answer

This navigation system ensures a smooth solving experience by automatically guiding you to the next cell that needs attention.

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
| `onComplete`      | `(completionTime: number, grid: (string \| null)[][]) => void`  | Called when the puzzle is solved and the success modal is about to be shown. Receives the completion time in seconds and the completed grid. |
| `leftNavElements` | `React.ReactNode`                   | Elements to display in the left side of the actions bar. |
| `onStart`         | `() => void \| string \| Promise<void \| string>` | Called when the user starts the puzzle (dismisses the splash modal). Can optionally return a timestamp string (e.g., from SQLite's CURRENT_TIMESTAMP) to use as the timer start time. If no timestamp is returned, the timer starts from when the callback completes. |
| `isComplete`      | `boolean`                           | If true, the puzzle is shown as completed and locked. |

### Completion Hooks

- **onComplete**: Fires when the puzzle is solved and the success modal is about to be shown. Receives the completion time in seconds and the completed grid where filled cells contain letters and empty/blocked cells are `null`.

## Examples

### Basic Usage
```tsx
<CrosswordSolver ipuzData={puzzle} />
```

### With Completion Callback
```tsx
<CrosswordSolver 
  ipuzData={puzzle} 
  onComplete={(time, grid) => {
    console.log(`Completed in ${time} seconds!`);
    console.log('Final grid:', grid);
  }}
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