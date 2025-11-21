// game_logic.js - Core game logic

import { 
  gameState, 
  PHASE_PLAYING, 
  PHASE_GAME_OVER_WIN, 
  PHASE_GAME_OVER_LOSE,
  TOTAL_WAVES,
  WAVE_SPAWN_DELAY,
  ENEMIES_PER_WAVE,
  MAX_ESCAPED,
  TRAP_DATA,
  ENEMY_TYPES,
  PATH_WAYPOINTS
} from './globals.js';
import { Trap, Enemy } from './entities.js';

export function initGame(p) {
  gameState.gold = 150;
  gameState.currentWave = 0;
  gameState.enemiesSpawned = 0;
  gameState.enemiesKilled = 0;
  gameState.enemiesEscaped = 0;
  gameState.score = 0;
  gameState.traps = [];
  gameState.enemies = [];
  gameState.projectiles = [];
  gameState.effects = [];
  gameState.minions = [];
  gameState.waveTimer = WAVE_SPAWN_DELAY;
  gameState.selectedTrapType = null;
  gameState.selectedGridPos = null;
  gameState.menuIndex = 0;
  gameState.cursorPos = { x: 7, y: 5 };
  gameState.upgradingTrap = null;
  
  // Clear grid
  for (let y = 0; y < gameState.grid.length; y++) {
    for (let x = 0; x < gameState.grid[y].length; x++) {
      gameState.grid[y][x] = null;
    }
  }
}

export function updateGame(p) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  gameState.frameCount++;
  
  // Update wave spawning
  if (gameState.currentWave < TOTAL_WAVES) {
    gameState.waveTimer--;
    if (gameState.waveTimer <= 0) {
      spawnWave(p);
      gameState.waveTimer = WAVE_SPAWN_DELAY;
    }
  }
  
  // Update entities
  gameState.enemies.forEach(enemy => enemy.update(p));
  gameState.projectiles.forEach(proj => proj.update(gameState, p));
  gameState.minions.forEach(minion => minion.update(gameState, p));
  gameState.traps.forEach(trap => {
    trap.update(gameState, p);
    
    // Auto-trigger traps
    if (trap.cooldownTimer === 0) {
      const hasNearbyEnemy = gameState.enemies.some(enemy => {
        if (!enemy.alive) return false;
        const dist = p.dist(trap.x, trap.y, enemy.x, enemy.y);
        return dist < 80;
      });
      
      if (hasNearbyEnemy) {
        trap.trigger(gameState, p);
      }
    }
  });
  
  // Remove dead/inactive entities
  gameState.projectiles = gameState.projectiles.filter(p => p.active);
  gameState.minions = gameState.minions.filter(m => m.active);
  
  // Check for killed enemies
  gameState.enemies.forEach(enemy => {
    if (!enemy.alive && enemy.gold > 0) {
      gameState.gold += enemy.gold;
      gameState.score += enemy.gold * 10;
      gameState.enemiesKilled++;
      enemy.gold = 0; // Mark as collected
    }
    
    if (enemy.reachedCore && !enemy.counted) {
      gameState.enemiesEscaped++;
      enemy.counted = true;
      
      // Log escaped enemy
      p.logs.player_info.push({
        screen_x: enemy.x,
        screen_y: enemy.y,
        game_x: enemy.x,
        game_y: enemy.y,
        framecount: p.frameCount,
        event: "enemy_escaped"
      });
    }
  });
  
  // Remove dead enemies
  gameState.enemies = gameState.enemies.filter(e => e.alive && !e.reachedCore);
  
  // Check win/lose conditions
  if (gameState.enemiesEscaped >= MAX_ESCAPED) {
    setGamePhase(PHASE_GAME_OVER_LOSE, p);
  } else if (gameState.currentWave >= TOTAL_WAVES && gameState.enemies.length === 0) {
    setGamePhase(PHASE_GAME_OVER_WIN, p);
  }
}

function spawnWave(p) {
  gameState.currentWave++;
  
  const waveMultiplier = 1 + (gameState.currentWave - 1) * 0.15;
  
  // Determine enemy types for this wave
  const types = Object.keys(ENEMY_TYPES);
  let enemyType = types[gameState.currentWave % types.length];
  
  // Spawn multiple enemies
  for (let i = 0; i < ENEMIES_PER_WAVE; i++) {
    setTimeout(() => {
      if (gameState.gamePhase === PHASE_PLAYING) {
        const enemy = new Enemy(enemyType, waveMultiplier);
        gameState.enemies.push(enemy);
        gameState.enemiesSpawned++;
      }
    }, i * 500);
  }
  
  // Log wave spawn
  p.logs.game_info.push({
    data: { event: "wave_spawn", wave: gameState.currentWave },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function setGamePhase(phase, p) {
  gameState.gamePhase = phase;
  
  p.logs.game_info.push({
    data: { event: "phase_change", phase: phase },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  if (phase === PHASE_GAME_OVER_WIN || phase === PHASE_GAME_OVER_LOSE) {
    // Calculate final score
    gameState.score += gameState.gold * 5;
    gameState.score += gameState.enemiesKilled * 100;
  }
}

export function canPlaceTrap(gridX, gridY) {
  // Check bounds
  if (gridX < 0 || gridX >= gameState.grid[0].length) return false;
  if (gridY < 0 || gridY >= gameState.grid.length) return false;
  
  // Check if already occupied
  if (gameState.grid[gridY][gridX] !== null) return false;
  
  // Check if on path
  if (gameState.pathCells.has(`${gridX},${gridY}`)) return false;
  
  return true;
}

export function placeTrap(gridX, gridY, trapType, p) {
  if (!canPlaceTrap(gridX, gridY)) return false;
  
  const cost = TRAP_DATA[trapType].baseCost;
  if (gameState.gold < cost) return false;
  
  gameState.gold -= cost;
  const trap = new Trap(gridX, gridY, trapType);
  gameState.traps.push(trap);
  gameState.grid[gridY][gridX] = trap;
  
  // Log trap placement
  p.logs.player_info.push({
    screen_x: trap.x,
    screen_y: trap.y,
    game_x: gridX,
    game_y: gridY,
    framecount: p.frameCount,
    event: "trap_placed",
    trap_type: trapType
  });
  
  return true;
}

export function upgradeTrap(trap, p) {
  if (!trap.canUpgrade()) return false;
  
  const cost = trap.getUpgradeCost();
  if (gameState.gold < cost) return false;
  
  gameState.gold -= cost;
  trap.upgrade();
  
  // Log upgrade
  p.logs.player_info.push({
    screen_x: trap.x,
    screen_y: trap.y,
    game_x: trap.gridX,
    game_y: trap.gridY,
    framecount: p.frameCount,
    event: "trap_upgraded",
    tier: trap.tier
  });
  
  return true;
}