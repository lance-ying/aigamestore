// level.js - Level loading and management

import { gameState, LEVELS } from './globals.js';
import { Enemy, Particle } from './entities.js';

export function loadLevel(p, levelIndex) {
  if (levelIndex >= LEVELS.length) {
    return false;
  }

  let level = LEVELS[levelIndex];
  
  // Clear existing entities
  gameState.platforms = [];
  gameState.enemies = [];
  gameState.items = [];
  gameState.hazards = [];
  gameState.particles = [];
  gameState.entities = [];
  
  // Set level properties
  gameState.levelWidth = level.width;
  gameState.levelComplete = false;
  
  // Load platforms
  for (let platData of level.platforms) {
    gameState.platforms.push({
      x: platData.x,
      y: platData.y,
      w: platData.w,
      h: platData.h,
      type: platData.type
    });
  }
  
  // Load enemies
  for (let enemyData of level.enemies) {
    let enemy = new Enemy(p, enemyData.x, enemyData.y, enemyData.type);
    gameState.enemies.push(enemy);
    gameState.entities.push(enemy);
  }
  
  // Load items
  for (let itemData of level.items) {
    gameState.items.push({
      x: itemData.x,
      y: itemData.y,
      type: itemData.type
    });
  }
  
  // Load hazards
  for (let hazardData of level.hazards) {
    gameState.hazards.push({
      x: hazardData.x,
      y: hazardData.y,
      w: hazardData.w,
      h: hazardData.h,
      type: hazardData.type
    });
  }
  
  // Set exit portal
  gameState.exitPortal = level.exitPortal;
  
  return true;
}

export function renderLevel(p, cameraX) {
  // Draw background
  p.push();
  p.fill(135, 206, 235);
  p.noStroke();
  p.rect(0, 0, p.width, p.height * 0.6);
  p.fill(100, 180, 100);
  p.rect(0, p.height * 0.6, p.width, p.height * 0.4);
  p.pop();
  
  // Draw platforms
  for (let platform of gameState.platforms) {
    let screenX = platform.x - cameraX;
    
    if (screenX + platform.w < 0 || screenX > p.width) continue;
    
    p.push();
    if (platform.type === "ground") {
      p.fill(101, 67, 33);
      p.stroke(70, 45, 20);
    } else {
      p.fill(139, 90, 43);
      p.stroke(100, 60, 30);
    }
    p.strokeWeight(3);
    p.rect(screenX, platform.y, platform.w, platform.h);
    
    // Add texture
    p.stroke(80, 50, 25);
    p.strokeWeight(1);
    for (let i = 0; i < platform.w; i += 30) {
      p.line(screenX + i, platform.y, screenX + i, platform.y + platform.h);
    }
    p.pop();
  }
  
  // Draw hazards
  for (let hazard of gameState.hazards) {
    let screenX = hazard.x - cameraX;
    
    if (screenX + hazard.w < 0 || screenX > p.width) continue;
    
    p.push();
    p.fill(150, 150, 150);
    p.noStroke();
    
    if (hazard.type === "spikes") {
      for (let i = 0; i < hazard.w; i += 10) {
        p.triangle(
          screenX + i, hazard.y + hazard.h,
          screenX + i + 5, hazard.y,
          screenX + i + 10, hazard.y + hazard.h
        );
      }
    }
    p.pop();
  }
  
  // Draw items
  for (let item of gameState.items) {
    let screenX = item.x - cameraX;
    
    if (screenX < -30 || screenX > p.width + 30) continue;
    
    p.push();
    p.noStroke();
    
    if (item.type === "sword") {
      p.fill(200, 200, 230);
      p.rect(screenX - 5, item.y - 15, 10, 25);
      p.fill(150, 100, 50);
      p.rect(screenX - 3, item.y + 10, 6, 8);
    } else if (item.type === "shield") {
      p.fill(100, 150, 200);
      p.ellipse(screenX, item.y, 25, 30);
      p.fill(180, 180, 200);
      p.ellipse(screenX, item.y, 15, 20);
    } else if (item.type === "health") {
      p.fill(255, 100, 100);
      p.rect(screenX - 8, item.y - 3, 16, 6);
      p.rect(screenX - 3, item.y - 8, 6, 16);
    }
    
    // Floating animation
    let float = p.sin(p.frameCount * 0.1 + item.x) * 3;
    p.translate(0, float);
    
    p.pop();
  }
  
  // Draw exit portal
  if (gameState.exitPortal) {
    let screenX = gameState.exitPortal.x - cameraX;
    
    if (screenX > -60 && screenX < p.width + 60) {
      p.push();
      p.noStroke();
      
      // Animated portal effect
      for (let i = 0; i < 3; i++) {
        let angle = p.frameCount * 0.05 + i * p.TWO_PI / 3;
        let radius = 30 + p.sin(p.frameCount * 0.1) * 5;
        p.fill(100, 200, 255, 100);
        p.ellipse(screenX, gameState.exitPortal.y, radius + i * 5, radius + i * 5);
      }
      
      p.fill(150, 220, 255, 200);
      p.ellipse(screenX, gameState.exitPortal.y, 40, 60);
      
      p.pop();
    }
  }
}