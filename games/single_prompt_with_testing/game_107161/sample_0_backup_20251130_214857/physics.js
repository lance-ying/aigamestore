import { gameState } from './globals.js';
import { collideRectRect, collideRectCircle } from 'https://cdn.jsdelivr.net/npm/p5.collide2d@1.0.0/+esm';

// Simple AABB collision check
export function checkAABB(r1, r2) {
    return (
        r1.x < r2.x + r2.width &&
        r1.x + r1.width > r2.x &&
        r1.y < r2.y + r2.height &&
        r1.y + r1.height > r2.y
    );
}

// Check if a point is inside a rect
export function pointInRect(px, py, rect) {
    return (
        px >= rect.x &&
        px <= rect.x + rect.width &&
        py >= rect.y &&
        py <= rect.y + rect.height
    );
}

// Platform collision resolution for player
export function resolvePlatformCollision(entity, platform) {
    // Determine the direction of collision based on previous frame position
    // This assumes entity has 'prevX' and 'prevY'
    
    // We only resolve vertical collisions (landing on top) or hitting head for now
    // to keep it simple and smooth like Downwell. Side collisions can be sticky.
    
    // Check if falling onto platform
    if (entity.vy > 0 && 
        entity.y + entity.height - entity.vy <= platform.y &&
        entity.y + entity.height > platform.y) {
        
        // Landed
        entity.y = platform.y - entity.height;
        entity.vy = 0;
        entity.onGround = true;
        return true;
    }
    
    // Head bump
    if (entity.vy < 0 && 
        entity.y - entity.vy >= platform.y + platform.height &&
        entity.y < platform.y + platform.height) {
        
        entity.y = platform.y + platform.height;
        entity.vy = 0;
        return true;
    }

    // Side collisions (simplified: push out)
    const overlapLeft = (entity.x + entity.width) - platform.x;
    const overlapRight = (platform.x + platform.width) - entity.x;
    const overlapTop = (entity.y + entity.height) - platform.y;
    const overlapBottom = (platform.y + platform.height) - entity.y;
    
    // Find smallest overlap
    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
    
    // Ideally we'd use the previous position to determine axis, but generic push out:
    if (minOverlap === overlapLeft) {
        entity.x = platform.x - entity.width;
        entity.vx = 0;
    } else if (minOverlap === overlapRight) {
        entity.x = platform.x + platform.width;
        entity.vx = 0;
    }
    
    return false;
}