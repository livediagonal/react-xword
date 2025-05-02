import React, { useState, useEffect } from "react";
import CrosswordSolver from "../../src/components/CrosswordSolver";
import { IPuzPuzzle } from "../../src/types/ipuz";

const App: React.FC = () => {
  const [ipuzData, setIpuzData] = useState<IPuzPuzzle | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load the example puzzle
    fetch('/example.ipuz')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Loaded puzzle data:', data);
        // Validate the data matches our IPuzPuzzle type
        if (isValidIpuzPuzzle(data)) {
          setIpuzData(data);
        } else {
          console.error('Invalid puzzle data:', data);
          setError('Invalid puzzle format');
        }
      })
      .catch(err => {
        console.error('Error loading puzzle:', err);
        setError('Failed to load puzzle: ' + err.message);
      });
  }, []);

  const isValidIpuzPuzzle = (data: any): data is IPuzPuzzle => {
    try {
      // Basic structure validation
      if (!data || typeof data !== 'object') {
        console.error('Invalid data: not an object');
        return false;
      }

      // Check required fields
      const requiredFields = ['version', 'kind', 'dimensions', 'puzzle', 'clues'];
      for (const field of requiredFields) {
        if (!(field in data)) {
          console.error(`Missing required field: ${field}`);
          return false;
        }
      }

      // Validate dimensions
      if (!data.dimensions || typeof data.dimensions.width !== 'number' || typeof data.dimensions.height !== 'number') {
        console.error('Invalid dimensions');
        return false;
      }

      // Validate puzzle grid
      if (!Array.isArray(data.puzzle) || data.puzzle.length !== data.dimensions.height) {
        console.error('Invalid puzzle grid height');
        return false;
      }

      for (const row of data.puzzle) {
        if (!Array.isArray(row) || row.length !== data.dimensions.width) {
          console.error('Invalid puzzle grid width');
          return false;
        }
      }

      // Validate clues
      if (!data.clues || !Array.isArray(data.clues.Across) || !Array.isArray(data.clues.Down)) {
        console.error('Invalid clues structure');
        return false;
      }

      return true;
    } catch (e) {
      console.error('Validation error:', e);
      return false;
    }
  };

  return (
    <div style={{
      maxWidth: "100%",
      boxSizing: "border-box",
      width: "100%"
    }}>
      {error ? (
        <div style={{ color: 'red', padding: '1rem' }}>
          Error: {error}
        </div>
      ) : !ipuzData ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          Loading puzzle...
        </div>
      ) : (
        <CrosswordSolver ipuzData={ipuzData} onStart={() => console.log('Start')} onComplete={() => console.log('Complete')} />
      )}
    </div>
  );
};

export default App;
