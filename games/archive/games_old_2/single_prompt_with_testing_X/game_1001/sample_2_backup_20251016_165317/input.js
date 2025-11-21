// input.js - Input handling

import { gameState } from './globals.js';
import { getDotAtPosition, clearSelectedDots, clearAllSelections } from './grid.js';

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

  if (p.keyCode === 27) { // ESC - Pause/Unpause
    if (gameState.gamePhase === "PLAYING") {
      gameState.gamePhase = "PAUSED";
      p.logs.game_info.push({
        data: { gamePhase: "PAUSED" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
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

export function handleMousePressed(p) {
  if (gameState.gamePhase !== "PLAYING") return;
  
  const dot = getDotAtPosition(p.mouseX, p.mouseY);
  if (dot) {
    gameState.isConnecting = true;
    gameState.currentPath = [dot];
    dot.selected = true;
  }
}

export function handleMouseDragged(p) {
  if (gameState.gamePhase !== "PLAYING" || !gameState.isConnecting) return;
  
  gameState.lastMousePos = { x: p.mouseX, y: p.mouseY };
  
  const dot = getDotAtPosition(p.mouseX, p.mouseY);
  if (!dot) return;
  
  const lastDot = gameState.currentPath[gameState.currentPath.length - 1];
  
  if (dot === lastDot) return;
  
  // Check if going back to previous dot
  if (gameState.currentPath.length >= 2) {
    const secondLast = gameState.currentPath[gameState.currentPath.length - 2];
    if (dot === secondLast) {
      lastDot.selected = false;
      gameState.currentPath.pop();
      return;
    }
  }
  
  // Check if adjacent and same color
  if (dot.colorIndex === lastDot.colorIndex && lastDot.isAdjacent(dot)) {
    // Check if already in path (no crossing)
    if (!gameState.currentPath.includes(dot)) {
      gameState.currentPath.push(dot);
      dot.selected = true;
      
      // Check for square
      if (gameState.currentPath.length === 4) {
        gameState.squareDetected = checkSquare(gameState.currentPath);
      }
    }
  }
}

export function handleMouseReleased(p) {
  if (gameState.gamePhase !== "PLAYING" || !gameState.isConnecting) return;
  
  gameState.isConnecting = false;
  
  if (gameState.currentPath.length >= 2) {
    clearSelectedDots(p);
  }
  
  clearAllSelections();
}

export function isKeyPressed(keyCode) {
  return keysPressed[keyCode] === true;
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