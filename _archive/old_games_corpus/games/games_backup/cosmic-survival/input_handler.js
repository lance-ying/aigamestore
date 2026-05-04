// input_handler.js - Input handling
import { gameState, playerStats } from './globals.js';
import {
  KEY_ENTER, KEY_ESC, KEY_R, KEY_SPACE, KEY_Z,
  KEY_LEFT, KEY_UP, KEY_RIGHT, KEY_DOWN,
  PHASE_START, PHASE_PLAYING, PHASE_PAUSED,
  PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE
} from './globals.js';
import { initGame, fireBullet } from './game_logic.js';
import { applyUpgrade } from './upgrades.js';
import get_automated_testing_action from './automated_testing_controller.js';

export function handleKeyPressed(p) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // Phase transitions
  if (p.keyCode === KEY_ENTER && gameState.gamePhase === PHASE_START) {
    gameState.gamePhase = PHASE_PLAYING;
    initGame(p);
    return;
  }

  if (p.keyCode === KEY_ESC && gameState.gamePhase === PHASE_PLAYING) {
    gameState.gamePhase = PHASE_PAUSED;
    return;
  }

  if (p.keyCode === KEY_ESC && gameState.gamePhase === PHASE_PAUSED) {
    gameState.gamePhase = PHASE_PLAYING;
    return;
  }

  if (p.keyCode === KEY_R && (
    gameState.gamePhase === PHASE_GAME_OVER_WIN || 
    gameState.gamePhase === PHASE_GAME_OVER_LOSE
  )) {
    gameState.gamePhase = PHASE_START;
    return;
  }

  // Upgrade selection (1, 2, 3 keys)
  if (gameState.showingUpgradeScreen && gameState.gamePhase === PHASE_PLAYING) {
    if (p.key === '1' && gameState.upgradeChoices.length > 0) {
      applyUpgrade(gameState.upgradeChoices[0]);
      gameState.showingUpgradeScreen = false;
    } else if (p.key === '2' && gameState.upgradeChoices.length > 1) {
      applyUpgrade(gameState.upgradeChoices[1]);
      gameState.showingUpgradeScreen = false;
    } else if (p.key === '3' && gameState.upgradeChoices.length > 2) {
      applyUpgrade(gameState.upgradeChoices[2]);
      gameState.showingUpgradeScreen = false;
    }
  }
}

export function handleGameplayInput(p) {
  if (gameState.gamePhase !== PHASE_PLAYING || gameState.showingUpgradeScreen) {
    return;
  }

  let action = null;

  if (gameState.controlMode === "HUMAN") {
    action = getHumanAction(p);
  } else {
    action = get_automated_testing_action(gameState);
  }

  if (action) {
    applyAction(p, action);
  }
}

function getHumanAction(p) {
  const action = {
    moveX: 0,
    moveY: 0,
    fire: false,
    special: false
  };

  if (p.keyIsDown(KEY_LEFT)) action.moveX -= 1;
  if (p.keyIsDown(KEY_RIGHT)) action.moveX += 1;
  if (p.keyIsDown(KEY_UP)) action.moveY -= 1;
  if (p.keyIsDown(KEY_DOWN)) action.moveY += 1;
  if (p.keyIsDown(KEY_SPACE)) action.fire = true;
  if (p.keyIsDown(KEY_Z)) action.special = true;

  return action;
}

function applyAction(p, action) {
  if (!gameState.player) return;

  // Movement
  if (action.moveX !== 0 || action.moveY !== 0) {
    // Normalize diagonal movement
    const magnitude = Math.sqrt(action.moveX * action.moveX + action.moveY * action.moveY);
    const dx = (action.moveX / magnitude) * playerStats.moveSpeed;
    const dy = (action.moveY / magnitude) * playerStats.moveSpeed;
    gameState.player.move(dx, dy);
  }

  // Firing
  if (action.fire) {
    fireBullet(p);
  }

  // Special ability (if implemented)
  if (action.special && playerStats.hasLightning) {
    // Could trigger manual lightning or other special abilities
  }
}