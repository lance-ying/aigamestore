/**
 * Physics engine handling collision detection and resolution.
 * Uses AABB (Axis-Aligned Bounding Box) logic.
 */

import { gameState } from './globals.js';

/**
 * Checks for AABB collision between two rectangular entities.
 * @param {Object} a - Entity A {x, y, width, height}
 * @param {Object} b - Entity B {x, y, width, height}
 * @returns {boolean} True if colliding
 */
export function checkAABB(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

/**
 * Checks collision between a rectangle and a point.
 */
export function checkPointRect(px, py, rect) {
    return (
        px >= rect.x &&
        px <= rect.x + rect.width &&
        py >= rect.y &&
        py <= rect.y + rect.height
    );
}

/**
 * Resolves collision between a dynamic entity (mover) and a static entity (obstacle).
 * Adjusts mover's position and velocity.
 * @param {Object} mover - The moving entity (Player, Enemy)
 * @param {Object} obstacle - The static entity (Platform)
 */
export function resolveCollision(mover, obstacle) {
    // Calculate overlap on both axes
    const dx = (mover.x + mover.width / 2) - (obstacle.x + obstacle.width / 2);
    const dy = (mover.y + mover.height / 2) - (obstacle.y + obstacle.height / 2);
    const combinedHalfWidth = mover.width / 2 + obstacle.width / 2;
    const combinedHalfHeight = mover.height / 2 + obstacle.height / 2;

    const overlapX = combinedHalfWidth - Math.abs(dx);
    const overlapY = combinedHalfHeight - Math.abs(dy);

    if (overlapX > 0 && overlapY > 0) {
        // Collision confirmed. Resolve along the axis of least penetration.
        if (overlapX < overlapY) {
            // Horizontal collision
            if (dx > 0) {
                mover.x += overlapX; // Push right
            } else {
                mover.x -= overlapX; // Push left
            }
            mover.vx = 0;
        } else {
            // Vertical collision
            if (dy > 0) {
                mover.y += overlapY; // Push down (hit head on ceiling)
                mover.vy = Math.max(0, mover.vy);
            } else {
                mover.y -= overlapY; // Push up (land on ground)
                mover.vy = 0; // Stop falling
                mover.onGround = true; // Set ground flag
            }
        }
        return true;
    }
    return false;
}

/**
 * Raycast helper to check line of sight or projectile path.
 * Simple implementation checking against platform list.
 */
export function raycastPlatforms(x1, y1, x2, y2) {
    // This is a simplified check, iterating through platforms
    // For high precision, we'd walk the line. 
    // Here we just check if the line segment intersects any platform rect.
    
    // Line-Rect intersection is complex, let's use p5.collide2d logic if needed,
    // or just check the endpoint for simple projectile hits if speed is high.
    // Since we have p5.collide2d, we can use it conceptually or implementing a simple version.
    
    // For now, projectiles move in steps, so we check AABB at new position.
    return false; 
}