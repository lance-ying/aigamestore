// input.js - Input handling

import { gameState } from './globals.js';
import { getInteractiveElements } from './puzzle.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  if (gameState.gamePhase === "START") {
    if (keyCode === 13) { // ENTER
      gameState.gamePhase = "PLAYING";
      p.logs.game_info.push({
        data: { phase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else if (gameState.gamePhase === "PLAYING") {
    handlePlayingInput(p, key, keyCode);
  } else if (gameState.gamePhase === "PAUSED") {
    if (keyCode === 27) { // ESC
      gameState.gamePhase = "PLAYING";
      p.logs.game_info.push({
        data: { phase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else if (gameState.gamePhase.startsWith("GAME_OVER")) {
    if (keyCode === 82) { // R
      restartGame(p);
    }
  }
}

function handlePlayingInput(p, key, keyCode) {
  // ESC - Pause
  if (keyCode === 27) {
    gameState.gamePhase = "PAUSED";
    p.logs.game_info.push({
      data: { phase: "PAUSED" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  // R - Restart
  if (keyCode === 82) {
    restartGame(p);
    return;
  }
  
  // Z - Toggle hint
  if (keyCode === 90) {
    if (!gameState.showHint && !gameState.puzzleSolved) {
      gameState.showHint = true;
      if (gameState.hintUsedCount === 0) {
        gameState.score = Math.max(0, gameState.score - 25);
        gameState.hintUsedCount++;
      }
    } else {
      gameState.showHint = false;
    }
    return;
  }
  
  const interactiveElements = getInteractiveElements();
  if (interactiveElements.length === 0) return;
  
  const selectedElement = interactiveElements[gameState.selectedObjectIndex];
  const isShiftPressed = p.keyIsDown(16);
  
  // Arrow keys - Select or move
  if (keyCode === 37) { // LEFT
    if (isShiftPressed && selectedElement && selectedElement.draggable) {
      moveElement(selectedElement, -20, 0);
    } else {
      gameState.selectedObjectIndex = (gameState.selectedObjectIndex - 1 + interactiveElements.length) % interactiveElements.length;
    }
  } else if (keyCode === 39) { // RIGHT
    if (isShiftPressed && selectedElement && selectedElement.draggable) {
      moveElement(selectedElement, 20, 0);
    } else {
      gameState.selectedObjectIndex = (gameState.selectedObjectIndex + 1) % interactiveElements.length;
    }
  } else if (keyCode === 38) { // UP
    if (isShiftPressed && selectedElement && selectedElement.draggable) {
      moveElement(selectedElement, 0, -20);
    }
  } else if (keyCode === 40) { // DOWN
    if (isShiftPressed && selectedElement && selectedElement.draggable) {
      moveElement(selectedElement, 0, 20);
    }
  }
  
  // Space - Tap action
  if (keyCode === 32 && selectedElement) {
    tapElement(selectedElement);
  }
}

function moveElement(element, dx, dy) {
  element.x += dx;
  element.y += dy;
  
  // Handle special cases
  if (element.id === "apple" && dy > 0) {
    element.falling = true;
  }
  
  if (element.id === "sky") {
    element.offsetY = (element.offsetY || 0) + dy;
  }
  
  // Constrain to canvas
  element.x = Math.max(30, Math.min(570, element.x));
  element.y = Math.max(30, Math.min(370, element.y));
}

function tapElement(element) {
  element.tapped = true;
  
  // Handle special tap actions
  if (element.id === "key") {
    element.pickedUp = true;
  }
  
  if (element.id === "cloud") {
    element.raining = true;
  }
}

function restartGame(p) {
  gameState.gamePhase = "START";
  gameState.score = 0;
  gameState.currentLevel = 1;
  gameState.currentPuzzleIndex = 0;
  gameState.puzzleSolved = false;
  gameState.hintUsedCount = 0;
  gameState.showHint = false;
  gameState.selectedObjectIndex = 0;
  gameState.showTransition = false;
  gameState.transitionTimer = 0;
  
  p.logs.game_info.push({
    data: { phase: "START", action: "restart" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function processTestingInput(p) {
  if (gameState.controlMode === "HUMAN") return;
  
  // Basic testing - just cycle through and tap objects
  if (gameState.controlMode === "TEST_1") {
    if (p.frameCount % 60 === 0) {
      handleKeyPressed(p, 'ArrowRight', 39);
    }
    if (p.frameCount % 120 === 0) {
      handleKeyPressed(p, ' ', 32);
    }
    if (p.frameCount % 180 === 30) {
      handleKeyPressed(p, 'ArrowRight', 39);
      p.keyIsDown = (code) => code === 16; // Mock shift
      handleKeyPressed(p, 'ArrowDown', 40);
      p.keyIsDown = window.p5.prototype.keyIsDown; // Restore
    }
  }
  
  // Win testing - solve puzzles quickly
  if (gameState.controlMode === "TEST_2") {
    const puzzle = gameState.currentPuzzleIndex;
    
    if (puzzle === 0 && p.frameCount % 60 === 0) {
      // Find and tap green circle
      gameState.selectedObjectIndex = 1;
      handleKeyPressed(p, ' ', 32);
    } else if (puzzle === 1 && p.frameCount % 30 === 0) {
      // Drag box right
      p.keyIsDown = (code) => code === 16;
      handleKeyPressed(p, 'ArrowRight', 39);
      p.keyIsDown = window.p5.prototype.keyIsDown;
    } else if (puzzle === 2 && p.frameCount % 30 === 0) {
      // Drag apple down
      gameState.selectedObjectIndex = 0;
      p.keyIsDown = (code) => code === 16;
      handleKeyPressed(p, 'ArrowDown', 40);
      p.keyIsDown = window.p5.prototype.keyIsDown;
    }
  }
}