/**
 * physics.js
 * Contains collision detection and resolution functions.
 */

import { TILE_SIZE, gameState } from './globals.js';

// AABB Collision Detection
export function checkAABB(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

// Get tiles around an entity for collision checking
// Optimized to only check nearby grid cells
export function getNearbyTiles(entity) {
    const nearby = [];
    
    // Convert entity bounds to grid coordinates
    const startCol = Math.floor(entity.x / TILE_SIZE) - 1;
    const endCol = Math.floor((entity.x + entity.width) / TILE_SIZE) + 1;
    const startRow = Math.floor(entity.y / TILE_SIZE) - 1;
    const endRow = Math.floor((entity.y + entity.height) / TILE_SIZE) + 1;

    // Iterate bounds
    for (let c = startCol; c <= endCol; c++) {
        for (let r = startRow; r <= endRow; r++) {
            const tileKey = `${c},${r}`;
            if (gameState.tiles[tileKey]) {
                nearby.push(gameState.tiles[tileKey]);
            }
        }
    }
    return nearby;
}

// Check collisions with world geometry
// Returns object with hit flags and adjusted position
export function resolveWorldCollisions(entity) {
    const nearby = getNearbyTiles(entity);
    const result = {
        onGround: false,
        hitCeiling: false,
        hitLeft: false,
        hitRight: false,
        wallObject: null // Reference to the wall we are touching (for wall jumps)
    };

    // Y Axis Collision (Vertical)
    // Predict next Y position
    let nextY = entity.y + entity.vy;
    let playerRectY = { x: entity.x, y: nextY, width: entity.width, height: entity.height };

    for (const tile of nearby) {
        if (!tile.solid) continue;
        if (checkAABB(playerRectY, tile)) {
            // Falling down
            if (entity.vy > 0) {
                // Land on top
                entity.y = tile.y - entity.height;
                entity.vy = 0;
                result.onGround = true;
            } 
            // Jumping up
            else if (entity.vy < 0) {
                // Hit head
                entity.y = tile.y + tile.height;
                entity.vy = 0;
                result.hitCeiling = true;
            }
            // Update prediction for subsequent checks
            playerRectY.y = entity.y;
        }
    }
    
    // If no collision, apply the movement
    if (!result.onGround && !result.hitCeiling) {
        entity.y = nextY;
    }

    // X Axis Collision (Horizontal)
    // Predict next X position
    let nextX = entity.x + entity.vx;
    let playerRectX = { x: nextX, y: entity.y, width: entity.width, height: entity.height };
    // Slightly shrink height for X checks to avoid snagging on ground seams
    playerRectX.y += 2;
    playerRectX.height -= 4;

    for (const tile of nearby) {
        if (!tile.solid) continue;
        if (checkAABB(playerRectX, tile)) {
            // Moving Right
            if (entity.vx > 0) {
                entity.x = tile.x - entity.width;
                entity.vx = 0;
                result.hitRight = true;
                result.wallObject = tile;
            }
            // Moving Left
            else if (entity.vx < 0) {
                entity.x = tile.x + tile.width;
                entity.vx = 0;
                result.hitLeft = true;
                result.wallObject = tile;
            }
        }
    }

    // If no collision, apply movement
    if (!result.hitRight && !result.hitLeft) {
        entity.x = nextX;
    }

    return result;
}

export function checkEntityCollisions(player, entities) {
    const hits = [];
    for (const ent of entities) {
        if (!ent.active) continue;
        if (checkAABB(player, ent)) {
            hits.push(ent);
        }
    }
    return hits;
}