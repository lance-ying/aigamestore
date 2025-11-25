// controls.js - Input handling and automated testing
import { gameState } from './globals.js';

export function handleControls(p) {
  const player = gameState.player;
  if (!player || gameState.gamePhase !== 'PLAYING') return;
  
  if (gameState.controlMode === 'HUMAN') {
    handleHumanControls(p, player);
  } else if (gameState.controlMode === 'TEST_1') {
    handleTest1Controls(p, player);
  } else if (gameState.controlMode === 'TEST_2') {
    handleTest2Controls(p, player);
  }
}

function handleHumanControls(p, player) {
  if (gameState.keys[37] || gameState.keys[65]) { // LEFT or A
    player.moveLeft();
  }
  if (gameState.keys[39] || gameState.keys[68]) { // RIGHT or D
    player.moveRight();
  }
}

// TEST_1: Basic movement and ring collection
let test1Timer = 0;
function handleTest1Controls(p, player) {
  test1Timer++;
  
  // Move right and jump periodically
  if (test1Timer < 600) {
    player.moveRight();
    
    // Jump every 60 frames
    if (test1Timer % 60 === 0) {
      player.jump();
    }
  }
}

// TEST_2: Win by reaching goal quickly
function handleTest2Controls(p, player) {
  // Continuous right movement and jump
  player.moveRight();
  
  // Jump frequently to maintain momentum
  if (p.frameCount % 40 === 0) {
    player.jump();
  }
}

export function handleJumpPress(p) {
  const player = gameState.player;
  if (!player || gameState.gamePhase !== 'PLAYING') return;
  
  if (player.isOnGround()) {
    player.jump();
  } else {
    // Second jump in air activates spin dash
    player.activateSpinDash();
  }
}