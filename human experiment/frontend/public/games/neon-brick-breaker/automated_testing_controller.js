/**
 * Automated testing controller
 * Generates inputs based on game state for testing modes
 */
import { gameState, CANVAS_WIDTH, CONFIG } from './globals.js';

export function get_automated_testing_action() {
    if (gameState.gamePhase !== "PLAYING") {
        // Simple menu navigation
        if (gameState.gamePhase === "START") return { keyCode: 13 }; // Enter
        if (gameState.gamePhase === "GAME_OVER_LOSE") return { keyCode: 82 }; // R
        return null;
    }

    if (gameState.turnPhase !== "AIMING") return null;

    // Throttle inputs to avoid erratic behavior, only decide once per turn start essentially
    // But since this is called every frame, we simulate holding keys.
    
    if (gameState.controlMode === "TEST_1") {
        return runTest1();
    } else if (gameState.controlMode === "TEST_2") {
        return runTest2();
    }
    
    return null;
}

// TEST 1: Survival - Aim at lowest HP brick
function runTest1() {
    // Find target
    let target = null;
    let minHp = Infinity;
    
    // Look at bottom rows first
    gameState.bricks.forEach(b => {
        if (!b.isDead && b.hp < minHp) {
            minHp = b.hp;
            target = b;
        }
    });

    if (!target) return { keyCode: 32 }; // Fire if no target (won scenario?)

    // Calculate angle to target center
    const tx = target.x + target.width/2;
    const ty = target.y + target.height/2;
    const dx = tx - gameState.player.x;
    const dy = ty - gameState.player.y;
    const desiredAngle = Math.atan2(dy, dx);
    
    return aimTowards(desiredAngle);
}

// TEST 2: Gap Shot - Try to aim at walls or randomness to get balls behind bricks
function runTest2() {
    // Pick a random angle that hits a wall eventually
    // For simplicity, aim at corners of the ceiling
    const targetX = Math.random() > 0.5 ? 0 : CANVAS_WIDTH;
    const targetY = 0;
    
    const dx = targetX - gameState.player.x;
    const dy = targetY - gameState.player.y;
    const desiredAngle = Math.atan2(dy, dx);
    
    return aimTowards(desiredAngle);
}

function aimTowards(desiredAngle) {
    const currentAngle = gameState.player.angle;
    const diff = desiredAngle - currentAngle;
    
    // Threshold to shoot
    if (Math.abs(diff) < 0.05) {
        return { keyCode: 32 }; // Space
    }
    
    if (diff < 0) {
        return { keyCode: 37 }; // Left
    } else {
        return { keyCode: 39 }; // Right
    }
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;