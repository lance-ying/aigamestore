// physics.js - Physics and collision detection

import { gameState, PHYSICS } from './globals.js';

// Check circle-circle collision
export function checkCircleCollision(obj1, obj2) {
  const dx = obj2.x - obj1.x;
  const dy = obj2.y - obj1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const minDist = obj1.radius + obj2.radius;
  return distance < minDist;
}

// Resolve collision between two circular objects
export function resolveCollision(obj1, obj2) {
  const dx = obj2.x - obj1.x;
  const dy = obj2.y - obj1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance === 0) return; // Avoid division by zero
  
  const minDist = obj1.radius + obj2.radius;
  
  if (distance < minDist) {
    // Separate objects
    const overlap = minDist - distance;
    const nx = dx / distance;
    const ny = dy / distance;
    
    const totalMass = obj1.mass + obj2.mass;
    const move1 = overlap * (obj2.mass / totalMass);
    const move2 = overlap * (obj1.mass / totalMass);
    
    obj1.x -= nx * move1;
    obj1.y -= ny * move1;
    obj2.x += nx * move2;
    obj2.y += ny * move2;
    
    // Calculate relative velocity
    const dvx = obj2.vx - obj1.vx;
    const dvy = obj2.vy - obj1.vy;
    const velocityAlongNormal = dvx * nx + dvy * ny;
    
    // Don't resolve if velocities are separating
    if (velocityAlongNormal > 0) return;
    
    // Calculate impulse
    const restitution = 0.3;
    const impulse = -(1 + restitution) * velocityAlongNormal / totalMass;
    
    // Apply impulse
    obj1.vx -= impulse * obj2.mass * nx;
    obj1.vy -= impulse * obj2.mass * ny;
    obj2.vx += impulse * obj1.mass * nx;
    obj2.vy += impulse * obj1.mass * ny;
  }
}

// Check if climber is on top of another climber
export function checkClimberSupport(climber, other) {
  if (climber === other) return false;
  
  const climberBottom = climber.y + climber.height / 2;
  const otherTop = other.y - other.height / 2;
  
  // Check vertical alignment
  if (Math.abs(climberBottom - otherTop) < 15) {
    // Check horizontal overlap
    const horizontalDist = Math.abs(climber.x - other.x);
    if (horizontalDist < (climber.width / 2 + other.width / 2)) {
      return true;
    }
  }
  
  return false;
}

// Update tower physics and stability
export function updateTowerPhysics() {
  // Calculate tower sway based on height and instability
  const towerHeight = gameState.climbers.length;
  const swayForce = Math.sin(gameState.frameCount * 0.02) * CONFIG.TOWER_SWAY_FACTOR * towerHeight;
  
  gameState.swayVelocity += swayForce;
  gameState.swayVelocity *= 0.95; // Damping
  gameState.towerSway = gameState.swayVelocity;
  
  // Update climber support relationships
  for (let i = 0; i < gameState.climbers.length; i++) {
    const climber = gameState.climbers[i];
    climber.bottomSupport = null;
    
    // Check ground
    if (climber.y + climber.height / 2 >= PHYSICS.GROUND_Y - 5) {
      climber.bottomSupport = { y: PHYSICS.GROUND_Y, height: 0 };
      continue;
    }
    
    // Check other climbers
    for (let j = 0; j < gameState.climbers.length; j++) {
      if (i === j) continue;
      const other = gameState.climbers[j];
      
      if (checkClimberSupport(climber, other)) {
        climber.bottomSupport = other;
        break;
      }
    }
    
    // Check goat
    if (gameState.goat && checkClimberSupport(climber, gameState.goat)) {
      climber.bottomSupport = gameState.goat;
    }
  }
}

// Check collisions between climbers
export function checkClimberCollisions() {
  for (let i = 0; i < gameState.climbers.length; i++) {
    for (let j = i + 1; j < gameState.climbers.length; j++) {
      const climber1 = gameState.climbers[i];
      const climber2 = gameState.climbers[j];
      
      // Simple circular collision for body
      if (checkCircleCollision(
        { x: climber1.x, y: climber1.y, radius: climber1.width / 2 },
        { x: climber2.x, y: climber2.y, radius: climber2.width / 2 }
      )) {
        resolveCollision(climber1, climber2);
      }
    }
  }
}

// Get highest point in the tower
export function getHighestPoint() {
  let highest = PHYSICS.GROUND_Y;
  
  for (const climber of gameState.climbers) {
    const top = climber.getTopY();
    if (top < highest) {
      highest = top;
    }
  }
  
  if (gameState.goat) {
    const goatTop = gameState.goat.getTopY();
    if (goatTop < highest) {
      highest = goatTop;
    }
  }
  
  return highest;
}

// Check if player reached target height
export function checkWinCondition() {
  if (!gameState.player) return false;
  
  const playerTop = gameState.player.getTopY();
  const targetY = gameState.targetHeight - CONFIG.WIN_HEIGHT_THRESHOLD;
  
  return playerTop <= targetY;
}