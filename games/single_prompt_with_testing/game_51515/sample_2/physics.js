/**
 * physics.js
 * Handles collision detection, grid mathematics, and movement calculations.
 */

import { TILE_SIZE, gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

// --- Collision Detection Helpers ---

/**
 * Checks Axis-Aligned Bounding Box collision between two rectangles.
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
 * Checks collision between a rectangle and a circle.
 */
export function checkRectCircle(rect, circle) {
    // Find the closest point on the rectangle to the circle center
    let closestX = clamp(circle.x, rect.x, rect.x + rect.width);
    let closestY = clamp(circle.y, rect.y, rect.y + rect.height);

    // Calculate distance between circle center and closest point
    let distanceX = circle.x - closestX;
    let distanceY = circle.y - closestY;

    // If distance is less than radius, collision
    let distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
    return distanceSquared < (circle.radius * circle.radius);
}

/**
 * Checks collision between two circles.
 */
export function checkCircleCircle(c1, c2) {
    let dx = c1.x - c2.x;
    let dy = c1.y - c2.y;
    let distance = Math.sqrt(dx * dx + dy * dy);
    return distance < c1.radius + c2.radius;
}

// --- Grid Helpers ---

/**
 * Converts pixel coordinates to grid coordinates.
 */
export function worldToGrid(x, y) {
    return {
        col: Math.floor(x / TILE_SIZE),
        row: Math.floor(y / TILE_SIZE)
    };
}

/**
 * Converts grid coordinates to top-left pixel coordinates of the tile.
 */
export function gridToWorld(col, row) {
    return {
        x: col * TILE_SIZE,
        y: row * TILE_SIZE
    };
}

/**
 * Generates a unique key for the grid map.
 */
export function getGridKey(col, row) {
    return `${col},${row}`;
}

/**
 * Checks if a specific grid cell is walkable (not a wall).
 */
export function isWalkable(col, row) {
    const key = getGridKey(col, row);
    const tile = gameState.grid.get(key);
    
    // If tile doesn't exist (yet), assume wall or void
    if (!tile) return false;
    
    return tile.type !== 'WALL';
}

/**
 * Checks if a specific grid cell is strictly solid (Walls).
 * Used for AI and movement logic.
 */
export function isSolid(col, row) {
    const key = getGridKey(col, row);
    const tile = gameState.grid.get(key);
    return !tile || tile.type === 'WALL';
}

// --- Math Utilities ---

export function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

export function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}

export function distSq(x1, y1, x2, y2) {
    return (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
}