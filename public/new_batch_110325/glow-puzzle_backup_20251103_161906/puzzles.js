// Puzzle definitions and generator
export function generatePuzzles() {
  const puzzles = [];
  
  // Level 1: Simple 3x3 grids - Easy introductory puzzles
  
  // Puzzle 1: Simple square cycle (all even degrees)
  puzzles.push({
    rows: 3, cols: 3,
    connections: [[0,1], [1,2], [2,5], [5,8], [8,7], [7,6], [6,3], [3,0]]
  });
  
  // Puzzle 2: Simple path with cross (2 odd degrees at ends)
  puzzles.push({
    rows: 3, cols: 3,
    connections: [[0,1], [1,2], [1,4], [4,5], [5,2]]
  });
  
  // Puzzle 3: Path with diagonal feel (2 odd degrees)
  puzzles.push({
    rows: 3, cols: 3,
    connections: [[0,1], [1,2], [0,3], [3,4], [4,5], [5,2], [4,1]]
  });
  
  // Level 2: More complex 3x3 grids
  
  // Puzzle 4: Cross pattern (2 odd degrees) - FIXED
  puzzles.push({
    rows: 3, cols: 3,
    connections: [[0,1], [1,2], [2,5], [5,4], [4,7], [7,6], [6,3], [3,4], [4,1]]
  });
  
  // Puzzle 5: More connections (all even degrees - cycle)
  puzzles.push({
    rows: 3, cols: 3,
    connections: [[0,1], [1,2], [2,5], [5,4], [4,3], [3,0], [3,6], [6,7], [7,4], [4,1]]
  });
  
  // Level 3: 4x3 grids
  
  // Puzzle 6: Simple 4x3 path
  puzzles.push({
    rows: 3, cols: 4,
    connections: [[0,1], [1,2], [2,3], [3,7], [7,11], [11,10], [10,9], [9,8], [8,4], [4,0], [4,5], [5,6], [6,7]]
  });
  
  // Puzzle 7: 4x3 with more complexity (2 odd degrees) - FIXED
  puzzles.push({
    rows: 3, cols: 4,
    connections: [[0,4], [4,8], [8,9], [9,10], [10,11], [11,7], [7,3], [3,2], [2,1], [1,0], [5,9], [5,6], [6,10]]
  });
  
  // Level 4: 4x4 grids
  
  // Puzzle 8: 4x4 rectangular cycle
  puzzles.push({
    rows: 4, cols: 4,
    connections: [[0,1], [1,2], [2,3], [3,7], [7,11], [11,15], [15,14], [14,13], [13,12], [12,8], [8,4], [4,0], [4,5], [5,6], [6,7], [5,9], [9,10], [10,6], [9,13]]
  });
  
  // Puzzle 9: Complex 4x4 path (2 odd degrees)
  puzzles.push({
    rows: 4, cols: 4,
    connections: [[0,1], [1,2], [2,3], [0,4], [4,5], [5,6], [6,7], [3,7], [4,8], [8,9], [9,10], [10,11], [7,11], [8,12], [12,13], [13,14], [14,15], [11,15], [9,13], [5,9], [6,10]]
  });
  
  // Level 5: Final challenging puzzles
  
  // Puzzle 10: Complex 4x4 (all even - cycle)
  puzzles.push({
    rows: 4, cols: 4,
    connections: [[0,1], [1,2], [2,3], [3,7], [7,6], [6,5], [5,4], [4,0], [1,5], [5,9], [9,13], [13,14], [14,10], [10,6], [6,2], [9,10], [8,9], [8,12], [12,13], [4,8], [10,11], [11,15], [15,14]]
  });
  
  return puzzles;
}

export function getDotPosition(index, rows, cols, gridWidth, gridHeight, offsetX, offsetY) {
  const row = Math.floor(index / cols);
  const col = index % cols;
  const x = offsetX + col * (gridWidth / (cols - 1));
  const y = offsetY + row * (gridHeight / (rows - 1));
  return { x, y, row, col };
}

export function areTouching(dot1, dot2, rows, cols) {
  const row1 = Math.floor(dot1 / cols);
  const col1 = dot1 % cols;
  const row2 = Math.floor(dot2 / cols);
  const col2 = dot2 % cols;
  
  const rowDiff = Math.abs(row1 - row2);
  const colDiff = Math.abs(col1 - col2);
  
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}