// physics.js - Physics and collision detection

import { gameState } from './globals.js';

export function checkCircleCollision(entity1, entity2) {
  const dx = entity2.x - entity1.x;
  const dy = entity2.y - entity1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const minDistance = (entity1.radius || entity1.size / 2) + (entity2.radius || entity2.size / 2);
  
  return distance < minDistance;
}

export function checkRectCollision(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

export function checkPointInCircle(px, py, cx, cy, radius) {
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy < radius * radius;
}

export function resolveCircleCollision(entity1, entity2) {
  const dx = entity2.x - entity1.x;
  const dy = entity2.y - entity1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance === 0) return;
  
  const normalX = dx / distance;
  const normalY = dy / distance;
  
  const radius1 = entity1.radius || entity1.size / 2;
  const radius2 = entity2.radius || entity2.size / 2;
  const overlap = (radius1 + radius2) - distance;
  
  const separationX = normalX * overlap * 0.5;
  const separationY = normalY * overlap * 0.5;
  
  entity1.x -= separationX;
  entity1.y -= separationY;
  entity2.x += separationX;
  entity2.y += separationY;
  
  // Elastic collision response
  const relativeVx = entity2.vx - entity1.vx;
  const relativeVy = entity2.vy - entity1.vy;
  
  const velocityAlongNormal = relativeVx * normalX + relativeVy * normalY;
  
  if (velocityAlongNormal > 0) return;
  
  const restitution = 0.5;
  const impulse = -(1 + restitution) * velocityAlongNormal;
  const mass1 = entity1.mass || 1;
  const mass2 = entity2.mass || 1;
  const impulseScalar = impulse / (mass1 + mass2);
  
  entity1.vx -= impulseScalar * normalX * mass2;
  entity1.vy -= impulseScalar * normalY * mass2;
  entity2.vx += impulseScalar * normalX * mass1;
  entity2.vy += impulseScalar * normalY * mass1;
}

export function keepInBounds(entity, margin = 0) {
  const radius = entity.radius || entity.size / 2;
  
  if (entity.x - radius < margin) {
    entity.x = margin + radius;
    if (entity.vx < 0) entity.vx *= -0.5;
  }
  if (entity.x + radius > gameState.worldWidth - margin) {
    entity.x = gameState.worldWidth - margin - radius;
    if (entity.vx > 0) entity.vx *= -0.5;
  }
  if (entity.y - radius < margin) {
    entity.y = margin + radius;
    if (entity.vy < 0) entity.vy *= -0.5;
  }
  if (entity.y + radius > gameState.worldHeight - margin) {
    entity.y = gameState.worldHeight - margin - radius;
    if (entity.vy > 0) entity.vy *= -0.5;
  }
}

export function wrapAround(entity) {
  const radius = entity.radius || entity.size / 2;
  
  if (entity.x + radius < 0) entity.x = gameState.worldWidth + radius;
  if (entity.x - radius > gameState.worldWidth) entity.x = -radius;
  if (entity.y + radius < 0) entity.y = gameState.worldHeight + radius;
  if (entity.y - radius > gameState.worldHeight) entity.y = -radius;
}

export function isOutOfBounds(entity, margin = 50) {
  return (
    entity.x < -margin ||
    entity.x > gameState.worldWidth + margin ||
    entity.y < -margin ||
    entity.y > gameState.worldHeight + margin
  );
}