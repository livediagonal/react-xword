import { describe, it, expect } from "@jest/globals";
import {
  findNextNumericClue,
  findFirstEmptyCellInClue,
  calculateClueNumbers,
} from "../utils";

describe("Navigation Functions - Bug Fix Tests", () => {
  // Simple 5x6 grid for testing:
  //   1  2  3  #  4  5
  //   6  #  #  #  7  #
  //   8  #  9 10  .  #
  //   #  # 11  # 12  #
  //   #  # 13  # 14  #
  const createGrid = (): boolean[][] => {
    return [
      [false, false, false, true, false, false],
      [false, true, true, true, false, true],
      [false, true, false, false, false, true],
      [true, true, false, true, false, true],
      [true, true, false, true, false, true],
    ];
  };

  const createEmptyLetters = (): string[][] => {
    return [
      ["", "", "", "", "", ""],
      ["", "", "", "", "", ""],
      ["", "", "", "", "", ""],
      ["", "", "", "", "", ""],
      ["", "", "", "", "", ""],
    ];
  };

  describe("findNextNumericClue - core bug fix", () => {
    it("should skip a full clue and find the next empty clue in same orientation", () => {
      const grid = createGrid();
      const letters = createEmptyLetters();
      const clueNumbers = calculateClueNumbers(grid, 5, 6);

      // Fill clue 4 across (row 0, cols 4-5)
      letters[0][4] = "A";
      letters[0][5] = "B";

      // Navigate from clue 1 across
      const result = findNextNumericClue(
        1, // current clue (1 across)
        "across",
        grid,
        letters,
        clueNumbers,
        5,
        6,
      );

      expect(result).not.toBeNull();
      // Should skip clue 4 (full) and find clue 6 (next across clue)
      expect(result?.clueNumber).toBe(6);
      expect(result?.orientation).toBe("across");
    });

    it("should navigate to first empty cell in partially filled clue", () => {
      const grid = createGrid();
      const letters = createEmptyLetters();
      const clueNumbers = calculateClueNumbers(grid, 5, 6);

      // Partially fill clue 4 across (row 0, cols 4-5)
      letters[0][4] = "A";
      // letters[0][5] is empty

      const result = findNextNumericClue(
        1,
        "across",
        grid,
        letters,
        clueNumbers,
        5,
        6,
      );

      expect(result).not.toBeNull();
      expect(result?.clueNumber).toBe(4);
      expect(result?.orientation).toBe("across");
      // Should navigate to the empty cell [0, 5], not the start [0, 4]
      expect(result?.cell).toEqual([0, 5]);
    });

    it("should switch orientation when all clues in current orientation are full", () => {
      const grid = createGrid();
      const letters = createEmptyLetters();
      const clueNumbers = calculateClueNumbers(grid, 5, 6);

      // Fill all across clues except the last few: 1, 4, 6, 7
      // This leaves down clues empty
      // Clue 1 (row 0, cols 0-2)
      letters[0][0] = "A";
      letters[0][1] = "B";
      letters[0][2] = "C";
      // Clue 4 (row 0, cols 4-5)
      letters[0][4] = "D";
      letters[0][5] = "E";
      // Clue 6 (row 1, col 0)
      letters[1][0] = "F";
      // Clue 7 (row 1, col 4)
      letters[1][4] = "G";

      const result = findNextNumericClue(
        1,
        "across",
        grid,
        letters,
        clueNumbers,
        5,
        6,
      );

      expect(result).not.toBeNull();
      // Should skip to clue 8 (next empty across clue after 1, 4, 6, 7)
      expect(result?.clueNumber).toBe(8);
      expect(result?.orientation).toBe("across");
    });

    it("should skip multiple full clues to find an empty one", () => {
      const grid = createGrid();
      const letters = createEmptyLetters();
      const clueNumbers = calculateClueNumbers(grid, 5, 6);

      // Fill clues 4 and 6 across
      letters[0][4] = "A";
      letters[0][5] = "B";
      letters[1][0] = "C";

      const result = findNextNumericClue(
        1,
        "across",
        grid,
        letters,
        clueNumbers,
        5,
        6,
      );

      expect(result).not.toBeNull();
      // Should skip 4 and 6 (both full) and find 7 (next empty across clue)
      expect(result?.clueNumber).toBe(7);
      expect(result?.orientation).toBe("across");
    });
  });

  describe("findFirstEmptyCellInClue", () => {
    it("should return null for a completely filled clue", () => {
      const grid = createGrid();
      const letters = createEmptyLetters();
      const clueNumbers = calculateClueNumbers(grid, 5, 6);

      // Fill clue 1 completely (row 0, cols 0-2)
      letters[0][0] = "A";
      letters[0][1] = "B";
      letters[0][2] = "C";

      const result = findFirstEmptyCellInClue(
        1,
        "across",
        grid,
        letters,
        clueNumbers,
        5,
        6,
      );

      expect(result).toBeNull();
    });

    it("should return first empty cell in partially filled clue", () => {
      const grid = createGrid();
      const letters = createEmptyLetters();
      const clueNumbers = calculateClueNumbers(grid, 5, 6);

      // Partially fill clue 1 (row 0, cols 0-2)
      letters[0][0] = "A";
      // letters[0][1] is empty
      letters[0][2] = "C";

      const result = findFirstEmptyCellInClue(
        1,
        "across",
        grid,
        letters,
        clueNumbers,
        5,
        6,
      );

      expect(result).toEqual([0, 1]);
    });
  });
});
