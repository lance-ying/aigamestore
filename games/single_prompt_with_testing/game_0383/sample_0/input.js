// input.js
import { gameState, GAME_PHASES } from './globals.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  gameState.keysPressed[keyCode] = true;
  
  // Phase transition keys
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame(p);
    }
  } else if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      pauseGame(p);
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      resumeGame(p);
    }
  } else if (keyCode === 82) { // R
    if (gameState.gamePhase.startsWith("GAME_OVER")) {
      restartGame(p);
    }
  }
  
  // Gameplay keys (only during PLAYING phase)
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    if (keyCode === 32) { // SPACE - Interact
      handleInteraction(p);
    } else if (keyCode === 90) { // Z - Use gadget
      handleGadgetUse(p);
    }
  }
}

export function handleKeyReleased(p, key, keyCode) {
  p.logs.inputs.push({
    input_type: "keyReleased",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  gameState.keysPressed[keyCode] = false;
}

function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  p.logs.game_info.push({
    data: { phase: gameState.gamePhase },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  p.loop();
}

function pauseGame(p) {
  gameState.gamePhase = GAME_PHASES.PAUSED;
  p.logs.game_info.push({
    data: { phase: gameState.gamePhase },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resumeGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  p.logs.game_info.push({
    data: { phase: gameState.gamePhase },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function restartGame(p) {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.score = 0;
  gameState.itemsCollected = 0;
  gameState.lives = 3;
  gameState.currentDialog = null;
  gameState.dialogTimer = 0;
  gameState.gadgetCooldown = 0;
  gameState.keysPressed = {};
  
  p.logs.game_info.push({
    data: { phase: gameState.gamePhase },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Recreate world
  const { createWorld } = require('./world.js');
  createWorld();
}

function handleInteraction(p) {
  if (!gameState.player) return;
  
  const interactionRange = 40;
  
  // Check NPCs
  for (const npc of gameState.npcs) {
    const dist = p.dist(gameState.player.x, gameState.player.y, npc.x, npc.y);
    if (dist < interactionRange) {
      npc.interact();
      return;
    }
  }
  
  // Check items
  for (const item of gameState.items) {
    const dist = p.dist(gameState.player.x, gameState.player.y, item.x, item.y);
    if (dist < interactionRange) {
      item.collect();
      return;
    }
  }
}

function handleGadgetUse(p) {
  if (!gameState.player || !gameState.player.hasGadget) return;
  if (gameState.gadgetCooldown > 0) return;
  
  // Distraction gadget - confuses nearby guards
  if (gameState.player.gadgetType === "DISTRACTION") {
    for (const guard of gameState.guards) {
      const dist = p.dist(gameState.player.x, gameState.player.y, guard.x, guard.y);
      if (dist < 150) {
        guard.isChasing = false;
        guard.alertness = 0;
      }
    }
    
    gameState.player.hasGadget = false;
    gameState.player.gadgetType = null;
    gameState.gadgetCooldown = 120; // 2 seconds
  }
}

export function processMovement(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING || !gameState.player) return;
  
  let dx = 0;
  let dy = 0;
  
  if (gameState.keysPressed[37]) dx -= 1; // LEFT
  if (gameState.keysPressed[39]) dx += 1; // RIGHT
  if (gameState.keysPressed[38]) dy -= 1; // UP
  if (gameState.keysPressed[40]) dy += 1; // DOWN
  
  const isSprinting = gameState.keysPressed[16]; // SHIFT
  
  if (dx !== 0 || dy !== 0) {
    // Normalize diagonal movement
    const mag = Math.sqrt(dx * dx + dy * dy);
    dx /= mag;
    dy /= mag;
    
    gameState.player.move(dx, dy, isSprinting);
  }
}