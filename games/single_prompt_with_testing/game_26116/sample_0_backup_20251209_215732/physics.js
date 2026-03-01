/**
 * Physics and collision detection engine.
 * 
 * Implements AABB collision, simple raycasting, and
 * tile-based collision resolution.
 */

import { TILE_SIZE, ROWS, COLS } from './globals.js';
import { collideRectRect, collideLineRect } from 'https://cdn.jsdelivr.net/npm/p5.collide2d@1.0.0/+esm';

/**
 * Axis Aligned Bounding Box (AABB) Collision Check
 */
export function checkAABB(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

/**
 * Check collision between an entity and the tilemap.
 * Returns true if colliding with a solid tile.
 */
export function checkMapCollision(entity, room, offset = {x:0, y:0}) {
    // Calculate entity bounds with offset (for predictive movement)
    const left = entity.x + offset.x;
    const right = left + entity.width;
    const top = entity.y + offset.y;
    const bottom = top + entity.height;

    // Convert pixels to tile coordinates
    const startCol = Math.floor(left / TILE_SIZE);
    const endCol = Math.floor((right - 0.1) / TILE_SIZE); // -0.1 to avoid edge cases
    const startRow = Math.floor(top / TILE_SIZE);
    const endRow = Math.floor((bottom - 0.1) / TILE_SIZE);

    // Check bounds
    if (startCol < 0 || endCol >= COLS || startRow < 0 || endRow >= ROWS) {
        // Treat screen edges as walls usually, unless it's a door/transition
        // For physics resolution, we usually treat world bounds as solid unless handled by room transition logic
        return false; // Let room transition logic handle out of bounds
    }

    // Iterate through potential tiles
    for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
            const tile = room.getTile(c, r);
            if (tile && tile.isSolid) {
                // Special case for One-Way platforms
                if (tile.type === "ONE_WAY") {
                    // Only collide if coming from above and feet are above the platform top
                    const tileTop = r * TILE_SIZE;
                    if (entity.vy > 0 && (entity.y + entity.height) <= tileTop + entity.vy + 1) {
                         return true;
                    }
                } else if (tile.type === "DOOR_CLOSED") {
                    return true;
                } else {
                    // Normal wall
                    return true;
                }
            }
        }
    }
    return false;
}

/**
 * Gets specific collision info (e.g. is it water? is it spike?)
 */
export function getTileAt(x, y, room) {
    const col = Math.floor(x / TILE_SIZE);
    const row = Math.floor(y / TILE_SIZE);
    
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return null;
    
    return room.getTile(col, row);
}

/**
 * Raycast for visibility (Line of Sight)
 * Returns true if the line from start to end is blocked by a solid tile
 */
export function raycastMap(x1, y1, x2, y2, room) {
    // Simple stepping algorithm (Bresenham-like or just sampling)
    // For TILE_SIZE grid, sampling every TILE_SIZE/2 is usually sufficient
    const dist = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
    const steps = Math.ceil(dist / (TILE_SIZE / 2));
    
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const px = x1 + (x2 - x1) * t;
        const py = y1 + (y2 - y1) * t;
        
        const tile = getTileAt(px, py, room);
        if (tile && tile.isSolid && tile.type !== "ONE_WAY") {
            return true; // Blocked
        }
    }
    return false; // Clear line of sight
}