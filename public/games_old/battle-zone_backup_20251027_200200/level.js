import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';
import { Obstacle, Pickup, Enemy, ExtractionPoint } from './entities.js';

// Helper function for collision detection
function checkCollisionWithRect(circleX, circleY, circleRadius, rectX, rectY, rectWidth, rectHeight) {
  // Find the closest point on the rectangle to the circle
  const closestX = Math.max(rectX, Math.min(circleX, rectX + rectWidth));
  const closestY = Math.max(rectY, Math.min(circleY, rectY + rectHeight));
  
  // Calculate the distance from the circle to this closest point
  const distanceX = circleX - closestX;
  const distanceY = circleY - closestY;
  
  // If the distance is less than the circle's radius, an intersection occurs
  return (distanceX * distanceX + distanceY * distanceY) < (circleRadius * circleRadius);
}

// Generate level with obstacles, enemies, and pickups
export function generateLevel(p) {
  const { level } = gameState;
  
  // Clear previous level elements
  gameState.obstacles = [];
  gameState.enemies = [];
  gameState.pickups = [];
  
  // Create outer walls
  gameState.obstacles.push(new Obstacle(-10, -10, level.width + 20, 10)); // Top
  gameState.obstacles.push(new Obstacle(-10, level.height, level.width + 20, 10)); // Bottom
  gameState.obstacles.push(new Obstacle(-10, -10, 10, level.height + 20)); // Left
  gameState.obstacles.push(new Obstacle(level.width, -10, 10, level.height + 20)); // Right
  
  // Generate random obstacles
  const numObstacles = 20;
  for (let i = 0; i < numObstacles; i++) {
    const obstacleWidth = 40 + Math.floor(p.random(80));
    const obstacleHeight = 40 + Math.floor(p.random(80));
    
    let x, y;
    let validPosition = false;
    
    // Try to find a valid position that doesn't overlap with player spawn
    while (!validPosition) {
      x = p.random(100, level.width - 100 - obstacleWidth);
      y = p.random(100, level.height - 100 - obstacleHeight);
      
      // Check distance from center (player spawn)
      const centerDist = p.dist(x + obstacleWidth/2, y + obstacleHeight/2, level.width/2, level.height/2);
      if (centerDist > 150) {
        validPosition = true;
      }
    }
    
    gameState.obstacles.push(new Obstacle(x, y, obstacleWidth, obstacleHeight));
  }
  
  // Generate enemies
  const numEnemies = gameState.requiredKills + 5; // More enemies than required kills
  for (let i = 0; i < numEnemies; i++) {
    let x, y;
    let validPosition = false;
    
    while (!validPosition) {
      x = p.random(100, level.width - 100);
      y = p.random(100, level.height - 100);
      
      // Check distance from center (player spawn)
      const centerDist = p.dist(x, y, level.width/2, level.height/2);
      if (centerDist > 300) {
        // Check collision with obstacles
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
    
    // 20% chance for elite enemy
    const enemyType = p.random() < 0.2 ? "elite" : "regular";
    gameState.enemies.push(new Enemy(x, y, enemyType));
  }
  
  // Generate health pickups
  const numHealthPickups = 8;
  for (let i = 0; i < numHealthPickups; i++) {
    placePickup(p, "health");
  }
  
  // Generate ammo pickups
  const numAmmoPickups = 12;
  for (let i = 0; i < numAmmoPickups; i++) {
    placePickup(p, "ammo");
  }
  
  // Place extraction point if mission type is extraction
  if (gameState.mission === "extraction") {
    let x, y;
    let validPosition = false;
    
    while (!validPosition) {
      x = p.random(100, level.width - 100);
      y = p.random(100, level.height - 100);
      
      // Check distance from center (player spawn)
      const centerDist = p.dist(x, y, level.width/2, level.height/2);
      if (centerDist > 500) { // Far from player spawn
        // Check collision with obstacles
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
    
    // Check collision with obstacles
    let collides = false;
    for (const obstacle of gameState.obstacles) {
      if (checkCollisionWithRect(x, y, 10, obstacle.x, obstacle.y, obstacle.width, obstacle.height)) {
        collides = true;
        break;
      }
    }
    
    // Check distance from other pickups
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