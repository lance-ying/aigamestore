/**
 * physics.js
 * Handles collisions (AABB) and physics calculations.
 * Uses p5.collide2D where beneficial, plus custom logic for tilemaps.
 */

import { TILE_SIZE, gameState } from './globals.js';
// We import p5.collide2D functions from window in the main loop context usually,
// but here we can define helpers that assume the library is loaded globally.

/**
 * Simple AABB collision check between two rectangle objects.
 * Objects must have x, y, width, height properties.
 */
export function checkAABB(r1, r2) {
    return (
        r1.x < r2.x + r2.width &&
        r1.x + r1.width > r2.x &&
        r1.y < r2.y + r2.height &&
        r1.y + r1.height > r2.y
    );
}

/**
 * Resolves collisions between a dynamic entity and static map tiles.
 * Modifies entity position and velocity directly.
 */
export function resolveMapCollision(entity) {
    // Define the entity's bounding box
    const entityLeft = entity.x;
    const entityRight = entity.x + entity.width;
    const entityTop = entity.y;
    const entityBottom = entity.y + entity.height;

    // Determine grid cells to check
    const startCol = Math.floor(entityLeft / TILE_SIZE);
    const endCol = Math.floor(entityRight / TILE_SIZE);
    const startRow = Math.floor(entityTop / TILE_SIZE);
    const endRow = Math.floor(entityBottom / TILE_SIZE);

    entity.grounded = false; // Assume in air until proven otherwise

    // Check vertical collisions first (Floor/Ceiling)
    // We prioritize vertical to handle gravity correctly
    
    // Check Downward (Floor)
    if (entity.vy >= 0) {
        for (let c = startCol; c <= endCol; c++) {
            const tile = getTileAt(c, endRow);
            if (tile && tile.solid) {
                const tileTop = endRow * TILE_SIZE;
                // If we are overlapping the top of the tile and were previously above it
                if (entityBottom > tileTop && (entity.y + entity.height - entity.vy) <= tileTop + 5) {
                    entity.y = tileTop - entity.height;
                    entity.vy = 0;
                    entity.grounded = true;
                    break; 
                }
            }
        }
    }

    // Check Upward (Ceiling)
    if (entity.vy < 0) {
        for (let c = startCol; c <= endCol; c++) {
            const tile = getTileAt(c, startRow);
            if (tile && tile.solid) {
                const tileBottom = (startRow + 1) * TILE_SIZE;
                if (entityTop < tileBottom) {
                    entity.y = tileBottom;
                    entity.vy = 0;
                }
                break;
            }
        }
    }

    // Re-calculate entity bounds for horizontal checks since Y might have changed
    const newEntityTop = entity.y;
    const newEntityBottom = entity.y + entity.height;
    const newStartRow = Math.floor(newEntityTop / TILE_SIZE);
    const newEndRow = Math.floor(newEntityBottom / TILE_SIZE);

    // Check Right (Wall)
    if (entity.vx > 0) {
        for (let r = newStartRow; r <= newEndRow; r++) {
            const tile = getTileAt(endCol, r);
            if (tile && tile.solid) {
                const tileLeft = endCol * TILE_SIZE;
                if (entity.x + entity.width > tileLeft) {
                    entity.x = tileLeft - entity.width;
                    entity.vx = 0;
                }
                break;
            }
        }
    }

    // Check Left (Wall)
    if (entity.vx < 0) {
        for (let r = newStartRow; r <= newEndRow; r++) {
            const tile = getTileAt(startCol, r);
            if (tile && tile.solid) {
                const tileRight = (startCol + 1) * TILE_SIZE;
                if (entity.x < tileRight) {
                    entity.x = tileRight;
                    entity.vx = 0;
                }
                break;
            }
        }
    }
}

/**
 * Helper to get tile from global state at grid coordinates
 */
function getTileAt(col, row) {
    if (row < 0 || row * TILE_SIZE >= 600) return null; // Out of vertical bounds (simplification)
    // In our level structure, we can lookup by key
    const key = `${col},${row}`;
    return gameState.tileMap ? gameState.tileMap[key] : null;
}

/**
 * Check if a rectangle overlaps with any solid tile.
 * Useful for spawning logic.
 */
export function isOverlappingMap(x, y, w, h) {
    const startCol = Math.floor(x / TILE_SIZE);
    const endCol = Math.floor((x + w) / TILE_SIZE);
    const startRow = Math.floor(y / TILE_SIZE);
    const endRow = Math.floor((y + h) / TILE_SIZE);

    for (let c = startCol; c <= endCol; c++) {
        for (let r = startRow; r <= endRow; r++) {
            const tile = getTileAt(c, r);
            if (tile && tile.solid) return true;
        }
    }
    return false;
}