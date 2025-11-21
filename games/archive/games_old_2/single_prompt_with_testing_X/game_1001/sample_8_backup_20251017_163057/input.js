import { gameState, GAME_PHASES } from './globals.js';
import { Player } from './player.js';
import { createLevel } from './level.js';

export function handleKeyPressed(p) {
  const key = p.key;
  const keyCode = p.keyCode;
  
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase transitions
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame();
    }
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { phase: GAME_PHASES.PAUSED },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: GAME_PHASES.PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      restartGame();
    }
  }
  
  // Gameplay controls
  if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.player) {
    if (keyCode === 90) { // Z
      gameState.player.shoot();
    }
    
    if (keyCode === 16) { // Shift
      gameState.player.cycleWeapon();
    }
  }
}

export function handleKeyReleased(p) {
  const key = p.key;
  const keyCode = p.keyCode;
  
  p.logs.inputs.push({
    input_type: "keyReleased",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.player) {
    if (keyCode === 32) { // Space
      gameState.player.jumpHeld = false;
    }
  }
}

function startGame() {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  gameState.score = 0;
  gameState.bossDefeated = false;
  
  const p = window.gameInstance;
  
  createLevel(p);
  gameState.player = new Player(p, 100, 300);
  gameState.camera.x = 0;
  gameState.camera.y = 0;
  
  p.logs.game_info.push({
    data: { phase: GAME_PHASES.PLAYING },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function restartGame() {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.player = null;
  gameState.entities = [];
  gameState.projectiles = [];
  gameState.particles = [];
  gameState.platforms = [];
  gameState.hazards = [];
  gameState.collectibles = [];
  gameState.saveStations = [];
  gameState.boss = null;
  gameState.score = 0;
  gameState.bossDefeated = false;
  
  const p = window.gameInstance;
  p.logs.game_info.push({
    data: { phase: GAME_PHASES.START },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}