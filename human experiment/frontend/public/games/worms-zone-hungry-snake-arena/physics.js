// physics.js - Collision detection and physics

import { SEGMENT_SIZE, FOOD_SIZE } from './globals.js';

export function checkWormCollision(p, worm1, worm2) {
  if (!worm1.alive || !worm2.alive) return false;
  
  const head1 = worm1.getHead();
  
  // Check head collision with body segments (skip first 3 segments to allow turning)
  for (let i = 5; i < worm2.segments.length; i++) {
    const seg = worm2.segments[i];
    if (p.collideCircleCircle(head1.x, head1.y, SEGMENT_SIZE * 2, 
                               seg.x, seg.y, SEGMENT_SIZE * 2)) {
      return true;
    }
  }
  
  return false;
}

export function checkFoodCollision(p, worm, food) {
  if (food.collected) return false;
  
  const head = worm.getHead();
  const collectRange = SEGMENT_SIZE * 2;
  
  return p.collideCircleCircle(head.x, head.y, collectRange, 
                                food.x, food.y, FOOD_SIZE);
}

export function checkPowerUpCollision(p, worm, powerup) {
  if (powerup.collected) return false;
  
  const head = worm.getHead();
  const collectRange = SEGMENT_SIZE * 2;
  
  return p.collideCircleCircle(head.x, head.y, collectRange, 
                                powerup.x, powerup.y, powerup.size);
}

export function checkEncirclement(worm, targetWorm) {
  if (!worm.alive || !targetWorm.alive) return false;
  if (worm.segments.length < 20) return false;
  
  const targetHead = targetWorm.getHead();
  
  // Simple polygon point-in-polygon test using ray casting
  // Use a subset of worm segments as polygon vertices
  const polygon = [];
  const step = Math.max(1, Math.floor(worm.segments.length / 15));
  
  for (let i = 0; i < worm.segments.length; i += step) {
    polygon.push(worm.segments[i]);
  }
  
  if (polygon.length < 4) return false;
  
  // Ray casting algorithm
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    
    const intersect = ((yi > targetHead.y) !== (yj > targetHead.y))
        && (targetHead.x < (xj - xi) * (targetHead.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  // Check if head and tail are close (loop is closed)
  const head = worm.getHead();
  const tail = worm.segments[worm.segments.length - 1];
  const loopClosed = Math.hypot(head.x - tail.x, head.y - tail.y) < SEGMENT_SIZE * 5;
  
  return inside && loopClosed;
}

export function applyMagnetEffect(p, worm, food) {
  if (!worm.magnetActive) return;
  
  const head = worm.getHead();
  const dx = head.x - food.x;
  const dy = head.y - food.y;
  const dist = Math.hypot(dx, dy);
  
  if (dist < 100 && dist > 5) {
    const pullStrength = 0.5;
    food.x += (dx / dist) * pullStrength;
    food.y += (dy / dist) * pullStrength;
  }
}