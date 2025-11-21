// game_logic.js - Core game logic

import { gameState, GAME_PHASES, PATH_WAYPOINTS, TOWER_PLOT_POSITIONS, TOWER_TYPES, TOWER_TYPE_ARRAY } from './globals.js';
import { TowerPlot, Tower, Enemy, Hero } from './entities.js';

export function initGame(p) {
  gameState.health = gameState.maxHealth;
  gameState.gold = 250;
  gameState.score = 0;
  gameState.currentWave = 0;
  gameState.waveInProgress = false;
  gameState.waveTimer = 0;
  gameState.enemiesSpawned = 0;
  gameState.enemiesToSpawn = 0;
  gameState.spawnInterval = 0;
  gameState.spawnTimer = 0;
  gameState.selectedTowerType = 0;
  gameState.hoveredPlot = null;
  gameState.selectedTower = null;
  gameState.heroAbilityCooldown = 0;
  gameState.framesSinceLastAction = 0;
  gameState.positionHistory = [];

  // Clear entities
  gameState.entities = [];
  gameState.towers = [];
  gameState.enemies = [];
  gameState.projectiles = [];
  gameState.heroes = [];
  gameState.particles = [];

  // Create path
  gameState.path = PATH_WAYPOINTS.map(wp => ({ x: wp.x, y: wp.y }));

  // Create tower plots
  gameState.towerPlots = TOWER_PLOT_POSITIONS.map(pos => new TowerPlot(pos.x, pos.y));

  // Create hero
  const hero = new Hero(100, 200);
  gameState.heroes.push(hero);
  gameState.entities.push(hero);

  // Log game start
  p.logs.game_info.push({
    data: { phase: "GAME_INITIALIZED" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function startWave(p) {
  if (gameState.currentWave >= gameState.maxWaves) {
    endGame(p, true);
    return;
  }

  gameState.currentWave++;
  gameState.waveInProgress = true;
  gameState.enemiesSpawned = 0;
  
  // Calculate enemies for this wave
  const baseEnemies = 5;
  const waveMultiplier = Math.floor(gameState.currentWave * 1.5);
  gameState.enemiesToSpawn = baseEnemies + waveMultiplier;
  
  gameState.spawnInterval = Math.max(40, 80 - gameState.currentWave * 3);
  gameState.spawnTimer = 0;

  p.logs.game_info.push({
    data: { 
      phase: "WAVE_START",
      wave: gameState.currentWave,
      enemies: gameState.enemiesToSpawn
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function updateWave(p) {
  if (!gameState.waveInProgress) {
    // Check if ready for next wave
    gameState.waveTimer++;
    if (gameState.waveTimer > 180) {
      startWave(p);
      gameState.waveTimer = 0;
    }
    return;
  }

  // Spawn enemies
  gameState.spawnTimer++;
  if (gameState.enemiesSpawned < gameState.enemiesToSpawn && gameState.spawnTimer >= gameState.spawnInterval) {
    spawnEnemy(p);
    gameState.spawnTimer = 0;
  }

  // Check if wave complete
  if (gameState.enemiesSpawned >= gameState.enemiesToSpawn && gameState.enemies.length === 0) {
    gameState.waveInProgress = false;
    gameState.waveTimer = 0;
    
    // Bonus gold for completing wave
    const bonus = 30 + gameState.currentWave * 10;
    gameState.gold += bonus;
    gameState.score += bonus;

    p.logs.game_info.push({
      data: { 
        phase: "WAVE_COMPLETE",
        wave: gameState.currentWave,
        bonus: bonus
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    if (gameState.currentWave >= gameState.maxWaves) {
      endGame(p, true);
    }
  }
}

export function spawnEnemy(p) {
  const wave = gameState.currentWave;
  
  // Enemy type distribution
  let type = 0;
  const rand = Math.random();
  if (wave >= 3 && rand < 0.3) type = 1; // Fast
  if (wave >= 5 && rand < 0.15) type = 2; // Tank
  
  const enemy = new Enemy(wave, type);
  gameState.enemies.push(enemy);
  gameState.entities.push(enemy);
  gameState.enemiesSpawned++;
}

export function updateGame(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;

  // Check game over condition
  if (gameState.health <= 0) {
    endGame(p, false);
    return;
  }

  // Update wave system
  updateWave(p);

  // Update hero ability cooldown
  if (gameState.heroAbilityCooldown > 0) {
    gameState.heroAbilityCooldown--;
  }

  // Update towers
  for (let tower of gameState.towers) {
    tower.update(p);
  }

  // Update enemies
  for (let i = gameState.enemies.length - 1; i >= 0; i--) {
    const enemy = gameState.enemies[i];
    enemy.update(p);
    
    if (enemy.health <= 0) {
      gameState.enemies.splice(i, 1);
      const entityIndex = gameState.entities.indexOf(enemy);
      if (entityIndex > -1) {
        gameState.entities.splice(entityIndex, 1);
      }
    }
  }

  // Update projectiles
  for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
    const proj = gameState.projectiles[i];
    proj.update(p);
    
    if (!proj.active) {
      gameState.projectiles.splice(i, 1);
    }
  }

  // Update heroes
  for (let hero of gameState.heroes) {
    hero.update(p);
  }

  // Update particles
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    const particle = gameState.particles[i];
    particle.update();
    
    if (particle.isDead()) {
      gameState.particles.splice(i, 1);
    }
  }

  // Track hero position for testing
  if (gameState.heroes.length > 0 && p.frameCount % 30 === 0) {
    const hero = gameState.heroes[0];
    p.logs.player_info.push({
      screen_x: hero.x,
      screen_y: hero.y,
      game_x: hero.x,
      game_y: hero.y,
      framecount: p.frameCount
    });

    gameState.positionHistory.push({ x: hero.x, y: hero.y });
    if (gameState.positionHistory.length > 10) {
      gameState.positionHistory.shift();
    }
  }
}

export function endGame(p, isWin) {
  gameState.gamePhase = isWin ? GAME_PHASES.GAME_OVER_WIN : GAME_PHASES.GAME_OVER_LOSE;
  
  p.logs.game_info.push({
    data: { 
      phase: gameState.gamePhase,
      score: gameState.score,
      wave: gameState.currentWave
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function placeTower(p, plot) {
  if (plot.occupied) return false;

  const towerType = TOWER_TYPE_ARRAY[gameState.selectedTowerType];
  const towerData = TOWER_TYPES[towerType];

  if (gameState.gold >= towerData.cost) {
    const tower = new Tower(plot.x, plot.y, towerType);
    gameState.towers.push(tower);
    gameState.entities.push(tower);
    gameState.gold -= towerData.cost;
    plot.occupied = true;
    plot.tower = tower;

    p.logs.game_info.push({
      data: { 
        action: "TOWER_PLACED",
        type: towerType,
        x: plot.x,
        y: plot.y
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    return true;
  }

  return false;
}

export function findPlotAtPosition(x, y) {
  for (let plot of gameState.towerPlots) {
    if (plot.contains(x, y)) {
      return plot;
    }
  }
  return null;
}

export function selectTower(plot) {
  if (plot && plot.tower) {
    gameState.selectedTower = plot.tower;
    return true;
  }
  gameState.selectedTower = null;
  return false;
}

export function upgradeTower(p) {
  if (!gameState.selectedTower) return false;

  const success = gameState.selectedTower.upgrade();
  
  if (success) {
    p.logs.game_info.push({
      data: { 
        action: "TOWER_UPGRADED",
        tower: gameState.selectedTower.type,
        level: gameState.selectedTower.level
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  return success;
}

export function moveHero(x, y) {
  if (gameState.heroes.length > 0) {
    gameState.heroes[0].moveTo(x, y);
    return true;
  }
  return false;
}

export function useHeroAbility(p) {
  if (gameState.heroes.length > 0 && gameState.heroAbilityCooldown === 0) {
    gameState.heroes[0].useAbility();
    
    p.logs.game_info.push({
      data: { action: "HERO_ABILITY_USED" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    return true;
  }
  return false;
}