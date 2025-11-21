// gameLogic.js - Core game logic
import { gameState, initializeGrid, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, GRID_ROWS, GRID_COLS } from './globals.js';
import { FallingCard } from './fallingCard.js';
import { detectAndClearCombos, removeCompletedClearingCards } from './comboDetector.js';
import { updateParticles } from './particles.js';

export function startGame(p) {
  initializeGrid();
  gameState.score = 0;
  gameState.level = 1;
  gameState.combosCleared = 0;
  gameState.timeRemaining = 120;
  gameState.entities = [];
  gameState.particleEffects = [];
  gameState.clearingAnimation = [];
  gameState.levelProgress = 0;
  gameState.requiredCombos = 5;
  gameState.fallSpeed = 1;
  gameState.scoreMultiplier = 1;
  gameState.lastFrameTime = Date.now();
  
  gameState.fallingCard = new FallingCard(p);
  gameState.gamePhase = PHASE_PLAYING;

  p.logs.game_info.push({
    data: { event: 'game_started' },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  logPlayerInfo(p);
}

export function togglePause(p) {
  if (gameState.gamePhase === PHASE_PLAYING) {
    gameState.gamePhase = PHASE_PAUSED;
    p.logs.game_info.push({
      data: { event: 'game_paused' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else if (gameState.gamePhase === PHASE_PAUSED) {
    gameState.gamePhase = PHASE_PLAYING;
    gameState.lastFrameTime = Date.now();
    p.logs.game_info.push({
      data: { event: 'game_resumed' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function restartGame(p) {
  gameState.gamePhase = PHASE_START;
  initializeGrid();
  gameState.entities = [];
  gameState.particleEffects = [];
  gameState.clearingAnimation = [];
  gameState.fallingCard = null;

  p.logs.game_info.push({
    data: { event: 'game_restarted' },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function updateGame(p) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return;
  }

  // Update timer
  const currentTime = Date.now();
  if (currentTime - gameState.lastFrameTime >= 1000) {
    gameState.timeRemaining--;
    gameState.lastFrameTime = currentTime;

    if (gameState.timeRemaining <= 0) {
      gameOver(p, false);
      return;
    }
  }

  // Update falling card
  if (gameState.fallingCard) {
    const settled = gameState.fallingCard.update();
    
    if (settled) {
      // Check if grid is full
      if (isGridFull()) {
        gameOver(p, false);
        return;
      }

      // Detect and clear combos
      detectAndClearCombos(p);

      // Spawn new card
      gameState.fallingCard.spawnNew();
      logPlayerInfo(p);
    }
  }

  // Update entities
  gameState.entities.forEach(entity => {
    if (entity.update) {
      entity.update();
    }
  });

  // Update particles
  updateParticles();

  // Remove completed clearing animations
  removeCompletedClearingCards();

  // Check win condition
  if (gameState.levelProgress >= gameState.requiredCombos) {
    advanceLevel(p);
  }
}

function isGridFull() {
  // Check if top row has any cards
  for (let col = 0; col < GRID_COLS; col++) {
    if (gameState.grid[0][col] !== null) {
      return true;
    }
  }
  return false;
}

function advanceLevel(p) {
  gameState.level++;
  gameState.levelProgress = 0;
  gameState.requiredCombos += 3;
  gameState.fallSpeed += 0.2;
  gameState.scoreMultiplier += 0.5;
  gameState.timeRemaining += 30;

  if (gameState.fallingCard) {
    gameState.fallingCard.fallSpeed = gameState.fallSpeed;
  }

  p.logs.game_info.push({
    data: { event: 'level_advanced', level: gameState.level },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // Check win condition (completed level 5)
  if (gameState.level > 5) {
    gameOver(p, true);
  }
}

function gameOver(p, won) {
  gameState.gamePhase = won ? PHASE_GAME_OVER_WIN : PHASE_GAME_OVER_LOSE;
  
  p.logs.game_info.push({
    data: { event: 'game_over', won, score: gameState.score },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function logPlayerInfo(p) {
  if (gameState.fallingCard && gameState.fallingCard.card) {
    p.logs.player_info.push({
      screen_x: gameState.fallingCard.card.x,
      screen_y: gameState.fallingCard.card.y,
      game_x: gameState.fallingCard.col,
      game_y: gameState.fallingCard.y,
      framecount: p.frameCount
    });
  }
}