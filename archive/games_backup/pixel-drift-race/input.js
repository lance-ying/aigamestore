// input.js - Input handling

import { 
  gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED,
  PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE
} from './globals.js';
import { resetLevel } from './gameLogic.js';

export function handleKeyPressed(p) {
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // ENTER - Start game
  if (p.keyCode === 13) {
    if (gameState.gamePhase === PHASE_START) {
      gameState.gamePhase = PHASE_PLAYING;
      gameState.currentLevel = 1;
      gameState.score = 0;
      resetLevel(p);
    }
  }

  // ESC - Pause/Unpause
  if (p.keyCode === 27) {
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

  // R - Restart
  if (p.keyCode === 82) {
    if (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
        gameState.gamePhase === PHASE_GAME_OVER_LOSE ||
        gameState.gamePhase === PHASE_PAUSED) {
      gameState.gamePhase = PHASE_START;
      gameState.currentLevel = 1;
      gameState.score = 0;
      gameState.cash = 0;
      p.logs.game_info.push({
        data: { phase: PHASE_START, action: "restart" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }

  // Game controls (only during PLAYING phase)
  if (gameState.gamePhase === PHASE_PLAYING) {
    // Arrow Up or W (87)
    if (p.keyCode === 38 || p.keyCode === 87) {
      gameState.inputState.up = true;
    }

    // Arrow Left or A (65)
    if (p.keyCode === 37 || p.keyCode === 65) {
      gameState.inputState.left = true;
    }

    // Arrow Right or D (68)
    if (p.keyCode === 39 || p.keyCode === 68) {
      gameState.inputState.right = true;
    }

    // Space (32)
    if (p.keyCode === 32) {
      gameState.inputState.space = true;
    }
  }
}

export function handleKeyReleased(p) {
  p.logs.inputs.push({
    input_type: "keyReleased",
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  if (gameState.gamePhase === PHASE_PLAYING) {
    // Arrow Up or W
    if (p.keyCode === 38 || p.keyCode === 87) {
      gameState.inputState.up = false;
    }

    // Arrow Left or A
    if (p.keyCode === 37 || p.keyCode === 65) {
      gameState.inputState.left = false;
    }

    // Arrow Right or D
    if (p.keyCode === 39 || p.keyCode === 68) {
      gameState.inputState.right = false;
    }

    // Space
    if (p.keyCode === 32) {
      gameState.inputState.space = false;
    }
  }
}

export function updateInputFromTestController(p) {
  if (gameState.controlMode === "HUMAN") return;

  // Reset all inputs
  gameState.inputState.up = false;
  gameState.inputState.left = false;
  gameState.inputState.right = false;
  gameState.inputState.space = false;

  if (gameState.controlMode === "TEST_1") {
    // Basic testing: just accelerate
    gameState.inputState.up = true;
  } else if (gameState.controlMode === "TEST_2") {
    // Win test: accelerate, avoid obstacles, complete level
    gameState.inputState.up = true;
    
    if (gameState.player) {
      // Simple AI to avoid obstacles
      let targetLane = gameState.player.lane;
      let minThreat = Infinity;
      
      for (let lane = 0; lane < 3; lane++) {
        let threat = 0;
        
        // Check obstacles in this lane
        gameState.obstacles.forEach(obs => {
          if (obs.lane === lane && obs.y > gameState.player.y - 100 && obs.y < gameState.player.y + 200) {
            threat += 100 / Math.max(1, obs.y - gameState.player.y);
          }
        });
        
        // Check rivals in this lane
        gameState.rivals.forEach(rival => {
          if (rival.lane === lane && rival.y > gameState.player.y - 100 && rival.y < gameState.player.y + 200) {
            threat += 50 / Math.max(1, Math.abs(rival.y - gameState.player.y));
          }
        });
        
        if (threat < minThreat) {
          minThreat = threat;
          targetLane = lane;
        }
      }
      
      if (targetLane < gameState.player.lane) {
        gameState.inputState.left = true;
      } else if (targetLane > gameState.player.lane) {
        gameState.inputState.right = true;
      }
      
      // Drift when changing lanes at high speed
      if (gameState.player.speed > 4 && gameState.player.x !== gameState.player.targetX) {
        gameState.inputState.space = true;
      }
    }
  }
}