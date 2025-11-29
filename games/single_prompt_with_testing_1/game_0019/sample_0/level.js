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

// Level 1 - Easy: Simple straight path (FORWARD/BACKWARD)
function createLevel1() {
  // Starting platform - BIG SQUARE (reoriented for Z-axis progression)
  const start = new Platform(0, 0.5, 5, 8, 1, 8, 0x64c864);
  gameState.platforms.push(start);
  gameState.entities.push(start);
  
  // Simple path forward (along Z axis)
  const plat1 = new Platform(0, 1, 12, 4, 0.5, 5, 0x64c864);
  gameState.platforms.push(plat1);
  gameState.entities.push(plat1);
  
  const plat2 = new Platform(0, 1.5, 18, 4, 0.5, 5, 0x64c864);
  gameState.platforms.push(plat2);
  gameState.entities.push(plat2);
  
  const plat3 = new Platform(0, 2, 24, 4, 0.5, 6, 0x64c864);
  gameState.platforms.push(plat3);
  gameState.entities.push(plat3);
  
  // Add coins - INCREASED TO 11 to make level solvable (110 points total)
  const coinPositions = [
    [0, 2.5, 5],
    [0, 2.5, 7.5],
    [0, 2.5, 10],
    [0, 2.5, 12.5],
    [0, 2.5, 15],
    [0, 2.5, 17.5],
    [0, 2.5, 20],
    [0, 2.5, 22],
    [0, 2.5, 24],
    [0, 2.5, 26],
    [0, 2.5, 28]
  ];
  
  coinPositions.forEach(pos => {
    const coin = new Coin(pos[0], pos[1], pos[2]);
    gameState.coins.push(coin);
  });
  
  // One easy enemy
  const enemy1 = new Enemy(0, 2, 12);
  gameState.enemies.push(enemy1);
  gameState.entities.push(enemy1);
  
  // Checkpoint
  const checkpoint = new Checkpoint(0, 2.5, 18);
  gameState.checkpoints.push(checkpoint);
  
  // Portal at end
  gameState.portal = new Portal(0, 5, 27);
}

// Level 2 - Easy: Gentle upward climb (FORWARD/BACKWARD)
function createLevel2() {
  // Starting platform - BIG SQUARE
  const start = new Platform(0, 0.5, 5, 8, 1, 8, 0x78c878);
  gameState.platforms.push(start);
  gameState.entities.push(start);
  
  // Ascending platforms
  const plat1 = new Platform(0, 2, 11, 4, 0.5, 4, 0x78c878);
  gameState.platforms.push(plat1);
  gameState.entities.push(plat1);
  
  const plat2 = new Platform(0, 3.5, 16, 4, 0.5, 4, 0x78c878);
  gameState.platforms.push(plat2);
  gameState.entities.push(plat2);
  
  const plat3 = new Platform(0, 5, 21, 4, 0.5, 5, 0x78c878);
  gameState.platforms.push(plat3);
  gameState.entities.push(plat3);
  
  const plat4 = new Platform(0, 6, 26, 4, 0.5, 5, 0x78c878);
  gameState.platforms.push(plat4);
  gameState.entities.push(plat4);
  
  // Coins on path
  const coinPositions = [
    [0, 2.5, 5], [0, 2.5, 8], [0, 3.5, 11], 
    [0, 5, 16], [0, 6.5, 21], [0, 7.5, 26],
    [0, 4, 14], [0, 5.5, 19]
  ];
  
  coinPositions.forEach(pos => {
    const coin = new Coin(pos[0], pos[1], pos[2]);
    gameState.coins.push(coin);
  });
  
  // Few enemies
  const enemy1 = new Enemy(0, 4.5, 16);
  gameState.enemies.push(enemy1);
  gameState.entities.push(enemy1);
  
  // Checkpoint
  const checkpoint = new Checkpoint(0, 6, 21);
  gameState.checkpoints.push(checkpoint);
  
  // Portal
  gameState.portal = new Portal(0, 9, 29);
}

