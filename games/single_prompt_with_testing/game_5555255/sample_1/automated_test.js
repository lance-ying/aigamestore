/**
 * Automated Testing Logic
 */

export function get_automated_testing_action(gameState) {
    if (!gameState.player) return null;

    if (gameState.controlMode === 'TEST_1') {
        // Survival Bot: Move right, jump over holes/spikes
        let action = { left: false, right: true, jump: false, brake: false, restart: false };
        
        // Simple raycast ahead
        let lookAheadX = gameState.player.x + 100;
        let groundFound = false;
        
        // Check for platforms ahead
        for (let plat of gameState.platforms) {
            if (plat.x < lookAheadX && plat.x + plat.width > lookAheadX &&
                plat.y > gameState.player.y && plat.y < gameState.player.y + 200) {
                groundFound = true;
                break;
            }
        }
        
        // Check for hazards immediately ahead
        let hazardAhead = false;
        for (let haz of gameState.hazards) {
            if (haz.x < gameState.player.x + 80 && haz.x + haz.width > gameState.player.x) {
                hazardAhead = true;
            }
        }
        
        // Jump if no ground or hazard
        if (!groundFound || hazardAhead) {
            // Only jump if on ground (game engine handles the 'can jump' check, 
            // but bot should hold key)
            action.jump = true;
        }
        
        // Handle restart if game over
        if (gameState.gamePhase === 'GAME_OVER_LOSE' || gameState.gamePhase === 'GAME_OVER_WIN') {
            action.restart = true;
        }
        
        return action;
        
    } else if (gameState.controlMode === 'TEST_2') {
        // Random Bot
        let r = Math.random();
        let action = {
            left: r < 0.2,
            right: r > 0.3 && r < 0.8,
            jump: Math.random() < 0.1,
            brake: Math.random() < 0.05,
            restart: (gameState.gamePhase === 'GAME_OVER_LOSE' || gameState.gamePhase === 'GAME_OVER_WIN')
        };
        return action;
    }
    
    return null;
}