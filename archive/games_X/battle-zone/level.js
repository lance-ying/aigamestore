import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, LEVEL_CONFIGS } from './globals.js';
import { Obstacle, Pickup, Enemy, ExtractionPoint, WeaponPickup } from './entities.js';

function checkCollisionWithRect(circleX, circleY, circleRadius, rectX, rectY, rectWidth, rectHeight) {
  const closestX = Math.max(rectX, Math.min(circleX, rectX + rectWidth));
  const closestY = Math.max(rectY, Math.min(circleY, rectY + rectHeight));
  const distanceX = circleX - closestX;
  const distanceY = circleY - closestY;
  return (distanceX * distanceX + distanceY * distanceY) < (circleRadius * circleRadius);
}

// Get enemy type distribution based on level difficulty
function getEnemyType(p, level) {
  const rand = p.random();
  
  if (level === 1) {
    // Level 1 (Easy): Mostly regular enemies, some scouts
    if (rand < 0.75) return "regular";
    else return "scout";
  } else if (level === 2) {
    // Level 2 (Easy): Regular, scouts, introduce elite
    if (rand < 0.55) return "regular";
    else if (rand < 0.80) return "scout";
    else return "elite";
  } else if (level === 3) {
    // Level 3 (Easy): More variety, introduce heavy
    if (rand < 0.45) return "regular";
    else if (rand < 0.70) return "scout";
    else if (rand < 0.90) return "elite";
    else return "heavy";
  } else if (level === 4) {
    // Level 4 (Medium): Balanced mix, no tanks yet
    if (rand < 0.30) return "regular";
    else if (rand < 0.50) return "scout";
    else if (rand < 0.70) return "elite";
    else if (rand < 0.90) return "heavy";
    else return "sniper";
  } else if (level === 5) {
    // Level 5 (Medium): All types, introduce tanks
    if (rand < 0.25) return "regular";
    else if (rand < 0.45) return "scout";
    else if (rand < 0.65) return "elite";
    else if (rand < 0.80) return "heavy";
    else if (rand < 0.93) return "sniper";
    else return "tank";
  } else if (level === 6) {
    // Level 6 (Medium): More difficult types
    if (rand < 0.20) return "regular";
    else if (rand < 0.35) return "scout";
    else if (rand < 0.55) return "elite";
    else if (rand < 0.75) return "heavy";
    else if (rand < 0.90) return "sniper";
    else return "tank";
  } else if (level === 7) {
    // Level 7 (Hard): Heavy focus on difficult enemies
    if (rand < 0.15) return "regular";
    else if (rand < 0.30) return "scout";
    else if (rand < 0.50) return "elite";
    else if (rand < 0.70) return "heavy";
    else if (rand < 0.88) return "sniper";
    else return "tank";
  } else if (level === 8) {
    // Level 8 (Hard): Very difficult composition
    if (rand < 0.10) return "regular";
    else if (rand < 0.22) return "scout";
    else if (rand < 0.42) return "elite";
    else if (rand < 0.65) return "heavy";
    else if (rand < 0.85) return "sniper";
    else return "tank";
  } else {
    // Level 9 (Hard - Final): Maximum difficulty
    if (rand < 0.08) return "regular";
    else if (rand < 0.18) return "scout";
    else if (rand < 0.38) return "elite";
    else if (rand < 0.60) return "heavy";
    else if (rand < 0.82) return "sniper";
    else return "tank";
  }
}

