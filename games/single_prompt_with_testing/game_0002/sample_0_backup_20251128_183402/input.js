// input.js - Input handling

import {
  PHASE_START, PHASE_PLAYING, PHASE_PAUSED,
  PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE
} from './globals.js';

export function handleKeyPress(p, gameState) {
  const key = p.key;
  const keyCode = p.keyCode;
  
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // ENTER - Start game
  if (keyCode === 13 && gameState.gamePhase === PHASE_START) {
    startGame(gameState, p);
  }
  
  // ESC - Pause/Unpause
  if (keyCode === 27) {
    if (gameState.gamePhase === PHASE_PLAYING) {
      pauseGame(gameState, p);
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      unpauseGame(gameState, p);
    }
  }
  
  // R - Restart
  if (keyCode === 82) {
    restartGame(gameState, p);
  }
  
  // Boon selection
  if (gameState.selectingBoon) {
    if (keyCode === 38) { // UP
      gameState.boonChoice = Math.max(0, (gameState.boonChoice || 0) - 1);
    } else if (keyCode === 40) { // DOWN
      gameState.boonChoice = Math.min(2, (gameState.boonChoice || 0) + 1);
    } else if (keyCode === 32) { // SPACE
      selectBoon(gameState);
    }
  }
}

export function handleGameInput(p, gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  if (gameState.selectingBoon) return;
  
  const player = gameState.player;
  if (!player) return;
  
  let dx = 0;
  let dy = 0;
  
  // Get input based on control mode
  let action = null;
  if (gameState.controlMode === "HUMAN") {
    // Arrow keys for movement
    if (p.keyIsDown(37)) dx = -1; // LEFT
    if (p.keyIsDown(39)) dx = 1;  // RIGHT
    if (p.keyIsDown(38)) dy = -1; // UP
    if (p.keyIsDown(40)) dy = 1;  // DOWN
    
    // Space for dash
    if (p.keyIsDown(32)) {
      action = { type: 'dash' };
    }
    
    // Z for attack
    if (p.keyIsDown(90)) {
      action = { type: 'attack' };
    }
  } else {
    // Automated testing
    action = window.get_automated_testing_action(gameState);
    
    if (action) {
      if (action.arrow_left) dx = -1;
      if (action.arrow_right) dx = 1;
      if (action.arrow_up) dy = -1;
      if (action.arrow_down) dy = 1;
    }
  }
  
  // Apply movement
  if (dx !== 0 || dy !== 0) {
    // Normalize diagonal movement
    const mag = Math.sqrt(dx * dx + dy * dy);
    dx /= mag;
    dy /= mag;
    player.move(dx, dy);
  } else {
    player.move(0, 0);
  }
  
  // Apply actions
  if (action) {
    if (action.type === 'dash' || action.space) {
      player.dash();
    }
    if (action.type === 'attack' || action.z) {
      const attacked = player.attack(gameState);
      if (attacked) {
        checkPlayerAttackHits(gameState);
      }
    }
  }
}

function checkPlayerAttackHits(gameState) {
  const player = gameState.player;
  const hitbox = player.getAttackHitbox();
  
  const room = gameState.roomData[gameState.currentRoom];
  if (!room) return;
  
  for (const enemy of room.enemies) {
    const dx = enemy.x - hitbox.x;
    const dy = enemy.y - hitbox.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < hitbox.radius + enemy.width / 2) {
      enemy.takeDamage(player.attackDamage, gameState);
    }
  }
}

function startGame(gameState, p) {
  gameState.gamePhase = PHASE_PLAYING;
  p.logs.game_info.push({
    data: { phase: PHASE_PLAYING },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function pauseGame(gameState, p) {
  gameState.gamePhase = PHASE_PAUSED;
  p.noLoop();
  p.logs.game_info.push({
    data: { phase: PHASE_PAUSED },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function unpauseGame(gameState, p) {
  gameState.gamePhase = PHASE_PLAYING;
  p.loop();
  p.logs.game_info.push({
    data: { phase: PHASE_PLAYING },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function restartGame(gameState, p) {
  // Reset to start screen
  gameState.gamePhase = PHASE_START;
  gameState.player = null;
  gameState.enemies = [];
  gameState.particles = [];
  gameState.roomData = [];
  gameState.currentRoom = 0;
  gameState.roomsCleared = 0;
  gameState.score = 0;
  gameState.boonOffered = false;
  gameState.selectingBoon = false;
  gameState.attackBonus = 0;
  gameState.speedBonus = 0;
  gameState.dashBonus = 0;
  
  p.loop();
  
  p.logs.game_info.push({
    data: { phase: PHASE_START, action: "restart" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function selectBoon(gameState) {
  if (!gameState.boonOffered) return;
  
  const boons = gameState.boonOffered;
  const choice = gameState.boonChoice || 0;
  const selectedBoon = boons[choice];
  
  const { applyBoon } = require('./boons.js');
  applyBoon(selectedBoon, gameState);
  
  gameState.selectingBoon = false;
  gameState.boonOffered = false;
}