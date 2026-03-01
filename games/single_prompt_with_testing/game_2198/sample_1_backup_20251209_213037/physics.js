/**
 * physics.js
 * Collision detection and resolution library.
 * Uses p5.collide2D and custom AABB logic.
 */

import { gameState, TILE_SIZE } from './globals.js';
// We assume p5.collide2d is loaded globally via script tag as per instructions

/**
 * Axis Aligned Bounding Box (AABB) Collision Check
 * @param {Object} a - Entity A with {x, y, width, height}
 * @param {Object} b - Entity B with {x, y, width, height}
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
 * Resolves collisions between a dynamic entity (player) and static platforms.
 * Modifies entity position and velocity.
 * @param {Object} entity - The dynamic entity
 * @param {Array} platforms - Array of static platform objects
 */
export function resolvePlatformCollisions(entity, platforms) {
    entity.onGround = false;

    // Optimization: Only check platforms near the entity (Spatial Partitioning Lite)
    // We assume platforms are sorted by X or we just check a range.
    // For this size, iterating all is "okay", but let's be smarter.
    // Filter platforms within X range.
    const relevantPlatforms = platforms.filter(p => 
        p.x > entity.x - TILE_SIZE * 2 && 
        p.x < entity.x + entity.width + TILE_SIZE * 2
    );

    for (let platform of relevantPlatforms) {
        // Simple AABB Check
        if (checkAABB(entity, platform)) {
            // Determine collision side based on previous frame position (tunneling prevention)
            // or overlap amounts.
            
            // Calculate overlaps
            const overlapX = (entity.width + platform.width) / 2 - Math.abs((entity.x + entity.width / 2) - (platform.x + platform.width / 2));
            const overlapY = (entity.height + platform.height) / 2 - Math.abs((entity.y + entity.height / 2) - (platform.y + platform.height / 2));

            // Resolve along axis of least overlap
            if (overlapX < overlapY) {
                // Horizontal Collision
                if (entity.x < platform.x) {
                    entity.x -= overlapX; // Push Left
                    entity.vx = 0;
                } else {
                    entity.x += overlapX; // Push Right
                    entity.vx = 0;
                }
            } else {
                // Vertical Collision
                if (entity.y < platform.y) {
                    // Landed on top
                    entity.y -= overlapY;
                    entity.vy = 0;
                    entity.onGround = true;
                } else {
                    // Hit head on bottom
                    entity.y += overlapY;
                    entity.vy = 0;
                }
            }
        }
    }
}

/**
 * Checks overlap with triggers/collectibles (no physics resolution).
 * @param {Object} entity 
 * @param {Array} targets 
 * @returns {Array} List of targets collided with
 */
export function checkTriggerCollisions(entity, targets) {
    const hits = [];
    for (let target of targets) {
        // Skip if target is inactive/collected
        if (target.collected) continue;

        // Use circle collision if radius exists, else Rect
        if (target.radius) {
            // Circle vs Rect
            // p5.collide2d: collideRectCircle(rx, ry, rw, rh, cx, cy, diameter)
            // Note: target.radius is usually half-width. p5.collide uses diameter often?
            // Let's implement manual logic for Rect vs Circle to be safe and dependency-free if needed.
            
            let testX = target.x;
            let testY = target.y;
            
            // Find closest point on rect
            if (target.x < entity.x) testX = entity.x;
            else if (target.x > entity.x + entity.width) testX = entity.x + entity.width;
            
            if (target.y < entity.y) testY = entity.y;
            else if (target.y > entity.y + entity.height) testY = entity.y + entity.height;
            
            const distX = target.x - testX;
            const distY = target.y - testY;
            const distance = Math.sqrt(distX*distX + distY*distY);
            
            if (distance <= target.radius) {
                hits.push(target);
            }
        } else {
            if (checkAABB(entity, target)) {
                hits.push(target);
            }
        }
    }
    return hits;
}

/**
 * Checks for collision with Triangle Spikes
 * @param {Object} entity 
 * @param {Array} spikes 
 * @returns {boolean} True if any collision
 */
export function checkSpikeCollisions(entity, spikes) {
    // Filter nearby
    const nearbySpikes = spikes.filter(s => 
        s.x > entity.x - 50 && s.x < entity.x + 50
    );

    for (let spike of nearbySpikes) {
        // Spike geometry: Triangle. 
        // p5.collide2d: collideRectPoly(rx, ry, rw, rh, vertices)
        
        // Define spike vertices
        // Spikes are typically pointing up.
        // Base at y + height, tip at y, center x.
        const x1 = spike.x; // Bottom Left
        const y1 = spike.y + spike.height;
        const x2 = spike.x + spike.width / 2; // Top Tip
        const y2 = spike.y;
        const x3 = spike.x + spike.width; // Bottom Right
        const y3 = spike.y + spike.height;

        const hit = window.collideRectPoly(
            entity.x, entity.y, entity.width, entity.height,
            [
                {x: x1, y: y1},
                {x: x2, y: y2},
                {x: x3, y: y3}
            ]
        );

        if (hit) return true;
    }
    return false;
}