export function generateLevel(p) {
  const { level } = gameState;
  const currentLevel = gameState.currentLevel;
  
  // Get level configuration or use max level config as fallback
  const levelConfig = LEVEL_CONFIGS[currentLevel] || LEVEL_CONFIGS[9];
  
  gameState.obstacles = [];
  gameState.enemies = [];
  gameState.pickups = [];
  gameState.weaponPickups = [];
  
  // Create outer walls
  gameState.obstacles.push(new Obstacle(-10, -10, level.width + 20, 10));
  gameState.obstacles.push(new Obstacle(-10, level.height, level.width + 20, 10));
  gameState.obstacles.push(new Obstacle(-10, -10, 10, level.height + 20));
  gameState.obstacles.push(new Obstacle(level.width, -10, 10, level.height + 20));
  
  // Generate random obstacles based on level configuration
  const numObstacles = levelConfig.numObstacles;
  
  // For harder levels, create some larger, more complex obstacle formations
  const complexObstacleRatio = Math.min(currentLevel / 9, 0.5); // Up to 50% complex obstacles
  const numComplexObstacles = Math.floor(numObstacles * complexObstacleRatio);
  const numSimpleObstacles = numObstacles - numComplexObstacles;
  
  // Generate simple obstacles
  for (let i = 0; i < numSimpleObstacles; i++) {
    const obstacleWidth = 40 + Math.floor(p.random(80));
    const obstacleHeight = 40 + Math.floor(p.random(80));
    
    let x, y;
    let validPosition = false;
    let attempts = 0;
    
    while (!validPosition && attempts < 50) {
      x = p.random(100, level.width - 100 - obstacleWidth);
      y = p.random(100, level.height - 100 - obstacleHeight);
      
      const centerDist = p.dist(x + obstacleWidth/2, y + obstacleHeight/2, level.width/2, level.height/2);
      if (centerDist > 150) {
        validPosition = true;
      }
      attempts++;
    }
    
    if (validPosition) {
      gameState.obstacles.push(new Obstacle(x, y, obstacleWidth, obstacleHeight));
    }
  }
  
  // Generate complex obstacle formations for harder levels
  for (let i = 0; i < numComplexObstacles; i++) {
    let x, y;
    let validPosition = false;
    let attempts = 0;
    
    while (!validPosition && attempts < 50) {
      x = p.random(150, level.width - 250);
      y = p.random(150, level.height - 250);
      
      const centerDist = p.dist(x, y, level.width/2, level.height/2);
      if (centerDist > 200) {
        validPosition = true;
      }
      attempts++;
    }
    
    if (validPosition) {
      // Create L-shaped or T-shaped formations
      const formationType = p.random() < 0.5 ? "L" : "T";
      
      if (formationType === "L") {
        gameState.obstacles.push(new Obstacle(x, y, 80, 40));
        gameState.obstacles.push(new Obstacle(x, y, 40, 100));
      } else {
        gameState.obstacles.push(new Obstacle(x, y, 120, 40));
        gameState.obstacles.push(new Obstacle(x + 40, y, 40, 80));
      }
    }
  }
  
  // Generate enemies with level-appropriate types
  const numEnemies = levelConfig.numEnemies;
  
  for (let i = 0; i < numEnemies; i++) {
    let x, y;
    let validPosition = false;
    let attempts = 0;
    
    while (!validPosition && attempts < 100) {
      x = p.random(100, level.width - 100);
      y = p.random(100, level.height - 100);
      
      const centerDist = p.dist(x, y, level.width/2, level.height/2);
      if (centerDist > 250) {
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
      attempts++;
    }
    
    if (validPosition) {
      const enemyType = getEnemyType(p, currentLevel);
      gameState.enemies.push(new Enemy(x, y, enemyType));
    }
  }
  
  // Generate health pickups based on level configuration
  const numHealthPickups = levelConfig.healthPickups;
  for (let i = 0; i < numHealthPickups; i++) {
    placePickup(p, "health");
  }
  
  // Generate ammo pickups based on level configuration
  const numAmmoPickups = levelConfig.ammoPickups;
  for (let i = 0; i < numAmmoPickups; i++) {
    placePickup(p, "ammo");
  }
  
  // Generate weapon pickups - unlock weapons progressively
  const weaponTypes = ["rifle", "shotgun", "sniper"];
  let numWeaponPickups = 0;
  
  if (currentLevel >= 2) {
    // Rifle available from level 2
    placeWeaponPickup(p, "rifle");
    numWeaponPickups++;
  }
  if (currentLevel >= 4) {
    // Shotgun available from level 4
    placeWeaponPickup(p, "shotgun");
    numWeaponPickups++;
  }
  if (currentLevel >= 6) {
    // Sniper available from level 6
    placeWeaponPickup(p, "sniper");
    numWeaponPickups++;
  }
  
  // For very hard levels (7+), add duplicate weapon pickups
  if (currentLevel >= 7) {
    placeWeaponPickup(p, p.random(weaponTypes));
  }
  if (currentLevel >= 9) {
    placeWeaponPickup(p, p.random(weaponTypes));
  }
  
  // Place extraction point if mission type is extraction
  if (gameState.mission === "extraction") {
    let x, y;
    let validPosition = false;
    let attempts = 0;
    
    // For harder levels, place extraction point further away
    const minDistance = 400 + currentLevel * 50;
    
    while (!validPosition && attempts < 100) {
      x = p.random(100, level.width - 100);
      y = p.random(100, level.height - 100);
      
      const centerDist = p.dist(x, y, level.width/2, level.height/2);
      if (centerDist > minDistance) {
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
      attempts++;
    }
    
    if (validPosition) {
      gameState.extractionPoint = { x, y };
      gameState.extractionPointObj = new ExtractionPoint(x, y);
    } else {
      // Fallback if no valid position found
      gameState.extractionPoint = { x: level.width - 150, y: level.height - 150 };
      gameState.extractionPointObj = new ExtractionPoint(level.width - 150, level.height - 150);
    }
  }
}

function placePickup(p, type) {
  let x, y;
  let validPosition = false;
  let attempts = 0;
  
  while (!validPosition && attempts < 100) {
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
    attempts++;
  }
  
  if (validPosition) {
    gameState.pickups.push(new Pickup(x, y, type));
  }
}

function placeWeaponPickup(p, weaponType) {
  let x, y;
  let validPosition = false;
  let attempts = 0;
  
  while (!validPosition && attempts < 100) {
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
    attempts++;
  }
  
  if (validPosition) {
    gameState.weaponPickups.push(new WeaponPickup(x, y, weaponType));
  }
}