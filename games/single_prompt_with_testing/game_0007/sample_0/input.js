// input.js - Input handling

import { gameState, KEY_ENTER, KEY_ESC, KEY_R,
         KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_SPACE, KEY_Z,
         PHASE_START, PHASE_PLAYING, PHASE_PAUSED,
         PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';

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
      data: { phase: PHASE_PLAYING, event: "game_started" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  if (keyCode === KEY_ESC) {
    if (gameState.gamePhase === PHASE_PLAYING) {
      gameState.gamePhase = PHASE_PAUSED;
      p.logs.game_info.push({
        data: { phase: PHASE_PAUSED, event: "game_paused" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      gameState.gamePhase = PHASE_PLAYING;
      p.logs.game_info.push({
        data: { phase: PHASE_PLAYING, event: "game_resumed" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === KEY_R && (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
                             gameState.gamePhase === PHASE_GAME_OVER_LOSE)) {
    gameState.gamePhase = PHASE_START;
    p.logs.game_info.push({
      data: { phase: PHASE_START, event: "game_restarted" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
}

export function processGameplayInput(p) {
  if (gameState.gamePhase !== PHASE_PLAYING || !gameState.player) {
    return;
  }
  
  let action = null;
  
  // Get action from control mode
  if (gameState.controlMode === "HUMAN") {
    // Human input
    if (p.keyIsDown(KEY_LEFT)) {
      gameState.player.move(-1);
    } else if (p.keyIsDown(KEY_RIGHT)) {
      gameState.player.move(1);
    } else {
      gameState.player.move(0);
    }
    
    if (p.keyIsDown(KEY_UP)) {
      gameState.player.jump();
    }
    
    if (p.keyIsDown(KEY_Z)) {
      action = { shoot: true };
    }
    
    if (p.keyIsDown(KEY_SPACE)) {
      action = { dash: true };
    }
  } else {
    // Automated testing
    if (window.get_automated_testing_action) {
      action = window.get_automated_testing_action(gameState);
      
      if (action) {
        // Apply action
        if (action.left) {
          gameState.player.move(-1);
        } else if (action.right) {
          gameState.player.move(1);
        } else {
          gameState.player.move(0);
        }
        
        if (action.jump) {
          gameState.player.jump();
        }
      }
    }
  }
  
  // Handle shooting and dashing (works for both human and AI)
  if (action) {
    if (action.shoot && gameState.player.shoot()) {
      return 'shoot';
    }
    if (action.dash && gameState.player.dash()) {
      return 'dash';
    }
  }
  
  return null;
}