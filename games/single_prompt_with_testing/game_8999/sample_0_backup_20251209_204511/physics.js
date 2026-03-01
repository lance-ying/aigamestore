/**
 * physics.js
 * Handles collisions, AABB checks, and physics integration.
 */

import { TILE_SIZE, BLOCK, gameState } from './globals.js';
import { collideRectRect } from 'https://cdn.jsdelivr.net/npm/p5.collide2d@1.0.0/+esm';

/**
 * Axis Aligned Bounding Box
 */
export class AABB {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }
}

/**
 * Check if a specific world coordinate contains a solid block.
 */
export function isSolid(tileX, tileY) {
    if (tileX < 0 || tileX >= gameState.worldWidth || tileY < 0 || tileY >= gameState.worldHeight) {
        return true; // World bounds are solid
    }
    const block = gameState.worldTiles[tileX][tileY];
    return block !== BLOCK.AIR && block !== BLOCK.LEAVES; // Leaves are solid? Usually yes, but let's make them passable for fun or solid. Let's make them solid but breakable.
}

/**
 * Standard AABB Collision check against the tile map.
 * Returns true if the box overlaps with any solid tile.
 */
export function checkMapCollision(x, y, w, h) {
    // Determine grid cells to check
    const startX = Math.floor(x / TILE_SIZE);
    const endX = Math.floor((x + w) / TILE_SIZE);
    const startY = Math.floor(y / TILE_SIZE);
    const endY = Math.floor((y + h) / TILE_SIZE);

    for (let i = startX; i <= endX; i++) {
        for (let j = startY; j <= endY; j++) {
            // Check bounds
            if (i < 0 || i >= gameState.worldWidth || j < 0 || j >= gameState.worldHeight) {
                return true; // Out of bounds is solid collision
            }
            
            // Check block type
            const block = gameState.worldTiles[i][j];
            if (block !== BLOCK.AIR) {
                // Determine strict collision box for the tile
                const tileBox = {
                    x: i * TILE_SIZE,
                    y: j * TILE_SIZE,
                    w: TILE_SIZE,
                    h: TILE_SIZE
                };
                
                // Detailed check
                if (collideRectRect(x, y, w, h, tileBox.x, tileBox.y, tileBox.w, tileBox.h)) {
                    return true;
                }
            }
        }
    }
    return false;
}

/**
 * Resolves collision for an entity.
 * Checks horizontal and vertical separately to allow sliding.
 */
export function resolveMapCollision(entity) {
    // Horizontal
    if (checkMapCollision(entity.x + entity.vx, entity.y, entity.width, entity.height)) {
        // Move to contact
        const sign = Math.sign(entity.vx);
        while (!checkMapCollision(entity.x + sign, entity.y, entity.width, entity.height)) {
            entity.x += sign;
        }
        entity.vx = 0;
    } else {
        entity.x += entity.vx;
    }

    // Vertical
    if (checkMapCollision(entity.x, entity.y + entity.vy, entity.width, entity.height)) {
        // Move to contact
        const sign = Math.sign(entity.vy);
        while (!checkMapCollision(entity.x, entity.y + sign, entity.width, entity.height)) {
            entity.y += sign;
        }
        
        // Ground detection
        if (entity.vy > 0) {
            entity.onGround = true;
        }
        
        entity.vy = 0;
    } else {
        entity.y += entity.vy;
        entity.onGround = false;
    }
}