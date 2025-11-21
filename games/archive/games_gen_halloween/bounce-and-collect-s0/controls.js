// controls.js - Input handling and control modes

import { gameState, GAME_PHASES, ARENA } from './globals.js';
import { dropBall } from './game.js';

export function handleInput(p) {
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    if (gameState.controlMode === "HUMAN") {
      handleHumanInput(p);
    } else if (gameState.controlMode === "TEST_1") {
      handleTest1(p);
    } else if (gameState.controlMode === "TEST_2") {
      handleTest2(p);
    }
  }
}

function handleHumanInput(p) {
  // Move drop position
  if (gameState.keys[37]) { // LEFT
    gameState.dropX -= 3;
  }
  if (gameState.keys[39]) { // RIGHT
    gameState.dropX += 3;
  }
  
  // Clamp drop position
  gameState.dropX = p.constrain(gameState.dropX, ARENA.LEFT + 20, ARENA.RIGHT - 20);
}

// TEST_1: Basic drop mechanics testing
function handleTest1(p) {
  const ts = gameState.testState;
  
  if (ts.actionQueue.length === 0) {
    // Initialize test sequence
    ts.actionQueue = [
      { action: 'wait', frames: 30 },
      { action: 'move', targetX: ARENA.LEFT + 100, frames: 30 },
      { action: 'drop' },
      { action: 'wait', frames: 180 },
      { action: 'move', targetX: ARENA.LEFT + 250, frames: 30 },
      { action: 'drop' },
      { action: 'wait', frames: 180 },
      { action: 'move', targetX: ARENA.LEFT + 400, frames: 30 },
      { action: 'drop' },
      { action: 'wait', frames: 300 }
    ];
    ts.currentActionIndex = 0;
    ts.frameCounter = 0;
  }
  
  if (ts.currentActionIndex >= ts.actionQueue.length) return;
  
  const currentAction = ts.actionQueue[ts.currentActionIndex];
  
  if (currentAction.action === 'wait') {
    ts.frameCounter++;
    if (ts.frameCounter >= currentAction.frames) {
      ts.currentActionIndex++;
      ts.frameCounter = 0;
    }
  } else if (currentAction.action === 'move') {
    const progress = ts.frameCounter / currentAction.frames;
    const startX = gameState.dropX;
    gameState.dropX = p.lerp(startX, currentAction.targetX, progress);
    
    ts.frameCounter++;
    if (ts.frameCounter >= currentAction.frames) {
      gameState.dropX = currentAction.targetX;
      ts.currentActionIndex++;
      ts.frameCounter = 0;
    }
  } else if (currentAction.action === 'drop') {
    if (gameState.ballsRemaining > 0 && gameState.ballsInPlay < 3) {
      dropBall(p);
    }
    ts.currentActionIndex++;
    ts.frameCounter = 0;
  }
}

// TEST_2: Win condition testing
function handleTest2(p) {
  const ts = gameState.testState;
  
  if (ts.actionQueue.length === 0) {
    // Initialize test sequence - target high multipliers
    ts.actionQueue = [
      { action: 'wait', frames: 30 },
      { action: 'move', targetX: 300, frames: 20 },
      { action: 'drop' },
      { action: 'wait', frames: 150 },
      { action: 'drop' },
      { action: 'wait', frames: 150 },
      { action: 'drop' },
      { action: 'wait', frames: 150 },
      { action: 'drop' },
      { action: 'wait', frames: 150 },
      { action: 'drop' },
      { action: 'wait', frames: 300 }
    ];
    ts.currentActionIndex = 0;
    ts.frameCounter = 0;
  }
  
  if (ts.currentActionIndex >= ts.actionQueue.length) return;
  
  const currentAction = ts.actionQueue[ts.currentActionIndex];
  
  if (currentAction.action === 'wait') {
    ts.frameCounter++;
    if (ts.frameCounter >= currentAction.frames) {
      ts.currentActionIndex++;
      ts.frameCounter = 0;
    }
  } else if (currentAction.action === 'move') {
    const progress = ts.frameCounter / currentAction.frames;
    const startX = gameState.dropX;
    gameState.dropX = p.lerp(startX, currentAction.targetX, progress);
    
    ts.frameCounter++;
    if (ts.frameCounter >= currentAction.frames) {
      gameState.dropX = currentAction.targetX;
      ts.currentActionIndex++;
      ts.frameCounter = 0;
    }
  } else if (currentAction.action === 'drop') {
    if (gameState.ballsRemaining > 0) {
      dropBall(p);
    }
    ts.currentActionIndex++;
    ts.frameCounter = 0;
  }
}

// Expose setControlMode globally
export function setControlMode(mode) {
  gameState.controlMode = mode;
  gameState.testState = {
    actionQueue: [],
    currentActionIndex: 0,
    frameCounter: 0
  };
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const activeBtn = document.getElementById(`${mode.toLowerCase()}ModeBtn`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
}

if (typeof window !== 'undefined') {
  window.setControlMode = setControlMode;
}