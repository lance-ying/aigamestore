/**
 * Helper functions for Isometric Projection calculations.
 * Converts 3D world coordinates to 2D screen coordinates.
 */

import { BLOCK_SIZE, COS_30, SIN_30, CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

/**
 * Converts 3D world coordinates to 2D screen coordinates.
 * @param {number} x - World X position
 * @param {number} y - World Y position (Height, Up is Positive)
 * @param {number} z - World Z position
 * @returns {object} {x, y} Screen coordinates
 */
export function worldToScreen(x, y, z) {
    // Isometric transformation
    // Center of the screen is (0,0) before translation
    
    // Rotate 45 degrees around Y axis effectively for iso view
    // Screen X corresponds to difference between X and Z
    // Screen Y corresponds to sum of X and Z, minus height Y
    
    const isoX = (x - z) * COS_30;
    const isoY = (x + z) * SIN_30 - y;

    return {
        x: isoX,
        y: isoY
    };
}

/**
 * Applies camera offset to screen coordinates.
 * @param {number} screenX 
 * @param {number} screenY 
 * @returns {object} {x, y} Adjusted coordinates
 */
export function applyCamera(screenX, screenY) {
    const cx = CANVAS_WIDTH / 2 - gameState.camera.x;
    const cy = CANVAS_HEIGHT / 2 - gameState.camera.y + 100; // +100 to push the view down a bit

    return {
        x: screenX + cx,
        y: screenY + cy
    };
}

/**
 * Checks if a point in screen space is approximately on screen.
 * Used for culling off-screen entities.
 * @param {number} sx - Screen X
 * @param {number} sy - Screen Y
 * @param {number} margin - Buffer margin
 */
export function isOnScreen(sx, sy, margin = 100) {
    return (
        sx >= -margin &&
        sx <= CANVAS_WIDTH + margin &&
        sy >= -margin &&
        sy <= CANVAS_HEIGHT + margin
    );
}

/**
 * Utility to get a unique key for grid coordinates
 */
export function getGridKey(gridX, gridZ) {
    return `${Math.floor(gridX)},${Math.floor(gridZ)}`;
}