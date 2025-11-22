// physics.js - Physics and collision detection

import { CANVAS_WIDTH, CANVAS_HEIGHT, BUBBLE_RADIUS } from './globals.js';

export function updateBubblePhysics(bubble, p) {
  if (!bubble.isMoving) return null;

  // Wall collisions
  if (bubble.x - bubble.radius <= 0 || bubble.x + bubble.radius >= CANVAS_WIDTH) {
    bubble.vx *= -1;
    bubble.x = bubble.x - bubble.radius <= 0 ? bubble.radius : CANVAS_WIDTH - bubble.radius;
  }

  // Top boundary
  if (bubble.y - bubble.radius <= 0) {
    return 'TOP';
  }

  return null;
}

export function checkBubbleCollision(movingBubble, gridBubbles, p) {
  for (const gridBubble of gridBubbles) {
    if (!gridBubble || gridBubble.markedForRemoval) continue;
    
    const dist = p.dist(movingBubble.x, movingBubble.y, gridBubble.x, gridBubble.y);
    if (dist < BUBBLE_RADIUS * 2) {
      return gridBubble;
    }
  }
  return null;
}

export function calculateLaserPath(startX, startY, angle, maxLength, gridBubbles, p) {
  const points = [];
  let x = startX;
  let y = startY;
  const dx = Math.cos(angle) * 5;
  const dy = Math.sin(angle) * 5;
  let length = 0;
  let bounces = 0;
  const maxBounces = 2;
  
  let currentDx = dx;
  
  while (length < maxLength && bounces <= maxBounces) {
    const nextX = x + currentDx;
    const nextY = y + dy;
    
    // Check wall collision
    if (nextX <= 0 || nextX >= CANVAS_WIDTH) {
      currentDx *= -1;
      bounces++;
      points.push({ x, y, bounce: true });
      continue;
    }
    
    // Check bubble collision
    let hitBubble = false;
    for (const bubble of gridBubbles) {
      if (!bubble) continue;
      const dist = p.dist(nextX, nextY, bubble.x, bubble.y);
      if (dist < BUBBLE_RADIUS * 2) {
        hitBubble = true;
        break;
      }
    }
    
    if (hitBubble || nextY <= 0) {
      points.push({ x: nextX, y: nextY, end: true });
      break;
    }
    
    points.push({ x: nextX, y: nextY });
    x = nextX;
    y = nextY;
    length += 5;
  }
  
  return points;
}