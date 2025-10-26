import { gameState, LEVELS, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { FishSpawner } from './spawner.js';
import { updateCannon } from './cannon.js';
import { checkCollisions } from './collision.js';

let spawner = null;

export function initGame(p) {
  spawner = new FishSpawner(p);
  loadHighScores();
}

export function startGame(p) {
  gameState.gamePhase = 'PLAYING';
  gameState.level = 1;
  gameState.score = 0;
  gameState.totalGameScore = 0;
  gameState.cannon.angle = 0;
  gameState.projectiles = [];
  gameState.fish = [];
  gameState.entities = [];
  gameState.particles = [];
  gameState.floatingTexts = [];
  gameState.bossSpawned = false;
  
  startLevel(p);
  
  p.logs.game_info.push({
    data: { event: 'game_started' },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function startLevel(p) {
  const currentLevel = LEVELS[gameState.level - 1];
  if (!currentLevel) return;
  
  gameState.score = 0;
  gameState.timeRemaining = currentLevel.timeLimit;
  gameState.levelStartTime = Date.now();
  gameState.projectiles = [];
  gameState.fish = [];
  gameState.entities = [];
  gameState.particles = [];
  gameState.floatingTexts = [];
  gameState.bossSpawned = false;
  
  spawner.setLevel(currentLevel);
  
  p.logs.game_info.push({
    data: { event: 'level_started', level: gameState.level },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function togglePause(p) {
  if (gameState.gamePhase === 'PLAYING') {
    gameState.gamePhase = 'PAUSED';
    p.logs.game_info.push({
      data: { event: 'game_paused' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else if (gameState.gamePhase === 'PAUSED') {
    gameState.gamePhase = 'PLAYING';
    // Adjust level start time to account for pause duration
    const pauseDuration = Date.now() - gameState.levelStartTime - 
                         (LEVELS[gameState.level - 1].timeLimit - gameState.timeRemaining) * 1000;
    gameState.levelStartTime += pauseDuration;
    
    p.logs.game_info.push({
      data: { event: 'game_unpaused' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function restartGame(p) {
  gameState.gamePhase = 'START';
  gameState.level = 0;
  gameState.score = 0;
  gameState.totalGameScore = 0;
  gameState.cannon.angle = 0;
  gameState.projectiles = [];
  gameState.fish = [];
  gameState.entities = [];
  gameState.particles = [];
  gameState.floatingTexts = [];
  
  p.logs.game_info.push({
    data: { event: 'game_restarted' },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function updateGame(p) {
  if (gameState.gamePhase !== 'PLAYING') return;
  
  const currentLevel = LEVELS[gameState.level - 1];
  if (!currentLevel) return;
  
  // Update time
  const elapsed = (Date.now() - gameState.levelStartTime) / 1000;
  gameState.timeRemaining = Math.max(0, currentLevel.timeLimit - elapsed);
  
  // Update cannon
  updateCannon();
  
  // Update spawner
  spawner.update();
  
  // Update all entities
  for (const entity of gameState.entities) {
    if (entity.update) {
      entity.update();
    }
  }
  
  // Update particles
  for (const particle of gameState.particles) {
    particle.update();
  }
  gameState.particles = gameState.particles.filter(p => !p.isDead());
  
  // Update floating texts
  for (const text of gameState.floatingTexts) {
    text.update();
  }
  gameState.floatingTexts = gameState.floatingTexts.filter(t => !t.isDead());
  
  // Check collisions
  checkCollisions(p);
  
  // Check win condition
  if (gameState.score >= currentLevel.targetScore) {
    completeLevel(p);
  }
  
  // Check lose condition
  if (gameState.timeRemaining <= 0 && gameState.score < currentLevel.targetScore) {
    gameOver(p, false);
  }
}

function completeLevel(p) {
  if (gameState.level >= LEVELS.length) {
    gameOver(p, true);
  } else {
    gameState.level++;
    startLevel(p);
    
    p.logs.game_info.push({
      data: { event: 'level_complete', level: gameState.level - 1 },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function gameOver(p, isWin) {
  gameState.gamePhase = isWin ? 'GAME_OVER_WIN' : 'GAME_OVER_LOSE';
  
  // Update high scores
  updateHighScores(gameState.totalGameScore);
  
  p.logs.game_info.push({
    data: { 
      event: 'game_over', 
      win: isWin, 
      finalScore: gameState.totalGameScore 
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function loadHighScores() {
  try {
    const stored = localStorage.getItem('oceanHunterHighScores');
    if (stored) {
      gameState.highScores = JSON.parse(stored);
    } else {
      gameState.highScores = [];
    }
  } catch (e) {
    gameState.highScores = [];
  }
}

function updateHighScores(score) {
  gameState.highScores.push(score);
  gameState.highScores.sort((a, b) => b - a);
  gameState.highScores = gameState.highScores.slice(0, 5);
  
  try {
    localStorage.setItem('oceanHunterHighScores', JSON.stringify(gameState.highScores));
  } catch (e) {
    // Ignore storage errors
  }
}