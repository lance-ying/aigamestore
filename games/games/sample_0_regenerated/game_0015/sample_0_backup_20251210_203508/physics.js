/**
 * Physics engine and collision detection utilities.
 */

import { WORLD_WIDTH, WORLD_HEIGHT } from './globals.js';

/**
 * Check collision between two rectangles.
 */
export function checkRectOverlap(r1, r2) {
    return (
        r1.x < r2.x + r2.width &&
        r1.x + r1.width > r2.x &&
        r1.y < r2.y + r2.height &&
        r1.y + r1.height > r2.y
    );
}

/**
 * Check collision between a circle and a rectangle.
 */
export function checkCircleRect(circle, rect) {
    // Find the closest point on the rectangle to the circle center
    let testX = circle.x;
    let testY = circle.y;

    if (circle.x < rect.x) testX = rect.x;
    else if (circle.x > rect.x + rect.width) testX = rect.x + rect.width;

    if (circle.y < rect.y) testY = rect.y;
    else if (circle.y > rect.y + rect.height) testY = rect.y + rect.height;

    let distX = circle.x - testX;
    let distY = circle.y - testY;
    let distance = Math.sqrt((distX * distX) + (distY * distY));

    return distance <= circle.radius;
}

/**
 * Check collision between two circles.
 */
export function checkCircleCircle(c1, c2) {
    const dx = c1.x - c2.x;
    const dy = c1.y - c2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < c1.radius + c2.radius;
}

/**
 * Calculate distance between two points.
 */
export function getDistance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Get angle between two points in radians.
 */
export function getAngle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

/**
 * Constrain an entity within the world bounds.
 */
export function constrainToWorld(entity) {
    let collided = false;
    
    if (entity.x < 0) {
        entity.x = 0;
        entity.vx = 0;
        collided = true;
    }
    if (entity.x + entity.width > WORLD_WIDTH) {
        entity.x = WORLD_WIDTH - entity.width;
        entity.vx = 0;
        collided = true;
    }
    if (entity.y < 0) {
        entity.y = 0;
        entity.vy = 0;
        collided = true;
    }
    if (entity.y + entity.height > WORLD_HEIGHT) {
        entity.y = WORLD_HEIGHT - entity.height;
        entity.vy = 0;
        collided = true;
    }
    
    return collided;
}

/**
 * Simple 1D linear interpolation
 */
export function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}

/**
 * Standard vector normalization
 */
export function normalizeVector(vx, vy) {
    const mag = Math.sqrt(vx * vx + vy * vy);
    if (mag === 0) return { x: 0, y: 0 };
    return { x: vx / mag, y: vy / mag };
}