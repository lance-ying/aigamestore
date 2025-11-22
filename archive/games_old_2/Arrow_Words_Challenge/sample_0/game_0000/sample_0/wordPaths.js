// wordPaths.js - Functions to find word paths from clues

export function findWordPath(grid, clueRow, clueCol, direction, solution) {
  const path = [];
  const gridSize = { rows: grid.length, cols: grid[0].length };
  
  let row = clueRow;
  let col = clueCol;
  
  if (direction === 'right') {
    // Move right from clue cell
    col++;
    while (col < gridSize.cols && grid[row][col].type !== 'blocked' && grid[row][col].type !== 'clue') {
      path.push({ row, col, letter: solution[row][col] });
      col++;
    }
  } else if (direction === 'down') {
    // Move down from clue cell
    row++;
    while (row < gridSize.rows && grid[row][col].type !== 'blocked' && grid[row][col].type !== 'clue') {
      path.push({ row, col, letter: solution[row][col] });
      row++;
    }
  }
  
  return path;
}

export function findAllWordPaths(level) {
  const paths = [];
  const grid = level.cells;
  const solution = level.solution;
  
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const cell = grid[row][col];
      if (cell.type === 'clue') {
        const path = findWordPath(grid, row, col, cell.dir, solution);
        if (path.length > 0) {
          paths.push({
            clueRow: row,
            clueCol: col,
            direction: cell.dir,
            clueText: cell.text,
            path: path,
            answer: path.map(p => p.letter).join('')
          });
        }
      }
    }
  }
  
  return paths;
}

export function getWordPathForCell(allPaths, row, col) {
  // Find the word path that contains this cell
  for (const wordPath of allPaths) {
    for (const cell of wordPath.path) {
      if (cell.row === row && cell.col === col) {
        return wordPath;
      }
    }
  }
  return null;
}