/**
 * physics.js
 * Contains physics calculations, collision detection, and spatial logic.
 * Uses p5.collide2D for primitive checks and custom logic for game-specific physics (2.5D beat-em-up).
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, HORIZON_Y, GROUND_Y, LEVEL_WIDTH } from './globals.js';
// We assume p5.collide2D is loaded globally via HTML script tag, so we access it via window or p5 instance if needed.
// However, since we are writing custom logic inside classes often, we'll define helpers here.

/**
 * Axis-Aligned Bounding Box
 */
export class AABB {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    // Update position center-based
    update(centerX, centerY) {
        this.x = centerX - this.w / 2;
        this.y = centerY - this.h / 2;
    }
    
    // Get center
    get center() {
        return { x: this.x + this.w / 2, y: this.y + this.h / 2 };
    }
}

/**
 * Simple 2D box collision check
 */
export function checkAABB(box1, box2) {
    return (
        box1.x < box2.x + box2.w &&
        box1.x + box1.w > box2.x &&
        box1.y < box2.y + box2.h &&
        box1.y + box1.h > box2.y
    );
}

/**
 * Checks for collision in the 2.5D plane.
 * In beat 'em ups, entities must be close in the Y axis (depth) as well as overlapping in X/Z(vertical).
 * Here, we treat 'y' as the ground depth position, and 'z' as altitude (jumping).
 * 
 * @param {Entity} entity1 
 * @param {Entity} entity2 
 * @param {number} depthThreshold - How close they must be in Y (depth) to touch
 */
export function checkEntityCollision(entity1, entity2, depthThreshold = 20) {
    // Check Depth (Y axis overlap)
    if (Math.abs(entity1.y - entity2.y) > depthThreshold) {
        return false;
    }

    // Check Horizontal (X axis)
    // We use a thinner hitbox for body overlap than the sprite width usually
    const width1 = entity1.width * 0.5;
    const width2 = entity2.width * 0.5;
    
    if (Math.abs(entity1.x - entity2.x) > (width1 + width2) / 2) {
        return false;
    }

    // Check Altitude (Z axis / Jumping height)
    // entity.z is height above ground (positive is up)
    const height1 = entity1.height;
    const height2 = entity2.height;
    
    // Entities overlap vertically if their height ranges overlap
    const bottom1 = entity1.z;
    const top1 = entity1.z + height1;
    const bottom2 = entity2.z;
    const top2 = entity2.z + height2;

    return (bottom1 < top2 && top1 > bottom2);
}

/**
 * Attack Hitbox Check
 * @param {Entity} attacker 
 * @param {Object} hitbox - {offsetX, offsetY, width, height}
 * @param {Entity} target 
 */
export function checkAttackHit(attacker, hitbox, target) {
    // 1. Check Depth Alignment
    if (Math.abs(attacker.y - target.y) > 30) return false;

    // 2. Calculate World Space Hitbox
    // Hitbox x is relative to attacker center and facing direction
    const boxX = attacker.x + (hitbox.offsetX * attacker.facing) - (hitbox.width / 2);
    // Hitbox y (altitude) is relative to attacker Z
    const boxZ = attacker.z + hitbox.offsetY - (hitbox.height / 2);

    const attackBox = {
        x: boxX,
        y: boxZ,
        w: hitbox.width,
        h: hitbox.height
    };

    const targetBox = {
        x: target.x - target.width/2,
        y: target.z,
        w: target.width,
        h: target.height
    };

    return checkAABB(attackBox, targetBox);
}

/**
 * Constrains an entity to the playable floor area.
 */
export function constrainToLevel(entity) {
    // Constrain Y (Depth)
    if (entity.y < HORIZON_Y) entity.y = HORIZON_Y;
    if (entity.y > GROUND_Y) entity.y = GROUND_Y;

    // Constrain X (Level Length)
    if (entity.x < 0) entity.x = 0;
    if (entity.x > LEVEL_WIDTH) entity.x = LEVEL_WIDTH;
}

/**
 * Resolves soft collision between characters to prevent stacking.
 */
export function resolveCharacterSpacing(entities) {
    for (let i = 0; i < entities.length; i++) {
        for (let j = i + 1; j < entities.length; j++) {
            const e1 = entities[i];
            const e2 = entities[j];

            // Only push if alive and on ground
            if (e1.dead || e2.dead) continue;

            const dx = e1.x - e2.x;
            const dy = e1.y - e2.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const minSpace = 30; // Minimum distance between centers

            if (dist < minSpace && dist > 0) {
                const overlap = minSpace - dist;
                const pushX = (dx / dist) * overlap * 0.1; // Soft push
                const pushY = (dy / dist) * overlap * 0.1;

                e1.x += pushX;
                e1.y += pushY;
                e2.x -= pushX;
                e2.y -= pushY;
            }
        }
    }
}