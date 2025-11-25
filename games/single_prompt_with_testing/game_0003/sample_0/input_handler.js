// input_handler.js - Input handling for keyboard and testing
import { gameState } from './globals.js';

export function createInputState() {
  return {
    left: false,
    right: false,
    up: false,
    down: false,
    space: false,
    spacePressed: false,
    leftPressed: false,
    rightPressed: false,
    key: ''
  };
}

export function updateInputs(p, inputs) {
  // Reset pressed states
  inputs.spacePressed = false;
  inputs.leftPressed = false;
  inputs.rightPressed = false;
  inputs.key = '';
  
  if (gameState.controlMode === 'HUMAN') {
    // Human control
    inputs.left = p.keyIsDown(37);
    inputs.right = p.keyIsDown(39);
    inputs.up = p.keyIsDown(38);
    inputs.down = p.keyIsDown(40);
    inputs.space = p.keyIsDown(32);
  } else {
    // Automated testing control
    const action = window.get_automated_testing_action(gameState);
    
    inputs.left = action.left || false;
    inputs.right = action.right || false;
    inputs.up = action.up || false;
    inputs.down = action.down || false;
    inputs.space = action.space || false;
    inputs.spacePressed = action.spacePressed || false;
    inputs.leftPressed = action.leftPressed || false;
    inputs.rightPressed = action.rightPressed || false;
    inputs.key = action.key || '';
  }
}

export function handleKeyPress(p, inputs) {
  if (p.keyCode === 32) { // Space
    inputs.spacePressed = true;
  }
  if (p.keyCode === 37) { // Left
    inputs.leftPressed = true;
  }
  if (p.keyCode === 39) { // Right
    inputs.rightPressed = true;
  }
  
  // Number keys for upgrade selection
  if (p.key === '1' || p.key === '2' || p.key === '3') {
    inputs.key = p.key;
  }
  
  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}