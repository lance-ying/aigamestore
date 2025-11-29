// level.js - Level creation
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

export function createLevel() {
  gameState.entities = [];
  gameState.enemies = [];
  gameState.coins = [];
  gameState.barriers = [];
  gameState.checkpoints = [];
  gameState.swingPoints = [];
  gameState.platforms = [];
  
  // Ground platforms
  const ground = new Platform(0, -1, 0, 30, 1, 5, 0x64c864);
  gameState.platforms.push(ground);
  gameState.entities.push(ground);
  
  // Starting platforms
  const plat1 = new Platform(5, 1, 0, 6, 0.5, 4, 0x64c864);
  gameState.platforms.push(plat1);
  gameState.entities.push(plat1);
  
  const plat2 = new Platform(12, 3, 0, 4, 0.5, 4, 0x64c864);
  gameState.platforms.push(plat2);
  gameState.entities.push(plat2);
  
  // Middle platforms
  const plat3 = new Platform(18, 4, 0, 3, 0.5, 4, 0x64c864);
  gameState.platforms.push(plat3);
  gameState.entities.push(plat3);
  
  const plat4 = new Platform(23, 6, 0, 4, 0.5, 4, 0x64c864);
  gameState.platforms.push(plat4);
  gameState.entities.push(plat4);
  
  // Upper platforms
  const plat5 = new Platform(10, 7, 0, 3, 0.5, 4, 0x64c864);
  gameState.platforms.push(plat5);
  gameState.entities.push(plat5);
  
  const plat6 = new Platform(20, 9, 0, 5, 0.5, 4, 0x64c864);
  gameState.platforms.push(plat6);
  gameState.entities.push(plat6);
  
  // Add coins
  const coinPositions = [
    [5, 2.5, 0], [12, 4.5, 0], [18, 5.5, 0], [23, 7.5, 0],
    [10, 8.5, 0], [20, 10.5, 0], [7, 2, 0], [15, 5, 0],
    [21, 7, 0], [11, 8, 0], [19, 10, 0], [6, 3, 0]
  ];
  
  coinPositions.forEach(pos => {
    const coin = new Coin(pos[0], pos[1], pos[2]);
    gameState.coins.push(coin);
  });
  
  // Add enemies
  const enemy1 = new Enemy(12, 4, 0);
  gameState.enemies.push(enemy1);
  gameState.entities.push(enemy1);
  
  const enemy2 = new Enemy(18, 5, 0);
  gameState.enemies.push(enemy2);
  gameState.entities.push(enemy2);
  
  const enemy3 = new Enemy(23, 7, 0);
  gameState.enemies.push(enemy3);
  gameState.entities.push(enemy3);
  
  // Add barriers (require Karate Kick)
  const barrier1 = new Barrier(8, 1.5, 0, 0.5, 2, 2);
  gameState.barriers.push(barrier1);
  gameState.entities.push(barrier1);
  
  const barrier2 = new Barrier(20, 5, 0, 0.5, 2, 2);
  gameState.barriers.push(barrier2);
  gameState.entities.push(barrier2);
  
  // Add checkpoints
  const checkpoint1 = new Checkpoint(12, 4, 0);
  gameState.checkpoints.push(checkpoint1);
  
  const checkpoint2 = new Checkpoint(20, 10, 0);
  gameState.checkpoints.push(checkpoint2);
  
  // Add swing point
  const swing1 = new SwingPoint(16, 7, 0);
  gameState.swingPoints.push(swing1);
  
  // Add portal at the end
  gameState.portal = new Portal(25, 11, 0);
}