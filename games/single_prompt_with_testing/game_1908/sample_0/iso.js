/**
 * iso.js
 * Handles Isometric math, projections, and coordinate transformations.
 */

import { TILE_SIZE } from './globals.js';

/**
 * Converts 3D Grid coordinates to 2D Screen coordinates.
 * Standard Isometric projection:
 * x_screen = (x - y) * cos(30)
 * y_screen = (x + y) * sin(30) - z
 */
export function gridToScreen(x, y, z) {
    const tileW = TILE_SIZE * 2; // Width of tile in screen pixels
    const tileH = TILE_SIZE;     // Height of tile in screen pixels
    
    // Isometric projection
    const screenX = (x - y) * (tileW / 2);
    const screenY = (x + y) * (tileH / 2) - (z * tileH);
    
    return { x: screenX, y: screenY };
}

/**
 * Calculates the depth (Z-index for sorting) of an entity.
 * In isometric view, objects with higher (x+y) are closer to the viewer (lower on screen).
 * Objects with higher z are higher up (overlap objects behind/below them).
 * A robust sort order is usually (x + y + z).
 */
export function getDepth(x, y, z) {
    // Basic painter's algorithm heuristic
    // We want things "front" (high x, high y) to draw last.
    // We want things "top" (high z) to draw last.
    return (x + y + 10 * z); 
}

/**
 * Helper to determine which of the 4 isometric directions aligns best with a screen vector.
 * Directions: 0: +X (Right-Down), 1: +Y (Left-Down), 2: -X (Left-Up), 3: -Y (Right-Up)
 * Screen inputs: Up, Down, Left, Right
 */
export function getIsoDirectionFromInput(dx, dy) {
    // Screen Up is -Y screen. Screen Right is +X screen.
    // Iso +X is (+sx, +sy)
    // Iso +Y is (-sx, +sy)
    // Iso -X is (-sx, -sy)
    // Iso -Y is (+sx, -sy)
    
    if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal dominance
        if (dx > 0) return { x: 1, y: 0 }; // Right key -> visually moves right -> roughly -Y iso or +X iso? 
        // Actually, let's map strictly to screen quadrants
        // Right Key -> move in +X -Y direction?
        // Let's keep it simple:
        // UP key -> Move "Up" on screen -> Iso -X or -Y.
        // Let's define the 4 cardinal iso moves:
        // 0: x+1 (Down-Right)
        // 1: x-1 (Up-Left)
        // 2: y+1 (Down-Left)
        // 3: y-1 (Up-Right)
        
        // Right Key: try x+1 or y-1. x+1 is down-right. y-1 is up-right. 
        return dx > 0 ? 'RIGHT' : 'LEFT';
    } else {
        return dy > 0 ? 'DOWN' : 'UP';
    }
}

/**
 * Checks if two points are close enough in screen space to be considered visually connected.
 * This is the core of the "Impossible Geometry" mechanic.
 */
export function areVisuallyConnected(p1, p2, threshold = 5) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return (dx * dx + dy * dy) < (threshold * threshold);
}