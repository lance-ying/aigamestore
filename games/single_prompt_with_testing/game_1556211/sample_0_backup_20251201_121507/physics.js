import { gameState, TILE_SIZE } from './globals.js';

// Simple circle-circle collision
export function checkCircleCollision(c1, c2) {
    const dx = c1.x - c2.x;
    const dy = c1.y - c2.y;
    const distSq = dx*dx + dy*dy;
    const radSum = c1.radius + c2.radius;
    return distSq < radSum * radSum;
}

// Check if a point is on any valid active tile
export function isOnGround(x, y) {
    // Convert world position to approximate grid key
    // Our grid is built on TILE_SIZE coordinates
    const gridX = Math.round(x / TILE_SIZE);
    const gridY = Math.round(y / TILE_SIZE);
    
    // Check nearest neighbors because floats might put us between keys
    for(let i = -1; i <= 1; i++) {
        for(let j = -1; j <= 1; j++) {
            const key = `${gridX+i},${gridY+j}`;
            if (gameState.tiles.has(key)) {
                const tile = gameState.tiles.get(key);
                if (tile.isActive && tile.containsPoint(x, y)) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Basic movement physics update
export function updatePhysicsEntity(entity) {
    // Apply velocity
    entity.x += entity.vx;
    entity.y += entity.vy;
    
    // Apply friction
    entity.vx *= entity.friction;
    entity.vy *= entity.friction;
    
    // Stop if very slow
    if (Math.abs(entity.vx) < 0.01) entity.vx = 0;
    if (Math.abs(entity.vy) < 0.01) entity.vy = 0;
}

// Resolve collisions between soft bodies (entities pushing each other)
export function resolveSoftCollision(e1, e2, pushFactor = 0.5) {
    const dx = e1.x - e2.x;
    const dy = e1.y - e2.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const minDist = e1.radius + e2.radius;
    
    if (dist < minDist && dist > 0) {
        const overlap = minDist - dist;
        const pushX = (dx / dist) * overlap * pushFactor;
        const pushY = (dy / dist) * overlap * pushFactor;
        
        e1.x += pushX;
        e1.y += pushY;
        e2.x -= pushX;
        e2.y -= pushY;
    }
}