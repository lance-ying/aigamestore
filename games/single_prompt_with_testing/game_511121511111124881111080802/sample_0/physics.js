// physics.js - Physics and collision detection utilities

import { gameState } from './globals.js';

// Update camera position
export function updateCamera() {
  // Camera follows upward movement
  gameState.cameraY -= gameState.scrollSpeed * gameState.speedMultiplier;
}

// Update all game objects
export function updateGameObjects(p) {
  // Update player/snake
  if (gameState.player) {
    gameState.player.update(p);
  }

  // Update bricks
  for (let i = gameState.bricks.length - 1; i >= 0; i--) {
    const brick = gameState.bricks[i];
    brick.update(p);
  }

  // Update collectibles
  for (let i = gameState.collectibles.length - 1; i >= 0; i--) {
    const collectible = gameState.collectibles[i];
    collectible.update(p);
  }

  // Update particles
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    const particle = gameState.particles[i];
    particle.update();
    if (particle.isDead()) {
      gameState.particles.splice(i, 1);
    }
  }
}

// Check if entity is on screen (with camera offset)
export function isOnScreen(entity, margin = 100) {
  const screenY = entity.y + gameState.cameraY;
  return screenY > -margin && screenY < CANVAS_HEIGHT + margin;
}

// Circle-circle collision detection
export function checkCircleCollision(circle1, circle2) {
  const dx = circle2.x - circle1.x;
  const dy = circle2.y - circle1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < (circle1.radius + circle2.radius);
}

// Rectangle-circle collision detection
export function checkRectCircleCollision(rect, circle) {
  // Find closest point on rectangle to circle center
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));

  // Calculate distance between circle center and closest point
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  const distanceSquared = dx * dx + dy * dy;

  return distanceSquared < (circle.radius * circle.radius);
}

// Rectangle-rectangle collision detection
export function checkRectRectCollision(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
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

// Line-circle intersection
export function lineCircleIntersection(x1, y1, x2, y2, cx, cy, radius) {
  // Calculate line direction
  const dx = x2 - x1;
  const dy = y2 - y1;

  // Calculate vector from line start to circle center
  const fx = x1 - cx;
  const fy = y1 - cy;

  // Quadratic formula coefficients
  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = (fx * fx + fy * fy) - radius * radius;

  const discriminant = b * b - 4 * a * c;

  if (discriminant < 0) {
    return false;
  }

  const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
  const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);

  return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
}

// Apply screen shake effect
export function applyScreenShake(p) {
  if (gameState.screenShake > 0) {
    const shakeX = (Math.random() - 0.5) * gameState.screenShake;
    const shakeY = (Math.random() - 0.5) * gameState.screenShake;
    p.translate(shakeX, shakeY);
    gameState.screenShake *= 0.9;
    if (gameState.screenShake < 0.1) {
      gameState.screenShake = 0;
    }
  }
}

// Calculate distance between two points
export function calculateDistance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

// Normalize a vector
export function normalizeVector(x, y) {
  const length = Math.sqrt(x * x + y * y);
  if (length === 0) return { x: 0, y: 0 };
  return { x: x / length, y: y / length };
}

// Rotate a point around origin
export function rotatePoint(x, y, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos
  };
}

// Clamp velocity
export function clampVelocity(vx, vy, maxSpeed) {
  const speed = Math.sqrt(vx * vx + vy * vy);
  if (speed > maxSpeed) {
    const ratio = maxSpeed / speed;
    return { vx: vx * ratio, vy: vy * ratio };
  }
  return { vx, vy };
}