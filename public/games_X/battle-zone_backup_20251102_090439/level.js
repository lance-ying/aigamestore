import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';
import { Obstacle, Pickup, Enemy, ExtractionPoint, WeaponPickup } from './entities.js';

function checkCollisionWithRect(circleX, circleY, circleRadius, rectX, rectY, rectWidth, rectHeight) {
  const closestX = Math.max(rectX, Math.min(circleX, rectX + rectWidth));
  const closestY = Math.max(rectY, Math.min(circleY, rectY + rectHeight));
  const distanceX = circleX - closestX;
  const distanceY = circleY - closestY;
  return (distanceX * distanceX + distanceY * distanceY) < (circleRadius * circleRadius);
}

export function generateLevel(p) {
  const { level } = gameState;
  
  gameState.obstacles = [];
  gameState.enemies = [];
  gameState.pickups = [];
  gameState.weaponPickups = [];
  
  // Create outer walls
  gameState.obstacles.push(new Obstacle(-10, -10, level.width + 20, 10));
  gameState.obstacles.push(new Obstacle(-10, level.height, level.width + 20, 10));
  gameState.obstacles.push(new Obstacle(-10, -10, 10, level.height + 20));
  gameState.obstacles.push(new Obstacle(level.width, -10, 10, level.height + 20));
  
  // Generate random obstacles - more obstacles at higher levels
  const numObstacles = 20 + gameState.currentLevel * 2;
  for (let i = 0; i < numObstacles; i++) {
    const obstacleWidth = 40 + Math.floor(p.random(80));
    const obstacleHeight = 40 + Math.floor(p.random(80));
    
    let x, y;
    let validPosition = false;
    
    while (!validPosition) {
      x = p.random(100, level.width - 100 - obstacleWidth);
      y = p.random(100, level.height - 100 - obstacleHeight);
      
      const centerDist = p.dist(x + obstacleWidth/2, y + obstacleHeight/2, level.width/2, level.height/2);
      if (centerDist > 150) {
        validPosition = true;
      }
    }
    
    gameState.obstacles.push(new Obstacle(x, y, obstacleWidth, obstacleHeight));
  }
  
  // Generate enemies with variety - MUCH fewer enemies for level 1
  let numEnemies;
  if (gameState.currentLevel === 1) {
    // Level 1: only 5-7 total enemies (way fewer than before)
    numEnemies = 5 + Math.floor(p.random(3));
  } else {
    // Other levels: scale normally
    numEnemies = gameState.requiredKills + 5 + gameState.currentLevel;
  }
  
  const enemyTypes = ["regular", "elite", "heavy", "scout", "sniper", "tank"];
  
  for (let i = 0; i < numEnemies; i++) {
    let x, y;
    let validPosition = false;
    
    while (!validPosition) {
      x = p.random(100, level.width - 100);
      y = p.random(100, level.height - 100);
      
      const centerDist = p.dist(x, y, level.width/2, level.height/2);
      if (centerDist > 300) {
        let collides = false;
        for (const obstacle of gameState.obstacles) {
          if (checkCollisionWithRect(x, y, 15, obstacle.x, obstacle.y, obstacle.width, obstacle.height)) {
            collides = true;
            break;
          }
        }
        
        if (!collides) {
          validPosition = true;
        }
      }
    }
    
    // Higher level = more difficult enemy types
    let enemyType;
    const rand = p.random();
    if (gameState.currentLevel === 1) {
      // Level 1: mostly regular enemies, very simple
      if (rand < 0.85) enemyType = "regular";
      else enemyType = "scout";
    } else if (gameState.currentLevel === 2) {
      // Level 2: introduce heavy and more elites
      if (rand < 0.5) enemyType = "regular";
      else if (rand < 0.7) enemyType = "elite";
      else if (rand < 0.85) enemyType = "scout";
      else if (rand < 0.95) enemyType = "heavy";
      else enemyType = "tank";
    } else if (gameState.currentLevel === 3) {
      // Level 3: introduce snipers and tanks
      if (rand < 0.3) enemyType = "regular";
      else if (rand < 0.5) enemyType = "elite";
      else if (rand < 0.65) enemyType = "scout";
      else if (rand < 0.8) enemyType = "heavy";
      else if (rand < 0.92) enemyType = "sniper";
      else enemyType = "tank";
    } else {
      // Level 4+: all enemy types with more challenging distribution
      if (rand < 0.2) enemyType = "regular";
      else if (rand < 0.4) enemyType = "elite";
      else if (rand < 0.55) enemyType = "scout";
      else if (rand < 0.7) enemyType = "heavy";
      else if (rand < 0.85) enemyType = "sniper";
      else enemyType = "tank";
    }
    
    gameState.enemies.push(new Enemy(x, y, enemyType));
  }
  
  // Generate health pickups
  const numHealthPickups = 6 + gameState.currentLevel;
  for (let i = 0; i < numHealthPickups; i++) {
    placePickup(p, "health");
  }
  
  // Generate ammo pickups
  const numAmmoPickups = 10 + gameState.currentLevel * 2;
  for (let i = 0; i < numAmmoPickups; i++) {
    placePickup(p, "ammo");
  }
  
  // Generate weapon pickups - more weapons at higher levels
  const weaponTypes = ["rifle", "shotgun", "sniper"];
  const numWeaponPickups = Math.min(gameState.currentLevel, 3);
  for (let i = 0; i < numWeaponPickups; i++) {
    const weaponType = weaponTypes[i];
    placeWeaponPickup(p, weaponType);
  }
  
  // Place extraction point if mission type is extraction
  if (gameState.mission === "extraction") {
    let x, y;
    let validPosition = false;
    
    while (!validPosition) {
      x = p.random(100, level.width - 100);
      y = p.random(100, level.height - 100);
      
      const centerDist = p.dist(x, y, level.width/2, level.height/2);
      if (centerDist > 500) {
        let collides = false;
        for (const obstacle of gameState.obstacles) {
          if (checkCollisionWithRect(x, y, 20, obstacle.x, obstacle.y, obstacle.width, obstacle.height)) {
            collides = true;
            break;
          }
        }
        
        if (!collides) {
          validPosition = true;
        }
      }
    }
    
    gameState.extractionPoint = { x, y };
    gameState.extractionPointObj = new ExtractionPoint(x, y);
  }
}

