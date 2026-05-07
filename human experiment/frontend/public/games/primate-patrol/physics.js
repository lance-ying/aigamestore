import { gameState, PATH_WIDTH } from './globals.js';

// --- Local Collision Functions (Replacing external dependency) ---

function collideCircleCircle(x1, y1, d1, x2, y2, d2) {
    const r1 = d1 / 2;
    const r2 = d2 / 2;
    const dx = x1 - x2;
    const dy = y1 - y2;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist <= (r1 + r2);
}

function collideLineCircle(x1, y1, x2, y2, cx, cy, d) {
    const r = d / 2;
    
    // Check if ends are inside
    const dx1 = cx - x1;
    const dy1 = cy - y1;
    if (Math.sqrt(dx1*dx1 + dy1*dy1) <= r) return true;
    
    const dx2 = cx - x2;
    const dy2 = cy - y2;
    if (Math.sqrt(dx2*dx2 + dy2*dy2) <= r) return true;
    
    // Length of line squared
    const lenSq = (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
    if (lenSq === 0) return false; // Line is a point, already checked above
    
    // Dot product to find projection scalar t
    const t = ((cx - x1) * (x2 - x1) + (cy - y1) * (y2 - y1)) / lenSq;
    
    // Check if projection falls on segment (0 <= t <= 1)
    if (t < 0 || t > 1) return false; // Closest point is beyond ends, checked above
    
    // Coordinates of closest point on line
    const closestX = x1 + t * (x2 - x1);
    const closestY = y1 + t * (y2 - y1);
    
    // Distance from closest point to center
    const dx = cx - closestX;
    const dy = cy - closestY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    return dist <= r;
}

// ---------------------------------------------------------------

// Check if a point is on the path (to prevent tower placement)
export function isPointOnPath(x, y, radius) {
    const path = gameState.levelPath;
    if (!path || path.length < 2) return false;

    for (let i = 0; i < path.length - 1; i++) {
        const p1 = path[i];
        const p2 = path[i + 1];
        
        // Check collision between a circle (tower footprint) and a line segment (path segment)
        // We add path width/2 to tower radius for safety margin
        const hit = collideLineCircle(
            p1.x, p1.y, p2.x, p2.y,
            x, y, (PATH_WIDTH) + (radius * 2)
        );
        
        if (hit) return true;
    }
    return false;
}

export function checkCollisions() {
    // Projectiles vs Enemies
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
        const proj = gameState.projectiles[i];
        let hit = false;
        
        for (let j = gameState.enemies.length - 1; j >= 0; j--) {
            const enemy = gameState.enemies[j];
            
            // Basic circle collision
            if (collideCircleCircle(proj.x, proj.y, proj.radius * 2, enemy.x, enemy.y, enemy.radius * 2)) {
                enemy.takeDamage(proj.damage);
                hit = true;
                break; // One projectile hits one enemy (unless we add piercing later)
            }
        }
        
        if (hit) {
            proj.destroy();
        }
    }
}

export function getEnemyInRange(tower) {
    // Find first enemy (furthest along path) within range
    let bestEnemy = null;
    let maxDistance = -1;
    
    for (const enemy of gameState.enemies) {
        const dx = enemy.x - tower.x;
        const dy = enemy.y - tower.y;
        const distToTower = Math.sqrt(dx * dx + dy * dy);
        
        if (distToTower <= tower.range) {
            if (enemy.distanceTraveled > maxDistance) {
                maxDistance = enemy.distanceTraveled;
                bestEnemy = enemy;
            }
        }
    }
    return bestEnemy;
}

export function isOverlappingTower(x, y, radius) {
    for (const tower of gameState.towers) {
        const dx = tower.x - x;
        const dy = tower.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < tower.radius + radius) {
            return true;
        }
    }
    return false;
}