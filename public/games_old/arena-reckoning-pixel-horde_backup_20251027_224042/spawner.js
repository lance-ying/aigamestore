// spawner.js - Enemy spawning logic

import { Enemy } from './enemies.js';
import { LEVEL_CONFIGS, CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export function spawnEnemy(p, type, config = {}) {
  // Spawn from edges
  const side = Math.floor(p.random(4));
  let x, y;
  
  switch (side) {
    case 0: // Top
      x = p.random(CANVAS_WIDTH);
      y = -20;
      break;
    case 1: // Right
      x = CANVAS_WIDTH + 20;
      y = p.random(CANVAS_HEIGHT);
      break;
    case 2: // Bottom
      x = p.random(CANVAS_WIDTH);
      y = CANVAS_HEIGHT + 20;
      break;
    case 3: // Left
      x = -20;
      y = p.random(CANVAS_HEIGHT);
      break;
  }
  
  return new Enemy(type, x, y, config);
}

export function updateSpawning(p, currentTime) {
  const level = gameState.currentLevel;
  const config = LEVEL_CONFIGS[level];
  
  if (!config) return;
  
  const levelTime = currentTime - gameState.levelStartTime;
  
  // Calculate difficulty scaling based on player level
  const playerLevel = gameState.player ? gameState.player.level : 1;
  const difficultyMultiplier = 1 + (playerLevel - 1) * 0.08; // 8% increase per player level
  
  // Check each spawn configuration
  for (const spawnRule of config.spawnConfig) {
    if (levelTime < spawnRule.time) continue;
    
    // Check for once-only spawns (bosses)
    if (spawnRule.once) {
      if (spawnRule.type === "MINIBOSS" && !gameState.miniBossSpawned) {
        const enemy = spawnEnemy(p, spawnRule.type, {
          speedMultiplier: (spawnRule.speedMultiplier || 1) * Math.min(difficultyMultiplier, 1.5),
          healthMultiplier: (spawnRule.healthMultiplier || 1) * difficultyMultiplier
        });
        gameState.enemies.push(enemy);
        gameState.entities.push(enemy);
        gameState.miniBossSpawned = true;
      } else if (spawnRule.type === "BOSS" && !gameState.bossSpawned) {
        const enemy = spawnEnemy(p, spawnRule.type, {
          speedMultiplier: (spawnRule.speedMultiplier || 1) * Math.min(difficultyMultiplier, 1.5),
          healthMultiplier: (spawnRule.healthMultiplier || 1) * difficultyMultiplier
        });
        gameState.enemies.push(enemy);
        gameState.entities.push(enemy);
        gameState.bossSpawned = true;
      }
      continue;
    }
    
    // Regular spawning
    if (currentTime - gameState.lastEnemySpawn > spawnRule.rate) {
      if (gameState.enemies.length < spawnRule.maxEnemies) {
        const groupSize = spawnRule.groupSize || 1;
        
        for (let i = 0; i < groupSize; i++) {
          if (gameState.enemies.length >= spawnRule.maxEnemies) break;
          
          const enemy = spawnEnemy(p, spawnRule.type, {
            speedMultiplier: (spawnRule.speedMultiplier || 1) * Math.min(difficultyMultiplier, 1.4),
            healthMultiplier: (spawnRule.healthMultiplier || 1) * difficultyMultiplier
          });
          gameState.enemies.push(enemy);
          gameState.entities.push(enemy);
        }
        
        gameState.lastEnemySpawn = currentTime;
      }
    }
  }
}