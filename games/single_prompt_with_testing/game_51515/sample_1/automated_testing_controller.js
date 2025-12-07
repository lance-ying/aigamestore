/**
 * Automated testing controller
 */
import { KEY_UP, KEY_DOWN, KEY_LEFT, KEY_RIGHT, KEY_SPACE, KEY_SHIFT } from './input.js';
import { TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { checkRectCollision } from './physics.js';

function getWinStrategyAction(gameState) {
    const player = gameState.player;
    if (!player) return null;

    // Goal: Move UP.
    // Check if path directly UP is clear
    let dangerUp = checkDanger(gameState, player.x, player.y - TILE_SIZE);
    let dangerLeft = checkDanger(gameState, player.x - TILE_SIZE, player.y);
    let dangerRight = checkDanger(gameState, player.x + TILE_SIZE, player.y);

    if (!dangerUp) {
        // Can move up. Should we dash?
        // Dash if lots of clear space and score allows or cooldown allows
        if (!checkDanger(gameState, player.x, player.y - TILE_SIZE*3)) {
             // 1% chance to dash to not spam it
             if (Math.random() < 0.05) return { keyCode: KEY_SPACE };
        }
        return { keyCode: KEY_UP };
    } else {
        // Up is blocked. Try Left or Right.
        // Prefer moving towards center if at edges
        if (player.x < CANVAS_WIDTH/2) {
            // Left side, try right first
            if (!dangerRight) return { keyCode: KEY_RIGHT };
            if (!dangerLeft) return { keyCode: KEY_LEFT };
        } else {
            // Right side, try left first
            if (!dangerLeft) return { keyCode: KEY_LEFT };
            if (!dangerRight) return { keyCode: KEY_RIGHT };
        }
        
        // If stuck, wait or shield?
        return { keyCode: KEY_SHIFT };
    }
}

function checkDanger(gameState, x, y) {
    // Check bounds
    if (x < 0 || x > CANVAS_WIDTH - 20 || y > gameState.wallOfDoomY) return true; // Wall of doom is actually below in Y coord (higher value)

    const testRect = { x: x, y: y, width: 20, height: 20 };

    // Check walls
    for (const wall of gameState.walls) {
        if (checkRectCollision(testRect, wall)) return true;
    }

    // Check traps (only active ones ideally, but let's be safe and avoid all spikes for now if possible)
    // Actually, spikes cycle. Bot can't easily predict cycles without state reading. 
    // Let's assume bot avoids spikes area if possible.
    for (const trap of gameState.traps) {
        if (checkRectCollision(testRect, trap)) return true;
    }

    return false;
}

function getRandomAction() {
    const actions = [KEY_UP, KEY_UP, KEY_UP, KEY_LEFT, KEY_RIGHT, KEY_DOWN, KEY_SPACE, KEY_SHIFT];
    return { keyCode: actions[Math.floor(Math.random() * actions.length)] };
}

export function get_automated_testing_action(gameState) {
    if (gameState.gamePhase !== "PLAYING") return null;

    switch (gameState.controlMode) {
        case "TEST_1": // Intelligent Win Attempt
            return getWinStrategyAction(gameState);
        case "TEST_2": // Random Stress
            return getRandomAction();
        case "TEST_3": // Stationary (do nothing)
            return null;
        default:
            return null;
    }
}