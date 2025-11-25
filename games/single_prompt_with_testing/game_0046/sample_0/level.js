// level.js
import { gameState, GROUND_Y } from './globals.js';
import { Enemy, Boss } from './enemy.js';
import { Pickup } from './pickup.js';

export function spawnLevel(p) {
  gameState.enemies = [];
  gameState.pickups = [];
  gameState.boss = null;
  gameState.levelProgress = 0;
  
  // Spawn enemies in waves
  // Wave 1
  for (let i = 0; i < 3; i++) {
    const enemy = new Enemy(p, 400 + i * 150, GROUND_Y - 32, 'soldier');
    gameState.enemies.push(enemy);
    gameState.entities.push(enemy);
  }
  
  // Pickup 1 - warrior skull
  const pickup1 = new Pickup(p, 700, GROUND_Y - 50, 'warrior');
  gameState.pickups.push(pickup1);
  
  // Wave 2
  for (let i = 0; i < 2; i++) {
    const enemy = new Enemy(p, 1000 + i * 120, GROUND_Y - 32, 'soldier');
    gameState.enemies.push(enemy);
    gameState.entities.push(enemy);
  }
  const elite1 = new Enemy(p, 1250, GROUND_Y - 32, 'elite');
  gameState.enemies.push(elite1);
  gameState.entities.push(elite1);
  
  // Pickup 2 - mage skull
  const pickup2 = new Pickup(p, 1400, GROUND_Y - 50, 'mage');
  gameState.pickups.push(pickup2);
  
  // Wave 3
  for (let i = 0; i < 4; i++) {
    const enemy = new Enemy(p, 1600 + i * 100, GROUND_Y - 32, 'soldier');
    gameState.enemies.push(enemy);
    gameState.entities.push(enemy);
  }
  const elite2 = new Enemy(p, 1900, GROUND_Y - 32, 'elite');
  gameState.enemies.push(elite2);
  gameState.entities.push(elite2);
  
  // Health pickup
  const pickup3 = new Pickup(p, 1800, GROUND_Y - 50, 'health');
  gameState.pickups.push(pickup3);
  
  // Boss
  const boss = new Boss(p, 2200, GROUND_Y - 100);
  gameState.boss = boss;
  gameState.entities.push(boss);
}

export function drawLevel(p, cameraX) {
  p.push();
  
  // Background
  p.fill(30, 20, 40);
  p.noStroke();
  p.rect(0, 0, 600, 400);
  
  // Dark atmosphere gradient
  for (let i = 0; i < 5; i++) {
    p.fill(20 + i * 5, 15 + i * 3, 30 + i * 5, 50);
    p.rect(0, i * 80, 600, 80);
  }
  
  // Ground
  p.fill(40, 35, 45);
  p.rect(0, GROUND_Y, 600, 400 - GROUND_Y);
  
  // Ground detail
  for (let i = 0; i < 30; i++) {
    const x = (i * 50 - cameraX * 0.5) % 650 - 50;
    p.fill(35, 30, 40);
    p.rect(x, GROUND_Y, 40, 2);
    p.rect(x + 10, GROUND_Y + 5, 3, 35);
  }
  
  // Background ruins/pillars
  for (let i = 0; i < 6; i++) {
    const x = (i * 400 - cameraX * 0.3) % (gameState.worldWidth + 400) - 200;
    p.fill(50, 45, 55, 150);
    p.rect(x, GROUND_Y - 150, 30, 150);
    p.rect(x - 5, GROUND_Y - 160, 40, 10);
  }
  
  // Progress marker for boss
  if (gameState.player && gameState.player.x > 2000 && !gameState.bossDefeated) {
    p.fill(255, 200, 50);
    p.textSize(16);
    p.textAlign(p.CENTER);
    p.text("BOSS AHEAD!", 300, 50);
  }
  
  p.pop();
}