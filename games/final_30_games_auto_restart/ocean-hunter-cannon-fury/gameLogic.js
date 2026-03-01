import { gameState, LEVELS, CANVAS_WIDTH, CANVAS_HEIGHT, UPGRADES } from './globals.js';
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
  gameState.upgrades = {
    damage: 0,
    fireRate: 0,
    rotationSpeed: 0,
    weaponType: 0
  };
  // Clear any pending auto-restart if starting manually
  if (gameState.autoRestartTimerId) {
    clearTimeout(gameState.autoRestartTimerId);
    gameState.autoRestartTimerId = null;
    gameState.autoRestartScheduled = false;
  }
  
  startLevel(p);
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
}

export function togglePause(p) {
  if (gameState.gamePhase === 'PLAYING') {
    gameState.gamePhase = 'PAUSED';
  } else if (gameState.gamePhase === 'PAUSED') {
    gameState.gamePhase = 'PLAYING';
    // Adjust level start time to account for pause duration
    const pauseDuration = Date.now() - gameState.levelStartTime - 
                         (LEVELS[gameState.level - 1].timeLimit - gameState.timeRemaining) * 1000;
    gameState.levelStartTime += pauseDuration;
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
  gameState.upgrades = {
    damage: 0,
    fireRate: 0,
    rotationSpeed: 0,
    weaponType: 0
  };
  // Reset auto-restart flags
  if (gameState.autoRestartTimerId) {
    clearTimeout(gameState.autoRestartTimerId);
  }
  gameState.autoRestartTimerId = null;
  gameState.autoRestartScheduled = false;
}

export function purchaseUpgrade(upgradeType, p) {
  if (gameState.gamePhase !== 'PLAYING') return;
  
  // Map camelCase state keys to UPPER_SNAKE_CASE UPGRADES keys
  const upgradeMapping = {
    'damage': 'DAMAGE',
    'fireRate': 'FIRE_RATE',
    'rotationSpeed': 'ROTATION_SPEED',
    'weaponType': 'WEAPON_TYPE'
  };
  
  const currentLevel = gameState.upgrades[upgradeType];
  const upgradeData = UPGRADES[upgradeMapping[upgradeType]];
  
  if (!upgradeData) return;
  
  if (currentLevel >= upgradeData.levels.length - 1) {
    // Already max level
    return;
  }
  
  const nextLevel = currentLevel + 1;
  const cost = upgradeData.costs[nextLevel];
  
  if (gameState.totalGameScore >= cost) {
    gameState.totalGameScore -= cost;
    gameState.upgrades[upgradeType] = nextLevel;
  }
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
  }
}

function gameOver(p, isWin) {
  gameState.gamePhase = isWin ? 'GAME_OVER_WIN' : 'GAME_OVER_LOSE';
  
  // Update high scores
  updateHighScores(gameState.totalGameScore);

  // Auto-restart logic
  if (!gameState.autoRestartScheduled) {
    gameState.autoRestartScheduled = true;
    gameState.autoRestartTimerId = setTimeout(() => {
      // Ensure p5 instance is available for restartGame
      const p5Instance = window.gameInstance ? window.gameInstance.p : p;
      if (p5Instance) {
        restartGame(p5Instance);
      }
      gameState.autoRestartTimerId = null;
      gameState.autoRestartScheduled = false;
    }, 1000); // 1 second delay
  }
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