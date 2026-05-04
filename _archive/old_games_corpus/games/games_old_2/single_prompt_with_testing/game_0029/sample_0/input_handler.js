// input_handler.js - Handle player inputs

import { gameState, GAME_PHASES } from './globals.js';
import get_automated_testing_action from './automated_testing_controller.js';

export function handleInput(p) {
  const player = gameState.player;

  // Reset velocity
  player.vx = 0;
  player.vy = 0;

  if (gameState.controlMode === "HUMAN") {
    // Handle keyboard input
    if (p.keyIsDown(37)) { // Left arrow
      player.vx = -player.speed;
    }
    if (p.keyIsDown(39)) { // Right arrow
      player.vx = player.speed;
    }
    if (p.keyIsDown(38)) { // Up arrow
      player.vy = -player.speed;
    }
    if (p.keyIsDown(40)) { // Down arrow
      player.vy = player.speed;
    }

    // Normalize diagonal movement
    if (player.vx !== 0 && player.vy !== 0) {
      const mag = p.sqrt(player.vx * player.vx + player.vy * player.vy);
      player.vx = (player.vx / mag) * player.speed;
      player.vy = (player.vy / mag) * player.speed;
    }

    if (p.keyIsDown(32)) { // Space - attack
      player.attack();
    }

    if (p.keyIsDown(90)) { // Z - special ability
      player.specialAbility();
    }
  } else {
    // Automated testing mode
    const action = get_automated_testing_action(gameState);

    if (action.up) player.vy = -player.speed;
    if (action.down) player.vy = player.speed;
    if (action.left) player.vx = -player.speed;
    if (action.right) player.vx = player.speed;

    // Normalize diagonal movement
    if (player.vx !== 0 && player.vy !== 0) {
      const mag = p.sqrt(player.vx * player.vx + player.vy * player.vy);
      player.vx = (player.vx / mag) * player.speed;
      player.vy = (player.vy / mag) * player.speed;
    }

    if (action.attack) player.attack();
    if (action.special) player.specialAbility();
  }
}

export function handleKeyPressed(p) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // Game phase transitions
  if (p.keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase, message: "Game started" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }

  if (p.keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase, message: "Game paused" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase, message: "Game resumed" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }

  if (p.keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      gameState.gamePhase = GAME_PHASES.START;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase, message: "Restarted to start screen" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
}