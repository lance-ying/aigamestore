// input.js - Input handling for different control modes

import { gameState, CONTROL_MODES } from './globals.js';

export function handleInput(p) {
  if (!gameState.player) return;
  
  switch (gameState.controlMode) {
    case CONTROL_MODES.HUMAN:
      handleHumanInput(p);
      break;
    case CONTROL_MODES.TEST_1:
      handleTest1Input(p);
      break;
    case CONTROL_MODES.TEST_2:
      handleTest2Input(p);
      break;
    case CONTROL_MODES.TEST_3:
      handleTest3Input(p);
      break;
    case CONTROL_MODES.TEST_4:
      handleTest4Input(p);
      break;
    case CONTROL_MODES.TEST_5:
      handleTest5Input(p);
      break;
    case CONTROL_MODES.TEST_6:
      handleTest6Input(p);
      break;
    case CONTROL_MODES.TEST_7:
      handleTest7Input(p);
      break;
  }
}

function handleHumanInput(p) {
  // Left/Right movement
  if (p.keyIsDown(37) || p.keyIsDown(65)) { // LEFT or A
    gameState.player.moveLeft();
  }
  if (p.keyIsDown(39) || p.keyIsDown(68)) { // RIGHT or D
    gameState.player.moveRight();
  }
  
  // Hook-swing
  if (p.keyIsDown(16)) { // SHIFT
    gameState.player.hookSwing();
  }
}

function handleTest1Input(p) {
  // TEST_1: Basic movement and jump testing
  gameState.testFrameCount++;
  
  const phase = Math.floor(gameState.testFrameCount / 180) % 3;
  
  if (phase === 0) {
    // Move left
    gameState.player.moveLeft();
  } else if (phase === 1) {
    // Move right
    gameState.player.moveRight();
  } else {
    // Jump every 30 frames
    if (gameState.testFrameCount % 30 === 0) {
      gameState.player.jump();
    }
  }
}

function handleTest2Input(p) {
  // TEST_2: Win condition test - move right, collect coins, reach portal
  gameState.testFrameCount++;
  
  // Constantly move right
  gameState.player.moveRight();
  
  // Jump periodically to get over obstacles
  if (gameState.testFrameCount % 60 === 30) {
    gameState.player.jump();
  }
  
  // Use karate kick when unlocked
  if (gameState.abilities.karateKick && gameState.testFrameCount % 90 === 0) {
    gameState.player.karateKick();
  }
  
  // Use hook swing when near the end
  if (gameState.abilities.hookSwing && gameState.player.body.position.x > 400) {
    gameState.player.hookSwing();
  }
}

function handleTest3Input(p) {
  // TEST_3: Damage system test - intentionally collide with enemies
  gameState.testFrameCount++;
  
  // Move toward enemies
  if (gameState.enemies.length > 0) {
    const enemy = gameState.enemies[0];
    if (gameState.player.body.position.x < enemy.body.position.x) {
      gameState.player.moveRight();
    } else {
      gameState.player.moveLeft();
    }
  } else {
    gameState.player.moveRight();
  }
  
  // Jump occasionally
  if (gameState.testFrameCount % 90 === 0) {
    gameState.player.jump();
  }
}

function handleTest4Input(p) {
  // TEST_4: Hazard death and respawn test
  gameState.testFrameCount++;
  
  if (gameState.testFrameCount < 120) {
    // Move right toward edge
    gameState.player.moveRight();
  } else if (gameState.testFrameCount === 120) {
    // Jump off edge
    gameState.player.jump();
    gameState.player.moveRight();
  }
  // Wait for respawn
}

function handleTest5Input(p) {
  // TEST_5: Karate Kick ability test
  gameState.testFrameCount++;
  
  // Move right until near barrier
  if (gameState.player.body.position.x < 250) {
    gameState.player.moveRight();
  } else {
    // Use karate kick when near barrier
    if (gameState.abilities.karateKick && gameState.testFrameCount % 30 === 0) {
      gameState.player.karateKick();
    }
  }
  
  // Jump to get coins
  if (gameState.testFrameCount % 60 === 0) {
    gameState.player.jump();
  }
}

function handleTest6Input(p) {
  // TEST_6: Hook-Swing mechanic test
  gameState.testFrameCount++;
  
  // Move toward swing point
  if (gameState.player.body.position.x < 350) {
    gameState.player.moveRight();
  }
  
  // Jump and swing when near swing point
  if (gameState.player.body.position.x > 300 && gameState.player.body.position.x < 370) {
    if (gameState.abilities.hookSwing) {
      gameState.player.hookSwing();
    }
  }
  
  // Collect coins
  if (gameState.testFrameCount % 40 === 0) {
    gameState.player.jump();
  }
}

function handleTest7Input(p) {
  // TEST_7: Pause/resume test
  gameState.testFrameCount++;
  
  // Just move right
  gameState.player.moveRight();
  
  // Jump periodically
  if (gameState.testFrameCount % 60 === 0) {
    gameState.player.jump();
  }
}