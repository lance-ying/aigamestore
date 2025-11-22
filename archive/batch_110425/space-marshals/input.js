// input.js - Input handling

import {
  gameState,
  KEY_ENTER,
  KEY_ESC,
  KEY_R,
  KEY_Z,
  KEY_SPACE,
  KEY_SHIFT,
  KEY_LEFT,
  KEY_UP,
  KEY_RIGHT,
  KEY_DOWN,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  CONTROL_HUMAN
} from './globals.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase transitions
  if (keyCode === KEY_ENTER && gameState.gamePhase === PHASE_START) {
    gameState.gamePhase = PHASE_PLAYING;
    p.logs.game_info.push({
      data: { phase: PHASE_PLAYING },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  if (keyCode === KEY_ESC) {
    if (gameState.gamePhase === PHASE_PLAYING) {
      gameState.gamePhase = PHASE_PAUSED;
      p.logs.game_info.push({
        data: { phase: PHASE_PAUSED },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      gameState.gamePhase = PHASE_PLAYING;
      p.logs.game_info.push({
        data: { phase: PHASE_PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  if (keyCode === KEY_R && 
      (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
       gameState.gamePhase === PHASE_GAME_OVER_LOSE)) {
    gameState.gamePhase = PHASE_START;
    p.logs.game_info.push({
      data: { phase: PHASE_START },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Gameplay inputs (only in PLAYING phase and HUMAN mode)
  if (gameState.gamePhase === PHASE_PLAYING && gameState.controlMode === CONTROL_HUMAN) {
    if (keyCode === KEY_Z && gameState.player) {
      gameState.player.switchWeapon();
    }
    
    if (keyCode === KEY_SHIFT && gameState.player) {
      gameState.player.stealthMode = !gameState.player.stealthMode;
      gameState.inStealth = gameState.player.stealthMode;
    }
  }
}

export function handleKeyReleased(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyReleased",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function processPlayerInput(p) {
  if (!gameState.player || gameState.gamePhase !== PHASE_PLAYING) return;
  
  let action = null;
  
  // Get action from appropriate controller
  if (gameState.controlMode === CONTROL_HUMAN) {
    action = getHumanAction(p);
  } else {
    // Automated testing mode
    if (typeof window.get_automated_testing_action === 'function') {
      action = window.get_automated_testing_action(gameState);
    }
  }
  
  if (!action) return;
  
  // Process movement
  if (action.move) {
    const speed = gameState.player.stealthMode ? 
                  gameState.player.speed * 0.6 : 
                  gameState.player.speed;
    
    if (action.move.left) gameState.player.x -= speed;
    if (action.move.right) gameState.player.x += speed;
    if (action.move.up) gameState.player.y -= speed;
    if (action.move.down) gameState.player.y += speed;
  }
  
  // Process aiming
  if (action.aim !== null) {
    gameState.player.angle = action.aim;
  }
  
  // Process actions
  if (action.fire) {
    const bullet = gameState.player.fire(p);
    if (bullet) {
      gameState.bullets.push(bullet);
    }
  }
  
  if (action.grenade) {
    const grenade = gameState.player.throwGrenade(p);
    if (grenade) {
      gameState.utilities.push(grenade);
    }
  }
  
  if (action.mine) {
    const mine = gameState.player.placeMine(p);
    if (mine) {
      gameState.utilities.push(mine);
    }
  }
}

function getHumanAction(p) {
  const action = {
    move: {
      left: p.keyIsDown(KEY_LEFT),
      right: p.keyIsDown(KEY_RIGHT),
      up: p.keyIsDown(KEY_UP),
      down: p.keyIsDown(KEY_DOWN)
    },
    aim: null,
    fire: p.keyIsDown(KEY_SPACE),
    grenade: false,
    mine: false
  };
  
  // Calculate aim angle based on movement or maintain current
  if (action.move.left || action.move.right || action.move.up || action.move.down) {
    let dx = 0, dy = 0;
    if (action.move.left) dx -= 1;
    if (action.move.right) dx += 1;
    if (action.move.up) dy -= 1;
    if (action.move.down) dy += 1;
    
    if (dx !== 0 || dy !== 0) {
      action.aim = Math.atan2(dy, dx);
    }
  }
  
  return action;
}