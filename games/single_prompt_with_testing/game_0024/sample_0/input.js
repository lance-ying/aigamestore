// input.js - Input handling

import {
  gameState,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  KEY_ENTER,
  KEY_ESC,
  KEY_R,
  KEY_SPACE,
  KEY_Z,
  KEY_SHIFT,
  KEY_LEFT,
  KEY_UP,
  KEY_RIGHT,
  KEY_DOWN,
  CONTROL_HUMAN
} from './globals.js';
import { handlePlayerMovement, checkSwitchInteraction, checkLightbulbPickup, checkSunChamberInteraction } from './physics.js';
import { startGame, resetGame } from './game_states.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase transitions
  if (keyCode === KEY_ENTER && gameState.gamePhase === PHASE_START) {
    startGame(p);
    return;
  }
  
  if (keyCode === KEY_ESC && gameState.gamePhase === PHASE_PLAYING) {
    gameState.gamePhase = PHASE_PAUSED;
    p.logs.game_info.push({
      data: { phase: PHASE_PAUSED },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  if (keyCode === KEY_ESC && gameState.gamePhase === PHASE_PAUSED) {
    gameState.gamePhase = PHASE_PLAYING;
    p.logs.game_info.push({
      data: { phase: PHASE_PLAYING },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  if (keyCode === KEY_R && (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE)) {
    resetGame(p);
    return;
  }
  
  // Gameplay inputs (only in PLAYING phase)
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  const player = gameState.player;
  if (!player) return;
  
  // Interaction keys
  if (keyCode === KEY_SPACE) {
    const sw = checkSwitchInteraction(player);
    if (sw) {
      sw.toggle();
    }
  }
  
  if (keyCode === KEY_Z) {
    // Pick up or place lightbulb
    if (!gameState.hasLightbulb) {
      const lightbulb = checkLightbulbPickup(player);
      if (lightbulb) {
        gameState.hasLightbulb = true;
        lightbulb.pickedUp = true;
        gameState.score += 200;
      }
    } else {
      // Try to place at sun chamber
      const chamber = checkSunChamberInteraction(player);
      if (chamber) {
        chamber.activate();
        gameState.hasLightbulb = false;
        gameState.gamePhase = PHASE_GAME_OVER_WIN;
        gameState.endTime = Date.now();
        p.logs.game_info.push({
          data: { phase: PHASE_GAME_OVER_WIN, score: gameState.score },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
}

export function processPlayerInput(p) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  if (gameState.controlMode !== CONTROL_HUMAN) return;
  
  const player = gameState.player;
  if (!player) return;
  
  let vx = 0;
  let vy = 0;
  
  if (p.keyIsDown(KEY_LEFT)) vx = -1;
  if (p.keyIsDown(KEY_RIGHT)) vx = 1;
  if (p.keyIsDown(KEY_UP)) vy = -1;
  if (p.keyIsDown(KEY_DOWN)) vy = 1;
  
  // Normalize diagonal movement
  if (vx !== 0 && vy !== 0) {
    vx *= 0.707;
    vy *= 0.707;
  }
  
  // Apply sprint
  const isSprinting = p.keyIsDown(KEY_SHIFT) && player.stamina > 0;
  player.isSprinting = isSprinting;
  const speed = isSprinting ? player.sprintSpeed : player.speed;
  
  player.vx = vx * speed;
  player.vy = vy * speed;
  
  handlePlayerMovement(player, player.vx, player.vy);
}

export function processAutomatedInput(p, action) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  const player = gameState.player;
  if (!player) return;
  
  let vx = 0;
  let vy = 0;
  
  if (action.left) vx = -1;
  if (action.right) vx = 1;
  if (action.up) vy = -1;
  if (action.down) vy = 1;
  
  // Normalize diagonal movement
  if (vx !== 0 && vy !== 0) {
    vx *= 0.707;
    vy *= 0.707;
  }
  
  // Apply sprint
  const isSprinting = action.sprint && player.stamina > 0;
  player.isSprinting = isSprinting;
  const speed = isSprinting ? player.sprintSpeed : player.speed;
  
  player.vx = vx * speed;
  player.vy = vy * speed;
  
  handlePlayerMovement(player, player.vx, player.vy);
  
  // Handle interactions
  if (action.interact) {
    const sw = checkSwitchInteraction(player);
    if (sw && !sw.activated) {
      sw.toggle();
    }
  }
  
  if (action.pickup) {
    if (!gameState.hasLightbulb) {
      const lightbulb = checkLightbulbPickup(player);
      if (lightbulb) {
        gameState.hasLightbulb = true;
        lightbulb.pickedUp = true;
        gameState.score += 200;
      }
    } else {
      const chamber = checkSunChamberInteraction(player);
      if (chamber) {
        chamber.activate();
        gameState.hasLightbulb = false;
        gameState.gamePhase = PHASE_GAME_OVER_WIN;
        gameState.endTime = Date.now();
        p.logs.game_info.push({
          data: { phase: PHASE_GAME_OVER_WIN, score: gameState.score },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
}