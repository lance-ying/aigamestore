/**
 * automated_testing_controller.js
 * Logic for the testing bots.
 */

import { GAME_CONFIG, CANVAS_HEIGHT } from './globals.js';
import { normalizeAngle } from './physics.js';

export function get_automated_testing_action(gameState) {
    if (gameState.controlMode === "TEST_1") {
        return getTestWinAction(gameState);
    } else if (gameState.controlMode === "TEST_2") {
        return getTestRandomAction(gameState);
    }
    return null;
}

function getTestWinAction(gameState) {
    // Wait if no active knife or target
    if (!gameState.activeKnife || !gameState.target) return null;
    if (gameState.activeKnife.state !== "READY") return null;

    const target = gameState.target;
    
    // Calculate time for knife to hit target
    // Distance from knife tip to target edge (approximately)
    const knifeTipY = gameState.activeKnife.y - gameState.activeKnife.height/2;
    const targetEdgeY = target.y + target.radius;
    const dist = knifeTipY - targetEdgeY;
    const speed = GAME_CONFIG.knifeSpeed;
    const framesToHit = dist / speed;
    
    // Predict target rotation after framesToHit
    // NOTE: This assumes constant speed for simplicity, but target speed varies.
    // For perfect play, we need to integrate speed over time or assume current speed persists.
    // Given the complexity of patterns, we assume current speed holds for the short travel time.
    const predictedRotation = target.rotation + (target.currentSpeed * framesToHit);
    
    // The knife hits at screen angle PI/2 (bottom).
    // We want to find the angle on the target relative to its rotation.
    // AngleOnTarget = ScreenHitAngle - TargetRotation
    // ScreenHitAngle is PI/2 (90 deg, bottom)
    const impactAngleOnTarget = normalizeAngle((Math.PI / 2) - predictedRotation);
    
    // Check if this angle is safe
    const isSafe = isAngleSafe(impactAngleOnTarget, gameState.stuckKnives);
    
    if (isSafe) {
        return { throw: true };
    }
    
    return null;
}

function isAngleSafe(angle, existingKnives) {
    const tolerance = GAME_CONFIG.collisionTolerance * 1.5; // Add extra safety margin for bot
    
    for (let k of existingKnives) {
        let diff = Math.abs(normalizeAngle(angle) - normalizeAngle(k.angle));
        if (diff > Math.PI) diff = (Math.PI * 2) - diff;
        
        if (diff < tolerance) return false;
    }
    return true;
}

function getTestRandomAction(gameState) {
    // Simply throw randomly with high frequency
    if (Math.random() < 0.1) {
        return { throw: true };
    }
    return null;
}

window.get_automated_testing_action = get_automated_testing_action;