// Level 3 - Medium: More challenging jumps (FORWARD/BACKWARD)
function createLevel3() {
  // Starting platform - BIG SQUARE
  const start = new Platform(0, 0.5, 5, 8, 1, 8, 0x8c8cc8);
  gameState.platforms.push(start);
  gameState.entities.push(start);
  
  // Spaced platforms requiring jumps
  const plat1 = new Platform(0, 2, 12, 4, 0.5, 3, 0x8c8cc8);
  gameState.platforms.push(plat1);
  gameState.entities.push(plat1);
  
  const plat2 = new Platform(0, 4, 17, 4, 0.5, 3, 0x8c8cc8);
  gameState.platforms.push(plat2);
  gameState.entities.push(plat2);
  
  const plat3 = new Platform(0, 5, 22, 4, 0.5, 4, 0x8c8cc8);
  gameState.platforms.push(plat3);
  gameState.entities.push(plat3);
  
  const plat4 = new Platform(0, 6, 14, 4, 0.5, 3, 0x8c8cc8);
  gameState.platforms.push(plat4);
  gameState.entities.push(plat4);
  
  const plat5 = new Platform(0, 8, 20, 4, 0.5, 4, 0x8c8cc8);
  gameState.platforms.push(plat5);
  gameState.entities.push(plat5);
  
  const plat6 = new Platform(0, 9, 26, 4, 0.5, 5, 0x8c8cc8);
  gameState.platforms.push(plat6);
  gameState.entities.push(plat6);
  
  // More coins
  const coinPositions = [
    [0, 2.5, 5], [0, 3.5, 12], [0, 5.5, 17], 
    [0, 6.5, 22], [0, 7.5, 14], [0, 9.5, 20],
    [0, 10.5, 26], [0, 3, 10], [0, 7, 19], [0, 10, 24]
  ];
  
  coinPositions.forEach(pos => {
    const coin = new Coin(pos[0], pos[1], pos[2]);
    gameState.coins.push(coin);
  });
  
  // More enemies
  const enemy1 = new Enemy(0, 3, 12);
  gameState.enemies.push(enemy1);
  gameState.entities.push(enemy1);
  
  const enemy2 = new Enemy(0, 6, 22);
  gameState.enemies.push(enemy2);
  gameState.entities.push(enemy2);
  
  // Barrier requiring karate kick
  const barrier1 = new Barrier(0, 5, 19, 2, 2, 0.5);
  gameState.barriers.push(barrier1);
  gameState.entities.push(barrier1);
  
  // Checkpoints
  const checkpoint1 = new Checkpoint(0, 5, 17);
  gameState.checkpoints.push(checkpoint1);
  
  const checkpoint2 = new Checkpoint(0, 10, 26);
  gameState.checkpoints.push(checkpoint2);
  
  // Portal
  gameState.portal = new Portal(0, 12, 29);
}

// Level 4 - Medium: Mixed movement (FORWARD/BACKWARD with lateral X variation)
function createLevel4() {
  // Starting platform - BIG SQUARE
  const start = new Platform(0, 0.5, 5, 8, 1, 8, 0x9696c8);
  gameState.platforms.push(start);
  gameState.entities.push(start);
  
  // Platforms with X variation for lateral movement
  const plat1 = new Platform(2, 2, 11, 3, 0.5, 3, 0x9696c8);
  gameState.platforms.push(plat1);
  gameState.entities.push(plat1);
  
  const plat2 = new Platform(-2, 3, 16, 3, 0.5, 3, 0x9696c8);
  gameState.platforms.push(plat2);
  gameState.entities.push(plat2);
  
  const plat3 = new Platform(0, 5, 21, 4, 0.5, 4, 0x9696c8);
  gameState.platforms.push(plat3);
  gameState.entities.push(plat3);
  
  const plat4 = new Platform(0, 7, 13, 3, 0.5, 3, 0x9696c8);
  gameState.platforms.push(plat4);
  gameState.entities.push(plat4);
  
  const plat5 = new Platform(2, 8, 18, 3, 0.5, 3, 0x9696c8);
  gameState.platforms.push(plat5);
  gameState.entities.push(plat5);
  
  const plat6 = new Platform(0, 10, 24, 4, 0.5, 5, 0x9696c8);
  gameState.platforms.push(plat6);
  gameState.entities.push(plat6);
  
  // Coins
  const coinPositions = [
    [0, 2.5, 5], [2, 3.5, 11], [-2, 4.5, 16], 
    [0, 6.5, 21], [0, 8.5, 13], [2, 9.5, 18],
    [0, 11.5, 24], [0, 2, 8], [0, 7, 19], [0, 11, 22]
  ];
  
  coinPositions.forEach(pos => {
    const coin = new Coin(pos[0], pos[1], pos[2]);
    gameState.coins.push(coin);
  });
  
  // Enemies
  const enemy1 = new Enemy(2, 3, 11);
  gameState.enemies.push(enemy1);
  gameState.entities.push(enemy1);
  
  const enemy2 = new Enemy(0, 6, 21);
  gameState.enemies.push(enemy2);
  gameState.entities.push(enemy2);
  
  const enemy3 = new Enemy(2, 9, 18);
  gameState.enemies.push(enemy3);
  gameState.entities.push(enemy3);
  
  // Barriers
  const barrier1 = new Barrier(0, 4, 15, 2, 2, 0.5);
  gameState.barriers.push(barrier1);
  gameState.entities.push(barrier1);
  
  // Checkpoint
  const checkpoint = new Checkpoint(0, 6, 21);
  gameState.checkpoints.push(checkpoint);
  
  // Portal
  gameState.portal = new Portal(0, 13, 27);
}

