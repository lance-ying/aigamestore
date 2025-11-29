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
  // Clear existing level
  gameState.entities = [];
  gameState.enemies = [];
  gameState.coins = [];
  gameState.barriers = [];
  gameState.checkpoints = [];
  gameState.swingPoints = [];
  gameState.platforms = [];
  
  // Create level based on current level number
  switch(gameState.currentLevel) {
    case 1:
      createLevel1(); // Easy
      break;
    case 2:
      createLevel2(); // Easy
      break;
    case 3:
      createLevel3(); // Medium
      break;
    case 4:
      createLevel4(); // Medium
      break;
    case 5:
      createLevel5(); // Hard
      break;
    case 6:
      createLevel6(); // Hard
      break;
    default:
      createLevel1();
  }
}

// Level 1 - Easy: Simple straight path
function createLevel1() {
  // Starting platform - BIG SQUARE
  const start = new Platform(5, 0.5, 0, 8, 1, 8, 0x64c864);
  gameState.platforms.push(start);
  gameState.entities.push(start);
  
  // Simple path forward
  const plat1 = new Platform(12, 1, 0, 5, 0.5, 4, 0x64c864);
  gameState.platforms.push(plat1);
  gameState.entities.push(plat1);
  
  const plat2 = new Platform(18, 1.5, 0, 5, 0.5, 4, 0x64c864);
  gameState.platforms.push(plat2);
  gameState.entities.push(plat2);
  
  const plat3 = new Platform(24, 2, 0, 6, 0.5, 4, 0x64c864);
  gameState.platforms.push(plat3);
  gameState.entities.push(plat3);
  
  // Add coins
  for (let i = 0; i < 8; i++) {
    const coin = new Coin(5 + i * 2.5, 2.5, 0);
    gameState.coins.push(coin);
  }
  
  // One easy enemy
  const enemy1 = new Enemy(12, 2, 0);
  gameState.enemies.push(enemy1);
  gameState.entities.push(enemy1);
  
  // Checkpoint
  const checkpoint = new Checkpoint(18, 2.5, 0);
  gameState.checkpoints.push(checkpoint);
  
  // Portal at end
  gameState.portal = new Portal(27, 5, 0);
}

// Level 2 - Easy: Gentle upward climb
function createLevel2() {
  // Starting platform - BIG SQUARE
  const start = new Platform(5, 0.5, 0, 8, 1, 8, 0x78c878);
  gameState.platforms.push(start);
  gameState.entities.push(start);
  
  // Ascending platforms
  const plat1 = new Platform(11, 2, 0, 4, 0.5, 4, 0x78c878);
  gameState.platforms.push(plat1);
  gameState.entities.push(plat1);
  
  const plat2 = new Platform(16, 3.5, 0, 4, 0.5, 4, 0x78c878);
  gameState.platforms.push(plat2);
  gameState.entities.push(plat2);
  
  const plat3 = new Platform(21, 5, 0, 5, 0.5, 4, 0x78c878);
  gameState.platforms.push(plat3);
  gameState.entities.push(plat3);
  
  const plat4 = new Platform(26, 6, 0, 5, 0.5, 4, 0x78c878);
  gameState.platforms.push(plat4);
  gameState.entities.push(plat4);
  
  // Coins on path
  const coinPositions = [
    [5, 2.5, 0], [8, 2.5, 0], [11, 3.5, 0], 
    [16, 5, 0], [21, 6.5, 0], [26, 7.5, 0],
    [14, 4, 0], [19, 5.5, 0]
  ];
  
  coinPositions.forEach(pos => {
    const coin = new Coin(pos[0], pos[1], pos[2]);
    gameState.coins.push(coin);
  });
  
  // Few enemies
  const enemy1 = new Enemy(16, 4.5, 0);
  gameState.enemies.push(enemy1);
  gameState.entities.push(enemy1);
  
  // Checkpoint
  const checkpoint = new Checkpoint(21, 6, 0);
  gameState.checkpoints.push(checkpoint);
  
  // Portal
  gameState.portal = new Portal(29, 9, 0);
}

