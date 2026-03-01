/**
 * utils.js
 * Helper functions for math, randomness, and game logic.
 */

import { TILE_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y, GRID_COLS, GRID_ROWS } from './globals.js';

/**
 * Converts grid coordinates to screen pixel coordinates (center of tile).
 */
export function gridToPixel(gridX, gridY) {
    return {
        x: GRID_OFFSET_X + (gridX * TILE_SIZE) + (TILE_SIZE / 2),
        y: GRID_OFFSET_Y + (gridY * TILE_SIZE) + (TILE_SIZE / 2)
    };
}

/**
 * Checks if grid coordinates are within bounds.
 */
export function isValidGrid(x, y) {
    return x >= 0 && x < GRID_COLS && y >= 0 && y < GRID_ROWS;
}

/**
 * Linear interpolation
 */
export function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}

/**
 * Distance between two grid points (Manhattan distance)
 */
export function manhattanDist(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

/**
 * Get direction object from vector
 */
export function getDirection(dx, dy) {
    if (Math.abs(dx) > Math.abs(dy)) {
        return dx > 0 ? { x: 1, y: 0, name: 'RIGHT' } : { x: -1, y: 0, name: 'LEFT' };
    } else {
        return dy > 0 ? { x: 0, y: 1, name: 'DOWN' } : { x: 0, y: -1, name: 'UP' };
    }
}

/**
 * Shuffles an array in place
 */
export function shuffleArray(p, array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(p.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}