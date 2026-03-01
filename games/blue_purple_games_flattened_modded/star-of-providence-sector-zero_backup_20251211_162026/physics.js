/**
 * physics.js
 * Collision detection and basic physics utilities.
 * Uses p5.collide2d implicitly by implementing custom AABB and Circle checks for performance and control.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

// AABB Collision (Axis-Aligned Bounding Box)
export function checkAABB(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

// Circle Collision
export function checkCircleCollision(c1, c2) {
    const dx = c1.x - c2.x;
    const dy = c1.y - c2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (c1.radius + c2.radius);
}

// Circle-Rectangle Collision
export function checkCircleRect(circle, rect) {
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

// Utility: Clamp value between min and max
export function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

// Basic movement physics with wall sliding
export function moveEntityWithCollisions(entity, dx, dy, walls) {
    // Move X
    entity.x += dx;
    // Check wall collisions X
    for (let wall of walls) {
        if (checkCircleRect(entity, wall)) {
            // Resolve X
            if (dx > 0) { // Moving right
                entity.x = wall.x - entity.radius;
            } else if (dx < 0) { // Moving left
                entity.x = wall.x + wall.width + entity.radius;
            }
        }
    }
    
    // Check bounds X
    if (entity.x - entity.radius < 0) entity.x = entity.radius;
    if (entity.x + entity.radius > CANVAS_WIDTH) entity.x = CANVAS_WIDTH - entity.radius;

    // Move Y
    entity.y += dy;
    // Check wall collisions Y
    for (let wall of walls) {
        if (checkCircleRect(entity, wall)) {
            // Resolve Y
            if (dy > 0) { // Moving down
                entity.y = wall.y - entity.radius;
            } else if (dy < 0) { // Moving up
                entity.y = wall.y + wall.height + entity.radius;
            }
        }
    }

    // Check bounds Y
    if (entity.y - entity.radius < 0) entity.y = entity.radius;
    if (entity.y + entity.radius > CANVAS_HEIGHT) entity.y = CANVAS_HEIGHT - entity.radius;
}