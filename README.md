# react-xword

A React component library for solving crossword puzzles.

## Features

- Solve crossword puzzles
- Import puzzles in IPUZ format
- Keyboard navigation
- Responsive design

## Installation

```bash
npm install react-xword
# or
yarn add react-xword
```

## Usage

### Basic Usage

```jsx
import React from "react";
import { CrosswordSolver } from "react-xword";

function App() {
  return (
    <div>
      <h1>My Crossword Puzzle</h1>
      <CrosswordSolver ipuzPath="/path/to/puzzle.ipuz" />
    </div>
  );
}

export default App;
```

#### Props

- `ipuzPath`: Path to an IPUZ file to load

### CrosswordGrid

Component for displaying and interacting with a crossword grid.

#### Props

- `rows`: Number of rows in the grid
- `columns`: Number of columns in the grid
- `grid`: 2D array of booleans representing black cells
- `letters`: 2D array of strings representing letters in cells
- `onCellToggle`: Function to call when a cell is toggled (for editor mode)
- `onLetterChange`: Function to call when a letter is changed
- `clueOrientation`: "across" or "down"
- `activeClueNumber`: Currently active clue number
- `onClueOrientationChange`: Function to call when clue orientation changes
- `onCellClick`: Function to call when a cell is clicked
- `activeCell`: Currently active cell [row, col]
- `storageKey`: Optional key for localStorage persistence

## License

MIT
