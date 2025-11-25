// input.js - Input handling

import { gameState, GAME_PHASES } from './globals.js';

export function handleInput(p) {
  const player = gameState.player;
  if (!player || gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  // Movement
  if (p.keyIsDown(37)) { // LEFT
    player.moveLeft();
  }
  if (p.keyIsDown(39)) { // RIGHT
    player.moveRight();
  }
  
  // Aim
  if (p.keyIsDown(38)) { // UP
    player.aimAngle -= 0.05;
  }
  if (p.keyIsDown(40)) { // DOWN
    player.aimAngle += 0.05;
  }
  
  // Clamp aim angle
  player.aimAngle = p.constrain(player.aimAngle, -p.PI / 2, p.PI / 2);
}

export function setupKeyHandlers(p) {
  p.keyPressed = function() {
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
        startGame(p);
      }
    }
    
    if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        p.logs.game_info.push({
          data: { gamePhase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        p.logs.game_info.push({
          data: { gamePhase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    if (p.keyCode === 82) { // R
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        resetGame(p);
      }
    }
    
    // Gameplay keys
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      const player = gameState.player;
      
      if (p.keyCode === 32) { // SPACE
        player.jump();
      }
      
      if (p.keyCode === 90) { // Z
        player.useCardAbility();
      }
      
      if (p.keyCode === 16) { // SHIFT
        const card = player.getCurrentCard();
        if (card && card.type.ability === "DASH") {
          player.dash();
          player.removeCurrentCard();
        }
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
  };
}

function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  gameState.startTime = Date.now();
  
  p.logs.game_info.push({
    data: { gamePhase: gameState.gamePhase, event: "game_started" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resetGame(p) {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.score = 0;
  gameState.demonsKilled = 0;
  gameState.levelComplete = false;
  gameState.completionTime = 0;
  
  p.logs.game_info.push({
    data: { gamePhase: gameState.gamePhase, event: "game_reset" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}