// input.js - Input handling for different control modes
import { gameState, CONTROL_MODES } from './globals.js';

const keys = {};

export function setupInputHandlers() {
  document.addEventListener('keydown', (event) => {
    keys[event.keyCode] = true;
    
    if (window.logs && window.logs.inputs) {
      window.logs.inputs.push({
        input_type: "keydown",
        data: { key: event.key, keyCode: event.keyCode },
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  });
  
  document.addEventListener('keyup', (event) => {
    keys[event.keyCode] = false;
    
    if (window.logs && window.logs.inputs) {
      window.logs.inputs.push({
        input_type: "keyup",
        data: { key: event.key, keyCode: event.keyCode },
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  });
}

export function handleInput() {
  if (!gameState.player) return;
  
  switch (gameState.controlMode) {
    case CONTROL_MODES.HUMAN:
      handleHumanInput();
      break;
    case CONTROL_MODES.TEST_1:
      handleTest1Input();
      break;
    case CONTROL_MODES.TEST_2:
      handleTest2Input();
      break;
  }
}

function handleHumanInput() {
  // Left/Right movement
  if (keys[37] || keys[65]) { // LEFT or A
    gameState.player.moveLeft();
  }
  if (keys[39] || keys[68]) { // RIGHT or D
    gameState.player.moveRight();
  }
  
  // Hook-swing
  if (keys[16]) { // SHIFT
    gameState.player.hookSwing();
  }
}

function handleTest1Input() {
  // TEST_1: Basic movement and jump testing
  gameState.testFrameCount++;
  
  const phase = Math.floor(gameState.testFrameCount / 180) % 3;
  
  if (phase === 0) {
    gameState.player.moveLeft();
  } else if (phase === 1) {
    gameState.player.moveRight();
  } else {
    if (gameState.testFrameCount % 30 === 0) {
      gameState.player.jump();
    }
  }
}

function handleTest2Input() {
  // TEST_2: Win condition test
  gameState.testFrameCount++;
  
  gameState.player.moveRight();
  
  if (gameState.testFrameCount % 60 === 30) {
    gameState.player.jump();
  }
  
  if (gameState.abilities.karateKick && gameState.testFrameCount % 90 === 0) {
    gameState.player.karateKick();
  }
  
  if (gameState.abilities.hookSwing && gameState.player.mesh.position.x > 15) {
    gameState.player.hookSwing();
  }
}

export function isKeyPressed(keyCode) {
  return keys[keyCode] || false;
}