// level.js
import { CANVAS_HEIGHT, gameState } from './globals.js';
import { Enemy } from './enemy.js';

export class Platform {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
  
  draw(p, cameraX) {
    p.push();
    p.fill(60, 60, 70);
    p.noStroke();
    p.rect(this.x - cameraX, this.y, this.width, this.height, 2);
    
    // Top highlight
    p.fill(80, 80, 90);
    p.rect(this.x - cameraX, this.y, this.width, 4, 2);
    p.pop();
  }
}

export function createLevel(levelNum) {
  const platforms = [];
  const enemies = [];
  
  // Ground
  platforms.push(new Platform(0, CANVAS_HEIGHT - 40, gameState.levelWidth, 40));
  
  switch(levelNum) {
    case 1:
      // Simple platforms
      platforms.push(new Platform(300, 300, 200, 20));
      platforms.push(new Platform(600, 250, 150, 20));
      platforms.push(new Platform(900, 200, 200, 20));
      platforms.push(new Platform(1200, 300, 150, 20));
      platforms.push(new Platform(1500, 250, 200, 20));
      platforms.push(new Platform(1800, 200, 150, 20));
      
      // Enemies
      for (let i = 0; i < 8; i++) {
        enemies.push(new Enemy(400 + i * 200, 100, 'minion', 1));
      }
      // Boss at end
      enemies.push(new Enemy(2100, 100, 'boss', 1));
      break;
      
    case 2:
      // More vertical variation
      platforms.push(new Platform(250, 300, 150, 20));
      platforms.push(new Platform(450, 250, 120, 20));
      platforms.push(new Platform(650, 200, 150, 20));
      platforms.push(new Platform(900, 280, 200, 20));
      platforms.push(new Platform(1150, 220, 150, 20));
      platforms.push(new Platform(1400, 260, 180, 20));
      platforms.push(new Platform(1650, 200, 150, 20));
      platforms.push(new Platform(1900, 280, 200, 20));
      
      // Mixed enemies
      for (let i = 0; i < 10; i++) {
        enemies.push(new Enemy(300 + i * 180, 100, 'minion', 2));
      }
      for (let i = 0; i < 3; i++) {
        enemies.push(new Enemy(600 + i * 400, 100, 'archer', 2));
      }
      enemies.push(new Enemy(2100, 100, 'boss', 2));
      break;
      
    case 3:
      // Higher platforms
      platforms.push(new Platform(200, 320, 150, 20));
      platforms.push(new Platform(400, 260, 120, 20));
      platforms.push(new Platform(600, 200, 150, 20));
      platforms.push(new Platform(850, 240, 140, 20));
      platforms.push(new Platform(1050, 180, 150, 20));
      platforms.push(new Platform(1300, 240, 160, 20));
      platforms.push(new Platform(1550, 180, 150, 20));
      platforms.push(new Platform(1800, 240, 180, 20));
      platforms.push(new Platform(2050, 200, 150, 20));
      
      // Harder enemies
      for (let i = 0; i < 12; i++) {
        enemies.push(new Enemy(250 + i * 160, 100, 'minion', 3));
      }
      for (let i = 0; i < 4; i++) {
        enemies.push(new Enemy(500 + i * 350, 100, 'archer', 3));
      }
      for (let i = 0; i < 2; i++) {
        enemies.push(new Enemy(800 + i * 600, 100, 'guard', 3));
      }
      enemies.push(new Enemy(2150, 100, 'boss', 3));
      break;
      
    case 4:
      // Complex layout
      platforms.push(new Platform(180, 330, 140, 20));
      platforms.push(new Platform(360, 280, 120, 20));
      platforms.push(new Platform(540, 220, 130, 20));
      platforms.push(new Platform(720, 170, 140, 20));
      platforms.push(new Platform(920, 230, 150, 20));
      platforms.push(new Platform(1120, 280, 140, 20));
      platforms.push(new Platform(1320, 220, 150, 20));
      platforms.push(new Platform(1520, 270, 140, 20));
      platforms.push(new Platform(1720, 210, 150, 20));
      platforms.push(new Platform(1920, 260, 160, 20));
      platforms.push(new Platform(2120, 200, 150, 20));
      
      // Many enemies
      for (let i = 0; i < 15; i++) {
        enemies.push(new Enemy(200 + i * 140, 100, 'minion', 4));
      }
      for (let i = 0; i < 5; i++) {
        enemies.push(new Enemy(400 + i * 320, 100, 'archer', 4));
      }
      for (let i = 0; i < 3; i++) {
        enemies.push(new Enemy(600 + i * 500, 100, 'guard', 4));
      }
      enemies.push(new Enemy(2150, 100, 'boss', 4));
      break;
      
    case 5:
      // Final boss arena
      platforms.push(new Platform(300, 280, 200, 20));
      platforms.push(new Platform(700, 280, 200, 20));
      platforms.push(new Platform(1100, 280, 200, 20));
      platforms.push(new Platform(1500, 280, 200, 20));
      platforms.push(new Platform(500, 180, 150, 20));
      platforms.push(new Platform(900, 180, 150, 20));
      platforms.push(new Platform(1300, 180, 150, 20));
      
      // Elite guards
      for (let i = 0; i < 4; i++) {
        enemies.push(new Enemy(400 + i * 350, 100, 'guard', 5));
      }
      for (let i = 0; i < 3; i++) {
        enemies.push(new Enemy(550 + i * 400, 100, 'archer', 5));
      }
      // Final boss
      enemies.push(new Enemy(2000, 100, 'boss', 5));
      break;
  }
  
  return { platforms, enemies };
}

export function drawBackground(p, cameraX, levelNum) {
  // Parallax background
  const layer1X = -cameraX * 0.2;
  const layer2X = -cameraX * 0.5;
  
  // Far background
  p.fill(30, 30, 50);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Mountains/hills (layer 1)
  p.fill(40, 40, 60);
  for (let i = 0; i < 10; i++) {
    const x = (layer1X + i * 200) % (CANVAS_WIDTH + 200);
    p.triangle(x, CANVAS_HEIGHT, x + 100, CANVAS_HEIGHT - 80, x + 200, CANVAS_HEIGHT);
  }
  
  // Closer structures (layer 2)
  p.fill(50, 50, 70);
  for (let i = 0; i < 15; i++) {
    const x = (layer2X + i * 150) % (CANVAS_WIDTH + 150);
    p.rect(x, CANVAS_HEIGHT - 120, 40, 120);
    p.triangle(x - 10, CANVAS_HEIGHT - 120, x + 20, CANVAS_HEIGHT - 140, x + 50, CANVAS_HEIGHT - 120);
  }
  
  // Stars/atmosphere
  p.fill(200, 200, 220, 150);
  for (let i = 0; i < 30; i++) {
    const x = (layer1X * 0.3 + i * 80) % (CANVAS_WIDTH + 80);
    const y = 30 + (i * 37) % 100;
    p.ellipse(x, y, 2, 2);
  }
}