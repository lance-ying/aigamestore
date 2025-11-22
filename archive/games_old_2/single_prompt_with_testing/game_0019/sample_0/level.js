// level.js - Level creation and initialization

import { gameState } from './globals.js';
import { 
  Platform, 
  Enemy, 
  Coin, 
  Barrier, 
  Checkpoint, 
  Portal,
  SwingPoint 
} from './entities.js';

export function createLevel(p) {
  gameState.entities = [];
  gameState.enemies = [];
  gameState.coins = [];
  gameState.barriers = [];
  gameState.checkpoints = [];
  gameState.swingPoints = [];
  
  // Ground platforms
  const ground = new Platform(p, 300, 380, 600, 40);
  gameState.entities.push(ground);
  
  // Starting area platforms
  const plat1 = new Platform(p, 150, 320, 150, 20);
  gameState.entities.push(plat1);
  
  const plat2 = new Platform(p, 280, 260, 100, 20);
  gameState.entities.push(plat2);
  
  // Middle section with gap
  const plat3 = new Platform(p, 400, 280, 80, 20);
  gameState.entities.push(plat3);
  
  const plat4 = new Platform(p, 520, 220, 100, 20);
  gameState.entities.push(plat4);
  
  // Upper platforms
  const plat5 = new Platform(p, 200, 180, 80, 20);
  gameState.entities.push(plat5);
  
  const plat6 = new Platform(p, 450, 140, 120, 20);
  gameState.entities.push(plat6);
  
  // Add coins
  const coinPositions = [
    [150, 290], [280, 230], [400, 250], [520, 190],
    [200, 150], [450, 110], [100, 300], [350, 260],
    [480, 200], [230, 160], [420, 120], [150, 250]
  ];
  
  coinPositions.forEach(pos => {
    const coin = new Coin(p, pos[0], pos[1]);
    gameState.coins.push(coin);
  });
  
  // Add enemies
  const enemy1 = new Enemy(p, 280, 240, 'basic');
  gameState.enemies.push(enemy1);
  gameState.entities.push(enemy1);
  
  const enemy2 = new Enemy(p, 400, 260, 'basic');
  gameState.enemies.push(enemy2);
  gameState.entities.push(enemy2);
  
  const enemy3 = new Enemy(p, 520, 200, 'basic');
  gameState.enemies.push(enemy3);
  gameState.entities.push(enemy3);
  
  // Add barriers (require Karate Kick)
  const barrier1 = new Barrier(p, 320, 340, 15, 60);
  gameState.barriers.push(barrier1);
  gameState.entities.push(barrier1);
  
  const barrier2 = new Barrier(p, 460, 260, 15, 60);
  gameState.barriers.push(barrier2);
  gameState.entities.push(barrier2);
  
  // Add checkpoints
  const checkpoint1 = new Checkpoint(p, 280, 240);
  gameState.checkpoints.push(checkpoint1);
  
  const checkpoint2 = new Checkpoint(p, 450, 120);
  gameState.checkpoints.push(checkpoint2);
  
  // Add swing point
  const swing1 = new SwingPoint(p, 360, 200);
  gameState.swingPoints.push(swing1);
  
  // Add portal at the end
  gameState.portal = new Portal(p, 550, 100);
}