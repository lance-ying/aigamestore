export function get_automated_testing_action(gameState) {
    if (!gameState.player) return null;
    
    // TEST_1: Survival / Movement
    if (gameState.controlMode === 'TEST_1') {
        const jumping = gameState.frameCount % 120 < 30; // Jump every 2 seconds
        return {
            moveRight: true,
            moveLeft: false,
            jump: jumping,
            attack: false
        };
    }
    
    // TEST_2: Aggressive / Combat
    if (gameState.controlMode === 'TEST_2') {
        // Find nearest enemy
        let nearest = null;
        let minDist = 1000;
        
        gameState.entities.forEach(e => {
            if (e.type && (e.type === 'SLIME' || e.type === 'BAT' || e.type === 'KNIGHT' || e.type === 'BOSS')) {
                const dist = Math.abs(e.x - gameState.player.x);
                if (dist < minDist) {
                    minDist = dist;
                    nearest = e;
                }
            }
        });
        
        const action = {
            moveRight: false,
            moveLeft: false,
            jump: false,
            attack: false
        };
        
        // Navigate to end if no enemies
        if (!nearest || minDist > 500) {
             action.moveRight = true;
             if (gameState.frameCount % 100 < 20) action.jump = true; // Random jumps
             return action;
        }
        
        // Combat logic
        const dx = nearest.x - gameState.player.x;
        
        if (Math.abs(dx) > 50) {
            if (dx > 0) action.moveRight = true;
            else action.moveLeft = true;
        } else {
            // Close enough to attack
            if (gameState.frameCount % 20 < 10) action.attack = true;
        }
        
        // Jump if enemy is higher or just randomly to dodge
        if (nearest.y < gameState.player.y - 20 || Math.random() < 0.05) {
            action.jump = true;
        }
        
        return action;
    }
    
    return null;
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;