// math_utils.js
// Helper functions for math and geometry

import { CANVAS_HEIGHT } from './globals.js';

// Noise function wrapper to ensure consistent terrain usage if needed
// We will use p5's noise, but this helps abstract scale
export function getTerrainHeight(p, x) {
    // Composite noise for interesting hills
    // Base rolling hills
    const noise1 = p.noise(x * 0.003);
    // Detail
    const noise2 = p.noise(x * 0.01);
    
    // Amplitude modulation
    const amp = 150 + noise1 * 200;
    
    // Height calculation (Screen Y coordinates, so higher value = lower on screen)
    // We want hills at the bottom, so base is around CANVAS_HEIGHT
    // y = Base - HillHeight
    const y = (CANVAS_HEIGHT + 50) - (p.noise(x * 0.005) * amp + noise2 * 50);
    
    return y;
}

// Calculate the slope (angle) of the terrain at x
export function getTerrainAngle(p, x) {
    const lookAhead = 5;
    const y1 = getTerrainHeight(p, x - lookAhead);
    const y2 = getTerrainHeight(p, x + lookAhead);
    return Math.atan2(y2 - y1, lookAhead * 2);
}

// Check circle collision with terrain function
export function checkTerrainCollision(p, circleX, circleY, radius) {
    const terrainY = getTerrainHeight(p, circleX);
    // Simple height map collision: if circle bottom is below terrain Y
    return (circleY + radius) >= terrainY;
}

// Resolve collision point
export function getSurfaceY(p, x) {
    return getTerrainHeight(p, x);
}

export function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}