// Level 5 - Hard: Complex platforming (FORWARD/BACKWARD)
function createLevel5() {
  // Starting platform - BIG SQUARE
  const start = new Platform(0, 0.5, 5, 8, 1, 8, 0xc86464);
  gameState.platforms.push(start);
  gameState.entities.push(start);
  
  // Challenging platform sequence
  const plat1 = new Platform(0, 3, 11, 3, 0.5, 2.5, 0xc86464);
  gameState.platforms.push(plat1);
  gameState.entities.push(plat1);
  
  const plat2 = new Platform(0, 5, 15, 3, 0.5, 2.5, 0xc86464);
  gameState.platforms.push(plat2);
  gameState.entities.push(plat2);
  
  const plat3 = new Platform(0, 6, 19, 3, 0.5, 3, 0xc86464);
  gameState.platforms.push(plat3);
  gameState.entities.push(plat3);
  
  const plat4 = new Platform(0, 8, 12, 3, 0.5, 2.5, 0xc86464);
  gameState.platforms.push(plat4);
  gameState.entities.push(plat4);
  
  const plat5 = new Platform(0, 10, 17, 3, 0.5, 3, 0xc86464);
  gameState.platforms.push(plat5);
  gameState.entities.push(plat5);
  
  const plat6 = new Platform(0, 11, 23, 3, 0.5, 3, 0xc86464);
  gameState.platforms.push(plat6);
  gameState.entities.push(plat6);
  
  const plat7 = new Platform(0, 13, 28, 4, 0.5, 4, 0xc86464);
  gameState.platforms.push(plat7);
  gameState.entities.push(plat7);
  
  // Many coins
  const coinPositions = [
    [0, 2.5, 5], [0, 2.5, 8], [0, 4.5, 11], 
    [0, 6.5, 15], [0, 7.5, 19], [0, 9.5, 12],
    [0, 11.5, 17], [0, 12.5, 23], [0, 14.5, 28],
    [0, 6, 13], [0, 9, 20], [0, 12, 25]
  ];
  
  coinPositions.forEach(pos => {
    const coin = new Coin(pos[0], pos[1], pos[2]);
    gameState.coins.push(coin);
  });
  
  // Many enemies
  const enemy1 = new Enemy(0, 4, 11);
  gameState.enemies.push(enemy1);
  gameState.entities.push(enemy1);
  
  const enemy2 = new Enemy(0, 7, 19);
  gameState.enemies.push(enemy2);
  gameState.entities.push(enemy2);
  
  const enemy3 = new Enemy(0, 9, 12);
  gameState.enemies.push(enemy3);
  gameState.entities.push(enemy3);
  
  const enemy4 = new Enemy(0, 12, 23);
  gameState.enemies.push(enemy4);
  gameState.entities.push(enemy4);
  
  // Multiple barriers
  const barrier1 = new Barrier(0, 5, 13, 2, 2, 0.5);
  gameState.barriers.push(barrier1);
  gameState.entities.push(barrier1);
  
  const barrier2 = new Barrier(0, 8, 21, 2, 2, 0.5);
  gameState.barriers.push(barrier2);
  gameState.entities.push(barrier2);
  
  // Checkpoints
  const checkpoint1 = new Checkpoint(0, 7, 19);
  gameState.checkpoints.push(checkpoint1);
  
  const checkpoint2 = new Checkpoint(0, 14, 28);
  gameState.checkpoints.push(checkpoint2);
  
  // Swing point
  const swing1 = new SwingPoint(0, 9, 20);
  gameState.swingPoints.push(swing1);
  
  // Portal
  gameState.portal = new Portal(0, 16, 31);
}