// Level 3 - Medium: More challenging jumps
function createLevel3() {
  // Starting platform - BIG SQUARE
  const start = new Platform(5, 0.5, 0, 8, 1, 8, 0x8c8cc8);
  gameState.platforms.push(start);
  gameState.entities.push(start);
  
  // Spaced platforms requiring jumps
  const plat1 = new Platform(12, 2, 0, 3, 0.5, 4, 0x8c8cc8);
  gameState.platforms.push(plat1);
  gameState.entities.push(plat1);
  
  const plat2 = new Platform(17, 4, 0, 3, 0.5, 4, 0x8c8cc8);
  gameState.platforms.push(plat2);
  gameState.entities.push(plat2);
  
  const plat3 = new Platform(22, 5, 0, 4, 0.5, 4, 0x8c8cc8);
  gameState.platforms.push(plat3);
  gameState.entities.push(plat3);
  
  const plat4 = new Platform(14, 6, 0, 3, 0.5, 4, 0x8c8cc8);
  gameState.platforms.push(plat4);
  gameState.entities.push(plat4);
  
  const plat5 = new Platform(20, 8, 0, 4, 0.5, 4, 0x8c8cc8);
  gameState.platforms.push(plat5);
  gameState.entities.push(plat5);
  
  const plat6 = new Platform(26, 9, 0, 5, 0.5, 4, 0x8c8cc8);
  gameState.platforms.push(plat6);
  gameState.entities.push(plat6);
  
  // More coins
  const coinPositions = [
    [5, 2.5, 0], [12, 3.5, 0], [17, 5.5, 0], 
    [22, 6.5, 0], [14, 7.5, 0], [20, 9.5, 0],
    [26, 10.5, 0], [10, 3, 0], [19, 7, 0], [24, 10, 0]
  ];
  
  coinPositions.forEach(pos => {
    const coin = new Coin(pos[0], pos[1], pos[2]);
    gameState.coins.push(coin);
  });
  
  // More enemies
  const enemy1 = new Enemy(12, 3, 0);
  gameState.enemies.push(enemy1);
  gameState.entities.push(enemy1);
  
  const enemy2 = new Enemy(22, 6, 0);
  gameState.enemies.push(enemy2);
  gameState.entities.push(enemy2);
  
  // Barrier requiring karate kick
  const barrier1 = new Barrier(19, 5, 0, 0.5, 2, 2);
  gameState.barriers.push(barrier1);
  gameState.entities.push(barrier1);
  
  // Checkpoints
  const checkpoint1 = new Checkpoint(17, 5, 0);
  gameState.checkpoints.push(checkpoint1);
  
  const checkpoint2 = new Checkpoint(26, 10, 0);
  gameState.checkpoints.push(checkpoint2);
  
  // Portal
  gameState.portal = new Portal(29, 12, 0);
}

// Level 4 - Medium: Mixed movement
function createLevel4() {
  // Starting platform - BIG SQUARE
  const start = new Platform(5, 0.5, 0, 8, 1, 8, 0x9696c8);
  gameState.platforms.push(start);
  gameState.entities.push(start);
  
  // Platforms in different Z positions
  const plat1 = new Platform(11, 2, 2, 3, 0.5, 3, 0x9696c8);
  gameState.platforms.push(plat1);
  gameState.entities.push(plat1);
  
  const plat2 = new Platform(16, 3, -2, 3, 0.5, 3, 0x9696c8);
  gameState.platforms.push(plat2);
  gameState.entities.push(plat2);
  
  const plat3 = new Platform(21, 5, 0, 4, 0.5, 4, 0x9696c8);
  gameState.platforms.push(plat3);
  gameState.entities.push(plat3);
  
  const plat4 = new Platform(13, 7, 0, 3, 0.5, 3, 0x9696c8);
  gameState.platforms.push(plat4);
  gameState.entities.push(plat4);
  
  const plat5 = new Platform(18, 8, 2, 3, 0.5, 3, 0x9696c8);
  gameState.platforms.push(plat5);
  gameState.entities.push(plat5);
  
  const plat6 = new Platform(24, 10, 0, 5, 0.5, 4, 0x9696c8);
  gameState.platforms.push(plat6);
  gameState.entities.push(plat6);
  
  // Coins
  const coinPositions = [
    [5, 2.5, 0], [11, 3.5, 2], [16, 4.5, -2], 
    [21, 6.5, 0], [13, 8.5, 0], [18, 9.5, 2],
    [24, 11.5, 0], [8, 2, 0], [19, 7, 0], [22, 11, 0]
  ];
  
  coinPositions.forEach(pos => {
    const coin = new Coin(pos[0], pos[1], pos[2]);
    gameState.coins.push(coin);
  });
  
  // Enemies
  const enemy1 = new Enemy(11, 3, 2);
  gameState.enemies.push(enemy1);
  gameState.entities.push(enemy1);
  
  const enemy2 = new Enemy(21, 6, 0);
  gameState.enemies.push(enemy2);
  gameState.entities.push(enemy2);
  
  const enemy3 = new Enemy(18, 9, 2);
  gameState.enemies.push(enemy3);
  gameState.entities.push(enemy3);
  
  // Barriers
  const barrier1 = new Barrier(15, 4, 0, 0.5, 2, 2);
  gameState.barriers.push(barrier1);
  gameState.entities.push(barrier1);
  
  // Checkpoint
  const checkpoint = new Checkpoint(21, 6, 0);
  gameState.checkpoints.push(checkpoint);
  
  // Portal
  gameState.portal = new Portal(27, 13, 0);
}

