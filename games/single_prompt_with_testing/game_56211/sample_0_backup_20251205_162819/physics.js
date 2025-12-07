import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

// Wrapper for p5.collide2D to ensure we are using the global p5 instance methods if needed,
// but p5.collide2d usually attaches to p5.prototype. 
// We will use the standalone functions provided by the library or implement simple AABB/Circle checks.

// Simple AABB Collision (Axis-Aligned Bounding Box)
export function checkRectRect(r1, r2) {
    return (
        r1.x < r2.x + r2.w &&
        r1.x + r1.w > r2.x &&
        r1.y < r2.y + r2.h &&
        r1.y + r1.h > r2.y
    );
}

// Circle to Rectangle Collision
export function checkCircleRect(cx, cy, radius, rx, ry, rw, rh) {
    // Find the closest point to the circle within the rectangle
    let testX = cx;
    let testY = cy;

    if (cx < rx) testX = rx;      // test left edge
    else if (cx > rx + rw) testX = rx + rw;   // right edge
    
    if (cy < ry) testY = ry;      // top edge
    else if (cy > ry + rh) testY = ry + rh;   // bottom edge

    // get distance from closest edges
    let distX = cx - testX;
    let distY = cy - testY;
    let distance = Math.sqrt((distX * distX) + (distY * distY));

    return distance <= radius;
}

export function updatePhysics() {
    // Update difficulty based on distance
    if (gameState.gamePhase === 'PLAYING') {
        gameState.difficultyMultiplier = 1 + (gameState.distance / 5000);
        gameState.scrollSpeed = 5 * gameState.difficultyMultiplier;
    }
}