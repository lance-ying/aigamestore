import { KEYS } from './input.js';
import { CANVAS_WIDTH } from './globals.js';

export function get_automated_testing_action(gameState) {
    if (gameState.controlMode === 'HUMAN') return null;

    const action = { keysDown: [] };

    // Common: Start game if at Start Screen
    if (gameState.gamePhase === "START") {
        action.keysDown.push(KEYS.ENTER);
        return action;
    }

    // Common: Handle Shop by just casting immediately or buying if rich
    if (gameState.subPhase === "SHOP") {
        if (gameState.controlMode === "TEST_1") {
            // Buy if possible, else cast
            if (gameState.money >= 100) {
                action.keysDown.push(KEYS.Z);
            } else {
                action.keysDown.push(KEYS.ENTER);
            }
        } else {
            action.keysDown.push(KEYS.ENTER);
        }
        return action;
    }
    
    if (gameState.subPhase === "SUMMARY") {
        action.keysDown.push(KEYS.ENTER);
        return action;
    }

    // TEST 1: Basic Loop - Fail Fast, Shoot Randomly
    if (gameState.controlMode === "TEST_1") {
        if (gameState.subPhase === "DESCENT") {
            // Steer towards center, don't avoid fish (hit them to trigger ascent)
            if (gameState.hookX < CANVAS_WIDTH/2) action.keysDown.push(KEYS.RIGHT);
            else action.keysDown.push(KEYS.LEFT);
        }
        else if (gameState.subPhase === "ASCENT") {
            // Just go up
        }
        else if (gameState.subPhase === "SHOOTING") {
            // Spam space
            action.keysDown.push(KEYS.SPACE);
            // Spin gun
            action.keysDown.push(KEYS.RIGHT);
        }
    }

    // TEST 2: "Win" Strategy - Dodge and Catch
    if (gameState.controlMode === "TEST_2") {
        if (gameState.subPhase === "DESCENT") {
            // DODGE LOGIC
            // Look for fish below us
            let nearestFish = null;
            let minDist = 1000;
            
            gameState.fish.forEach(fish => {
                const dy = fish.y - gameState.depth; // Dist below hook
                if (dy > 0 && dy < 300) { // Look ahead
                    const dist = Math.sqrt(Math.pow(gameState.hookX - fish.x, 2) + Math.pow(dy, 2));
                    if (dist < minDist) {
                        minDist = dist;
                        nearestFish = fish;
                    }
                }
            });

            if (nearestFish && Math.abs(nearestFish.x - gameState.hookX) < 60) {
                // Steer AWAY
                if (gameState.hookX < nearestFish.x) action.keysDown.push(KEYS.LEFT);
                else action.keysDown.push(KEYS.RIGHT);
            } else {
                // Stay roughly center if safe
                if (gameState.hookX < CANVAS_WIDTH/2 - 50) action.keysDown.push(KEYS.RIGHT);
                else if (gameState.hookX > CANVAS_WIDTH/2 + 50) action.keysDown.push(KEYS.LEFT);
            }
        }
        else if (gameState.subPhase === "ASCENT") {
            // CATCH LOGIC
            let target = null;
            let minDist = 1000;
            
            gameState.fish.forEach(fish => {
                 if (fish.y < gameState.depth) { // Above hook (relative to movement direction? Hook moves UP, depth decreases. Fish y is static world y.)
                     // Actually hook moves up (depth decreases). Fish are at fixed Y.
                     // We want fish where fish.y < currentDepth (wait, fish are static).
                     // We are at depth, moving to 0. We want to intercept fish at currentDepth.
                     const dy = gameState.depth - fish.y; // distance above
                     if (dy > 0 && dy < 300) {
                         const dist = Math.abs(fish.x - gameState.hookX);
                         if (dist < minDist) {
                             minDist = dist;
                             target = fish;
                         }
                     }
                 }
            });
            
            if (target) {
                if (gameState.hookX < target.x) action.keysDown.push(KEYS.RIGHT);
                else action.keysDown.push(KEYS.LEFT);
            }
        }
        else if (gameState.subPhase === "SHOOTING") {
            // AIM LOGIC
            // Find lowest fish in air (closest to gun)
            let target = null;
            let maxY = -1000;
            
            gameState.airborneFish.forEach(fish => {
                if (fish.y > maxY) {
                    maxY = fish.y;
                    target = fish;
                }
            });
            
            if (target) {
                // Calculate angle to target
                const dx = target.x - (CANVAS_WIDTH/2);
                const dy = target.y - (CANVAS_HEIGHT - 20);
                const targetAngle = Math.atan2(dy, dx);
                
                // Current angle is gameState.gunAngle
                // We need to match it.
                // gunAngle is -PI to 0. targetAngle usually -PI to 0.
                
                if (gameState.gunAngle < targetAngle - 0.1) action.keysDown.push(KEYS.RIGHT);
                else if (gameState.gunAngle > targetAngle + 0.1) action.keysDown.push(KEYS.LEFT);
                else action.keysDown.push(KEYS.SPACE); // Fire if aligned
            }
        }
    }

    return action;
}

// Global exposure
window.get_automated_testing_action = get_automated_testing_action;