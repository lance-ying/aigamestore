import { dist } from './utils.js';

export function get_automated_testing_action(gameState) {
    if (!gameState.player) return null;

    const action = {
        left: false, right: false, up: false, down: false,
        dash: false, ult: false, restart: false
    };

    if (gameState.controlMode === "TEST_3") {
        // Test Restart
        if (gameState.frameCount > 120 && (gameState.gamePhase === "GAME_OVER_LOSE" || gameState.gamePhase === "GAME_OVER_WIN")) {
            action.restart = true;
        }
    }

    // Logic for SURVIVAL (TEST_1)
    if (gameState.controlMode === "TEST_1") {
        // 1. Avoid Enemies (Repulsion vector)
        let moveX = 0;
        let moveY = 0;
        let threats = 0;

        gameState.enemies.forEach(e => {
            const d = dist(gameState.player.x, gameState.player.y, e.x, e.y);
            if (d < 150) {
                const dx = gameState.player.x - e.x;
                const dy = gameState.player.y - e.y;
                moveX += dx / (d * 0.1); // Weight by closeness
                moveY += dy / (d * 0.1);
                threats++;
            }
        });

        // 2. If safe, collect XP
        if (threats === 0) {
            let closestXP = null;
            let minDist = 1000;
            gameState.collectibles.forEach(c => {
                const d = dist(gameState.player.x, gameState.player.y, c.x, c.y);
                if (d < minDist) {
                    minDist = d;
                    closestXP = c;
                }
            });
            
            if (closestXP) {
                moveX = closestXP.x - gameState.player.x;
                moveY = closestXP.y - gameState.player.y;
            } else {
                // Stay center
                moveX = (300 - gameState.player.x);
                moveY = (200 - gameState.player.y);
            }
        }

        // Apply
        if (moveX < -0.1) action.left = true;
        if (moveX > 0.1) action.right = true;
        if (moveY < -0.1) action.up = true;
        if (moveY > 0.1) action.down = true;
        
        // Panic Dash
        if (threats > 3 && gameState.player.stamina > 50) action.dash = true;
    }

    // Logic for SUICIDE (TEST_2)
    if (gameState.controlMode === "TEST_2") {
        let closestEnemy = null;
        let minDist = 2000;
        
        gameState.enemies.forEach(e => {
            const d = dist(gameState.player.x, gameState.player.y, e.x, e.y);
            if (d < minDist) {
                minDist = d;
                closestEnemy = e;
            }
        });

        if (closestEnemy) {
            if (closestEnemy.x < gameState.player.x) action.left = true;
            if (closestEnemy.x > gameState.player.x) action.right = true;
            if (closestEnemy.y < gameState.player.y) action.up = true;
            if (closestEnemy.y > gameState.player.y) action.down = true;
        }
    }

    return action;
}

window.get_automated_testing_action = get_automated_testing_action;