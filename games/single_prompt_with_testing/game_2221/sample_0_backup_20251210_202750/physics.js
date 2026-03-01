/**
 * physics.js
 * Collision detection and spatial utilities.
 * Uses p5.collide2D for some checks, and custom AABB for platforming physics.
 */

import { collideRectRect, collideLineRect } from 'https://cdn.jsdelivr.net/npm/p5.collide2d@1.0.0/+esm';
import { gameState, CANVAS_HEIGHT } from './globals.js';

/**
 * Standard AABB collision check between two rectangular entities
 */
export function checkAABB(ent1, ent2) {
    return (
        ent1.x < ent2.x + ent2.width &&
        ent1.x + ent1.width > ent2.x &&
        ent1.y < ent2.y + ent2.height &&
        ent1.y + ent1.height > ent2.y
    );
}

/**
 * Raycast against platforms to find the first hit point
 * Useful for grappling hook logic
 * @param {number} startX 
 * @param {number} startY 
 * @param {number} dirX - Normalized direction X
 * @param {number} dirY - Normalized direction Y
 * @param {number} maxDist 
 * @param {Array} platforms 
 */
export function rayCastPlatforms(startX, startY, dirX, dirY, maxDist, platforms) {
    let closestHit = null;
    let closestDist = maxDist;
    const endX = startX + dirX * maxDist;
    const endY = startY + dirY * maxDist;

    for (const plat of platforms) {
        // Simple check if platform is generally in direction (optimization)
        // Then do precise line intersection
        
        // p5.collide2D collideLineRect returns boolean, but we need intersection point for a real raycast.
        // For simplicity in this game, we will step along the ray or check rect sides.
        // A simpler approach for a tile/rect based game:
        // Check intersection with each platform rectangle.
        
        const hit = collideLineRect(startX, startY, endX, endY, plat.x, plat.y, plat.width, plat.height, true);
        
        if (hit.x !== false) { // Collide2D with calcIntersection=true returns object {x,y} or boolean false ?? 
                              // Wait, the ESM import version might act differently. 
                              // Let's implement a custom AABB Ray intersect for reliability.
            const hitPoint = getRayRectIntersection(startX, startY, dirX, dirY, maxDist, plat);
            if (hitPoint) {
                const dist = Math.sqrt((hitPoint.x - startX)**2 + (hitPoint.y - startY)**2);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestHit = { x: hitPoint.x, y: hitPoint.y, entity: plat, type: 'platform' };
                }
            }
        }
    }
    return closestHit;
}

/**
 * Helper: Ray vs AABB intersection
 */
function getRayRectIntersection(px, py, dx, dy, maxDist, rect) {
    // Slabs method
    let tMin = 0;
    let tMax = maxDist;
    
    // X axis
    if (Math.abs(dx) < 0.00001) {
        if (px < rect.x || px > rect.x + rect.width) return null;
    } else {
        const invD = 1.0 / dx;
        let t1 = (rect.x - px) * invD;
        let t2 = (rect.x + rect.width - px) * invD;
        if (t1 > t2) [t1, t2] = [t2, t1];
        tMin = Math.max(tMin, t1);
        tMax = Math.min(tMax, t2);
        if (tMin > tMax) return null;
    }
    
    // Y axis
    if (Math.abs(dy) < 0.00001) {
        if (py < rect.y || py > rect.y + rect.height) return null;
    } else {
        const invD = 1.0 / dy;
        let t1 = (rect.y - py) * invD;
        let t2 = (rect.y + rect.height - py) * invD;
        if (t1 > t2) [t1, t2] = [t2, t1];
        tMin = Math.max(tMin, t1);
        tMax = Math.min(tMax, t2);
        if (tMin > tMax) return null;
    }
    
    return {
        x: px + dx * tMin,
        y: py + dy * tMin
    };
}

/**
 * Resolves entity movement vs platforms (Semi-solid and Solid)
 * @param {Object} entity 
 * @param {Array} platforms 
 */
export function resolvePlatformCollisions(entity, platforms) {
    entity.onGround = false;
    
    for (const plat of platforms) {
        if (checkAABB(entity, plat)) {
            // Collision Detected
            
            // Calculate overlap
            const overlapX = (entity.width + plat.width) / 2 - Math.abs((entity.x + entity.width/2) - (plat.x + plat.width/2));
            const overlapY = (entity.height + plat.height) / 2 - Math.abs((entity.y + entity.height/2) - (plat.y + plat.height/2));
            
            // Determine direction of collision based on previous frame position (tunneling prevention)
            // For simple platforming: check if we were above the platform previously
            
            const prevBottom = entity.lastY + entity.height;
            
            // Landing on top
            // If we were above the top of the platform in the last frame AND we are moving down
            if (prevBottom <= plat.y + 10 && entity.vy >= 0) { // +10 tolerance
                entity.y = plat.y - entity.height;
                entity.vy = 0;
                entity.onGround = true;
                entity.groundEntity = plat;
                continue; // Processed top collision
            }
            
            // Only Solid platforms block sides/bottom
            if (plat.type === "SOLID") {
                if (overlapX < overlapY) {
                    // Horizontal collision
                    if (entity.x < plat.x) {
                        entity.x = plat.x - entity.width; // Left side
                    } else {
                        entity.x = plat.x + plat.width; // Right side
                    }
                    entity.vx = 0;
                } else {
                    // Vertical collision (Bottom / Ceiling)
                    if (entity.y > plat.y) {
                        entity.y = plat.y + plat.height; // Hit head
                        entity.vy = 0;
                    }
                }
            }
        }
    }
}