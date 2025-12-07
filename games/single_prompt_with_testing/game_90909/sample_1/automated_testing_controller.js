import { gameState } from './globals.js';

export function get_automated_testing_action() {
    if (!gameState.player || gameState.gamePhase !== "PLAYING") return;

    if (gameState.controlMode === "TEST_1") {
        // Strategy: Run right, Jump at obstacles
        const player = gameState.player;
        
        // Basic movement
        gameState.keys[39] = true; // Right Arrow
        gameState.keys[37] = false;
        
        // Check for pits or walls ahead
        // Look ahead 50 pixels
        const lookAheadX = player.x + 50;
        const groundY = player.y + player.height + 5;
        
        let wallAhead = false;
        let pitAhead = true;
        
        // Use level data to simple raycast (conceptually)
        if (gameState.levelData && gameState.levelData.blocks) {
            for (let block of gameState.levelData.blocks) {
                // Check wall
                if (block.x < lookAheadX && block.x + block.width > player.x + player.width &&
                    block.y < player.y + player.height && block.y + block.height > player.y) {
                    wallAhead = true;
                }
                
                // Check ground at lookahead
                if (block.x < lookAheadX && block.x + block.width > lookAheadX &&
                    block.y <= groundY + 10 && block.y >= groundY - 10) {
                    pitAhead = false;
                }
            }
        }
        
        // Enemies ahead?
        let enemyAhead = false;
        for (let entity of gameState.entities) {
            if (entity.type === 'enemy' && entity.x > player.x && entity.x < player.x + 150) {
                enemyAhead = true;
            }
        }
        
        if (wallAhead || pitAhead || enemyAhead) {
            if (!player.isJumping) {
               gameState.keys[32] = true; // Jump
               // Reset jump key quickly in next frame logic if needed, but holding is fine for higher jump
            }
        } else {
            gameState.keys[32] = false;
        }
        
        if (enemyAhead && player.ammo > 0 && Math.random() < 0.1) {
            gameState.keys[90] = true; // Shoot Z
        } else {
            gameState.keys[90] = false;
        }

    } else if (gameState.controlMode === "TEST_2") {
        // Random Chaos
        const keys = [37, 38, 39, 40, 32, 90, 16];
        keys.forEach(k => {
            if (Math.random() < 0.2) gameState.keys[k] = true;
            if (Math.random() < 0.2) gameState.keys[k] = false;
        });
    }
}