// level.js - Level management and generation

import { 
  gameState, 
  LEVELS, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  GROUND_HEIGHT,
  GLASS_WIDTH
} from './globals.js';

import { Glass, Obstacle } from './entities.js';

export function loadLevel(p, levelIndex) {
  // Clear existing glasses and obstacles
  gameState.glasses.forEach(glass => glass.destroy());
  gameState.obstacles.forEach(obstacle => obstacle.destroy());
  gameState.glasses = [];
  gameState.obstacles = [];
  
  const level = LEVELS[levelIndex] || LEVELS[LEVELS.length - 1];
  gameState.totalGlasses = level.glasses;
  gameState.ballsRemaining = level.balls;
  gameState.glassesKnockedOver = 0;
  
  // Generate glass positions
  generateGlasses(p, level.glasses);
  
  // Generate obstacles
  generateObstacles(p, level.obstacles);
}

function generateGlasses(p, count) {
  const groundY = CANVAS_HEIGHT - GROUND_HEIGHT - 25;
  const spacing = (CANVAS_WIDTH - 100) / (count + 1);
  
  // Randomize positions slightly for variety
  const positions = [];
  for (let i = 0; i < count; i++) {
    const baseX = 50 + spacing * (i + 1);
    const offsetX = (p.random() - 0.5) * 30;
    positions.push(baseX + offsetX);
  }
  
  positions.forEach(x => {
    const glass = new Glass(p, x, groundY);
    gameState.glasses.push(glass);
    gameState.entities.push(glass);
  });
}

function generateObstacles(p, count) {
  if (count === 0) return;
  
  const groundY = CANVAS_HEIGHT - GROUND_HEIGHT - 50;
  
  for (let i = 0; i < count; i++) {
    const x = p.random(100, CANVAS_WIDTH - 100);
    const y = groundY - p.random(30, 80);
    const width = p.random(40, 80);
    const height = 15;
    const isRotated = p.random() > 0.5;
    
    const obstacle = new Obstacle(p, x, y, width, height, isRotated);
    gameState.obstacles.push(obstacle);
    gameState.entities.push(obstacle);
  }
}

export function getRequiredKnockdowns() {
  return Math.ceil(gameState.totalGlasses * 0.8);
}

export function checkLevelComplete() {
  const required = getRequiredKnockdowns();
  return gameState.glassesKnockedOver >= required;
}

export function checkLevelFailed() {
  // Level fails if no balls remaining and not enough glasses knocked over
  const allBallsSettled = gameState.balls.every(ball => {
    const vel = ball.body.velocity;
    return Math.abs(vel.x) < 0.1 && Math.abs(vel.y) < 0.1;
  });
  
  return gameState.ballsRemaining === 0 && 
         gameState.balls.length > 0 && 
         allBallsSettled && 
         !checkLevelComplete();
}