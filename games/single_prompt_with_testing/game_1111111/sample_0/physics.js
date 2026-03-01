/**
 * Physics engine, collision detection, and spatial calculations.
 */
// Removed: import { collideRectRect, collideLineRect } from 'https://cdn.jsdelivr.net/npm/p5.collide2d@1.0.0/+esm';
import { gameState, LEVEL_WIDTH, TILE_SIZE, GRAVITY } from './globals.js';

export function checkCollisions(p, entity) { // Added p
    // Platform Collisions
    entity.onGround = false;
    entity.onWall = 0; // -1 left, 1 right, 0 none
    entity.ceilingBump = false;

    // We only check platforms near the entity to optimize
    // Map repeats, so we normalize entity X to 0..LEVEL_WIDTH for checking static map data if we stored it that way.
    // However, our platforms array will contain objects with absolute positions for the visible segments.
    // Actually, for a looping runner, it's best to generate platforms dynamically ahead or repeat the array.
    // Strategy: We will check against ALL platforms but offset them by map loops if needed.
    // SIMPLIFICATION: We assume the platforms array contains all geometry for one loop.
    // We check collision against Platform X, and Platform X + LEVEL_WIDTH, and Platform X - LEVEL_WIDTH.

    const nearbyRadius = 100; // Optimization radius
    
    // Store original position to resolve
    let originalX = entity.x;
    let originalY = entity.y;

    // 1. Horizontal Collision
    entity.x += entity.vx;
    let wallHit = false;

    // Check world loop offsets (-1, 0, 1)
    for (let loop = -1; loop <= 1; loop++) {
        const xOffset = loop * LEVEL_WIDTH;
        
        for (let platform of gameState.platforms) {
            // Optimization: Simple box check first
            let platX = platform.x + xOffset;
            let platY = platform.y;
            
            if (p.collideRectRect(entity.x, entity.y, entity.width, entity.height, platX, platY, platform.width, platform.height)) { // Used p.collideRectRect
                
                // Collision detected on X axis
                if (entity.vx > 0) { // Moving right
                    entity.x = platX - entity.width;
                    entity.onWall = 1;
                } else if (entity.vx < 0) { // Moving left
                    entity.x = platX + platform.width;
                    entity.onWall = -1;
                }
                entity.vx = 0;
                wallHit = true;
            }
        }
    }

    // 2. Vertical Collision
    entity.y += entity.vy;
    
    for (let loop = -1; loop <= 1; loop++) {
        const xOffset = loop * LEVEL_WIDTH;
        
        for (let platform of gameState.platforms) {
            let platX = platform.x + xOffset;
            let platY = platform.y;

            if (p.collideRectRect(entity.x, entity.y, entity.width, entity.height, platX, platY, platform.width, platform.height)) { // Used p.collideRectRect
                
                // Collision detected on Y axis
                if (entity.vy > 0) { // Falling down
                    entity.y = platY - entity.height;
                    entity.onGround = true;
                    entity.vy = 0;
                } else if (entity.vy < 0) { // Jumping up
                    entity.y = platY + platform.height;
                    entity.ceilingBump = true;
                    entity.vy = 0;
                }
            }
        }
    }
}

export function checkHazardCollisions(p, entity) { // Added p
    if (entity.invulnerable > 0) return false;

    for (let loop = -1; loop <= 1; loop++) {
        const xOffset = loop * LEVEL_WIDTH;
        for (let hazard of gameState.hazards) {
            let hazX = hazard.x + xOffset;
            let hazY = hazard.y;
            
            // Simple Circle-Rect or Rect-Rect collision
            // Hazards are usually triangles (spikes), treat as smaller rects at bottom
            if (p.collideRectRect(entity.x + entity.width * 0.5, entity.y + entity.height * 0.5, entity.width * 0.5, entity.height * 0.5, hazX, hazY + hazard.height / 2, hazard.width, hazard.height / 2)) { // Used p.collideRectRect
                return true;
            }
        }
    }
    return false;
}

export function findGrapplePoint(p, entity, directionX, directionY) { // Added p
    let bestPoint = null;
    let minDist = Infinity;
    
    // Search angle: Look in direction of input or facing
    // We scan all ceiling platforms and special grapple points
    
    // Normalize absolute entity X for map checking
    // Actually, just check all points with loop offset
    
    for (let loop = -1; loop <= 1; loop++) {
        const xOffset = loop * LEVEL_WIDTH;
        
        // Check "Grapple Points" (ceilings)
        // We define grappleable surfaces as the bottom of platforms
        for (let platform of gameState.platforms) {
            // Check if platform is above player and within range
            let platX = platform.x + xOffset;
            let platY = platform.y + platform.height; // Bottom edge
            
            // Check corners and center
            const pointsToCheck = [
                {x: platX, y: platY},
                {x: platX + platform.width, y: platY},
                {x: platX + platform.width/2, y: platY}
            ];
            
            for (let pt of pointsToCheck) {
                const d = p.dist(entity.x + entity.width/2, entity.y + entity.height/2, pt.x, pt.y); // Used p.dist
                if (d < gameState.grappleRange && pt.y < entity.y) {
                    // Simple priority: Closest point
                    // Advanced: Best alignment with input vector
                    
                    // Filter by direction if input is given
                    if (directionY < 0) { // Aiming up
                        // If aiming right, prefer points to the right
                        if (directionX > 0 && pt.x < entity.x) continue;
                        if (directionX < 0 && pt.x > entity.x) continue;
                    }

                    if (d < minDist) {
                        minDist = d;
                        bestPoint = { x: pt.x, y: pt.y, obj: platform };
                    }
                }
            }
        }
    }
    
    return bestPoint;
}

// Removed local dist function

// Raycasting for hook visibility (prevent grappling through walls)
export function raycast(p, x1, y1, x2, y2) { // Added p
    // Check if line intersects any platform
    for (let loop = -1; loop <= 1; loop++) {
        const xOffset = loop * LEVEL_WIDTH;
        for (let platform of gameState.platforms) {
            let hit = p.collideLineRect( // Used p.collideLineRect
                x1, y1, x2, y2,
                platform.x + xOffset, platform.y, platform.width, platform.height
            );
            if (hit) return true; // Blocked
        }
    }
    return false; // Clear
}