// Level 6 - Hard: Ultimate challenge (FORWARD/BACKWARD)
function createLevel6() {
  // Starting platform - BIG SQUARE
  const start = new Platform(0, 0.5, 5, 8, 1, 8, 0xc87878);
  gameState.platforms.push(start);
  gameState.entities.push(start);
  
  // Very challenging sequence
  const plat1 = new Platform(2, 3, 11, 2, 0.5, 2, 0xc87878);
  gameState.platforms.push(plat1);
  gameState.entities.push(plat1);
  
  const plat2 = new Platform(-2, 5, 15, 2, 0.5, 2, 0xc87878);
  gameState.platforms.push(plat2);
  gameState.entities.push(plat2);
  
  const plat3 = new Platform(1, 7, 19, 2.5, 0.5, 2.5, 0xc87878);
  gameState.platforms.push(plat3);
  gameState.entities.push(plat3);
  
  const plat4 = new Platform(0, 9, 13, 2, 0.5, 2, 0xc87878);
  gameState.platforms.push(plat4);
  gameState.entities.push(plat4);
  
  const plat5 = new Platform(-1, 11, 18, 2.5, 0.5, 2.5, 0xc87878);
  gameState.platforms.push(plat5);
  gameState.entities.push(plat5);
  
  const plat6 = new Platform(0, 12, 24, 3, 0.5, 2.5, 0xc87878);
  gameState.platforms.push(plat6);
  gameState.entities.push(plat6);
  
  const plat7 = new Platform(0, 14, 16, 2.5, 0.5, 2.5, 0xc87878);
  gameState.platforms.push(plat7);
  gameState.entities.push(plat7);
  
  const plat8 = new Platform(0, 15, 22, 3, 0.5, 3, 0xc87878);
  gameState.platforms.push(plat8);
  gameState.entities.push(plat8);
  
  const plat9 = new Platform(0, 17, 28, 4, 0.5, 4, 0xc87878);
  gameState.platforms.push(plat9);
  gameState.entities.push(plat9);
  
  // Maximum coins
  const coinPositions = [
    [0, 2.5, 5], [0, 2.5, 8], [2, 4.5, 11], 
    [-2, 6.5, 15], [1, 8.5, 19], [0, 10.5, 13],
    [-1, 12.5, 18], [0, 13.5, 24], [0, 15.5, 16],
    [0, 16.5, 22], [0, 18.5, 28], [0, 4, 10],
    [0, 8, 14], [0, 13, 20], [0, 16, 26]
  ];
  
  coinPositions.forEach(pos => {
    const coin = new Coin(pos[0], pos[1], pos[2]);
    gameState.coins.push(coin);
  });
  
  // Maximum enemies
  const enemy1 = new Enemy(2, 4, 11);
  gameState.enemies.push(enemy1);
  gameState.entities.push(enemy1);
  
  const enemy2 = new Enemy(-2, 6, 15);
  gameState.enemies.push(enemy2);
  gameState.entities.push(enemy2);
  
  const enemy3 = new Enemy(1, 8, 19);
  gameState.enemies.push(enemy3);
  gameState.entities.push(enemy3);
  
  const enemy4 = new Enemy(0, 10, 13);
  gameState.enemies.push(enemy4);
  gameState.entities.push(enemy4);
  
  const enemy5 = new Enemy(0, 13, 24);
  gameState.enemies.push(enemy5);
  gameState.entities.push(enemy5);
  
  // Multiple barriers
  const barrier1 = new Barrier(0, 6, 17, 2, 2, 0.5);
  gameState.barriers.push(barrier1);
  gameState.entities.push(barrier1);
  
  const barrier2 = new Barrier(0, 10, 21, 2, 2, 0.5);
  gameState.barriers.push(barrier2);
  gameState.entities.push(barrier2);
  
  const barrier3 = new Barrier(0, 15, 26, 2, 2, 0.5);
  gameState.barriers.push(barrier3);
  gameState.entities.push(barrier3);
  
  // Checkpoints
  const checkpoint1 = new Checkpoint(1, 8, 19);
  gameState.checkpoints.push(checkpoint1);
  
  const checkpoint2 = new Checkpoint(0, 13, 24);
  gameState.checkpoints.push(checkpoint2);
  
  // Multiple swing points
  const swing1 = new SwingPoint(0, 10, 20);
  gameState.swingPoints.push(swing1);
  
  const swing2 = new SwingPoint(0, 14, 25);
  gameState.swingPoints.push(swing2);
  
  // Portal
  gameState.portal = new Portal(0, 20, 31);
}