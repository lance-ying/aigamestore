// physics calculations and collision detection
import { gameState, CANVAS_WIDTH } from './globals.js';

/**
 * Checks the alignment between the active block and the block below it (top of stack).
 * @param {Object} activeBlock - The currently moving block
 * @param {Object} baseBlock - The block immediately below the active block
 * @returns {Object} Result containing overlap, offset, and isMiss boolean
 */
export function checkStackAlignment(activeBlock, baseBlock) {
    const dist = activeBlock.x - baseBlock.x;
    const absDist = Math.abs(dist);
    
    // If distance is greater than the width of the base block, it's a miss
    if (absDist >= baseBlock.width) {
        return {
            isMiss: true,
            overlap: 0,
            diff: dist
        };
    }
    
    // Check for "Perfect" placement (within small tolerance)
    const tolerance = 3;
    if (absDist < tolerance) {
        return {
            isMiss: false,
            isPerfect: true,
            overlap: baseBlock.width, // Full width preserved
            diff: 0,
            snappedX: baseBlock.x // Snap to exact position
        };
    }
    
    // Standard overlap
    return {
        isMiss: false,
        isPerfect: false,
        overlap: baseBlock.width - absDist,
        diff: dist,
        snappedX: null
    };
}

/**
 * Applies gravity to debris
 */
export function updatePhysics() {
    // Update debris physics
    for (const piece of gameState.debris) {
        piece.vy += gameState.gravity;
        piece.x += piece.vx;
        piece.y += piece.vy;
        piece.rotation += piece.rotSpeed;
    }
}