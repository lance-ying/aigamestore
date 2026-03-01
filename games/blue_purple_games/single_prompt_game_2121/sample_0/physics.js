// Physics Engine and Collision Detection

import { gameState, PHYSICS, STAGE_BOUNDS } from './globals.js';
// Using p5.collide2D via global p5 instance if available, or manual implementation
// We assume p5.collide2D is loaded in index.html

/**
 * Checks for AABB collision between two rectangular entities.
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
 * Applies basic physics integration (Euler) to an entity.
 */
export function applyPhysics(entity) {
    if (entity.isStatic) return;

    // Apply Gravity
    entity.vy += PHYSICS.GRAVITY * entity.gravityScale;

    // Apply Velocity
    entity.x += entity.vx;
    entity.y += entity.vy;

    // Apply Friction (Ground) or Air Resistance (Air)
    if (entity.onGround) {
        entity.vx *= PHYSICS.FRICTION;
    } else {
        entity.vx *= PHYSICS.AIR_RESISTANCE;
    }

    // Terminal Velocity (Vertical)
    if (entity.vy > PHYSICS.TERMINAL_VELOCITY) {
        entity.vy = PHYSICS.TERMINAL_VELOCITY;
    }

    // Almost zero velocity cleanup
    if (Math.abs(entity.vx) < 0.1) entity.vx = 0;
    if (Math.abs(entity.vy) < 0.1) entity.vy = 0;
}

/**
 * Handles collisions between an entity and the stage platforms.
 */
export function handlePlatformCollisions(entity) {
    entity.onGround = false;
    entity.nearWallLeft = false;
    entity.nearWallRight = false;

    for (let platform of gameState.platforms) {
        // Broad phase check
        if (!checkAABB(entity, platform)) continue;

        // Determine collision side
        // Calculate overlap on each axis
        const overlapLeft = (entity.x + entity.width) - platform.x;
        const overlapRight = (platform.x + platform.width) - entity.x;
        const overlapTop = (entity.y + entity.height) - platform.y;
        const overlapBottom = (platform.y + platform.height) - entity.y;

        // Find smallest overlap to resolve
        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

        if (minOverlap === overlapTop && entity.vy >= 0) {
            // Landing on top
            // Only resolve if we were previously above the platform (simple check)
            // or if we are moving downwards significantly
            if (entity.y + entity.height - entity.vy <= platform.y + 10) { 
                entity.y = platform.y - entity.height;
                entity.vy = 0;
                entity.onGround = true;
            }
        } else if (minOverlap === overlapBottom && entity.vy < 0) {
            // Hitting bottom (ceiling)
            entity.y = platform.y + platform.height;
            entity.vy = 0;
        } else if (minOverlap === overlapLeft) {
            // Hitting left side of platform
            entity.x = platform.x - entity.width;
            entity.vx = 0;
            entity.nearWallRight = true;
        } else if (minOverlap === overlapRight) {
            // Hitting right side of platform
            entity.x = platform.x + platform.width;
            entity.vx = 0;
            entity.nearWallLeft = true;
        }
    }
}

/**
 * Checks if an entity is outside the blast zones.
 * @returns {boolean} true if dead
 */
export function checkBlastZone(entity) {
    if (entity.x < STAGE_BOUNDS.LEFT || 
        entity.x > STAGE_BOUNDS.RIGHT || 
        entity.y > STAGE_BOUNDS.BOTTOM || 
        entity.y < STAGE_BOUNDS.TOP) {
        return true;
    }
    return false;
}

/**
 * Calculates and applies knockback to a target based on damage percent.
 */
export function applyKnockback(target, sourceX, sourceY, baseKnockback, angleRad, damageDealt) {
    if (target.invincible) return;

    // Update target damage
    target.damagePercent += damageDealt;

    // Calculate knockback magnitude
    // Formula: ((((Damage% / 10) + (DamageDealt * Damage%) / 20) * 1.4 + 18) * Growth) + Base
    // Simplified for this game:
    const knockbackMag = PHYSICS.BASE_KNOCKBACK + (target.damagePercent * PHYSICS.KNOCKBACK_SCALING * (baseKnockback / 5));

    target.vx = Math.cos(angleRad) * knockbackMag;
    target.vy = Math.sin(angleRad) * knockbackMag;
    
    // Apply hitstun
    target.hitstun = Math.floor(knockbackMag * 2); // Frames of stun
    target.state = "STUN";
}

/**
 * Checks overlap of a hitbox (attack) with hurtboxes (entities).
 */
export function checkAttackCollision(attackHitbox, targetEntity) {
    // Simple rect-rect check for hitbox vs target
    // attackHitbox: {x, y, width, height}
    // targetEntity: entity object
    
    if (targetEntity.invincible || targetEntity.state === "DEAD") return false;

    return (
        attackHitbox.x < targetEntity.x + targetEntity.width &&
        attackHitbox.x + attackHitbox.width > targetEntity.x &&
        attackHitbox.y < targetEntity.y + targetEntity.height &&
        attackHitbox.y + attackHitbox.height > targetEntity.y
    );
}