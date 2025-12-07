/**
 * physics.js
 * Contains collision detection algorithms and physics helpers.
 * Wraps p5.collide2D functionality and adds custom logic.
 */

import { gameState, WORLD_WIDTH, WORLD_HEIGHT } from './globals.js';

/**
 * Check collision between two rectangles.
 * @param {object} r1 - {x, y, width, height}
 * @param {object} r2 - {x, y, width, height}
 * @returns {boolean}
 */
export function checkAABB(r1, r2) {
    return (
        r1.x < r2.x + r2.width &&
        r1.x + r1.width > r2.x &&
        r1.y < r2.y + r2.height &&
        r1.y + r1.height > r2.y
    );
}

/**
 * Check collision between a rectangle and a circle.
 * @param {object} rect - {x, y, width, height}
 * @param {object} circle - {x, y, radius} (Assuming radius is half-width, or explicit radius property)
 * @returns {boolean}
 */
export function checkRectCircle(rect, circle) {
    // Find the closest point on the rect to the circle center
    let testX = circle.x;
    let testY = circle.y;

    if (circle.x < rect.x) testX = rect.x;
    else if (circle.x > rect.x + rect.width) testX = rect.x + rect.width;

    if (circle.y < rect.y) testY = rect.y;
    else if (circle.y > rect.y + rect.height) testY = rect.y + rect.height;

    // Distance from closest point to center
    let distX = circle.x - testX;
    let distY = circle.y - testY;
    let distance = Math.sqrt((distX * distX) + (distY * distY));

    return distance <= circle.radius;
}

/**
 * Resolves collisions between a dynamic entity (like player) and static map platforms.
 * Handles wall sliding, floor landing, and ceiling hitting.
 * @param {object} entity - The moving entity
 * @param {Array} platforms - List of platform objects
 */
export function resolveMapCollisions(entity, platforms) {
    entity.onGround = false;

    // Sort platforms by distance to prioritize close ones (simple optimization)
    // For now, we iterate all.

    for (let platform of platforms) {
        // Skip phasable platforms if entity is phasing
        if (entity.isPhasing && platform.type === "PHASABLE") continue;

        // Broadphase check
        if (!checkAABB(entity, platform)) continue;

        // Calculate overlap amounts
        // We look at the previous position to determine collision normal
        
        // Entity center
        let entCX = entity.x + entity.width / 2;
        let entCY = entity.y + entity.height / 2;
        
        // Platform center
        let platCX = platform.x + platform.width / 2;
        let platCY = platform.y + platform.height / 2;

        let dx = entCX - platCX;
        let dy = entCY - platCY;

        let combinedHalfWidth = (entity.width + platform.width) / 2;
        let combinedHalfHeight = (entity.height + platform.height) / 2;

        let overlapX = combinedHalfWidth - Math.abs(dx);
        let overlapY = combinedHalfHeight - Math.abs(dy);

        // Determine collision side based on minimum overlap
        if (overlapX < overlapY) {
            // Horizontal Collision
            if (dx > 0) {
                // Hit left side of entity (Right side of platform)
                entity.x += overlapX;
                entity.vx = 0;
            } else {
                // Hit right side of entity (Left side of platform)
                entity.x -= overlapX;
                entity.vx = 0;
            }
        } else {
            // Vertical Collision
            if (dy > 0) {
                // Hit top of entity (Bottom of platform) - Ceiling
                entity.y += overlapY;
                entity.vy = 0;
            } else {
                // Hit bottom of entity (Top of platform) - Floor
                entity.y -= overlapY;
                entity.vy = 0;
                entity.onGround = true;
            }
        }
    }
    
    // World Boundary checking
    if (entity.x < 0) {
        entity.x = 0;
        entity.vx = 0;
    }
    if (entity.x + entity.width > WORLD_WIDTH) {
        entity.x = WORLD_WIDTH - entity.width;
        entity.vx = 0;
    }
    // Floor death plane
    if (entity.y > WORLD_HEIGHT + 100) {
        if (entity.takeDamage) entity.takeDamage(999);
    }
}