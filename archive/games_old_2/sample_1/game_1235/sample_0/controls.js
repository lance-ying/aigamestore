// controls.js - Input handling and automated testing

import { gameState } from './globals.js';
import { startGame, shootBubble, updateAim } from './gameLogic.js';

export function handleKeyPressed(p, bubbleGrid) {
  // Log the key press
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Game phase controls
  if (p.keyCode === 13) { // ENTER
    if (gameState.gamePhase === 'START') {
      startGame(p, bubbleGrid);
    }
  } else if (p.keyCode === 27) { // ESC
    if (gameState.gamePhase === 'PLAYING') {
      gameState.gamePhase = 'PAUSED';
      p.logs.game_info.push({
        data: { phase: 'PAUSED' },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === 'PAUSED') {
      gameState.gamePhase = 'PLAYING';
      p.logs.game_info.push({
        data: { phase: 'PLAYING' },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else if (p.keyCode === 82) { // R
    if (gameState.gamePhase.startsWith('GAME_OVER')) {
      resetGame(p, bubbleGrid);
    }
  }
  
  // Gameplay controls
  if (gameState.gamePhase === 'PLAYING') {
    if (p.keyCode === 32) { // SPACE
      shootBubble(p);
    }
  }
}

export function handleKeyReleased(p) {
  p.logs.inputs.push({
    input_type: 'keyReleased',
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function handleContinuousInput(p, deltaTime) {
  if (gameState.gamePhase !== 'PLAYING') return;
  
  if (p.keyIsDown(37)) { // LEFT
    updateAim('LEFT', deltaTime);
  }
  if (p.keyIsDown(39)) { // RIGHT
    updateAim('RIGHT', deltaTime);
  }
}

export function resetGame(p, bubbleGrid) {
  gameState.gamePhase = 'START';
  gameState.score = 0;
  gameState.timeRemaining = 0;
  gameState.bubblesCleared = 0;
  gameState.combo = 0;
  gameState.currentLevel = 1;
  gameState.matchStarted = false;
  gameState.currentBubble = null;
  gameState.nextBubble = null;
  gameState.opponents = [];
  gameState.entities = [];
  gameState.aimAngle = -Math.PI / 2;
  
  p.logs.game_info.push({
    data: { phase: 'START' },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

// Automated testing modes
export function getTestAction(p, bubbleGrid) {
  const mode = gameState.controlMode;
  
  if (mode === 'TEST_1') {
    return getBasicTestAction(p, bubbleGrid);
  } else if (mode === 'TEST_2') {
    return getWinTestAction(p, bubbleGrid);
  }
  
  return null;
}

function getBasicTestAction(p, bubbleGrid) {
  // Basic testing: alternate aiming and shooting
  if (gameState.gamePhase === 'START') {
    return { action: 'START' };
  } else if (gameState.gamePhase === 'PLAYING') {
    if (!gameState.currentBubble || !gameState.currentBubble.isMoving) {
      if (p.frameCount % 30 === 0) {
        return { action: 'SHOOT' };
      } else if (p.frameCount % 60 < 30) {
        return { action: 'AIM_LEFT' };
      } else {
        return { action: 'AIM_RIGHT' };
      }
    }
  }
  
  return null;
}

function getWinTestAction(p, bubbleGrid) {
  // Win test: play optimally to win
  if (gameState.gamePhase === 'START') {
    return { action: 'START' };
  } else if (gameState.gamePhase === 'PLAYING') {
    if (!gameState.currentBubble || !gameState.currentBubble.isMoving) {
      // Aim at bubbles and shoot to create matches
      const allBubbles = bubbleGrid.getAllBubbles();
      if (allBubbles.length > 0 && p.frameCount % 20 === 0) {
        return { action: 'SHOOT' };
      } else if (p.frameCount % 40 < 20) {
        return { action: 'AIM_LEFT' };
      } else {
        return { action: 'AIM_RIGHT' };
      }
    }
  }
  
  return null;
}

export function executeTestAction(action, p, bubbleGrid, deltaTime) {
  if (!action) return;
  
  switch (action.action) {
    case 'START':
      if (gameState.gamePhase === 'START') {
        startGame(p, bubbleGrid);
      }
      break;
    case 'SHOOT':
      shootBubble(p);
      break;
    case 'AIM_LEFT':
      updateAim('LEFT', deltaTime);
      break;
    case 'AIM_RIGHT':
      updateAim('RIGHT', deltaTime);
      break;
  }
}