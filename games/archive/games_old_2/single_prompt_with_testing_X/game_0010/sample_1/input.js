// input.js
import { 
  PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_LOSE,
  gameState 
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
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === PHASE_START) {
      startGame(p);
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === PHASE_PLAYING) {
      gameState.gamePhase = PHASE_PAUSED;
      p.noLoop();
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      gameState.gamePhase = PHASE_PLAYING;
      p.loop();
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      resetGame(p);
    }
    return;
  }
  
  // Gameplay controls (only in PLAYING phase)
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  if (gameState.controlMode === "HUMAN") {
    handleHumanInput(p, keyCode);
  }
}

function handleHumanInput(p, keyCode) {
  if (!gameState.player) return;
  
  if (keyCode === 32) { // SPACE
    gameState.player.changeColor(p);
  }
}

export function handleContinuousInput(p) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  if (!gameState.player) return;
  
  if (gameState.controlMode === "HUMAN") {
    if (p.keyIsDown(37)) { // LEFT
      gameState.player.moveLeft();
    }
    if (p.keyIsDown(39)) { // RIGHT
      gameState.player.moveRight();
    }
  }
}

function startGame(p) {
  gameState.gamePhase = PHASE_PLAYING;
  
  // Initialize player
  const { Player } = require('./player.js');
  gameState.player = new Player(300, 320);
  gameState.entities = [gameState.player];
  
  p.logs.game_info.push({
    data: { phase: PHASE_PLAYING, event: "game_started" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resetGame(p) {
  gameState.gamePhase = PHASE_START;
  gameState.player = null;
  gameState.entities = [];
  gameState.rings = [];
  gameState.obstacles = [];
  gameState.particles = [];
  gameState.score = 0;
  gameState.distance = 0;
  gameState.neckLength = 5;
  gameState.currentColor = 'RED';
  gameState.frameCounter = 0;
  gameState.lastRingSpawn = 0;
  gameState.lastObstacleSpawn = 0;
  gameState.difficulty = 1;
  gameState.courseSpeed = 2;
  gameState.positionHistory = [];
  
  p.logs.game_info.push({
    data: { phase: PHASE_START, event: "game_reset" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}