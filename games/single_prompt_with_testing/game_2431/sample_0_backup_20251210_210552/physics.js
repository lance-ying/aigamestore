/**
 * Physics engine handling collision detection, gravity, and movement updates.
 * While this game is grid-based/lane-based, we use physics for particles 
 * and tree falling animations.
 */

import { gameState, GAME_CONFIG, CANVAS_HEIGHT, SIDE } from './globals.js';
import { collideRectRect } from 'https://cdn.jsdelivr.net/npm/p5.collide2d@1.0.0/+esm';

/**
 * Checks collision between the player and the tree branch.
 * @param {object} player - The player entity
 * @param {object} treeSegment - The bottom-most tree segment that might hit the player
 * @returns {boolean} - True if collision detected
 */
export function checkPlayerTreeCollision(player, treeSegment) {
    if (!treeSegment) return false;
    
    // In this specific game logic, collision happens if:
    // 1. The player is on the same side as a branch
    // 2. The tree segment is the one effectively at "head level"
    // Since we abstract the tree as a stack, the "collision" is logic-based 
    // rather than AABB based for the core mechanic, but we verify logical states here.
    
    // If the segment has a branch on the player's side
    if (treeSegment.hasBranch && treeSegment.branchSide === player.side) {
        return true;
    }
    
    return false;
}

/**
 * Updates positions of physics-based entities (particles).
 */
export function updatePhysics(entities) {
    for (let i = entities.length - 1; i >= 0; i--) {
        const entity = entities[i];
        
        // Apply Gravity if entity has mass
        if (entity.useGravity) {
            entity.vy += GAME_CONFIG.GRAVITY;
        }
        
        // Apply Velocity
        entity.x += entity.vx;
        entity.y += entity.vy;
        
        // Apply Rotation
        if (entity.rotationSpeed) {
            entity.rotation += entity.rotationSpeed;
        }
        
        // Floor Collision for particles
        if (entity.y > CANVAS_HEIGHT + 50) { // Off screen bottom
            entity.dead = true;
        }
    }
}

/**
 * Calculates screenshake offsets.
 * @returns {object} {x, y} offset values
 */
export function getShakeOffset(p) {
    if (gameState.shakeTimer > 0) {
        gameState.shakeTimer--;
        const mag = gameState.shakeMagnitude;
        const x = p.random(-mag, mag);
        const y = p.random(-mag, mag);
        return { x, y };
    }
    return { x: 0, y: 0 };
}

/**
 * Triggers a screen shake effect.
 * @param {number} duration - Frames to shake
 * @param {number} magnitude - Pixel intensity
 */
export function triggerShake(duration, magnitude) {
    gameState.shakeTimer = duration;
    gameState.shakeMagnitude = magnitude;
}

/**
 * Easing function for smooth animations (e.g. tree falling down).
 * Ease Out Cubic
 */
export function easeOutCubic(x) {
    return 1 - Math.pow(1 - x, 3);
}