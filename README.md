# react-xword

A vibe-coded React component library for solving crossword puzzles.

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

### Example App

The package includes a live example app in the `examples` directory that demonstrates the library's features. The example app allows you to:

- Upload and solve IPUZ format crossword puzzles
- Test keyboard navigation
- See the component in action with a responsive layout

To run the example app locally:

```bash
# Clone the repository
git clone https://github.com/livediagonal/react-xword.git
cd react-xword

# Install dependencies
npm install

# Start the example app
npm run example
```

### Keyboard Navigation

The crossword solver supports the following keyboard shortcuts:

- **Tab**: Jump to the next clue in the current orientation (Across or Down) and select the first empty cell
- **Shift+Tab**: Jump to the previous clue in the current orientation (Across or Down) and select the first empty cell
- `Letters`: Type letters to fill in cells
- **Backspace/Delete**: Clear a cell

The navigation system intelligently selects the first empty cell in each clue, allowing for quick filling of the crossword puzzle.

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
