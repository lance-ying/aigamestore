import { gameState } from './globals.js';

export function checkCircleCollision(x1, y1, r1, x2, y2, r2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    const dist = Math.sqrt(dx*dx + dy*dy);
    return dist < (r1 + r2);
}

export function handleCollisions() {
    // Projectiles vs Bloons
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
        const proj = gameState.projectiles[i];
        if (proj.type === 'SNIPER_TRAIL') continue; // Visual only
        
        let hit = false;
        
        for (let j = gameState.bloons.length - 1; j >= 0; j--) {
            const bloon = gameState.bloons[j];
            
            // Projectile radius is roughly 2
            if (checkCircleCollision(proj.x, proj.y, 2, bloon.x, bloon.y, bloon.radius)) {
                bloon.takeDamage(proj.damage);
                hit = true;
                break; // One projectile hits one bloon (usually, unless piercing)
            }
        }
        
        if (hit) {
            proj.dead = true;
        }
    }
}

export function isValidPlacement(x, y, radius = 12) {
    // Check canvas bounds (padding)
    if (x < 20 || x > 580 || y < 20 || y > 380) return false;
    
    // Check against other towers
    for (const tower of gameState.towers) {
        if (checkCircleCollision(x, y, radius, tower.x, tower.y, 12)) return false;
    }
    
    // Check against Path
    // Simple check: distance to each path segment line
    // Or just points check if points are dense, but we used waypoints.
    // Let's implement point-to-segment distance check
    
    // Only check collision with the path itself, not the inside of loops
    // Path width approx 30px (radius 15)
    
    import { PATH_POINTS } from './globals.js';
    
    for (let i = 0; i < PATH_POINTS.length - 1; i++) {
        const p1 = PATH_POINTS[i];
        const p2 = PATH_POINTS[i+1];
        if (distToSegment(x, y, p1.x, p1.y, p2.x, p2.y) < 25) { // 25 = 15(path) + 10(tower)
            return false;
        }
    }
    
    return true;
}

// Helper for path collision
function distToSegment(x, y, x1, y1, x2, y2) {
  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const len_sq = C * C + D * D;
  let param = -1;
  if (len_sq != 0) //in case of 0 length line
      param = dot / len_sq;

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  }
  else if (param > 1) {
    xx = x2;
    yy = y2;
  }
  else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = x - xx;
  const dy = y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}