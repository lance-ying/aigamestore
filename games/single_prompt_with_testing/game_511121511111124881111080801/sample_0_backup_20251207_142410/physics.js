/**
 * Cavern Tale - Physics Engine
 * Handles AABB collision detection, tilemap collisions, and raycasting for projectiles.
 */

import { TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';
// The p5.collide2d library is already loaded globally via a script tag in index.html
// This import is causing a 404 error and is redundant.
// import { collideRectRect } from 'https://cdn.jsdelivr.net/npm/p5.collide2d@1.0.0/+esm';

/**
 * Checks if a rectangle overlaps with any solid tile in the level.
 * @param {number} x - Top-left X
 * @param {number} y - Top-left Y
 * @param {number} w - Width
 * @param {number} h - Height
 * @returns {boolean} - True if collision detected
 */
export function checkMapCollision(x, y, w, h) {
    if (!gameState.level) return false;

    // Calculate tile range to check (optimization)
    const startCol = Math.floor(x / TILE_SIZE);
    const endCol = Math.floor((x + w) / TILE_SIZE);
    const startRow = Math.floor(y / TILE_SIZE);
    const endRow = Math.floor((y + h) / TILE_SIZE);

    for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
            const tile = gameState.level.getTile(col, row);
            if (tile && tile.solid) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Checks which specific tile type the entity is touching (e.g., SPIKE, DOOR).
 * @param {Object} entity 
 * @returns {string|null} - Type of special tile or null
 */
export function checkSpecialTileCollision(entity) {
    if (!gameState.level) return null;
    
    // Shrink hitbox slightly for environmental hazards to be forgiving
    const padding = 4;
    const x = entity.x + padding;
    const y = entity.y + padding;
    const w = entity.width - padding * 2;
    const h = entity.height - padding * 2;

    const startCol = Math.floor(x / TILE_SIZE);
    const endCol = Math.floor((x + w) / TILE_SIZE);
    const startRow = Math.floor(y / TILE_SIZE);
    const endRow = Math.floor((y + h) / TILE_SIZE);

    for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
            const tile = gameState.level.getTile(col, row);
            if (tile) {
                if (tile.type === 'SPIKE') return 'SPIKE';
                if (tile.type === 'DOOR') return 'DOOR';
            }
        }
    }
    return null;
}

/**
 * Resolves collisions for an entity against the map.
 * Moves the entity out of the wall and zeros velocity appropriately.
 * Updates entity.onGround status.
 * @param {Object} entity - The entity with x, y, width, height, vx, vy
 */
export function resolveMapCollision(entity) {
    entity.onGround = false;

    // Horizontal Collision
    // Predict next X position
    let nextX = entity.x + entity.vx;
    if (checkMapCollision(nextX, entity.y, entity.width, entity.height)) {
        // Collision detected. Move to contact.
        if (entity.vx > 0) {
            // Moving Right
            entity.x = (Math.floor((nextX + entity.width) / TILE_SIZE)) * TILE_SIZE - entity.width - 0.01;
        } else if (entity.vx < 0) {
            // Moving Left
            entity.x = (Math.floor(nextX / TILE_SIZE) + 1) * TILE_SIZE + 0.01;
        }
        entity.vx = 0;
    } else {
        entity.x = nextX;
    }

    // Vertical Collision
    // Predict next Y position
    let nextY = entity.y + entity.vy;
    if (checkMapCollision(entity.x, nextY, entity.width, entity.height)) {
        if (entity.vy > 0) {
            // Falling down (Hitting floor)
            entity.y = (Math.floor((nextY + entity.height) / TILE_SIZE)) * TILE_SIZE - entity.height - 0.01;
            entity.onGround = true;
        } else if (entity.vy < 0) {
            // Jumping up (Hitting ceiling)
            entity.y = (Math.floor(nextY / TILE_SIZE) + 1) * TILE_SIZE + 0.01;
        }
        entity.vy = 0;
    } else {
        entity.y = nextY;
    }
    
    // World Bounds Safety
    if (entity.y > gameState.level.heightPx + 100) {
        // Fell out of world
        if (entity.die) entity.die();
    }
}

/**
 * Checks collision between two entities using AABB
 * @param {Object} ent1 
 * @param {Object} ent2 
 * @returns {boolean}
 */
export function checkEntityCollision(ent1, ent2) {
    // p5.collide2d's collideRectRect is expected to be globally available
    // via the script tag in index.html.
    return window.collideRectRect(
        ent1.x, ent1.y, ent1.width, ent1.height,
        ent2.x, ent2.y, ent2.width, ent2.height
    );
}

/**
 * Simple raycast to check if line of sight is clear
 */
export function raycastMap(x1, y1, x2, y2) {
    // Bresenham's line algorithm or stepping would be ideal
    // For simplicity in JS, we step by TILE_SIZE/2
    const dist = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
    const steps = Math.ceil(dist / (TILE_SIZE / 2));
    
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const cx = x1 + (x2 - x1) * t;
        const cy = y1 + (y2 - y1) * t;
        
        const col = Math.floor(cx / TILE_SIZE);
        const row = Math.floor(cy / TILE_SIZE);
        
        const tile = gameState.level.getTile(col, row);
        if (tile && tile.solid) return true; // Hit wall
    }
    return false;
}