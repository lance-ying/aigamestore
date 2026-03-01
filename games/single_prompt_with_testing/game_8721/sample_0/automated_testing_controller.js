/**
 * automated_testing_controller.js
 * Provides input simulation for automated tests.
 */

import { gameState, TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Player } from './entities.js';

/*
 * Analyzes the grid ahead of the player to detect pits or obstacles.
 */
function scanTerrain(player) {
    const startTileX = Math.floor((player.x + player.width) / TILE_SIZE);
    const startTileY = Math.floor((player.y + player.height) / TILE_SIZE);
    
    // Look ahead 5 tiles
    for (let i = 1; i <= 5; i++) {
        const checkX = startTileX + i;
        const checkY = startTileY; // The tile immediately below player level
        
        const key = `${checkX},${checkY}`;
        const tile = gameState.tiles[key];
        
        // Check for pit (no tile below)
        if (!tile) {
            return { type: 'PIT', distance: i };
        }
        
        // Check for high wall (tile at player head level)
        const wallKey = `${checkX},${startTileY - 1}`;
        const wallTile = gameState.tiles[wallKey];
        if (wallTile) {
            return { type: 'WALL', distance: i };
        }
    }
    
    // Check for enemies
    for (const ent of gameState.entities) {
        if (ent.x > player.x && ent.x < player.x + 300) {
            // Very simple enemy check
            return { type: 'ENEMY', distance: (ent.x - player.x) / TILE_SIZE };
        }
    }
    
    return null;
}

export function get_automated_testing_action(gameState) {
    const player = gameState.player;
    if (!player) return null;

    // Default action
    let action = null;

    if (gameState.controlMode === "TEST_1") {
        // "Smart Runner" Logic
        const threat = scanTerrain(player);
        
        if (threat) {
            if (threat.distance < 3) {
                // Jump if threat is close
                action = { keyCode: 32 }; // SPACE
            }
        }
        
        // Handle wall sliding explicitly for testing
        if (player.state === "WALL_SLIDING") {
            // Wall jump immediately
            action = { keyCode: 32 };
        }
        
        // Randomly spin if high in air to safely land
        if (player.state === "FALLING" && player.y < 200 && Math.random() < 0.1) {
             action = { keyCode: 90 }; // Z
        }

    } else if (gameState.controlMode === "TEST_2") {
        // Chaos / Stress Test
        const rand = Math.random();
        if (rand < 0.05) action = { keyCode: 32 }; // Jump
        else if (rand < 0.1) action = { keyCode: 90 }; // Spin
        else if (rand < 0.12) action = { keyCode: 27 }; // Pause spam check
    }

    return action;
}

// Expose to window for the test runner if needed
window.get_automated_testing_action = get_automated_testing_action;