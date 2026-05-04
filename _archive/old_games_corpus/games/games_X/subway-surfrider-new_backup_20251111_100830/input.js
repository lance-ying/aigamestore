// input.js - Input handling
import { gameState, GAME_PHASES } from './globals.js';

export function handleInput(p, player, keyCode) {
  // Game phase controls
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame();
      
      p.logs.game_info.push({
        data: { phase: "PLAYING", action: "game_started" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      
      p.logs.game_info.push({
        data: { phase: "PAUSED", action: "game_paused" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      
      p.logs.game_info.push({
        data: { phase: "PLAYING", action: "game_resumed" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER || 
        gameState.gamePhase === GAME_PHASES.WIN) {
      resetGame();
      
      p.logs.game_info.push({
        data: { phase: "START", action: "game_reset" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  // Gameplay controls
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  // Movement controls
  if (keyCode === 37 || keyCode === 65) { // LEFT or A
    player.moveLeft();
    
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: "LEFT", keyCode: keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else if (keyCode === 39 || keyCode === 68) { // RIGHT or D
    player.moveRight();
    
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: "RIGHT", keyCode: keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else if (keyCode === 38 || keyCode === 87) { // UP or W
    player.jump();
    
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: "UP", keyCode: keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else if (keyCode === 40 || keyCode === 83) { // DOWN or S
    player.slide();
    
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: "DOWN", keyCode: keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function startGame() {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  gameState.score = 0;
  gameState.coinsCollected = 0;
  gameState.distanceRun = 0;
  gameState.currentLevel = 0;
  gameState.gameSpeed = 5;
  gameState.lastPowerupDistance = 0;
  gameState.framesSinceStart = 0;
  gameState.lives = 3;
  
  // Clear entities
  gameState.entities = [];
  gameState.obstacles = [];
  gameState.coins = [];
  gameState.powerups = [];
  
  // Reset player state
  if (gameState.player) {
    gameState.player.invincible = false;
    gameState.player.invincibilityTimer = 0;
  }
}

function resetGame() {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.score = 0;
  gameState.coinsCollected = 0;
  gameState.distanceRun = 0;
  gameState.currentLevel = 0;
  gameState.gameSpeed = 5;
  gameState.lastPowerupDistance = 0;
  gameState.framesSinceStart = 0;
  gameState.lives = 3;
  
  // Clear entities
  gameState.entities = [];
  gameState.obstacles = [];
  gameState.coins = [];
  gameState.powerups = [];
  
  // Reset player state
  if (gameState.player) {
    gameState.player.invincible = false;
    gameState.player.invincibilityTimer = 0;
  }
}