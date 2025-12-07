/**
 * Physics and collision detection utilities
 */
import { TILE_SIZE } from './globals.js';

// Axis-Aligned Bounding Box (AABB) collision
export function checkRectCollision(r1, r2) {
    return (
        r1.x < r2.x + r2.width &&
        r1.x + r1.width > r2.x &&
        r1.y < r2.y + r2.height &&
        r1.y + r1.height > r2.y
    );
}

export function checkCircleCollision(c1, c2) {
    const dx = c1.x - c2.x;
    const dy = c1.y - c2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < c1.radius + c2.radius;
}

export function checkRectCircleCollision(rect, circle) {
    // Find the closest point to the circle within the rectangle
    let closestX = clamp(circle.x, rect.x, rect.x + rect.width);
    let closestY = clamp(circle.y, rect.y, rect.y + rect.height);

    // Calculate the distance between the circle's center and this closest point
    let distanceX = circle.x - closestX;
    let distanceY = circle.y - closestY;

    // If the distance is less than the circle's radius, an intersection occurs
    let distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
    return distanceSquared < (circle.radius * circle.radius);
}

function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

// Check grid-based collision for simple walls
// Returns true if the bounding box overlaps with any wall tile
export function checkWallCollisions(entity, walls) {
    for (const wall of walls) {
        if (checkRectCollision(entity, wall)) {
            return true;
        }
    }
    return false;
}

// Resolve collision by pushing entity back
// A simple resolution strategy that checks X and Y axes independently
export function resolveWallCollision(entity, walls) {
    // We assume entity was updated and now might be colliding
    // This function is complex for a grid system, so we typically 
    // move X, check, resolve. Move Y, check, resolve.
    // This is handled in the Entity update loop usually.
    // Here we provide a checker.
    
    // See Entity.update() for implementation
}