// Level 5 - Hard: Complex platforming
function createLevel5() {
  // Starting platform - BIG SQUARE
  const start = new Platform(5, 0.5, 0, 8, 1, 8, 0xc86464);
  gameState.platforms.push(start);
  gameState.entities.push(start);
  
  // Challenging platform sequence
  const plat1 = new Platform(11, 3, 0, 2.5, 0.5, 3, 0xc86464);
  gameState.platforms.push(plat1);
  gameState.entities.push(plat1);
  
  const plat2 = new Platform(15, 5, 0, 2.5, 0.5, 3, 0xc86464);
  gameState.platforms.push(plat2);
  gameState.entities.push(plat2);
  
  const plat3 = new Platform(19, 6, 0, 3, 0.5, 3, 0xc86464);
  gameState.platforms.push(plat3);
  gameState.entities.push(plat3);
  
  const plat4 = new Platform(12, 8, 0, 2.5, 0.5, 3, 0xc86464);
  gameState.platforms.push(plat4);
  gameState.entities.push(plat4);
  
  const plat5 = new Platform(17, 10, 0, 3, 0.5, 3, 0xc86464);
  gameState.platforms.push(plat5);
  gameState.entities.push(plat5);
  
  const plat6 = new Platform(23, 11, 0, 3, 0.5, 3, 0xc86464);
  gameState.platforms.push(plat6);
  gameState.entities.push(plat6);
  
  const plat7 = new Platform(28, 13, 0, 4, 0.5, 4, 0xc86464);
  gameState.platforms.push(plat7);
  gameState.entities.push(plat7);
  
  // Many coins
  const coinPositions = [
    [5, 2.5, 0], [8, 2.5, 0], [11, 4.5, 0], 
    [15, 6.5, 0], [19, 7.5, 0], [12, 9.5, 0],
    [17, 11.5, 0], [23, 12.5, 0], [28, 14.5, 0],
    [13, 6, 0], [20, 9, 0], [25, 12, 0]
  ];
  
  coinPositions.forEach(pos => {
    const coin = new Coin(pos[0], pos[1], pos[2]);
    gameState.coins.push(coin);
  });
  
  // Many enemies
  const enemy1 = new Enemy(11, 4, 0);
  gameState.enemies.push(enemy1);
  gameState.entities.push(enemy1);
  
  const enemy2 = new Enemy(19, 7, 0);
  gameState.enemies.push(enemy2);
  gameState.entities.push(enemy2);
  
  const enemy3 = new Enemy(12, 9, 0);
  gameState.enemies.push(enemy3);
  gameState.entities.push(enemy3);
  
  const enemy4 = new Enemy(23, 12, 0);
  gameState.enemies.push(enemy4);
  gameState.entities.push(enemy4);
  
  // Multiple barriers
  const barrier1 = new Barrier(13, 5, 0, 0.5, 2, 2);
  gameState.barriers.push(barrier1);
  gameState.entities.push(barrier1);
  
  const barrier2 = new Barrier(21, 8, 0, 0.5, 2, 2);
  gameState.barriers.push(barrier2);
  gameState.entities.push(barrier2);
  
  // Checkpoints
  const checkpoint1 = new Checkpoint(19, 7, 0);
  gameState.checkpoints.push(checkpoint1);
  
  const checkpoint2 = new Checkpoint(28, 14, 0);
  gameState.checkpoints.push(checkpoint2);
  
  // Swing point
  const swing1 = new SwingPoint(20, 9, 0);
  gameState.swingPoints.push(swing1);
  
  // Portal
  gameState.portal = new Portal(31, 16, 0);
}

