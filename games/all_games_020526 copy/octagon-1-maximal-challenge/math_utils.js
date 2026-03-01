/**
 * Mathematical utility functions for 3D projection and geometry.
 */
import { CANVAS_WIDTH, CANVAS_HEIGHT, OCTAGON_SIDES } from './globals.js';

// Global rotation offset to align the octagon flat side to the bottom
export const ANGLE_OFFSET = Math.PI / 2 + (Math.PI / OCTAGON_SIDES);

// Project a 3D point (x, y, z) to 2D screen coordinates
export function project3D(x, y, z, centerX = CANVAS_WIDTH / 2, centerY = CANVAS_HEIGHT / 2) {
    // Move camera back to see the player and tunnel context
    const CAMERA_Z = -600;
    
    // Avoid division by zero
    const depth = Math.max(1, z - CAMERA_Z);
    const fov = 400; // Field of view scale factor
    
    const scale = fov / depth;
    const sx = centerX + x * scale;
    const sy = centerY + y * scale;
    
    return { x: sx, y: sy, scale: scale };
}

// Get vertices for an octagon ring at a specific depth and rotation
export function getOctagonVertices(depth, radius, rotation) {
    const vertices = [];
    const step = (Math.PI * 2) / OCTAGON_SIDES;
    
    for (let i = 0; i < OCTAGON_SIDES; i++) {
        const theta = i * step + rotation + ANGLE_OFFSET;
        const x = Math.cos(theta) * radius;
        const y = Math.sin(theta) * radius;
        
        vertices.push({ x, y, z: depth, angle: theta });
    }
    return vertices;
}

// Linear Interpolation
export function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}

// Normalize angle to -PI to PI
export function normalizeAngle(angle) {
    return angle - (2 * Math.PI) * Math.floor((angle + Math.PI) / (2 * Math.PI));
}

// Snap rotation to nearest 45 degrees (PI/4)
export function snapToOctagon(angle) {
    const step = Math.PI / 4;
    return Math.round(angle / step) * step;
}