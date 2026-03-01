/**
 * Physics Engine Module
 * 
 * Handles collision detection, spatial calculations, and AABB physics logic.
 * Uses p5.collide2D for precise shape overlaps.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, BLAST_ZONE_PADDING } from './globals.js';
import { collideRectRect } from 'https://cdn.jsdelivr.net/npm/p5.collide2d@1.0.0/+esm';

// ==========================================
// COLLISION DETECTION
// ==========================================

/**
 * Checks AABB collision between two rectangular entities.
 * @param {object} a - Entity A
 * @param {object} b - Entity B
 * @returns {boolean} True if colliding
 */
export function checkAABB(a, b) {
    // Simple AABB first for performance
    if (a.x + a.width < b.x || a.x > b.x + b.width ||
        a.y + a.height < b.y || a.y > b.y + b.height) {
        return false;
    }
    
    // Use p5.collide2D for confirmation if needed (though AABB is sufficient for rects)
    return collideRectRect(a.x, a.y, a.width, a.height, b.x, b.y, b.width, b.height);
}

/**
 * Resolves collisions between a dynamic entity and static platforms.
 * Handles solid ground, walls, and ceilings.
 * @param {object} entity - The moving entity (Player/Enemy)
 * @param {Array} platforms - List of platform objects
 */
export function resolvePlatformCollisions(entity, platforms) {
    entity.onGround = false;
    
    for (const platform of platforms) {
        // Broad phase check
        if (!checkAABB(entity, platform)) continue;
        
        // Calculate overlap
        // We check previous position to determine collision normal
        const prevBottom = entity.lastY + entity.height;
        const prevTop = entity.lastY;
        const prevLeft = entity.lastX;
        const prevRight = entity.lastX + entity.width;
        
        // Floor Collision (Landing)
        // Only collide if we were previously above the platform AND falling/stationary
        if (prevBottom <= platform.y + 5 && entity.vy >= 0) {
            // Snap to top
            entity.y = platform.y - entity.height;
            entity.vy = 0;
            entity.onGround = true;
            continue; // Prioritize floor
        }
        
        // Ceiling Collision
        if (prevTop >= platform.y + platform.height && entity.vy < 0) {
            entity.y = platform.y + platform.height;
            entity.vy = 0;
            continue;
        }
        
        // Wall Collision
        // Left Wall (hitting right side of platform)
        if (prevRight <= platform.x && entity.vx > 0) {
            entity.x = platform.x - entity.width;
            entity.vx = 0;
        }
        // Right Wall (hitting left side of platform)
        else if (prevLeft >= platform.x + platform.width && entity.vx < 0) {
            entity.x = platform.x + platform.width;
            entity.vx = 0;
        }
    }
}

// ==========================================
// GAMEPLAY PHYSICS
// ==========================================

/**
 * Calculates knockback velocity based on damage percentage and base power.
 * Formula: Velocity = Base * (1 + Damage/100 * Scaling)
 * @param {number} damagePercent - Current damage of victim
 * @param {number} baseKnockback - Base power of the attack
 * @param {number} knockbackScaling - How much percent affects this attack
 * @returns {number} Magnitude of knockback
 */
export function calculateKnockbackMagnitude(damagePercent, baseKnockback, knockbackScaling) {
    return baseKnockback + (damagePercent * 0.1 * knockbackScaling);
}

/**
 * Checks if an entity is outside the blast zones (Ring Out).
 * @param {object} entity 
 * @returns {boolean} True if dead
 */
export function checkBlastZone(entity) {
    return (
        entity.x < -BLAST_ZONE_PADDING ||
        entity.x > CANVAS_WIDTH + BLAST_ZONE_PADDING ||
        entity.y < -BLAST_ZONE_PADDING ||
        entity.y > CANVAS_HEIGHT + BLAST_ZONE_PADDING
    );
}

/**
 * Basic Euler integration for movement.
 * @param {object} entity 
 */
export function applyPhysics(entity) {
    // Store previous position for collision resolution
    entity.lastX = entity.x;
    entity.lastY = entity.y;
    
    // Apply velocity
    entity.x += entity.vx;
    entity.y += entity.vy;
    
    // Apply gravity
    if (!entity.onGround) {
        entity.vy += gameState.gravity || 0.6;
    }
    
    // Friction (Ground)
    if (entity.onGround) {
        entity.vx *= gameState.friction || 0.85;
    } else {
        entity.vx *= gameState.airResistance || 0.95;
    }
    
    // Terminal velocity
    const termVel = gameState.terminalVelocity || 15;
    if (entity.vy > termVel) entity.vy = termVel;
    
    // Stop very small movements
    if (Math.abs(entity.vx) < 0.1) entity.vx = 0;
}