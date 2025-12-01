import { collideCircleCircle, collidePointCircle, collideLineCircle } from 'https://cdn.jsdelivr.net/npm/p5.collide2d@1.0.0/+esm';
import { gameState, PATH_WIDTH, LEVEL_PATH } from './globals.js';

// Check if a point is on the path (to prevent tower placement)
export function isPointOnPath(x, y, radius) {
    for (let i = 0; i < LEVEL_PATH.length - 1; i++) {
        const p1 = LEVEL_PATH[i];
        const p2 = LEVEL_PATH[i + 1];
        
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
    // Enemies are naturally ordered by spawn time usually, but distance along path is best metric
    
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