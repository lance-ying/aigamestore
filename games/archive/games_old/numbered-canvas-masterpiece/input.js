// input.js - Input handling

import { gameState, ZOOM_SPEED, ZOOM_MIN, ZOOM_MAX, PAN_SPEED, CANVAS_WIDTH, GAME_HEIGHT } from './globals.js';
import { startGame, togglePause, restartGame, selectNextColor, tryFillSegment } from './gameLogic.js';

export function setupInput(p) {
  p.keyPressed = function() {
    const key = p.key;
    const keyCode = p.keyCode;
    
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: key, keyCode: keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Handle based on game phase
    if (gameState.gamePhase === "START") {
      if (keyCode === 13) { // ENTER
        startGame(p);
      }
    } else if (gameState.gamePhase === "PLAYING") {
      if (keyCode === 27) { // ESC
        togglePause(p);
      } else if (keyCode === 32) { // SPACE
        selectNextColor();
      } else if (keyCode === 82) { // R
        restartGame(p);
      }
    } else if (gameState.gamePhase === "PAUSED") {
      if (keyCode === 27) { // ESC
        togglePause(p);
      } else if (keyCode === 82) { // R
        restartGame(p);
      }
    } else if (gameState.gamePhase === "GAME_OVER_WIN") {
      if (keyCode === 82) { // R
        restartGame(p);
      }
    }
    
    // Store key state
    gameState.keys[keyCode] = true;
    
    return false;
  };
  
  p.keyReleased = function() {
    const keyCode = p.keyCode;
    
    p.logs.inputs.push({
      input_type: "keyReleased",
      data: { keyCode: keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    gameState.keys[keyCode] = false;
    
    return false;
  };
}

export function handleContinuousInput(p) {
  if (gameState.gamePhase !== "PLAYING") return;
  
  // Pan with arrow keys
  if (gameState.keys[37]) { // Left arrow
    gameState.canvasTransform.panOffsetX += PAN_SPEED;
  }
  if (gameState.keys[39]) { // Right arrow
    gameState.canvasTransform.panOffsetX -= PAN_SPEED;
  }
  if (gameState.keys[38]) { // Up arrow
    gameState.canvasTransform.panOffsetY += PAN_SPEED;
  }
  if (gameState.keys[40]) { // Down arrow
    gameState.canvasTransform.panOffsetY -= PAN_SPEED;
  }
  
  // Clamp pan offsets to keep artwork visible
  clampPanOffsets();
}

function clampPanOffsets() {
  const maxPanX = 200 * gameState.canvasTransform.zoomLevel;
  const maxPanY = 200 * gameState.canvasTransform.zoomLevel;
  
  gameState.canvasTransform.panOffsetX = Math.max(-maxPanX, Math.min(maxPanX, gameState.canvasTransform.panOffsetX));
  gameState.canvasTransform.panOffsetY = Math.max(-maxPanY, Math.min(maxPanY, gameState.canvasTransform.panOffsetY));
}

export function handleTestInput(p) {
  if (gameState.controlMode === "HUMAN") return;
  
  if (gameState.controlMode === "TEST_1") {
    // Basic testing - just select colors and try to fill
    if (p.frameCount % 30 === 0) {
      selectNextColor();
    }
    if (p.frameCount % 60 === 0 && gameState.currentSelectedColorID) {
      tryFillRandomMatchingSegment();
    }
  } else if (gameState.controlMode === "TEST_2") {
    // Win testing - efficiently fill all segments
    if (p.frameCount % 2 === 0) {
      if (!gameState.currentSelectedColorID || !tryFillRandomMatchingSegment()) {
        selectNextColor();
      }
    }
  }
}

function tryFillRandomMatchingSegment() {
  const matchingSegments = gameState.artworkSegments.filter(
    seg => !seg.isFilled && seg.targetColorID === gameState.currentSelectedColorID
  );
  
  if (matchingSegments.length > 0) {
    const segment = matchingSegments[Math.floor(Math.random() * matchingSegments.length)];
    tryFillSegment(segment);
    return true;
  }
  return false;
}