/**
 * Mathematical utility functions for 3D projection and geometry.
 */
import { CANVAS_WIDTH, CANVAS_HEIGHT, OCTAGON_SIDES } from './globals.js';

// Project a 3D point (x, y, z) to 2D screen coordinates
export function project3D(x, y, z, centerX = CANVAS_WIDTH / 2, centerY = CANVAS_HEIGHT / 2) {
    // Avoid division by zero
    const depth = Math.max(1, z);
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
    
    // Offset rotation so 0 is at the bottom (6 o'clock)
    // In p5, 0 is right (3 o'clock). 
    // We want index 0 to be bottom. PI/2 is bottom.
    // Let's standard: Index 0 is Bottom.
    const angleOffset = Math.PI / 2 + (Math.PI / 8); // Align flat side to bottom
    
    for (let i = 0; i < OCTAGON_SIDES; i++) {
        const theta = i * step + rotation + angleOffset;
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