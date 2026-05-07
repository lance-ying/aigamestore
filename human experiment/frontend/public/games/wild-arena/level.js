// level.js - Level management and initialization

import { gameState, LEVELS, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Enemy, Obstacle } from './entities.js';

export function initLevel(p, levelNumber) {
  const levelConfig = LEVELS[levelNumber - 1];
  
  gameState.currentLevel = levelNumber;
  gameState.levelTimer = 0;
  gameState.levelDuration = levelConfig.duration * 60;
  gameState.enemiesDefeated = 0;
  gameState.enemiesRequired = levelConfig.enemyCount;
  gameState.zoneRadius = 280;
  gameState.zoneTargetRadius = levelConfig.zoneMinRadius;
  gameState.zoneCenterX = CANVAS_WIDTH / 2;
  gameState.zoneCenterY = CANVAS_HEIGHT / 2;
  gameState.zoneDamageTimer = 0;
  
  // Clear entities
  gameState.entities = [];
  gameState.projectiles = [];
  gameState.loot = [];
  gameState.obstacles = [];
  
  // Reset player position and health
  if (gameState.player) {
    gameState.player.x = CANVAS_WIDTH / 2;
    gameState.player.y = CANVAS_HEIGHT / 2;
    gameState.player.health = gameState.player.maxHealth;
    gameState.player.weapon.cooldown = 0;
    gameState.player.ability.cooldown = 0;
    gameState.entities.push(gameState.player);
  }
  
  // Spawn obstacles
  const obstacleCount = 3 + levelNumber;
  for (let i = 0; i < obstacleCount; i++) {
    let x, y;
    let valid = false;
    let attempts = 0;
    
    while (!valid && attempts < 50) {
      x = p.random(50, CANVAS_WIDTH - 50);
      y = p.random(50, CANVAS_HEIGHT - 50);
      
      const distToCenter = p.dist(x, y, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      if (distToCenter > 80) {
        valid = true;
        for (const obs of gameState.obstacles) {
          if (p.dist(x, y, obs.x, obs.y) < 60) {
            valid = false;
            break;
          }
        }
      }
      attempts++;
    }
    
    if (valid) {
      gameState.obstacles.push(new Obstacle(p, x, y, 20 + p.random(-5, 5)));
    }
  }
  
  // Spawn enemies
  for (const enemyConfig of levelConfig.enemyTypes) {
    for (let i = 0; i < enemyConfig.count; i++) {
      let x, y;
      let valid = false;
      let attempts = 0;
      
      while (!valid && attempts < 50) {
        x = p.random(40, CANVAS_WIDTH - 40);
        y = p.random(40, CANVAS_HEIGHT - 40);
        
        const distToPlayer = p.dist(x, y, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        if (distToPlayer > 120) {
          valid = true;
          for (const obs of gameState.obstacles) {
            if (p.dist(x, y, obs.x, obs.y) < 50) {
              valid = false;
              break;
            }
          }
        }
        attempts++;
      }
      
      if (valid) {
        const enemy = new Enemy(p, x, y, enemyConfig.type);
        gameState.entities.push(enemy);
      }
    }
  }
  
  return levelConfig;
}

export function getCurrentLevelConfig() {
  return LEVELS[gameState.currentLevel - 1];
}