/**
 * automated_testing_controller.js
 * Controls the automated playing logic for TEST_1 and TEST_2 modes.
 */

import { gameState, CANVAS_WIDTH, ATTACK_RANGE } from './globals.js';
import { handleAttackInput, handleFury } from './combat_manager.js';

export function updateAutomatedTest() {
    if (gameState.gamePhase !== 'PLAYING') return;

    if (gameState.controlMode === 'TEST_1') {
        runTestStrategyBasic();
    } else if (gameState.controlMode === 'TEST_2') {
        runTestStrategyPerfect();
    }
}

function runTestStrategyBasic() {
    // Strategy: Cautious. Attack only when enemy is very close (guaranteed hit).
    // range safety buffer: 20px
    const safeRange = ATTACK_RANGE - 20;
    const center = CANVAS_WIDTH / 2;

    // Check Left
    if (gameState.leftSideEnemies.length > 0) {
        const enemy = gameState.leftSideEnemies[0];
        const dist = Math.abs(enemy.x - center);
        if (dist < safeRange && !gameState.isMissStunned) {
            handleAttackInput(-1);
            return;
        }
    }

    // Check Right
    if (gameState.rightSideEnemies.length > 0) {
        const enemy = gameState.rightSideEnemies[0];
        const dist = Math.abs(enemy.x - center);
        if (dist < safeRange && !gameState.isMissStunned) {
            handleAttackInput(1);
            return;
        }
    }
}

function runTestStrategyPerfect() {
    // Strategy: Frame-perfect. Hit as soon as they enter valid range.
    // Also use Fury whenever available.
    
    const center = CANVAS_WIDTH / 2;
    
    // Fury
    if (gameState.furyMeter >= 100) {
        handleFury();
        return;
    }

    // Check Left
    if (gameState.leftSideEnemies.length > 0) {
        const enemy = gameState.leftSideEnemies[0];
        const dist = Math.abs(enemy.x - center);
        if (dist <= ATTACK_RANGE && !gameState.isMissStunned) {
            handleAttackInput(-1);
            // In perfect mode, we can potentially attack multiple times per frame if needed? 
            // No, usually limited by animation or game loop. But stick to one action per frame to be safe.
            return;
        }
    }

    // Check Right
    if (gameState.rightSideEnemies.length > 0) {
        const enemy = gameState.rightSideEnemies[0];
        const dist = Math.abs(enemy.x - center);
        if (dist <= ATTACK_RANGE && !gameState.isMissStunned) {
            handleAttackInput(1);
            return;
        }
    }
}