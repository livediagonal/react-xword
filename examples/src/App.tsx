import React, { useState } from "react";
import { CrosswordSolver } from "react-xword";

const App: React.FC = () => {
  const [ipuzData, setIpuzData] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        try {
          // Parse the content to validate it's valid JSON
          JSON.parse(content);
          setIpuzData(content);
        } catch (err) {
          alert("Invalid ipuz file. Please make sure it contains valid JSON.");
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      {!ipuzData ? (
        <>
          <h1>Crossword Solver Example</h1>
          <div style={{ marginBottom: "2rem" }}>
            <input
              type="file"
              accept=".ipuz"
              onChange={handleFileUpload}
              style={{ marginBottom: "1rem" }}
            />
          </div>
        </>
      ) : (
        <CrosswordSolver ipuzPath={ipuzData} />
      )}
    </div>
  );
};

export default App;
