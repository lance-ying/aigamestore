// input.js - Input handling for human and test modes

import { gameState, GAME_PHASES, MOVE_SPEED, FINE_MOVE_SPEED } from './globals.js';
import { getGroupByPieceId } from './group.js';
import { checkAndSnapPieces, updateChainSnapBonus } from './snapLogic.js';

export function handleKeyPressed(p) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Global controls
  if (p.keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame(p);
    }
  } else if (p.keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        event: "pause",
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        event: "resume",
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else if (p.keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN ||
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE ||
        gameState.gamePhase === GAME_PHASES.PAUSED) {
      restartGame(p);
    }
  }
  
  // Playing controls
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    // Track key states
    if (p.keyCode === 32) gameState.keys.space = true; // SPACE
    if (p.keyCode === 16) gameState.keys.shift = true; // SHIFT
    if (p.keyCode === 90) gameState.keys.z = true; // Z
    if (p.keyCode === 37) gameState.keys.left = true;
    if (p.keyCode === 38) gameState.keys.up = true;
    if (p.keyCode === 39) gameState.keys.right = true;
    if (p.keyCode === 40) gameState.keys.down = true;
    
    // Space for selection
    if (p.keyCode === 32) {
      toggleSelection(p);
    }
    
    // Z for rotation (counter-clockwise)
    if (p.keyCode === 90 && gameState.levelData.rotationEnabled) {
      rotateSelected(p, false);
    }
  }
}

export function handleKeyReleased(p) {
  if (p.keyCode === 32) gameState.keys.space = false;
  if (p.keyCode === 16) gameState.keys.shift = false;
  if (p.keyCode === 90) gameState.keys.z = false;
  if (p.keyCode === 37) gameState.keys.left = false;
  if (p.keyCode === 38) gameState.keys.up = false;
  if (p.keyCode === 39) gameState.keys.right = false;
  if (p.keyCode === 40) gameState.keys.down = false;
}

export function updateMovement(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  if (!gameState.selectedPieceId) return;
  
  const speed = gameState.keys.shift ? FINE_MOVE_SPEED : MOVE_SPEED;
  let dx = 0, dy = 0;
  
  if (gameState.keys.left) dx -= speed;
  if (gameState.keys.right) dx += speed;
  if (gameState.keys.up) dy -= speed;
  if (gameState.keys.down) dy += speed;
  
  if (dx !== 0 || dy !== 0) {
    moveSelected(p, dx, dy);
  }
}

function toggleSelection(p) {
  if (gameState.selectedPieceId) {
    // Deselect
    const piece = gameState.entities.find(p => p.id === gameState.selectedPieceId);
    if (piece) piece.isSelected = false;
    gameState.selectedPieceId = null;
  } else {
    // Select nearest piece to cursor
    let nearest = null;
    let minDist = Infinity;
    
    for (const piece of gameState.entities) {
      // Only select root pieces (not part of a group) or entire groups
      const group = getGroupByPieceId(piece.id);
      if (group && group.pieceIds[0] !== piece.id) continue;
      
      const dist = piece.distanceToPoint(gameState.player.x, gameState.player.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = piece;
      }
    }
    
    if (nearest) {
      gameState.selectedPieceId = nearest.id;
      nearest.isSelected = true;
      gameState.player.x = nearest.x;
      gameState.player.y = nearest.y;
    }
  }
}

function moveSelected(p, dx, dy) {
  const selectedPiece = gameState.entities.find(p => p.id === gameState.selectedPieceId);
  if (!selectedPiece) return;
  
  const group = getGroupByPieceId(selectedPiece.id);
  
  if (group) {
    // Move entire group
    group.move(dx, dy);
  } else {
    // Move single piece
    selectedPiece.move(dx, dy);
  }
  
  // Update cursor position
  gameState.player.x = selectedPiece.x;
  gameState.player.y = selectedPiece.y;
  
  // Check for snaps
  const snapCount = checkAndSnapPieces(p);
  if (snapCount > 0) {
    updateChainSnapBonus(snapCount);
  }
}

function rotateSelected(p, clockwise) {
  const selectedPiece = gameState.entities.find(p => p.id === gameState.selectedPieceId);
  if (!selectedPiece) return;
  
  const group = getGroupByPieceId(selectedPiece.id);
  
  if (group) {
    // Rotate all pieces in group
    group.getPieces().forEach(piece => {
      piece.rotate90(clockwise);
    });
  } else {
    // Rotate single piece
    selectedPiece.rotate90(clockwise);
  }
}

function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  gameState.score = 0;
  gameState.currentLevel = 1;
  gameState.completedLevels = [];
  
  const levelManager = await import('./levelManager.js');
  levelManager.initializeLevel(p, 1);
  
  p.logs.game_info.push({
    event: "game_start",
    level: 1,
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function restartGame(p) {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.selectedPieceId = null;
  gameState.entities = [];
  gameState.groups = [];
  
  p.logs.game_info.push({
    event: "restart",
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

// Test mode automation
export function updateTestMode(p) {
  if (gameState.controlMode === "HUMAN") return;
  
  if (gameState.controlMode === "TEST_1") {
    // Basic testing - select and move pieces randomly
    if (p.frameCount % 60 === 0) {
      toggleSelection(p);
    }
    
    if (gameState.selectedPieceId && p.frameCount % 10 === 0) {
      const dx = p.random(-5, 5);
      const dy = p.random(-5, 5);
      moveSelected(p, dx, dy);
    }
  } else if (gameState.controlMode === "TEST_2") {
    // Win test - systematically solve puzzle
    if (p.frameCount % 5 === 0) {
      autoSolve(p);
    }
  }
}

function autoSolve(p) {
  // Find two pieces that should snap
  for (let i = 0; i < gameState.entities.length; i++) {
    for (let j = i + 1; j < gameState.entities.length; j++) {
      const piece1 = gameState.entities[i];
      const piece2 = gameState.entities[j];
      
      // Check if they're adjacent in grid
      const gridDX = Math.abs(piece1.gridX - piece2.gridX);
      const gridDY = Math.abs(piece1.gridY - piece2.gridY);
      
      if ((gridDX === 1 && gridDY === 0) || (gridDX === 0 && gridDY === 1)) {
        const group1 = getGroupByPieceId(piece1.id);
        const group2 = getGroupByPieceId(piece2.id);
        
        if (!group1 || !group2 || group1.id !== group2.id) {
          // Move piece2 towards piece1
          const targetX = piece1.x + (piece2.gridX - piece1.gridX) * piece1.width;
          const targetY = piece1.y + (piece2.gridY - piece1.gridY) * piece1.height;
          
          const dx = (targetX - piece2.x) * 0.1;
          const dy = (targetY - piece2.y) * 0.1;
          
          piece2.x += dx;
          piece2.y += dy;
          
          // Check for snaps
          checkAndSnapPieces(p);
          return;
        }
      }
    }
  }
}