// Level 6 - Hard: Ultimate challenge
function createLevel6() {
  // Starting platform - BIG SQUARE
  const start = new Platform(5, 0.5, 0, 8, 1, 8, 0xc87878);
  gameState.platforms.push(start);
  gameState.entities.push(start);
  
  // Very challenging sequence
  const plat1 = new Platform(11, 3, 2, 2, 0.5, 2, 0xc87878);
  gameState.platforms.push(plat1);
  gameState.entities.push(plat1);
  
  const plat2 = new Platform(15, 5, -2, 2, 0.5, 2, 0xc87878);
  gameState.platforms.push(plat2);
  gameState.entities.push(plat2);
  
  const plat3 = new Platform(19, 7, 1, 2.5, 0.5, 2.5, 0xc87878);
  gameState.platforms.push(plat3);
  gameState.entities.push(plat3);
  
  const plat4 = new Platform(13, 9, 0, 2, 0.5, 2, 0xc87878);
  gameState.platforms.push(plat4);
  gameState.entities.push(plat4);
  
  const plat5 = new Platform(18, 11, -1, 2.5, 0.5, 2.5, 0xc87878);
  gameState.platforms.push(plat5);
  gameState.entities.push(plat5);
  
  const plat6 = new Platform(24, 12, 0, 2.5, 0.5, 3, 0xc87878);
  gameState.platforms.push(plat6);
  gameState.entities.push(plat6);
  
  const plat7 = new Platform(16, 14, 0, 2.5, 0.5, 2.5, 0xc87878);
  gameState.platforms.push(plat7);
  gameState.entities.push(plat7);
  
  const plat8 = new Platform(22, 15, 0, 3, 0.5, 3, 0xc87878);
  gameState.platforms.push(plat8);
  gameState.entities.push(plat8);
  
  const plat9 = new Platform(28, 17, 0, 4, 0.5, 4, 0xc87878);
  gameState.platforms.push(plat9);
  gameState.entities.push(plat9);
  
  // Maximum coins
  const coinPositions = [
    [5, 2.5, 0], [8, 2.5, 0], [11, 4.5, 2], 
    [15, 6.5, -2], [19, 8.5, 1], [13, 10.5, 0],
    [18, 12.5, -1], [24, 13.5, 0], [16, 15.5, 0],
    [22, 16.5, 0], [28, 18.5, 0], [10, 4, 0],
    [14, 8, 0], [20, 13, 0], [26, 16, 0]
  ];
  
  coinPositions.forEach(pos => {
    const coin = new Coin(pos[0], pos[1], pos[2]);
    gameState.coins.push(coin);
  });
  
  // Maximum enemies
  const enemy1 = new Enemy(11, 4, 2);
  gameState.enemies.push(enemy1);
  gameState.entities.push(enemy1);
  
  const enemy2 = new Enemy(15, 6, -2);
  gameState.enemies.push(enemy2);
  gameState.entities.push(enemy2);
  
  const enemy3 = new Enemy(19, 8, 1);
  gameState.enemies.push(enemy3);
  gameState.entities.push(enemy3);
  
  const enemy4 = new Enemy(13, 10, 0);
  gameState.enemies.push(enemy4);
  gameState.entities.push(enemy4);
  
  const enemy5 = new Enemy(24, 13, 0);
  gameState.enemies.push(enemy5);
  gameState.entities.push(enemy5);
  
  // Multiple barriers
  const barrier1 = new Barrier(17, 6, 0, 0.5, 2, 2);
  gameState.barriers.push(barrier1);
  gameState.entities.push(barrier1);
  
  const barrier2 = new Barrier(21, 10, 0, 0.5, 2, 2);
  gameState.barriers.push(barrier2);
  gameState.entities.push(barrier2);
  
  const barrier3 = new Barrier(26, 15, 0, 0.5, 2, 2);
  gameState.barriers.push(barrier3);
  gameState.entities.push(barrier3);
  
  // Checkpoints
  const checkpoint1 = new Checkpoint(19, 8, 1);
  gameState.checkpoints.push(checkpoint1);
  
  const checkpoint2 = new Checkpoint(24, 13, 0);
  gameState.checkpoints.push(checkpoint2);
  
  // Multiple swing points
  const swing1 = new SwingPoint(20, 10, 0);
  gameState.swingPoints.push(swing1);
  
  const swing2 = new SwingPoint(25, 14, 0);
  gameState.swingPoints.push(swing2);
  
  // Portal
  gameState.portal = new Portal(31, 20, 0);
}