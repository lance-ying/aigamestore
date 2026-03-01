/**
 * physics.js
 * Handles collision detection, movement physics, and spatial calculations.
 */

import { gameState, WORLD_WIDTH, WORLD_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
// Using p5.collide2D via global window object as it's loaded via script tag, 
// but we wrap calls here for modularity.

export const Physics = {
    
    /**
     * Checks collision between two circle colliders
     */
    checkCircleCollision(c1, c2) {
        if (!c1 || !c2) return false;
        // Manual implementation for performance (avoiding overhead of library calls for simple checks)
        const dx = c1.x - c2.x;
        const dy = c1.y - c2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (c1.radius + c2.radius);
    },

    /**
     * Checks collision between a point and a circle
     */
    checkPointCircle(x, y, circle) {
        const dx = x - circle.x;
        const dy = y - circle.y;
        return (dx*dx + dy*dy) < (circle.radius * circle.radius);
    },

    /**
     * Checks collision between a rectangle (AABB) and a circle
     */
    checkRectCircle(rect, circle) {
        // Find the closest point on the rect to the circle center
        let closestX = clamp(circle.x, rect.x, rect.x + rect.w);
        let closestY = clamp(circle.y, rect.y, rect.y + rect.h);

        // Calculate distance between circle center and closest point
        let distanceX = circle.x - closestX;
        let distanceY = circle.y - closestY;

        // If distance < radius, collision occurred
        let distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
        return distanceSquared < (circle.radius * circle.radius);
    },

    /**
     * Apply standard top-down physics movement
     * @param {Entity} entity - The entity to move
     */
    applyMovement(entity) {
        // Update position
        entity.x += entity.vx;
        entity.y += entity.vy;
        
        // Constrain to World Bounds
        if (entity.x < entity.radius) {
            entity.x = entity.radius;
            entity.vx = 0;
        }
        if (entity.x > WORLD_WIDTH - entity.radius) {
            entity.x = WORLD_WIDTH - entity.radius;
            entity.vx = 0;
        }
        if (entity.y < entity.radius) {
            entity.y = entity.radius;
            entity.vy = 0;
        }
        if (entity.y > WORLD_HEIGHT - entity.radius) {
            entity.y = WORLD_HEIGHT - entity.radius;
            entity.vy = 0;
        }
    },

    /**
     * Resolve collisions between entities to prevent overlapping
     * Uses simple separation logic
     */
    resolveEntityCollisions(entity) {
        // Check against other entities
        for (let other of gameState.entities) {
            if (entity === other || other.isDead) continue;
            
            // Only collide with certain types if needed (e.g. Enemy vs Enemy)
            // For now, let's keep it simple: Enemies don't stack on each other
            if (entity.type === 'ENEMY' && other.type === 'ENEMY') {
                if (this.checkCircleCollision(entity, other)) {
                    // Calculate repulsion vector
                    let dx = entity.x - other.x;
                    let dy = entity.y - other.y;
                    let dist = Math.sqrt(dx*dx + dy*dy);
                    
                    if (dist === 0) { dx = 1; dy = 0; dist = 1; } // Prevent div by 0
                    
                    // Normalize and push apart
                    let pushX = (dx / dist) * 0.5;
                    let pushY = (dy / dist) * 0.5;
                    
                    entity.x += pushX;
                    entity.y += pushY;
                }
            }
        }
        
        // Player vs Enemy collision (body blocking)
        if (entity.type === 'PLAYER') {
            for (let other of gameState.entities) {
                if (other.type === 'ENEMY' && !other.isDead) {
                    if (this.checkCircleCollision(entity, other)) {
                        let dx = entity.x - other.x;
                        let dy = entity.y - other.y;
                        let dist = Math.sqrt(dx*dx + dy*dy);
                        if (dist === 0) dist = 1;
                        
                        // Push player away slightly
                        entity.x += (dx/dist) * 2;
                        entity.y += (dy/dist) * 2;
                    }
                }
            }
        }
    }
};

// Helper utility
function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}