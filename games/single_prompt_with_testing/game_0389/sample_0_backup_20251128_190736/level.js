// level.js - Level initialization

import { Platform, Block, Enemy, Hazard, Goal } from './entities.js';
import { gameState } from './globals.js';

export function initializeLevel(levelNum) {
  gameState.platforms = [];
  gameState.blocks = [];
  gameState.enemies = [];
  gameState.hazards = [];
  
  if (levelNum === 1) {
    // Ground
    gameState.platforms.push(new Platform(0, 380, 200, 20));
    gameState.platforms.push(new Platform(250, 380, 350, 20));
    
    // Platforms
    gameState.platforms.push(new Platform(50, 320, 80, 15));
    gameState.platforms.push(new Platform(180, 260, 80, 15));
    gameState.platforms.push(new Platform(320, 200, 100, 15));
    gameState.platforms.push(new Platform(480, 140, 100, 15));
    
    // Blocks
    gameState.blocks.push(new Block(60, 280, 30, 30));
    gameState.blocks.push(new Block(190, 220, 30, 30));
    gameState.blocks.push(new Block(330, 160, 30, 30));
    gameState.blocks.push(new Block(370, 160, 30, 30));
    
    // Enemies
    gameState.enemies.push(new Enemy(200, 365, 30));
    gameState.enemies.push(new Enemy(340, 185, 40));
    gameState.enemies.push(new Enemy(500, 125, 35));
    
    // Hazards (lava)
    gameState.hazards.push(new Hazard(200, 380, 50, 20));
    gameState.hazards.push(new Hazard(260, 380, 40, 20));
    gameState.hazards.push(new Hazard(130, 320, 40, 15));
    gameState.hazards.push(new Hazard(420, 200, 50, 15));
    
    // Goal
    gameState.goal = new Goal(520, 80);
  }
}