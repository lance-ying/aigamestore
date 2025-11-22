// input.js
import { GAME_PHASES, gameState } from './globals.js';

export function setupInput(p, wheel, minigame) {
  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Phase transitions
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === GAME_PHASES.START) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        p.logs.game_info.push({
          data: { phase: "PLAYING" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        p.logs.game_info.push({
          data: { phase: "PAUSED" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        p.logs.game_info.push({
          data: { phase: "PLAYING" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    if (p.keyCode === 82) { // R
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        resetGame(p);
      }
    }
    
    // Gameplay inputs
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (p.keyCode === 32) { // SPACE
        gameState.spacePressed = true;
        if (!gameState.minigameActive) {
          wheel.spin();
        }
      }
      
      if (p.keyCode === 90) { // Z
        gameState.zPressed = true;
      }
    }
  };
  
  p.keyReleased = function() {
    p.logs.inputs.push({
      input_type: "keyReleased",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    if (p.keyCode === 32) {
      gameState.spacePressed = false;
    }
    
    if (p.keyCode === 90) {
      gameState.zPressed = false;
    }
  };
}

function resetGame(p) {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.score = 0;
  gameState.memories = 0;
  gameState.currentSpace = 0;
  gameState.wheelSpinning = false;
  gameState.wheelValue = 0;
  gameState.wheelAngle = 0;
  gameState.wheelSpeed = 0;
  gameState.moving = false;
  gameState.moveProgress = 0;
  gameState.targetSpace = 0;
  gameState.minigameActive = false;
  gameState.minigameType = null;
  gameState.minigameScore = 0;
  gameState.minigameTimer = 0;
  gameState.minigameTargets = [];
  gameState.souvenirs = 0;
  gameState.photos = 0;
  gameState.celebrationTimer = 0;
  gameState.messageTimer = 0;
  gameState.currentMessage = "";
  gameState.spacePressed = false;
  gameState.zPressed = false;
  
  p.logs.game_info.push({
    data: { phase: "START", action: "reset" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}