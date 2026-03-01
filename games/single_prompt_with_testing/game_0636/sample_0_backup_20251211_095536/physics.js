/**
 * physics.js
 * Handles collision detection, physics updates, and math utilities.
 */

import { gameState, GAME_CONFIG, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { collideCircleCircle, collideRectCircle, collideLineCircle } from 'https://unpkg.com/p5.collide2d@0.7.3/p5.collide2d.js';

/**
 * Normalizes an angle to be between 0 and TWO_PI
 */
export function normalizeAngle(angle) {
    const TWO_PI = Math.PI * 2;
    let a = angle % TWO_PI;
    if (a < 0) a += TWO_PI;
    return a;
}

/**
 * Checks collision between a flying knife and the target (log).
 * @param {Knife} knife 
 * @param {Target} target 
 */
export function checkKnifeTargetCollision(knife, target) {
    // Determine the hit point based on knife tip
    // Knife is a rectangle, we care about the top center point
    const tipX = knife.x;
    const tipY = knife.y - knife.height / 2;

    // Simple circle collision check for the tip entering the log
    const dist = Math.sqrt(Math.pow(tipX - target.x, 2) + Math.pow(tipY - target.y, 2));
    
    return dist <= target.radius;
}

/**
 * Checks if a newly stuck knife collides with any existing knives on the target.
 * This is the core "Fail" condition logic.
 * @param {number} hitAngle - The angle on the target where the new knife hit (radians)
 * @param {Array} existingKnives - Array of knives already on the target
 */
export function checkKnifeKnifeCollision(hitAngle, existingKnives) {
    const tolerance = GAME_CONFIG.collisionTolerance;
    
    for (let other of existingKnives) {
        // Calculate difference between angles
        // We need to account for the wrapping at 0/TWO_PI
        let diff = Math.abs(normalizeAngle(hitAngle) - normalizeAngle(other.angle));
        
        // Handle wrap-around case (e.g. 0.1 vs 6.2)
        if (diff > Math.PI) {
            diff = (Math.PI * 2) - diff;
        }
        
        if (diff < tolerance) {
            return true;
        }
    }
    return false;
}

/**
 * Checks if the knife hit an apple attached to the target.
 * @param {Knife} knife 
 * @param {Target} target 
 */
export function checkKnifeAppleCollision(knife, target) {
    if (!target.apples || target.apples.length === 0) return null;

    // Knife tip position
    const tipX = knife.x;
    const tipY = knife.y - knife.height / 2;

    for (let i = 0; i < target.apples.length; i++) {
        const apple = target.apples[i];
        
        // Calculate apple's world position based on target rotation
        const appleAngle = apple.angle + target.rotation;
        const appleX = target.x + Math.cos(appleAngle) * target.radius;
        const appleY = target.y + Math.sin(appleAngle) * target.radius;
        
        // Distance check (knife tip vs apple center)
        const dist = Math.sqrt(Math.pow(tipX - appleX, 2) + Math.pow(tipY - appleY, 2));
        
        if (dist < apple.radius + 10) { // +10 for generous hit box
            return i; // Return index of hit apple
        }
    }
    return null;
}

/**
 * Calculate the angle of impact relative to the target center.
 * @param {number} x - collision point x
 * @param {number} y - collision point y
 * @param {number} cx - center x
 * @param {number} cy - center y
 */
export function getImpactAngle(x, y, cx, cy) {
    // At the moment of impact (knife flying up), the angle is PI/2 (90 deg) usually,
    // but relative to the rotation of the log.
    // Actually, since the knife always hits from the bottom center in this game style,
    // the impact angle on the screen is always PI/2 (bottom of circle).
    // However, we need to store it relative to the log's current rotation.
    
    // Screen angle of hit is PI/2 (90 degrees, straight down from center)
    // Wait, in p5, 0 is right, PI/2 is down, PI is left, 3PI/2 is up.
    // The knife comes from the bottom, so it hits the bottom of the log.
    const screenHitAngle = Math.PI / 2; 
    
    return screenHitAngle;
}

/**
 * Apply screen shake effect
 * @param {number} amplitude - Pixels to shake
 * @param {number} duration - Frames to shake
 */
export function triggerScreenShake(amplitude, duration) {
    gameState.shakeAmplitude = amplitude;
    gameState.shakeDuration = duration;
}

/**
 * Updates screen shake and returns current offset
 */
export function getShakeOffset(p) {
    if (gameState.shakeDuration > 0) {
        gameState.shakeDuration--;
        const dx = p.random(-gameState.shakeAmplitude, gameState.shakeAmplitude);
        const dy = p.random(-gameState.shakeAmplitude, gameState.shakeAmplitude);
        return { x: dx, y: dy };
    }
    return { x: 0, y: 0 };
}