import React from "react";
import { ClueOrientation } from "../types";

interface CrosswordControlsProps {
  rows: number;
  columns: number;
  clueOrientation: ClueOrientation;
  onRowsChange: (rows: number) => void;
  onColumnsChange: (columns: number) => void;
  onClueOrientationChange: (orientation: ClueOrientation) => void;
  onClearGrid: () => void;
  onRandomFill: () => void;
  clues: {
    Across: { [key: number]: string };
    Down: { [key: number]: string };
  };
  activeClueNumber: number | null;
  onClueTextChange: (text: string) => void;
  _clueText: string;
}

const CrosswordControls: React.FC<CrosswordControlsProps> = ({
  rows,
  columns,
  clueOrientation,
  onRowsChange,
  onColumnsChange,
  onClueOrientationChange,
  onClearGrid,
  onRandomFill,
  clues,
  activeClueNumber,
  onClueTextChange,
  _clueText,
}) => {
  return (
    <div className="mb-6 flex w-full flex-col items-center">
      {/* Grid Controls */}
      <div className="mb-6 grid w-full max-w-md grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Rows
          </label>
          <input
            type="number"
            min="3"
            max="25"
            value={rows}
            onChange={(e) => onRowsChange(parseInt(e.target.value))}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Columns
          </label>
          <input
            type="number"
            min="3"
            max="25"
            value={columns}
            onChange={(e) => onColumnsChange(parseInt(e.target.value))}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Grid Actions */}
      <div className="mb-6 flex w-full max-w-md justify-center space-x-4">
        <button
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          onClick={onClearGrid}
        >
          Clear Grid
        </button>
        <button
          className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          onClick={onRandomFill}
        >
          Random Fill
        </button>
      </div>

      {/* Clue Controls */}
      <div className="mb-6 w-full max-w-md">
        <div className="mb-4 flex space-x-4">
          <button
            className={`rounded px-4 py-2 ${
              clueOrientation === "across"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
            onClick={() => onClueOrientationChange("across")}
          >
            Across
          </button>
          <button
            className={`rounded px-4 py-2 ${
              clueOrientation === "down"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
            onClick={() => onClueOrientationChange("down")}
          >
            Down
          </button>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-lg font-semibold">Across</h3>
            <div className="max-h-60 overflow-y-auto">
              {Object.entries(clues.Across).map(([number, text]) => (
                <div
                  key={`across-${number}`}
                  className={`mb-1 cursor-pointer hover:bg-gray-100 p-1 rounded ${
                    activeClueNumber === parseInt(number) &&
                    clueOrientation === "across"
                      ? "bg-yellow-100 font-medium"
                      : ""
                  }`}
                >
                  <span className="font-bold">{number}.</span> {text}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold">Down</h3>
            <div className="max-h-60 overflow-y-auto">
              {Object.entries(clues.Down).map(([number, text]) => (
                <div
                  key={`down-${number}`}
                  className={`mb-1 cursor-pointer hover:bg-gray-100 p-1 rounded ${
                    activeClueNumber === parseInt(number) &&
                    clueOrientation === "down"
                      ? "bg-yellow-100 font-medium"
                      : ""
                  }`}
                >
                  <span className="font-bold">{number}.</span> {text}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Clue Text
          </label>
          <input
            type="text"
            value={_clueText}
            onChange={(e) => onClueTextChange(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Enter clue text..."
          />
        </div>
      </div>
    </div>
  );
};

export default CrosswordControls;
