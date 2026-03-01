// physics.js - Collision detection and physics simulation
import { gameState, TILE_SIZE, CANVAS_HEIGHT, CANVAS_WIDTH, GRAVITY, TERMINAL_VELOCITY } from './globals.js';

/**
 * Axis-Aligned Bounding Box (AABB) collision check
 */
export function checkAABB(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

/**
 * Resolves collision between a dynamic entity and static map tiles.
 * Updates entity position and velocity directly.
 */
export function resolveMapCollision(entity) {
    // Determine the grid cells the entity overlaps
    // We expand the check range slightly to ensure we catch all neighbors
    const startCol = Math.floor(entity.x / TILE_SIZE) - 1;
    const endCol = Math.floor((entity.x + entity.width) / TILE_SIZE) + 1;
    const startRow = Math.floor(entity.y / TILE_SIZE) - 1;
    const endRow = Math.floor((entity.y + entity.height) / TILE_SIZE) + 1;

    entity.onGround = false;
    entity.ceilingHit = false;
    entity.wallHit = false;

    // Check vertical collisions first
    // Apply Y movement
    let testY = entity.y; // Current Y (already updated by velocity in entity.update)
    
    // We need to check against blocks in the range
    for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
            const tile = getTileAt(col, row);
            if (tile && tile.solid) {
                // Create a temp rect for the tile
                const tileRect = {
                    x: col * TILE_SIZE,
                    y: row * TILE_SIZE,
                    width: TILE_SIZE,
                    height: TILE_SIZE
                };

                // Check intersection
                if (checkAABB(entity, tileRect)) {
                    // Collision detected. Determine direction based on previous position or velocity.
                    // Since we're doing simple separation:
                    
                    // Falling down?
                    if (entity.vy > 0 && entity.y + entity.height - entity.vy <= tileRect.y) {
                        entity.y = tileRect.y - entity.height;
                        entity.vy = 0;
                        entity.onGround = true;
                    }
                    // Jumping up?
                    else if (entity.vy < 0 && entity.y - entity.vy >= tileRect.y + tileRect.height) {
                        entity.y = tileRect.y + tileRect.height;
                        entity.vy = 0;
                        entity.ceilingHit = true;
                        
                        // Interact with the block (e.g., break it)
                        if (tile.interact) tile.interact(entity);
                    }
                }
            }
        }
    }

    // Check horizontal collisions second
    for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
            const tile = getTileAt(col, row);
            if (tile && tile.solid) {
                const tileRect = {
                    x: col * TILE_SIZE,
                    y: row * TILE_SIZE,
                    width: TILE_SIZE,
                    height: TILE_SIZE
                };

                if (checkAABB(entity, tileRect)) {
                    // Moving Right?
                    if (entity.vx > 0) {
                        entity.x = tileRect.x - entity.width;
                        entity.vx = 0;
                        entity.wallHit = true;
                    }
                    // Moving Left?
                    else if (entity.vx < 0) {
                        entity.x = tileRect.x + tileRect.width;
                        entity.vx = 0;
                        entity.wallHit = true;
                    }
                }
            }
        }
    }
    
    // World bounds
    if (entity.x < 0) {
        entity.x = 0;
        entity.vx = 0;
    }
    // No right bound limit in scrolling world effectively, but if needed:
    if (entity.x > gameState.levelWidth - entity.width) {
        entity.x = gameState.levelWidth - entity.width;
        entity.vx = 0;
    }
    
    // Bottom bound (death pit)
    if (entity.y > gameState.levelHeight + 100) {
        if (entity.die) entity.die();
        else entity.active = false;
    }
}

// Helper to get tile safely
function getTileAt(col, row) {
    if (row >= 0 && row < gameState.tiles.length && col >= 0 && col < gameState.tiles[0].length) {
        return gameState.tiles[row][col];
    }
    return null;
}

/**
 * Standard physics update for entities with mass
 */
export function applyPhysics(entity) {
    // Gravity
    entity.vy += GRAVITY;
    entity.vy = Math.min(entity.vy, TERMINAL_VELOCITY);
    
    // Position Update
    entity.x += entity.vx;
    entity.y += entity.vy;
}