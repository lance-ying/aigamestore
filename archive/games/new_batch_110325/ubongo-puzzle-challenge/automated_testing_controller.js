// Automated testing controller
import { gameState } from './globals.js';
import { isValidPlacement } from './puzzle.js';

function findBestPlacement(piece, board, targetCells) {
  // Try all rotations and flips
  const configurations = [];
  
  for (let rotation = 0; rotation < 4; rotation++) {
    for (let flip = 0; flip < 2; flip++) {
      // Try all positions
      for (const targetCell of targetCells) {
        piece.x = targetCell.x;
        piece.y = targetCell.y;
        
        if (isValidPlacement(piece, board, targetCells)) {
          configurations.push({
            x: piece.x,
            y: piece.y,
            rotation: piece.rotation,
            flipped: piece.flipped,
            score: calculatePlacementScore(piece, targetCells)
          });
        }
      }
      
      if (flip === 0) {
        piece.flip();
      }
    }
    if (rotation < 3) {
      piece.rotate();
    }
  }
  
  // Sort by score and return best
  configurations.sort((a, b) => b.score - a.score);
  return configurations[0];
}

function calculatePlacementScore(piece, targetCells) {
  const cells = piece.getAbsoluteCells();
  let score = 0;
  
  // Prefer positions that cover more target cells efficiently
  for (const cell of cells) {
    const neighbors = targetCells.filter(tc => 
      Math.abs(tc.x - cell.x) + Math.abs(tc.y - cell.y) === 1
    );
    score += neighbors.length;
  }
  
  return score;
}

function getTestWinAction(gs) {
  if (gs.gamePhase !== "PLAYING") {
    return null;
  }
  
  // Find current unplaced piece
  const currentPiece = gs.pieces[gs.selectedPieceIndex];
  
  if (!currentPiece || currentPiece.placed) {
    // Select next unplaced piece
    return { key: 'z', keyCode: 90 };
  }
  
  // Find best placement for current piece
  const placement = findBestPlacement(
    currentPiece, 
    gs.puzzleBoard, 
    gs.targetCells
  );
  
  if (!placement) {
    // Try next piece if current can't be placed
    return { key: 'z', keyCode: 90 };
  }
  
  // Navigate to best position
  if (currentPiece.x < placement.x) {
    return { key: 'ArrowRight', keyCode: 39 };
  }
  if (currentPiece.x > placement.x) {
    return { key: 'ArrowLeft', keyCode: 37 };
  }
  if (currentPiece.y < placement.y) {
    return { key: 'ArrowDown', keyCode: 40 };
  }
  if (currentPiece.y > placement.y) {
    return { key: 'ArrowUp', keyCode: 38 };
  }
  
  // Adjust rotation
  const rotationDiff = (placement.rotation - currentPiece.rotation + 360) % 360;
  if (rotationDiff !== 0) {
    return { key: ' ', keyCode: 32 };
  }
  
  // Adjust flip
  if (placement.flipped !== currentPiece.flipped) {
    return { key: 'Shift', keyCode: 16 };
  }
  
  // Should be placed now, select next piece
  return { key: 'z', keyCode: 90 };
}

function getTestBasicAction(gs) {
  if (gs.gamePhase !== "PLAYING") {
    return null;
  }
  
  const actions = [
    { key: 'ArrowLeft', keyCode: 37 },
    { key: 'ArrowRight', keyCode: 39 },
    { key: 'ArrowUp', keyCode: 38 },
    { key: 'ArrowDown', keyCode: 40 },
    { key: ' ', keyCode: 32 },
    { key: 'Shift', keyCode: 16 },
    { key: 'z', keyCode: 90 }
  ];
  
  return actions[Math.floor(Math.random() * actions.length)];
}

export function get_automated_testing_action(gs) {
  switch (gs.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gs);
    case "TEST_2":
      return getTestWinAction(gs);
    default:
      return null;
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;