// Automated testing controller
import { gameState } from './globals.js';
import { areTouching } from './puzzles.js';

function getTestBasicAction(gameState) {
  // Random movement and occasional connection attempts
  const actions = [37, 38, 39, 40]; // Arrow keys
  
  // Occasionally press space to try connections
  if (Math.random() < 0.2) {
    return 32; // Space
  }
  
  // Occasionally undo
  if (Math.random() < 0.05 && gameState.currentPath.length > 0) {
    return 16; // Shift
  }
  
  // Random movement
  return actions[Math.floor(Math.random() * actions.length)];
}

function getTestWinAction(gameState) {
  // Solve puzzle using DFS with backtracking
  if (!gameState.puzzleData) return null;
  
  const { rows, cols, connections } = gameState.puzzleData;
  const totalDots = rows * cols;
  
  // Build adjacency graph
  const graph = new Map();
  for (let i = 0; i < totalDots; i++) {
    graph.set(i, []);
  }
  
  for (const [dot1, dot2] of connections) {
    graph.get(dot1).push(dot2);
    graph.get(dot2).push(dot1);
  }
  
  // If path is empty, navigate to a good starting position
  if (gameState.currentPath.length === 0) {
    // Find nodes with odd degree (Eulerian path endpoints)
    let targetDot = 0;
    for (let i = 0; i < totalDots; i++) {
      if (graph.get(i).length % 2 === 1) {
        targetDot = i;
        break;
      }
    }
    
    const targetRow = Math.floor(targetDot / cols);
    const targetCol = targetDot % cols;
    
    if (gameState.cursorPosition.row < targetRow) return 40; // DOWN
    if (gameState.cursorPosition.row > targetRow) return 38; // UP
    if (gameState.cursorPosition.col < targetCol) return 39; // RIGHT
    if (gameState.cursorPosition.col > targetCol) return 37; // LEFT
    
    return 32; // Space to start
  }
  
  // Find next move using greedy approach
  const currentDot = gameState.currentPath[gameState.currentPath.length - 1];
  const neighbors = graph.get(currentDot);
  
  // Find unvisited valid connection
  for (const neighbor of neighbors) {
    const connKey = `${Math.min(currentDot, neighbor)}-${Math.max(currentDot, neighbor)}`;
    if (!gameState.completedConnections.has(connKey)) {
      // Navigate to this neighbor
      const currentRow = Math.floor(currentDot / cols);
      const currentCol = currentDot % cols;
      const neighborRow = Math.floor(neighbor / cols);
      const neighborCol = neighbor % cols;
      
      if (neighborRow > currentRow) {
        gameState.cursorPosition = { row: neighborRow, col: neighborCol };
        return 32; // Space
      }
      if (neighborRow < currentRow) {
        gameState.cursorPosition = { row: neighborRow, col: neighborCol };
        return 32; // Space
      }
      if (neighborCol > currentCol) {
        gameState.cursorPosition = { row: neighborRow, col: neighborCol };
        return 32; // Space
      }
      if (neighborCol < currentCol) {
        gameState.cursorPosition = { row: neighborRow, col: neighborCol };
        return 32; // Space
      }
    }
  }
  
  // Backtrack if stuck
  if (gameState.currentPath.length > 1) {
    return 16; // Shift (undo)
  }
  
  return 90; // Z (reset)
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return null;
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;