function placePickup(p, type) {
  let x, y;
  let validPosition = false;
  
  while (!validPosition) {
    x = p.random(100, gameState.level.width - 100);
    y = p.random(100, gameState.level.height - 100);
    
    let collides = false;
    for (const obstacle of gameState.obstacles) {
      if (checkCollisionWithRect(x, y, 10, obstacle.x, obstacle.y, obstacle.width, obstacle.height)) {
        collides = true;
        break;
      }
    }
    
    let tooClose = false;
    for (const pickup of gameState.pickups) {
      if (p.dist(x, y, pickup.x, pickup.y) < 60) {
        tooClose = true;
        break;
      }
    }
    
    if (!collides && !tooClose) {
      validPosition = true;
    }
  }
  
  gameState.pickups.push(new Pickup(x, y, type));
}

function placeWeaponPickup(p, weaponType) {
  let x, y;
  let validPosition = false;
  
  while (!validPosition) {
    x = p.random(100, gameState.level.width - 100);
    y = p.random(100, gameState.level.height - 100);
    
    let collides = false;
    for (const obstacle of gameState.obstacles) {
      if (checkCollisionWithRect(x, y, 12, obstacle.x, obstacle.y, obstacle.width, obstacle.height)) {
        collides = true;
        break;
      }
    }
    
    let tooClose = false;
    for (const pickup of [...gameState.pickups, ...gameState.weaponPickups]) {
      if (p.dist(x, y, pickup.x, pickup.y) < 80) {
        tooClose = true;
        break;
      }
    }
    
    if (!collides && !tooClose) {
      validPosition = true;
    }
  }
  
  gameState.weaponPickups.push(new WeaponPickup(x, y, weaponType));
}