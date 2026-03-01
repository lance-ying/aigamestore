import { gameState } from './globals.js';

// Simple AABB collision detection
export function checkAABB(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.w &&
        rect1.x + rect1.w > rect2.x &&
        rect1.y < rect2.y + rect2.h &&
        rect1.y + rect1.h > rect2.y
    );
}

// Circle-Rect collision detection
// Returns true if collision occurs
export function checkCircleRect(circle, rect) {
    // Find the closest point to the circle within the rectangle
    let closestX = clamp(circle.x, rect.x, rect.x + rect.w);
    let closestY = clamp(circle.y, rect.y, rect.y + rect.h);

    // Calculate the distance between the circle's center and this closest point
    let distanceX = circle.x - closestX;
    let distanceY = circle.y - closestY;

    // If the distance is less than the circle's radius, an intersection occurs
    let distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
    return distanceSquared < (circle.r * circle.r);
}

// Helper to clamp value
function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

// Resolve collisions between a moving circle (player) and static rectangles (platforms)
// Updates player position and velocity directly
export function resolvePlayerPlatformCollisions(player, platforms) {
    player.onGround = false;
    
    // We check vertical and horizontal collisions separately for stability
    
    // 1. Horizontal movement
    player.x += player.vx;
    for (let platform of platforms) {
        if (checkCircleRect(player, platform)) {
            // Fix for teleport glitch: 
            // If we are walking on the floor (or hitting ceiling), ignore X collision.
            // We check if the player is vertically aligned with the surface.
            
            const tolerance = 10; // Pixels of overlap allowed before considering it a wall hit
            
            // Check if on top (Floor)
            // Player bottom (y+r) should be near Platform top (y)
            const isOnTop = (player.y + player.r) <= (platform.y + tolerance);
            
            // Check if under (Ceiling)
            // Player top (y-r) should be near Platform bottom (y+h)
            const isUnder = (player.y - player.r) >= (platform.y + platform.h - tolerance);
            
            if (isOnTop || isUnder) {
                // It's a vertical contact, ignore for horizontal resolution
                continue;
            }

            // Determine direction of collision
            // Since we just moved X, the overlap is horizontal
            if (player.vx > 0) { // Moving right
                // Push back to left
                // Closest point logic again to find edge
                player.x = platform.x - player.r;
                player.vx = 0;
            } else if (player.vx < 0) { // Moving left
                player.x = platform.x + platform.w + player.r;
                player.vx = 0;
            }
        }
    }
    
    // 2. Vertical movement
    player.y += player.vy;
    for (let platform of platforms) {
        if (checkCircleRect(player, platform)) {
            if (player.vy > 0) { // Falling down
                // Land on top
                player.y = platform.y - player.r;
                player.vy = 0;
                player.onGround = true;
            } else if (player.vy < 0) { // Jumping up
                // Hit bottom
                player.y = platform.y + platform.h + player.r;
                player.vy = 0;
            }
        }
    }
}