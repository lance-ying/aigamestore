/**
 * Physics engine handling collisions, gravity, and spatial calculations.
 * Uses AABB (Axis-Aligned Bounding Box) for detection.
 */

import { gameState, GRAVITY, TERMINAL_VELOCITY, CANVAS_HEIGHT } from './globals.js';

/**
 * Checks for AABB collision between two rectangular entities.
 * @param {Object} a - Entity A with x, y, width, height
 * @param {Object} b - Entity B with x, y, width, height
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
 * Checks for collision between a rectangular entity and a circular entity.
 * @param {Object} rect - Rectangle entity (x, y, width, height)
 * @param {Object} circle - Circle entity (x, y, radius) (x,y is center)
 * @returns {boolean} True if colliding
 */
export function checkRectCircle(rect, circle) {
    // Find the closest point on the rectangle to the center of the circle
    let testX = circle.x;
    let testY = circle.y;

    if (circle.x < rect.x) testX = rect.x;
    else if (circle.x > rect.x + rect.width) testX = rect.x + rect.width;

    if (circle.y < rect.y) testY = rect.y;
    else if (circle.y > rect.y + rect.height) testY = rect.y + rect.height;

    // Get distance from closest edges
    const distX = circle.x - testX;
    const distY = circle.y - testY;
    const distance = Math.sqrt((distX * distX) + (distY * distY));

    return distance <= circle.radius;
}

/**
 * Resolves collision between a dynamic entity (player/enemy) and a static platform.
 * Modifies the entity's position and velocity.
 * @param {Object} entity - The moving entity
 * @param {Object} platform - The static obstacle
 */
export function resolvePlatformCollision(entity, platform) {
    // Calculate overlap
    const dx = (entity.x + entity.width / 2) - (platform.x + platform.width / 2);
    const dy = (entity.y + entity.height / 2) - (platform.y + platform.height / 2);
    
    const combinedHalfWidth = entity.width / 2 + platform.width / 2;
    const combinedHalfHeight = entity.height / 2 + platform.height / 2;

    const overlapX = combinedHalfWidth - Math.abs(dx);
    const overlapY = combinedHalfHeight - Math.abs(dy);

    if (overlapX > 0 && overlapY > 0) {
        // Resolve along the axis of least penetration
        if (overlapX < overlapY) {
            // Horizontal collision
            if (dx > 0) {
                // Entity is to the right
                entity.x += overlapX;
                // Wall jumping logic could go here
            } else {
                // Entity is to the left
                entity.x -= overlapX;
            }
            entity.vx = 0;
            
            // Wall slide logic hook
            if (entity.handleWallCollision) {
                entity.handleWallCollision(dx > 0 ? -1 : 1); // Normal direction
            }
        } else {
            // Vertical collision
            if (dy > 0) {
                // Entity is below (hitting head)
                entity.y += overlapY;
                entity.vy = 0;
            } else {
                // Entity is above (landing)
                entity.y -= overlapY;
                entity.vy = 0;
                entity.onGround = true;
            }
        }
    }
}

/**
 * Applies global forces like gravity to an entity.
 * @param {Object} entity 
 */
export function applyPhysics(entity) {
    // Apply Gravity
    if (!entity.onGround) {
        entity.vy += GRAVITY;
    }

    // Terminal Velocity Cap
    if (entity.vy > TERMINAL_VELOCITY) {
        entity.vy = TERMINAL_VELOCITY;
    }

    // Move Y
    entity.y += entity.vy;
}

/**
 * A raycast implementation for AI and logic.
 * @param {number} x - Start X
 * @param {number} y - Start Y
 * @param {number} dirX - Direction X
 * @param {number} dirY - Direction Y
 * @param {number} length - Length of ray
 * @param {Array} obstacles - Array of platforms
 * @returns {boolean} True if hit
 */
export function raycast(x, y, dirX, dirY, length, obstacles) {
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
        const checkX = x + dirX * (length * (i / steps));
        const checkY = y + dirY * (length * (i / steps));
        
        for (let obs of obstacles) {
            if (checkX >= obs.x && checkX <= obs.x + obs.width &&
                checkY >= obs.y && checkY <= obs.y + obs.height) {
                return true;
            }
        }
    }
    return false;
}