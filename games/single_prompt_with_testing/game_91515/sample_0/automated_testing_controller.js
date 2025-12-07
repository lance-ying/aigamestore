// Automated Testing Controller
// Provides logic for automated tests to control the game

export function get_automated_testing_action(gameState) {
    if (!gameState.player) return null;

    const player = gameState.player;
    const nearbyEnemies = gameState.enemies.filter(e => 
        Math.abs(e.x - player.x) < 300 && Math.abs(e.y - player.y) < 100
    );
    const nearbyWalls = gameState.platforms.filter(p => 
        p.x > player.x && p.x < player.x + 100 && p.y < player.y + player.height
    );

    switch (gameState.controlMode) {
        case "TEST_1": // Win Strategy
            // 1. Attack enemies
            if (nearbyEnemies.length > 0 && player.mode === 'MECH' && player.cooldown <= 0) {
                return { keyCode: 90 }; // Z to shoot
            }
            
            // 2. Jump over obstacles
            // Simple check: if wall is close in front, jump
            let needsJump = false;
            for (let wall of nearbyWalls) {
                // If wall bottom is below player top (it's in the way)
                if (wall.y + wall.height > player.y && wall.y < player.y + player.height) {
                    needsJump = true;
                }
            }
            // Pit check: Cast ray down ahead
            // (Simulated by checking if there's no platform ahead)
            let groundAhead = false;
            for (let plat of gameState.platforms) {
                if (plat.x < player.x + 50 && plat.x + plat.width > player.x + 50 && 
                    plat.y >= player.y + player.height) {
                    groundAhead = true;
                }
            }
            if (!groundAhead && player.onGround) needsJump = true;
            
            if (needsJump && player.onGround) {
                return { keyCode: 32 }; // Space
            }
            
            // 3. Move Right towards goal
            return { keyCode: 39 }; // Right Arrow

        case "TEST_2": // Random Fuzzing
            const keys = [37, 38, 39, 40, 32, 90, 16]; // All keys
            const randKey = keys[Math.floor(Math.random() * keys.length)];
            // Bias towards movement
            if (Math.random() < 0.5) return { keyCode: 39 }; // Right
            return { keyCode: randKey };
            
        default:
            return null;
    }
}