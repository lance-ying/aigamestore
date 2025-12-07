import { TILE_SIZE } from './globals.js';

export function get_automated_testing_action(gameState) {
    if (!gameState.player) return null;
    
    const player = gameState.player;
    const action = {
        moveRight: false,
        moveLeft: false,
        jump: false,
        shoot: false,
        sprint: false
    };

    if (gameState.controlMode === "TEST_1") {
        // Strategy: Run right, jump over pits/walls, shoot enemies
        action.moveRight = true;
        action.sprint = true;

        // Look ahead
        const tileX = Math.floor((player.x + player.width + 10) / TILE_SIZE);
        const tileY = Math.floor((player.y + player.height) / TILE_SIZE);
        
        // Check pit (empty space below)
        if (tileY + 1 < gameState.tiles[0].length) {
             const tileBelowAhead = gameState.tiles[tileX] ? gameState.tiles[tileX][tileY + 1] : null;
             if (!tileBelowAhead || !tileBelowAhead.solid) {
                 action.jump = true;
             }
        }
        
        // Check wall
        const tileAhead = gameState.tiles[tileX] ? gameState.tiles[tileX][tileY] : null;
        if (tileAhead && tileAhead.solid) {
            action.jump = true;
        }

        // Check enemies
        const nearbyEnemy = gameState.enemies.find(e => {
            const dx = e.x - player.x;
            const dy = e.y - player.y;
            return dx > 0 && dx < 200 && Math.abs(dy) < 50;
        });

        if (nearbyEnemy) {
            action.shoot = true;
            if (nearbyEnemy.x - player.x < 100) action.jump = true; // Jump over if close
        }

    } else if (gameState.controlMode === "TEST_2") {
        // Random inputs
        if (Math.random() < 0.1) action.jump = true;
        if (Math.random() < 0.5) action.moveRight = true;
        if (Math.random() < 0.1) action.moveLeft = true;
        if (Math.random() < 0.05) action.shoot = true;
    }

    return action;
}