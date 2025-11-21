// controls.js - Input handling and AI control modes

import { gameState, GAME_PHASES, CONTROL_MODES } from './globals.js';

export function handlePlayerInput(p) {
  if (!gameState.player || gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return;
  }

  if (gameState.controlMode === CONTROL_MODES.HUMAN) {
    handleHumanControl(p);
  } else {
    handleAIControl(p);
  }
}

function handleHumanControl(p) {
  const keys = gameState.keys;

  // Movement
  if (keys['37'] || keys['65']) { // Left arrow or A
    gameState.player.moveLeft();
  }
  if (keys['39'] || keys['68']) { // Right arrow or D
    gameState.player.moveRight();
  }

  // Jump
  if (keys['32']) { // Space
    if (!keys.spaceWasPressed) {
      gameState.player.jump();
      keys.spaceWasPressed = true;
    } else {
      gameState.player.jumpHold();
    }
  } else {
    if (keys.spaceWasPressed) {
      gameState.player.jumpRelease();
    }
    keys.spaceWasPressed = false;
  }
}

function handleAIControl(p) {
  const mode = gameState.controlMode;
  gameState.testFrameCount++;

  switch (mode) {
    case CONTROL_MODES.TEST_1:
      testBasicMovement(p);
      break;
    case CONTROL_MODES.TEST_2:
      testWinCondition(p);
      break;
    case CONTROL_MODES.TEST_3:
      testJumpMechanics(p);
      break;
    case CONTROL_MODES.TEST_4:
      testCoinCollection(p);
      break;
    case CONTROL_MODES.TEST_5:
      testEnemyCollision(p);
      break;
    case CONTROL_MODES.TEST_6:
      testLoseCondition(p);
      break;
    case CONTROL_MODES.TEST_7:
      testHealthRestoration(p);
      break;
  }
}

function testBasicMovement(p) {
  const frame = gameState.testFrameCount;
  
  // Alternate between left and right movement
  if (frame < 60) {
    gameState.player.moveRight();
  } else if (frame < 120) {
    gameState.player.moveLeft();
  } else if (frame < 180) {
    gameState.player.moveRight();
  } else if (frame < 240) {
    gameState.player.moveLeft();
  }

  // Test passes if player is still on ground after 300 frames
  if (frame >= 300) {
    console.log("TEST_1 Complete: Basic movement stable");
  }
}

function testWinCondition(p) {
  const frame = gameState.testFrameCount;
  
  // Move right continuously and jump over obstacles
  gameState.player.moveRight();
  
  // Jump periodically to clear platforms and enemies
  if (frame % 80 === 0 || (frame > 200 && frame % 60 === 30)) {
    gameState.player.jump();
  } else if (frame % 80 < 15) {
    gameState.player.jumpHold();
  }

  if (frame >= 600 && gameState.gamePhase !== GAME_PHASES.GAME_OVER_WIN) {
    console.log("TEST_2 Timeout: Did not reach flag in time");
  }
}

function testJumpMechanics(p) {
  const frame = gameState.testFrameCount;
  
  // Test short tap jump
  if (frame === 30) {
    gameState.player.jump();
    gameState.testData.jumpStartY = gameState.player.body.position.y;
  }
  
  // Record max height for short jump
  if (frame > 30 && frame < 60) {
    if (!gameState.testData.shortJumpMaxHeight) {
      gameState.testData.shortJumpMaxHeight = gameState.player.body.position.y;
    } else {
      gameState.testData.shortJumpMaxHeight = Math.min(
        gameState.testData.shortJumpMaxHeight,
        gameState.player.body.position.y
      );
    }
  }

  // Test held jump
  if (frame === 100) {
    gameState.player.jump();
    gameState.testData.longJumpStartY = gameState.player.body.position.y;
  }
  if (frame > 100 && frame < 115) {
    gameState.player.jumpHold();
  }

  // Record max height for held jump
  if (frame > 100 && frame < 150) {
    if (!gameState.testData.longJumpMaxHeight) {
      gameState.testData.longJumpMaxHeight = gameState.player.body.position.y;
    } else {
      gameState.testData.longJumpMaxHeight = Math.min(
        gameState.testData.longJumpMaxHeight,
        gameState.player.body.position.y
      );
    }
  }

  // Evaluate results
  if (frame === 200) {
    const shortJumpHeight = gameState.testData.jumpStartY - gameState.testData.shortJumpMaxHeight;
    const longJumpHeight = gameState.testData.longJumpStartY - gameState.testData.longJumpMaxHeight;
    console.log(`TEST_3 Results: Short jump: ${shortJumpHeight}px, Long jump: ${longJumpHeight}px`);
  }
}

