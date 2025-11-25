// level.js - Level management

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';
import { Enemy } from './enemy.js';

export class LevelManager {
  constructor(p) {
    this.p = p;
    this.levels = this.createLevels();
  }
  
  createLevels() {
    return [
      // Level 1 - Introduction
      {
        enemies: [
          { x: 400, y: 100, type: 'melee' },
          { x: 500, y: 100, type: 'melee' }
        ],
        description: "Level 1: Basic Training"
      },
      // Level 2 - Ranged enemies
      {
        enemies: [
          { x: 300, y: 100, type: 'melee' },
          { x: 450, y: 100, type: 'ranged' },
          { x: 550, y: 100, type: 'melee' }
        ],
        description: "Level 2: Bullet Time"
      },
      // Level 3 - Final challenge
      {
        enemies: [
          { x: 250, y: 100, type: 'melee' },
          { x: 350, y: 100, type: 'ranged' },
          { x: 450, y: 100, type: 'melee' },
          { x: 550, y: 100, type: 'ranged' }
        ],
        description: "Level 3: Final Stand"
      }
    ];
  }
  
  loadLevel(levelIndex) {
    if (levelIndex >= this.levels.length) {
      return false;
    }
    
    const level = this.levels[levelIndex];
    
    // Clear existing enemies
    gameState.enemies = [];
    gameState.projectiles = [];
    gameState.particles = [];
    
    // Spawn enemies
    for (const enemyData of level.enemies) {
      const enemy = new Enemy(this.p, enemyData.x, enemyData.y, enemyData.type);
      gameState.enemies.push(enemy);
    }
    
    // Reset entities
    gameState.entities = [gameState.player, ...gameState.enemies];
    
    // Reset time slow
    gameState.timeSlowCharge = 100;
    
    return true;
  }
  
  getCurrentLevelDescription() {
    if (gameState.currentLevel < this.levels.length) {
      return this.levels[gameState.currentLevel].description;
    }
    return "";
  }
  
  allEnemiesDefeated() {
    return gameState.enemies.every(e => !e.alive);
  }
}