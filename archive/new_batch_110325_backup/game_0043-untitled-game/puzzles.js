// Puzzle definitions and generator
export function generatePuzzles() {
  const puzzles = [];
  
  // Level 1: Simple 3x3 grids
  puzzles.push({
    rows: 3, cols: 3,
    connections: [[0,1], [1,2], [0,3], [1,4], [2,5], [3,4], [4,5], [3,6], [4,7], [5,8], [6,7], [7,8]]
  });
  
  puzzles.push({
    rows: 3, cols: 3,
    connections: [[0,1], [1,2], [0,3], [3,6], [6,7], [7,8], [5,8], [2,5], [1,4], [4,7]]
  });
  
  puzzles.push({
    rows: 3, cols: 3,
    connections: [[0,1], [1,4], [4,3], [3,0], [1,2], [2,5], [5,4], [4,7], [7,6], [6,3]]
  });
  
  // Level 2: 4x3 grids
  puzzles.push({
    rows: 3, cols: 4,
    connections: [[0,1], [1,2], [2,3], [0,4], [1,5], [2,6], [3,7], [4,5], [5,6], [6,7], [4,8], [5,9], [6,10], [7,11], [8,9], [9,10], [10,11]]
  });
  
  puzzles.push({
    rows: 3, cols: 4,
    connections: [[0,1], [1,5], [5,4], [4,0], [1,2], [2,6], [6,5], [2,3], [3,7], [7,6], [5,9], [9,10], [10,6], [9,8], [10,11], [11,7]]
  });
  
  // Level 3: 4x4 grids
  puzzles.push({
    rows: 4, cols: 4,
    connections: [[0,1], [1,2], [2,3], [0,4], [1,5], [2,6], [3,7], [4,5], [5,6], [6,7], [4,8], [5,9], [6,10], [7,11], [8,9], [9,10], [10,11], [8,12], [9,13], [10,14], [11,15], [12,13], [13,14], [14,15]]
  });
  
  puzzles.push({
    rows: 4, cols: 4,
    connections: [[0,1], [1,5], [5,4], [4,8], [8,9], [9,5], [5,6], [6,10], [10,9], [6,2], [2,3], [3,7], [7,11], [11,15], [15,14], [14,10], [10,11], [11,10], [6,7]]
  });
  
  // Level 4: Complex 4x4
  puzzles.push({
    rows: 4, cols: 4,
    connections: [[0,1], [1,2], [2,3], [3,7], [7,11], [11,15], [15,14], [14,13], [13,12], [12,8], [8,4], [4,0], [4,5], [5,6], [6,7], [6,10], [10,9], [9,8], [9,13], [5,9], [1,5], [2,6], [10,14], [11,10]]
  });
  
  puzzles.push({
    rows: 4, cols: 4,
    connections: [[0,4], [4,8], [8,12], [12,13], [13,14], [14,15], [15,11], [11,7], [7,3], [3,2], [2,1], [1,0], [1,5], [5,9], [9,13], [9,10], [10,6], [6,2], [6,5], [10,11], [5,4], [10,14]]
  });
  
  // Level 5: 5x4 grids
  puzzles.push({
    rows: 4, cols: 5,
    connections: [[0,1], [1,2], [2,3], [3,4], [0,5], [1,6], [2,7], [3,8], [4,9], [5,6], [6,7], [7,8], [8,9], [5,10], [6,11], [7,12], [8,13], [9,14], [10,11], [11,12], [12,13], [13,14], [10,15], [11,16], [12,17], [13,18], [14,19], [15,16], [16,17], [17,18], [18,19]]
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