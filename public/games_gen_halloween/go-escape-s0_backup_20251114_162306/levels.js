// levels.js - Level generation and management

import { Player, Platform, Obstacle, Goal } from './entities.js';
import { gameState, CANVAS_HEIGHT } from './globals.js';

export function createLevel(p, levelNum) {
  const groundY = CANVAS_HEIGHT - 50;
  
  if (levelNum === 1) {
    return createLevel1(p, groundY);
  } else if (levelNum === 2) {
    return createLevel2(p, groundY);
  } else if (levelNum === 3) {
    return createLevel3(p, groundY);
  }
  
  return createLevel1(p, groundY);
}

function createLevel1(p, groundY) {
  const level = {
    platforms: [],
    obstacles: [],
    goal: null,
    playerStart: { x: 80, y: groundY - 100 }
  };
  
  // Starting platform
  level.platforms.push(new Platform(p, 100, groundY, 150, 20, 'normal'));
  
  // Gap then platform
  level.platforms.push(new Platform(p, 300, groundY, 120, 20, 'normal'));
  
  // Small gap then vanishing platform
  level.platforms.push(new Platform(p, 470, groundY, 100, 20, 'vanishing'));
  
  // Final platform with goal
  level.platforms.push(new Platform(p, 650, groundY, 150, 20, 'normal'));
  
  // Goal
  level.goal = new Goal(p, 720, groundY - 40);
  
  return level;
}

function createLevel2(p, groundY) {
  const level = {
    platforms: [],
    obstacles: [],
    goal: null,
    playerStart: { x: 80, y: groundY - 100 }
  };
  
  // Starting platform
  level.platforms.push(new Platform(p, 100, groundY, 140, 20, 'normal'));
  
  // Gap with static obstacle
  level.platforms.push(new Platform(p, 280, groundY, 100, 20, 'normal'));
  level.obstacles.push(new Obstacle(p, 330, groundY - 40, 30, 30, 'static'));
  
  // Narrow platform
  level.platforms.push(new Platform(p, 450, groundY + 20, 80, 20, 'normal'));
  
  // Moving obstacle area
  level.platforms.push(new Platform(p, 600, groundY, 120, 20, 'normal'));
  level.obstacles.push(new Obstacle(p, 600, groundY - 50, 40, 40, 'moving'));
  
  // Final platform
  level.platforms.push(new Platform(p, 780, groundY, 150, 20, 'normal'));
  
  // Goal
  level.goal = new Goal(p, 850, groundY - 40);
  
  return level;
}

function createLevel3(p, groundY) {
  const level = {
    platforms: [],
    obstacles: [],
    goal: null,
    playerStart: { x: 80, y: groundY - 100 }
  };
  
  // Starting platform
  level.platforms.push(new Platform(p, 100, groundY, 120, 20, 'normal'));
  
  // Series of narrow platforms with gaps
  level.platforms.push(new Platform(p, 260, groundY, 70, 20, 'vanishing'));
  level.platforms.push(new Platform(p, 380, groundY + 30, 70, 20, 'normal'));
  level.platforms.push(new Platform(p, 500, groundY, 80, 20, 'vanishing'));
  
  // Moving obstacle section
  level.platforms.push(new Platform(p, 650, groundY, 100, 20, 'normal'));
  level.obstacles.push(new Obstacle(p, 650, groundY - 50, 35, 35, 'moving'));
  
  // Final platforms
  level.platforms.push(new Platform(p, 800, groundY + 20, 70, 20, 'normal'));
  level.platforms.push(new Platform(p, 920, groundY, 120, 20, 'normal'));
  
  // Goal
  level.goal = new Goal(p, 980, groundY - 40);
  
  return level;
}