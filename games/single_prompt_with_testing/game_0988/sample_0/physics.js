/**
 * physics.js
 * Physics engine components, spatial partitioning, and collision resolution.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y } from './globals.js';
import { checkAABB } from './utils.js';

export function applyPhysics(entity) {
    // Apply Gravity
    if (!entity.onGround && entity.useGravity) {
        entity.vy += gameState.gravity;
    }

    // Apply Friction
    if (entity.onGround) {
        entity.vx *= gameState.friction;
    } else {
        entity.vx *= 0.95; // Air resistance
    }

    // Terminal velocity
    if (entity.vy > 15) entity.vy = 15;

    // Update Position
    entity.x += entity.vx;
    entity.y += entity.vy;

    // Floor Collision
    if (entity.y + entity.height > GROUND_Y) {
        entity.y = GROUND_Y - entity.height;
        entity.vy = 0;
        entity.onGround = true;
    } else {
        entity.onGround = false;
    }

    // World Bounds
    if (entity.x < 0) {
        entity.x = 0;
        entity.vx = 0;
    }
    if (entity.x + entity.width > CANVAS_WIDTH) {
        entity.x = CANVAS_WIDTH - entity.width;
        entity.vx = 0;
    }
}

/**
 * Checks attack collisions.
 * @param {Object} attacker - Entity dealing damage
 * @param {Object} target - Entity receiving damage
 */
export function resolveAttack(attacker, target) {
    // Calculate knockback
    const dir = attacker.x < target.x ? 1 : -1;
    target.vx = dir * 5;
    target.vy = -3;
    
    // Apply damage
    target.takeDamage(attacker.damage);
}