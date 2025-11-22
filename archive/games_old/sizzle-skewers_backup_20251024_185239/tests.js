import { gameState, GRID_SIZE } from './globals.js';

export function runAutomatedTest(p) {
  if (gameState.controlMode === "HUMAN") {
    return;
  }
  
  if (gameState.controlMode === "TEST_1") {
    testBasicGameplay(p);
  } else if (gameState.controlMode === "TEST_2") {
    testWinCondition(p);
  }
}

function testBasicGameplay(p) {
  if (gameState.gamePhase === "START" && p.frameCount === 60) {
    p.keyPressed();
    p.keyCode = 13;
    const { handleKeyPressed } = require('./input.js');
    handleKeyPressed(p, 13);
  } else if (gameState.gamePhase === "PLAYING" && p.frameCount % 120 === 0) {
    // Random cursor movement
    const direction = Math.floor(p.random() * 4);
    const keyCodes = [37, 38, 39, 40]; // Arrow keys
    p.keyCode = keyCodes[direction];
    const { handleKeyPressed } = require('./input.js');
    handleKeyPressed(p, keyCodes[direction]);
  } else if (gameState.gamePhase === "PLAYING" && p.frameCount % 180 === 0) {
    // Try to select tile
    p.keyCode = 32;
    const { handleKeyPressed } = require('./input.js');
    handleKeyPressed(p, 32);
  }
}

function testWinCondition(p) {
  if (gameState.gamePhase === "START" && p.frameCount === 60) {
    p.keyCode = 13;
    const { handleKeyPressed } = require('./input.js');
    handleKeyPressed(p, 13);
  } else if (gameState.gamePhase === "PLAYING" && !gameState.animating) {
    // Cheat to win
    const { LEVELS } = require('./globals.js');
    const levelData = LEVELS[gameState.currentLevel - 1];
    
    Object.keys(levelData.objectives).forEach(key => {
      gameState.objectives[key] = levelData.objectives[key];
    });
  }
}