// physics.js - Physics and collision detection utilities

import { gameState } from './globals.js';

// ============================================================================
// COLLISION DETECTION
// ============================================================================

/**
 * Check collision between two rectangles (AABB collision)
 */
export function checkRectCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
    return (
        x1 < x2 + w2 &&
        x1 + w1 > x2 &&
        y1 < y2 + h2 &&
        y1 + h1 > y2
    );
}

/**
 * Check collision between two circles
 */
export function checkCircleCollision(x1, y1, r1, x2, y2, r2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (r1 + r2);
}

/**
 * Check if a point is inside a rectangle
 */
export function isPointInRect(px, py, rx, ry, rw, rh) {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

/**
 * Check if a point is inside a circle
 */
export function isPointInCircle(px, py, cx, cy, radius) {
    const dx = px - cx;
    const dy = py - cy;
    return Math.sqrt(dx * dx + dy * dy) <= radius;
}

/**
 * Check collision between a circle and a rectangle
 */
export function checkCircleRectCollision(cx, cy, radius, rx, ry, rw, rh) {
    // Find the closest point on the rectangle to the circle
    const closestX = Math.max(rx, Math.min(cx, rx + rw));
    const closestY = Math.max(ry, Math.min(cy, ry + rh));
    
    // Calculate distance between circle center and closest point
    const dx = cx - closestX;
    const dy = cy - closestY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance <= radius;
}

// ============================================================================
// SPATIAL PARTITIONING
// ============================================================================

/**
 * Simple spatial grid for efficient collision detection
 */
export class SpatialGrid {
    constructor(cellSize) {
        this.cellSize = cellSize;
        this.grid = new Map();
    }
    
    getCellKey(x, y) {
        const cellX = Math.floor(x / this.cellSize);
        const cellY = Math.floor(y / this.cellSize);
        return `${cellX},${cellY}`;
    }
    
    insert(entity) {
        const key = this.getCellKey(entity.x, entity.y);
        if (!this.grid.has(key)) {
            this.grid.set(key, []);
        }
        this.grid.get(key).push(entity);
    }
    
    getNearbyEntities(entity, radius = 1) {
        const nearby = [];
        const centerX = Math.floor(entity.x / this.cellSize);
        const centerY = Math.floor(entity.y / this.cellSize);
        
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                const key = `${centerX + dx},${centerY + dy}`;
                if (this.grid.has(key)) {
                    nearby.push(...this.grid.get(key));
                }
            }
        }
        
        return nearby;
    }
    
    clear() {
        this.grid.clear();
    }
}

// ============================================================================
// VECTOR UTILITIES
// ============================================================================

/**
 * Calculate distance between two points
 */
export function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate angle between two points
 */
export function angleBetween(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

/**
 * Normalize a vector
 */
export function normalize(x, y) {
    const length = Math.sqrt(x * x + y * y);
    if (length === 0) return { x: 0, y: 0 };
    return { x: x / length, y: y / length };
}

/**
 * Linear interpolation
 */
export function lerp(start, end, t) {
    return start + (end - start) * t;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// ============================================================================
// PATHFINDING UTILITIES
// ============================================================================

/**
 * Simple A* pathfinding implementation
 */
export class PathFinder {
    constructor(gridWidth, gridHeight, cellSize) {
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        this.cellSize = cellSize;
        this.obstacles = [];
    }
    
    setObstacles(obstacles) {
        this.obstacles = obstacles;
    }
    
    isWalkable(x, y) {
        // Check if position collides with any obstacle
        for (const obstacle of this.obstacles) {
            if (checkCircleRectCollision(
                x, y, this.cellSize / 2,
                obstacle.x, obstacle.y, obstacle.width, obstacle.height
            )) {
                return false;
            }
        }
        return true;
    }
    
    findPath(startX, startY, endX, endY) {
        // Simplified pathfinding - just return direct path for performance
        // In a more complex game, implement full A* here
        return [
            { x: startX, y: startY },
            { x: endX, y: endY }
        ];
    }
}

// ============================================================================
// CAMERA UTILITIES
// ============================================================================

/**
 * Update camera to follow target with smoothing
 */
export function updateCamera(target, smoothness = 0.1) {
    if (!target) return;
    
    const targetX = target.x - CANVAS_WIDTH / 2;
    const targetY = target.y - CANVAS_HEIGHT / 2;
    
    gameState.cameraX = lerp(gameState.cameraX, targetX, smoothness);
    gameState.cameraY = lerp(gameState.cameraY, targetY, smoothness);
    
    // Clamp camera to world bounds
    gameState.cameraX = clamp(gameState.cameraX, 0, gameState.worldWidth - CANVAS_WIDTH);
    gameState.cameraY = clamp(gameState.cameraY, 0, gameState.worldHeight - CANVAS_HEIGHT);
}

// ============================================================================
// SCREEN SPACE UTILITIES
// ============================================================================

/**
 * Convert world coordinates to screen coordinates
 */
export function worldToScreen(worldX, worldY) {
    return {
        x: worldX - gameState.cameraX,
        y: worldY - gameState.cameraY
    };
}

/**
 * Convert screen coordinates to world coordinates
 */
export function screenToWorld(screenX, screenY) {
    return {
        x: screenX + gameState.cameraX,
        y: screenY + gameState.cameraY
    };
}

/**
 * Check if a point is visible on screen
 */
export function isOnScreen(x, y, margin = 50) {
    const screenPos = worldToScreen(x, y);
    return (
        screenPos.x >= -margin &&
        screenPos.x <= CANVAS_WIDTH + margin &&
        screenPos.y >= -margin &&
        screenPos.y <= CANVAS_HEIGHT + margin
    );
}

// Import CANVAS_WIDTH and CANVAS_HEIGHT for screen utilities
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';