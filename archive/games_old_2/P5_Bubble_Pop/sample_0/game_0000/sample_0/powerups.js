// powerups.js - Power-up system

import { BUBBLE_RADIUS, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function activateBomb(bubble, grid, activeBubbles) {
  if (!bubble) return 0;
  
  const explosionRadius = BUBBLE_RADIUS * 4;
  let popped = 0;
  
  for (const other of activeBubbles) {
    if (other.active && !other.markedForPop) {
      const dx = other.x - bubble.x;
      const dy = other.y - bubble.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < explosionRadius) {
        other.markedForPop = true;
        if (grid[other.gridRow] && grid[other.gridRow][other.gridCol]) {
          grid[other.gridRow][other.gridCol] = null;
        }
        popped++;
      }
    }
  }
  
  return popped;
}

export function activateBeamShot(launcher, grid, activeBubbles) {
  const angle = launcher.angle;
  const x = launcher.x;
  const y = launcher.y;
  const vx = Math.cos(angle);
  const vy = Math.sin(angle);
  
  let popped = 0;
  
  // Raycast and destroy all bubbles in path
  for (let dist = 0; dist < 1000; dist += 5) {
    const checkX = x + vx * dist;
    const checkY = y + vy * dist;
    
    if (checkY < 0 || checkX < 0 || checkX > CANVAS_WIDTH) break;
    
    for (const bubble of activeBubbles) {
      if (bubble.active && !bubble.markedForPop) {
        const dx = bubble.x - checkX;
        const dy = bubble.y - checkY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < BUBBLE_RADIUS * 2) {
          bubble.markedForPop = true;
          if (grid[bubble.gridRow] && grid[bubble.gridRow][bubble.gridCol]) {
            grid[bubble.gridRow][bubble.gridCol] = null;
          }
          popped++;
        }
      }
    }
  }
  
  return popped;
}

export function renderBombEffect(x, y, progress, p) {
  p.push();
  p.noFill();
  p.stroke(255, 150, 0, 255 * (1 - progress));
  p.strokeWeight(3);
  const radius = BUBBLE_RADIUS * 4 * progress;
  p.ellipse(x, y, radius * 2);
  
  // Explosion particles
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const dist = radius * 0.7;
    p.fill(255, 100, 0, 255 * (1 - progress));
    p.noStroke();
    p.ellipse(
      x + Math.cos(angle) * dist,
      y + Math.sin(angle) * dist,
      10 * (1 - progress)
    );
  }
  p.pop();
}

export function renderBeamEffect(launcher, progress, p) {
  const angle = launcher.angle;
  const x = launcher.x;
  const y = launcher.y;
  const length = 1000 * progress;
  
  p.push();
  p.stroke(0, 255, 255, 255 * (1 - progress));
  p.strokeWeight(5);
  p.line(
    x,
    y,
    x + Math.cos(angle) * length,
    y + Math.sin(angle) * length
  );
  
  // Glow effect
  p.stroke(150, 255, 255, 150 * (1 - progress));
  p.strokeWeight(10);
  p.line(
    x,
    y,
    x + Math.cos(angle) * length,
    y + Math.sin(angle) * length
  );
  p.pop();
}