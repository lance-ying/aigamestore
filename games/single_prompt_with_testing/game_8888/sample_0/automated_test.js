/**
 * Automated Testing Controller
 * Simulates input based on game state and test scenarios.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { KEYS } from './input.js';

export function get_automated_testing_action() {
    if (!gameState.player) return null;
    
    switch (gameState.controlMode) {
        case "TEST_1": // Survival
            return runSurvivalBot();
        case "TEST_2": // Combat
            return runCombatBot();
        case "TEST_3": // Collector
            return runCollectorBot();
        default:
            return null;
    }
}

function runSurvivalBot() {
    // Always move right
    const actions = [{ keyCode: KEYS.RIGHT }];
    
    // Check for pit or obstacle ahead
    const scanX = gameState.player.x + 100;
    const groundY = gameState.player.y + gameState.player.height + 5;
    
    let floorAhead = false;
    for (let p of gameState.platforms) {
        if (scanX > p.x && scanX < p.x + p.width) {
            floorAhead = true; 
            break;
        }
    }
    
    // Jump if no floor
    if (!floorAhead && gameState.player.grounded) {
        actions.push({ keyCode: KEYS.SPACE });
    }
    
    // Random jump for obstacles
    if (Math.random() < 0.02 && gameState.player.grounded) {
        actions.push({ keyCode: KEYS.SPACE });
    }

    // Return one action per frame roughly (limitations of this simple interface)
    // Actually the interface returns a single key event usually.
    // We'll prioritize Jump over Right
    if (!floorAhead && gameState.player.grounded) return { keyCode: KEYS.SPACE };
    return { keyCode: KEYS.RIGHT };
}

function runCombatBot() {
    // Detect enemy
    let enemyNear = false;
    for (let e of gameState.enemies) {
        const d = Math.sqrt(Math.pow(e.x - gameState.player.x, 2) + Math.pow(e.y - gameState.player.y, 2));
        if (d < 150) {
            enemyNear = true;
            break;
        }
    }
    
    if (enemyNear) {
        return { keyCode: KEYS.Z }; // Attack!
    }
    
    return { keyCode: KEYS.RIGHT };
}

function runCollectorBot() {
    // Find nearest collectible
    let nearest = null;
    let minDist = 1000;
    
    for (let c of gameState.collectibles) {
        const d = Math.sqrt(Math.pow(c.x - gameState.player.x, 2) + Math.pow(c.y - gameState.player.y, 2));
        if (d < minDist && c.x > gameState.player.x) { // Only look forward
            minDist = d;
            nearest = c;
        }
    }
    
    if (nearest) {
        if (nearest.y < gameState.player.y - 50 && gameState.player.grounded) {
            return { keyCode: KEYS.SPACE }; // Jump for it
        }
    }
    
    return { keyCode: KEYS.RIGHT };
}