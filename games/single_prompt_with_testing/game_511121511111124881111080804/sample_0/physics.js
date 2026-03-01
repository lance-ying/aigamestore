// physics.js - Physics calculations and collision detection

import { gameState, CANVAS_HEIGHT, clamp, distance } from './globals.js';

// Apply physics to an entity
export function applyPhysics(entity) {
  if (!entity) return;
  
  // Apply gravity if not grappling
  if (!entity.isGrappling) {
    entity.vy += gameState.gravity;
  }
  
  // Apply friction when on ground
  if (entity.onGround) {
    entity.vx *= gameState.friction;
  } else {
    // Air resistance
    entity.vx *= gameState.airResistance;
    entity.vy *= gameState.airResistance;
  }
  
  // Clamp velocities
  entity.vx = clamp(entity.vx, -20, 20);
  entity.vy = clamp(entity.vy, -20, 20);
  
  // Update position
  entity.x += entity.vx;
  entity.y += entity.vy;
}

// Check collision between circle and rectangle
export function checkCircleRectCollision(circle, rect) {
  // Find the closest point on the rectangle to the circle center
  const closestX = clamp(circle.x, rect.x, rect.x + rect.width);
  const closestY = clamp(circle.y, rect.y, rect.y + rect.height);
  
  // Calculate distance between circle center and closest point
  const distanceX = circle.x - closestX;
  const distanceY = circle.y - closestY;
  const distanceSquared = distanceX * distanceX + distanceY * distanceY;
  
  return distanceSquared < (circle.radius * circle.radius);
}

// Resolve collision between circle and rectangle
export function resolveCircleRectCollision(circle, rect, bounce = 0.3) {
  // Find the closest point on the rectangle to the circle center
  const closestX = clamp(circle.x, rect.x, rect.x + rect.width);
  const closestY = clamp(circle.y, rect.y, rect.y + rect.height);
  
  // Calculate penetration
  const distanceX = circle.x - closestX;
  const distanceY = circle.y - closestY;
  const distanceSquared = distanceX * distanceX + distanceY * distanceY;
  
  if (distanceSquared >= circle.radius * circle.radius) {
    return false; // No collision
  }
  
  const distanceValue = Math.sqrt(distanceSquared);
  
  if (distanceValue === 0) {
    // Circle center is inside rect, push up
    circle.y = rect.y - circle.radius;
    circle.vy = 0;
    circle.onGround = true;
    return true;
  }
  
  // Calculate normal
  const normalX = distanceX / distanceValue;
  const normalY = distanceY / distanceValue;
  
  // Calculate penetration depth
  const penetration = circle.radius - distanceValue;
  
  // Push circle out of rect
  circle.x += normalX * penetration;
  circle.y += normalY * penetration;
  
  // Determine collision side
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;
  
  const dx = circle.x - centerX;
  const dy = circle.y - centerY;
  
  // Check if collision is primarily vertical or horizontal
  if (Math.abs(dy) > Math.abs(dx)) {
    // Vertical collision (top or bottom)
    if (dy < 0) {
      // Collision from top
      circle.vy = -Math.abs(circle.vy) * bounce;
    } else {
      // Collision from bottom
      circle.y = rect.y + rect.height + circle.radius;
      circle.vy = Math.abs(circle.vy) * bounce;
    }
    
    // Set onGround if landing on top
    if (circle.y < rect.y) {
      circle.onGround = true;
      circle.vy = 0;
    }
  } else {
    // Horizontal collision (left or right)
    circle.vx = -circle.vx * bounce;
  }
  
  return true;
}

// Check if circle is on top of platform
export function checkOnPlatform(circle, rect) {
  // Check if circle is within horizontal bounds of platform
  if (circle.x < rect.x - circle.radius || circle.x > rect.x + rect.width + circle.radius) {
    return false;
  }
  
  // Check if circle is just above platform
  const distanceToTop = (rect.y - circle.radius) - circle.y;
  return distanceToTop > -5 && distanceToTop < 5 && circle.vy >= 0;
}

// Check collision between two circles
export function checkCircleCircleCollision(circle1, circle2) {
  const dist = distance(circle1.x, circle1.y, circle2.x, circle2.y);
  return dist < circle1.radius + circle2.radius;
}

// Grapple physics - calculate swing force
export function calculateGrappleForce(entity, anchorX, anchorY) {
  if (!entity) return { fx: 0, fy: 0 };
  
  // Calculate distance and angle to anchor
  const dx = anchorX - entity.x;
  const dy = anchorY - entity.y;
  const currentLength = Math.sqrt(dx * dx + dy * dy);
  
  // Calculate tension force (pulls toward anchor)
  const tension = (currentLength - gameState.grappleLength) * 0.5;
  
  const angle = Math.atan2(dy, dx);
  const tensionX = Math.cos(angle) * tension;
  const tensionY = Math.sin(angle) * tension;
  
  // Add perpendicular swing force based on velocity
  const velMag = Math.sqrt(entity.vx * entity.vx + entity.vy * entity.vy);
  const perpAngle = angle + Math.PI / 2;
  
  // Calculate component of velocity perpendicular to rope
  const perpVelX = Math.cos(perpAngle);
  const perpVelY = Math.sin(perpAngle);
  const perpComponent = entity.vx * perpVelX + entity.vy * perpVelY;
  
  // Apply centripetal force
  const centripetalForce = (velMag * velMag) / currentLength * 0.3;
  const centripetalX = Math.cos(angle) * centripetalForce;
  const centripetalY = Math.sin(angle) * centripetalForce;
  
  return {
    fx: tensionX + centripetalX,
    fy: tensionY + centripetalY
  };
}

// Check if entity is off screen (lose condition)
export function isOffScreen(entity) {
  if (!entity) return false;
  
  // Check if fallen below screen
  return entity.y > CANVAS_HEIGHT + 100;
}

// Simple AABB collision check
export function checkAABB(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

// Point in rectangle check
export function pointInRect(px, py, rect) {
  return (
    px >= rect.x &&
    px <= rect.x + rect.width &&
    py >= rect.y &&
    py <= rect.y + rect.height
  );
}

// Calculate bounce velocity
export function calculateBounce(velocity, normal, restitution = 0.5) {
  // Reflect velocity around normal
  const dot = velocity.vx * normal.x + velocity.vy * normal.y;
  return {
    vx: velocity.vx - 2 * dot * normal.x * restitution,
    vy: velocity.vy - 2 * dot * normal.y * restitution
  };
}