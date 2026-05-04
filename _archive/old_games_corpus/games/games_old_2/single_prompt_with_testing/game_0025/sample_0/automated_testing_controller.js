import { gameState, GAME_CONFIG } from './globals.js';

function getTestBasicAction(gameState) {
  // Basic random testing
  const actions = [];
  
  // Random movement
  const moveRand = Math.random();
  if (moveRand < 0.25) actions.push(37); // LEFT
  else if (moveRand < 0.5) actions.push(39); // RIGHT
  else if (moveRand < 0.75) actions.push(38); // UP
  else actions.push(40); // DOWN
  
  // Random action
  if (Math.random() < 0.3) {
    if (Math.random() < 0.7) {
      actions.push(32); // SPACE - reveal
    } else {
      actions.push(90); // Z - flag
    }
  }
  
  return actions;
}

function getTestWinAction(gameState) {
  // Intelligent solver using logical deduction
  const { grid, cursorX, cursorY, firstClick } = gameState;
  const { rows, cols } = GAME_CONFIG;
  
  if (!grid || grid.length === 0) return [];
  
  // First click - start at a corner (statistically safer)
  if (firstClick) {
    const targetX = 0;
    const targetY = 0;
    
    if (cursorX !== targetX || cursorY !== targetY) {
      return moveTowards(cursorX, cursorY, targetX, targetY);
    }
    return [32]; // SPACE to reveal
  }
  
  // Analyze the board and find definite safe cells and mines
  const analysis = analyzeBoard(grid, rows, cols);
  
  // First, flag all definite mines
  if (analysis.definiteMines.length > 0) {
    for (const mine of analysis.definiteMines) {
      if (!grid[mine.row][mine.col].flagged) {
        const actions = moveTowards(cursorX, cursorY, mine.col, mine.row);
        if (actions.length > 0) return actions;
        return [90]; // Z to flag
      }
    }
  }
  
  // Then, reveal all definite safe cells
  if (analysis.definiteSafe.length > 0) {
    for (const safe of analysis.definiteSafe) {
      if (!grid[safe.row][safe.col].revealed) {
        const actions = moveTowards(cursorX, cursorY, safe.col, safe.row);
        if (actions.length > 0) return actions;
        return [32]; // SPACE to reveal
      }
    }
  }
  
  // Check for quick-open opportunities
  const quickOpenCell = findQuickOpenOpportunity(grid, rows, cols);
  if (quickOpenCell) {
    const actions = moveTowards(cursorX, cursorY, quickOpenCell.col, quickOpenCell.row);
    if (actions.length > 0) return actions;
    return [32]; // SPACE to quick-open
  }
  
  // If no definite moves, find the safest unrevealed cell
  const safestCell = findSafestCell(grid, rows, cols);
  if (safestCell) {
    const actions = moveTowards(cursorX, cursorY, safestCell.col, safestCell.row);
    if (actions.length > 0) return actions;
    return [32]; // SPACE to reveal
  }
  
  // Fallback: random safe-looking move
  return getTestBasicAction(gameState);
}

function analyzeBoard(grid, rows, cols) {
  const definiteSafe = [];
  const definiteMines = [];
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cell = grid[row][col];
      
      if (!cell.revealed || cell.adjacentMines === 0) continue;
      
      const neighbors = getNeighbors(row, col, rows, cols);
      const unrevealed = neighbors.filter(n => !grid[n.row][n.col].revealed);
      const flagged = neighbors.filter(n => grid[n.row][n.col].flagged);
      const unflaggedUnrevealed = unrevealed.filter(n => !grid[n.row][n.col].flagged);
      
      // All remaining unrevealed neighbors are mines
      if (unflaggedUnrevealed.length > 0 && 
          flagged.length + unflaggedUnrevealed.length === cell.adjacentMines) {
        for (const n of unflaggedUnrevealed) {
          if (!definiteMines.some(m => m.row === n.row && m.col === n.col)) {
            definiteMines.push(n);
          }
        }
      }
      
      // All mines are flagged, remaining unrevealed are safe
      if (unflaggedUnrevealed.length > 0 && flagged.length === cell.adjacentMines) {
        for (const n of unflaggedUnrevealed) {
          if (!definiteSafe.some(s => s.row === n.row && s.col === n.col)) {
            definiteSafe.push(n);
          }
        }
      }
    }
  }
  
  return { definiteSafe, definiteMines };
}

function findQuickOpenOpportunity(grid, rows, cols) {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cell = grid[row][col];
      
      if (!cell.revealed || cell.adjacentMines === 0) continue;
      
      const neighbors = getNeighbors(row, col, rows, cols);
      const flagged = neighbors.filter(n => grid[n.row][n.col].flagged);
      const unflaggedUnrevealed = neighbors.filter(n => 
        !grid[n.row][n.col].revealed && !grid[n.row][n.col].flagged
      );
      
      // Can quick-open if flags match number and there are unrevealed neighbors
      if (flagged.length === cell.adjacentMines && unflaggedUnrevealed.length > 0) {
        return { row, col };
      }
    }
  }
  return null;
}

function findSafestCell(grid, rows, cols) {
  // Find unrevealed, unflagged cells adjacent to revealed areas
  const candidates = [];
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cell = grid[row][col];
      
      if (cell.revealed || cell.flagged) continue;
      
      const neighbors = getNeighbors(row, col, rows, cols);
      const revealedNeighbors = neighbors.filter(n => grid[n.row][n.col].revealed);
      
      if (revealedNeighbors.length > 0) {
        // Calculate risk score (lower is better)
        let riskScore = 0;
        for (const n of revealedNeighbors) {
          const nCell = grid[n.row][n.col];
          if (nCell.adjacentMines > 0) {
            const nNeighbors = getNeighbors(n.row, n.col, rows, cols);
            const nUnrevealed = nNeighbors.filter(nn => !grid[nn.row][nn.col].revealed);
            const nFlagged = nNeighbors.filter(nn => grid[nn.row][nn.col].flagged);
            const remainingMines = nCell.adjacentMines - nFlagged.length;
            const remainingCells = nUnrevealed.length - nFlagged.length;
            if (remainingCells > 0) {
              riskScore += remainingMines / remainingCells;
            }
          }
        }
        
        candidates.push({ row, col, risk: riskScore / revealedNeighbors.length });
      }
    }
  }
  
  if (candidates.length === 0) {
    // No adjacent cells, pick any unrevealed cell
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (!grid[row][col].revealed && !grid[row][col].flagged) {
          return { row, col };
        }
      }
    }
    return null;
  }
  
  // Return cell with lowest risk
  candidates.sort((a, b) => a.risk - b.risk);
  return candidates[0];
}

function getNeighbors(row, col, rows, cols) {
  const neighbors = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const newRow = row + dr;
      const newCol = col + dc;
      if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
        neighbors.push({ row: newRow, col: newCol });
      }
    }
  }
  return neighbors;
}

function moveTowards(currentX, currentY, targetX, targetY) {
  const actions = [];
  
  if (currentX < targetX) actions.push(39); // RIGHT
  else if (currentX > targetX) actions.push(37); // LEFT
  else if (currentY < targetY) actions.push(40); // DOWN
  else if (currentY > targetY) actions.push(38); // UP
  
  return actions;
}

export function get_automated_testing_action(gameState) {
  if (gameState.gamePhase !== "PLAYING") return [];
  
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return [];
  }
}

if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;