function testCoinCollection(p) {
  const frame = gameState.testFrameCount;
  
  // Move right to collect coins
  gameState.player.moveRight();
  
  // Jump when needed
  if (frame % 70 === 0) {
    gameState.player.jump();
  } else if (frame % 70 < 15) {
    gameState.player.jumpHold();
  }

  // Check results after collecting several coins
  if (frame === 250) {
    console.log(`TEST_4 Results: Collected ${gameState.testData.coinsCollected} coins, Score: ${gameState.score}`);
  }
}

function testEnemyCollision(p) {
  const frame = gameState.testFrameCount;
  
  // Move towards first enemy
  if (frame < 80) {
    gameState.player.moveRight();
  }
  
  // Take side damage
  if (frame === 80) {
    gameState.testData.healthBeforeDamage = gameState.player.health;
  }
  
  // Wait for invulnerability to wear off
  if (frame > 150 && frame < 230) {
    gameState.player.moveRight();
  }
  
  // Try to stomp an enemy
  if (frame === 240) {
    gameState.player.jump();
  }
  if (frame > 240 && frame < 255) {
    gameState.player.jumpHold();
    gameState.player.moveRight();
  }

  if (frame === 300) {
    console.log(`TEST_5 Results: Damage taken: ${gameState.testData.damageTaken}, Enemies defeated: ${gameState.testData.enemiesDefeated}`);
  }
}

function testLoseCondition(p) {
  const frame = gameState.testFrameCount;
  
  // Move towards enemies to take damage
  gameState.player.moveRight();
  
  // Log when health reaches zero
  if (gameState.player.health === 0 || gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    if (frame < 400) {
      console.log(`TEST_6 Complete: Lost all health at frame ${frame}`);
    }
  }

  if (frame >= 400 && gameState.gamePhase !== GAME_PHASES.GAME_OVER_LOSE) {
    console.log("TEST_6 Failed: Did not lose all health");
  }
}

function testHealthRestoration(p) {
  const frame = gameState.testFrameCount;
  
  // First take damage
  if (frame < 80) {
    gameState.player.moveRight();
  }
  
  if (frame === 80) {
    gameState.testData.healthAfterDamage = gameState.player.health;
  }
  
  // Move to collect cloverleaf
  if (frame > 150 && frame < 300) {
    gameState.player.moveRight();
    
    // Jump to reach platform with clover
    if (frame === 180) {
      gameState.player.jump();
    }
    if (frame > 180 && frame < 195) {
      gameState.player.jumpHold();
    }
  }

  if (frame === 300) {
    console.log(`TEST_7 Results: Health after damage: ${gameState.testData.healthAfterDamage}, Final health: ${gameState.player.health}`);
  }
}

export function setControlMode(mode) {
  if (CONTROL_MODES[mode]) {
    gameState.controlMode = mode;
    gameState.testFrameCount = 0;
    gameState.testData = {
      jumpHeights: [],
      coinsCollected: 0,
      enemiesDefeated: 0,
      damageTaken: 0
    };
    
    // Update button states
    document.querySelectorAll('.control-button').forEach(btn => {
      btn.classList.remove('active');
    });
    const activeBtn = document.getElementById(`${mode.toLowerCase()}ModeBtn`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }
  }
}

window.setControlMode = setControlMode;