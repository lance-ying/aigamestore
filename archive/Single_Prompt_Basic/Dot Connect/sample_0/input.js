// input.js - Input handling

import { gameState, GRID_SIZE } from './globals.js';
import { clearSelectedDots, clearAllSelections } from './grid.js';

let keysPressed = {};

export function handleKeyPressed(p) {
  keysPressed[p.keyCode] = true;
  
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // Handle phase controls
  if (p.keyCode === 13 && gameState.gamePhase === "START") { // ENTER
    gameState.gamePhase = "PLAYING";
    p.logs.game_info.push({
      data: { gamePhase: "PLAYING" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  if (p.keyCode === 27) { // ESC
    if (gameState.gamePhase === "PLAYING") {
      // Cancel selection if active, otherwise pause
      if (gameState.currentPath.length > 0) {
        clearAllSelections();
        gameState.isSelecting = false;
      } else {
        gameState.gamePhase = "PAUSED";
        p.logs.game_info.push({
          data: { gamePhase: "PAUSED" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (gameState.gamePhase === "PAUSED") {
      gameState.gamePhase = "PLAYING";
      p.logs.game_info.push({
        data: { gamePhase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }

  if (p.keyCode === 82) { // R - Restart
    if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
      p.logs.game_info.push({
        data: { gamePhase: "RESTART" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }

  // Handle gameplay controls
  if (gameState.gamePhase === "PLAYING") {
    handleGameplayInput(p);
  }

  return false;
}

function handleGameplayInput(p) {
  const prevX = gameState.cursorX;
  const prevY = gameState.cursorY;

  // Arrow key navigation
  if (p.keyCode === 37) { // LEFT
    gameState.cursorX = Math.max(0, gameState.cursorX - 1);
  } else if (p.keyCode === 39) { // RIGHT
    gameState.cursorX = Math.min(GRID_SIZE - 1, gameState.cursorX + 1);
  } else if (p.keyCode === 38) { // UP
    gameState.cursorY = Math.max(0, gameState.cursorY - 1);
  } else if (p.keyCode === 40) { // DOWN
    gameState.cursorY = Math.min(GRID_SIZE - 1, gameState.cursorY + 1);
  }

  // If cursor moved while selecting, try to extend path
  if ((prevX !== gameState.cursorX || prevY !== gameState.cursorY) && gameState.isSelecting) {
    tryExtendPath();
  }

  // Space - Toggle selection at cursor
  if (p.keyCode === 32) { // SPACE
    const dot = gameState.grid[gameState.cursorY][gameState.cursorX];
    if (!dot) return;

    if (gameState.currentPath.length === 0) {
      // Start new selection
      gameState.isSelecting = true;
      gameState.currentPath = [dot];
      dot.selected = true;
    } else {
      // Try to extend or start over
      const lastDot = gameState.currentPath[gameState.currentPath.length - 1];
      
      if (dot === lastDot) {
        // Clicking same dot - do nothing
        return;
      }

      // Check if this is the second-to-last dot (going back)
      if (gameState.currentPath.length >= 2) {
        const secondLast = gameState.currentPath[gameState.currentPath.length - 2];
        if (dot === secondLast) {
          lastDot.selected = false;
          gameState.currentPath.pop();
          updateSquareDetection();
          return;
        }
      }

      // Check if adjacent and same color - must be strictly adjacent
      if (dot.colorIndex === lastDot.colorIndex && 
          lastDot.isAdjacent(dot) && 
          !gameState.currentPath.includes(dot)) {
        gameState.currentPath.push(dot);
        dot.selected = true;
        updateSquareDetection();
      }
    }
  }

  // Enter - Confirm and clear selection
  if (p.keyCode === 13) { // ENTER
    if (gameState.currentPath.length >= 2) {
      clearSelectedDots(p);
      gameState.isSelecting = false;
    }
    clearAllSelections();
  }
}

function tryExtendPath() {
  if (gameState.currentPath.length === 0) return;

  const dot = gameState.grid[gameState.cursorY][gameState.cursorX];
  if (!dot) return;

  const lastDot = gameState.currentPath[gameState.currentPath.length - 1];

  if (dot === lastDot) return;

  // Check if going back to previous dot
  if (gameState.currentPath.length >= 2) {
    const secondLast = gameState.currentPath[gameState.currentPath.length - 2];
    if (dot === secondLast) {
      lastDot.selected = false;
      gameState.currentPath.pop();
      updateSquareDetection();
      return;
    }
  }

  // Validate adjacency strictly - must be within 1 grid space in both dimensions
  const dx = Math.abs(dot.gridX - lastDot.gridX);
  const dy = Math.abs(dot.gridY - lastDot.gridY);
  const isStrictlyAdjacent = (dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0);

  // Check if adjacent, same color, and not already in path
  if (dot.colorIndex === lastDot.colorIndex && 
      isStrictlyAdjacent && 
      !gameState.currentPath.includes(dot)) {
    gameState.currentPath.push(dot);
    dot.selected = true;
    updateSquareDetection();
  }
}

function updateSquareDetection() {
  if (gameState.currentPath.length === 4) {
    gameState.squareDetected = checkSquare(gameState.currentPath);
  } else {
    gameState.squareDetected = false;
  }
}

function checkSquare(path) {
  if (path.length !== 4) return false;
  
  const positions = path.map(dot => ({ x: dot.gridX, y: dot.gridY }));
  const minX = Math.min(...positions.map(p => p.x));
  const maxX = Math.max(...positions.map(p => p.x));
  const minY = Math.min(...positions.map(p => p.y));
  const maxY = Math.max(...positions.map(p => p.y));
  
  if (maxX - minX === 1 && maxY - minY === 1) {
    const hasTopLeft = path.some(d => d.gridX === minX && d.gridY === minY);
    const hasTopRight = path.some(d => d.gridX === maxX && d.gridY === minY);
    const hasBottomLeft = path.some(d => d.gridX === minX && d.gridY === maxY);
    const hasBottomRight = path.some(d => d.gridX === maxX && d.gridY === maxY);
    
    return hasTopLeft && hasTopRight && hasBottomLeft && hasBottomRight;
  }
  
  return false;
}

export function handleKeyReleased(p) {
  keysPressed[p.keyCode] = false;
  
  p.logs.inputs.push({
    input_type: "keyReleased",
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  return false;
}

// Empty mouse handlers (no longer used)
export function handleMousePressed(p) {
  // Mouse input disabled - use keyboard only
}

export function handleMouseDragged(p) {
  // Mouse input disabled - use keyboard only
}

export function handleMouseReleased(p) {
  // Mouse input disabled - use keyboard only
}

export function isKeyPressed(keyCode) {
  return keysPressed[keyCode] === true;
}