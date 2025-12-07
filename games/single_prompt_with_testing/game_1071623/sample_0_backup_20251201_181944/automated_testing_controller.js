export function get_automated_testing_action(gameState) {
    if (!gameState.player) return null;
    
    const player = gameState.player;
    
    // Helper to find nearest hazard/platform in front
    const lookAheadDist = 150;
    let hazardAhead = false;
    let wallAhead = false;
    let gapAhead = false;
    let enemyAhead = false;
    
    // Check hazards
    for (let h of gameState.hazards) {
        if (h.x > player.x && h.x < player.x + lookAheadDist && Math.abs(h.y - player.y) < 50) {
            hazardAhead = true;
        }
    }
    
    // Check enemies
    for (let e of gameState.enemies) {
        if (e.x > player.x && e.x < player.x + lookAheadDist && Math.abs(e.y - player.y) < 50) {
            enemyAhead = true;
        }
    }
    
    // Check walls
    for (let p of gameState.platforms) {
        if (p.x > player.x && p.x < player.x + 50 && p.y < player.y && p.y + p.h > player.y) {
            wallAhead = true;
        }
    }
    
    // Check gap (raycast down ahead)
    let groundAhead = false;
    const checkX = player.x + 50;
    const checkY = player.y + 50;
    for (let p of gameState.platforms) {
        if (p.x < checkX && p.x + p.w > checkX && p.y > player.y) {
            groundAhead = true;
        }
    }
    if (!groundAhead) gapAhead = true;

    // Strategies
    if (gameState.controlMode === "TEST_1") {
        // Win Strategy: Move right constantly, jump over obstacles, dash attack enemies
        const action = {
            left: false,
            right: true,
            up: false,
            down: false,
            jump: false,
            dash: false
        };
        
        if (hazardAhead || gapAhead || wallAhead) {
            action.jump = true;
        }
        
        if (enemyAhead) {
            action.dash = true;
        }
        
        // Wall jump logic
        if (player.onWall !== 0) {
            action.jump = true;
            action.right = player.onWall === -1; // If on left wall, hold right
            action.left = player.onWall === 1;
        }
        
        return action;
    }
    
    if (gameState.controlMode === "TEST_2") {
        // Random Stress Test
        return {
            left: Math.random() > 0.7,
            right: Math.random() > 0.3, // Bias right
            up: false,
            down: Math.random() > 0.9,
            jump: Math.random() > 0.8,
            dash: Math.random() > 0.9
        };
    }
    
    if (gameState.controlMode === "TEST_3") {
        // Suicide Test
        return {
            left: false,
            right: true,
            up: false,
            down: false,
            jump: false, // Don't jump over hazards
            dash: false
        };
    }
    
    return null;
}