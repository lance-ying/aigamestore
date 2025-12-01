import { gameState } from './globals.js';

// Simple AABB collision detection
export function checkRectCollision(r1, r2) {
    return (r1.x < r2.x + r2.w &&
            r1.x + r1.w > r2.x &&
            r1.y < r2.y + r2.h &&
            r1.y + r1.h > r2.y);
}

// Circle-Rectangle Collision for Player
export function checkCircleRectCollision(circle, rect) {
    // Find closest point on rect to circle center
    let closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
    let closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));

    let dx = circle.x - closestX;
    let dy = circle.y - closestY;

    return (dx * dx + dy * dy) < (circle.r * circle.r);
}

// Resolve collision between player (circle) and static platform (rect)
// Returns true if collision happened
export function resolvePlayerPlatform(player, platform) {
    // AABB approximation for stability in platformers is often better than pure circle physics
    // for the 'standing' behavior, but we want the 'rolling' feel.
    // We'll use a hybrid: Treat player as a box for resolution, but use circle for corner checks?
    // Let's stick to AABB resolution for reliability with the tile-based world.
    
    // Player AABB
    const pLeft = player.x - player.r;
    const pRight = player.x + player.r;
    const pTop = player.y - player.r;
    const pBottom = player.y + player.r;
    
    const bLeft = platform.x;
    const bRight = platform.x + platform.w;
    const bTop = platform.y;
    const bBottom = platform.y + platform.h;

    if (pRight > bLeft && pLeft < bRight && pBottom > bTop && pTop < bBottom) {
        // Collision detected. Determine smallest overlap.
        const overlapLeft = pRight - bLeft;
        const overlapRight = bRight - pLeft;
        const overlapTop = pBottom - bTop;
        const overlapBottom = bBottom - pTop;

        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

        if (minOverlap === overlapTop) {
            // Landed on top
            player.y = bTop - player.r;
            player.vy = 0;
            player.onGround = true;
        } else if (minOverlap === overlapBottom) {
            // Hit bottom (ceiling)
            player.y = bBottom + player.r;
            player.vy *= 0.5; // Bounce down slightly
        } else if (minOverlap === overlapLeft) {
            // Hit left side of platform
            player.x = bLeft - player.r;
            player.vx = 0;
        } else if (minOverlap === overlapRight) {
            // Hit right side of platform
            player.x = bRight + player.r;
            player.vx = 0;
        }
        return true;
    }
    return false;
}