import { gameState, CELL_SIZE } from './globals.js';

// Simple AABB Collision
export function checkAABB(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

// Raycast-like check for movement destination (Discrete steps for simplicity in grid)
// Returns the furthest safe point or the collision point
export function getSlideDestination(startX, startY, width, height, vx, vy, walls) {
    let currX = startX;
    let currY = startY;
    let stepX = vx !== 0 ? Math.sign(vx) : 0;
    let stepY = vy !== 0 ? Math.sign(vy) : 0;
    
    // Safety break
    let maxSteps = 1000;
    let steps = 0;
    
    // We simulate movement pixel by pixel or in small chunks
    // For a grid based game, we can check grid lines, but continuous collision is smoother
    // Given the high speed, we sweep.
    
    // Actually, since it's a grid, we can look ahead.
    // But entities might be off-grid slightly. Let's do a stepped approach for robustness.
    const speed = Math.max(Math.abs(vx), Math.abs(vy));
    const normalizedVx = vx / speed;
    const normalizedVy = vy / speed;
    
    // Test rect
    const playerRect = { x: currX, y: currY, width: width, height: height };
    
    // We assume we are not currently colliding.
    // We project forward.
    // Finding the nearest wall in the direction of movement.
    
    let nearestDist = Infinity;
    
    walls.forEach(wall => {
        // Optimization: ignore walls behind us or too far perpendicular
        if (vx > 0 && wall.x <= currX) return;
        if (vx < 0 && wall.x >= currX) return;
        if (vy > 0 && wall.y <= currY) return;
        if (vy < 0 && wall.y >= currY) return;
        
        // Simple broadphase check
        if (vx !== 0) {
             // Moving Horizontal. Check if wall is in Y-row.
             if (wall.y < currY + height && wall.y + wall.height > currY) {
                 let dist;
                 if (vx > 0) dist = wall.x - (currX + width);
                 else dist = currX - (wall.x + wall.width);
                 
                 if (dist >= 0 && dist < nearestDist) nearestDist = dist;
             }
        } else if (vy !== 0) {
            // Moving Vertical
            if (wall.x < currX + width && wall.x + wall.width > currX) {
                let dist;
                if (vy > 0) dist = wall.y - (currY + height);
                else dist = currY - (wall.y + wall.height);
                
                if (dist >= 0 && dist < nearestDist) nearestDist = dist;
            }
        }
    });
    
    // Also check bounds of generated world if needed, but walls should enclose everything.
    
    if (nearestDist === Infinity) return null; // Should not happen in closed maze
    
    return nearestDist;
}