import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function get_automated_testing_action(gameState) {
    if (gameState.gamePhase !== "PLAYING" || !gameState.player) return null;

    const player = gameState.player;
    const lookAheadX = 150;
    
    // Scan entities ahead
    const obstaclesAhead = gameState.platforms.filter(p => 
        p.x > player.x && 
        p.x < player.x + lookAheadX && 
        p.y < player.y + 50 // Same level or higher
    );
    
    const pitsAhead = !gameState.platforms.some(p => 
        p.x > player.x + 20 && 
        p.x < player.x + 80 && 
        p.y > player.y // Ground exists below
    );
    
    const enemiesAhead = gameState.enemies.filter(e => 
        e.x > player.x && 
        e.x < player.x + lookAheadX
    );

    // Heuristics based on control mode
    if (gameState.controlMode === "TEST_1") {
        // Basic Survival: Jump over pits and walls
        if (pitsAhead) return { keyCode: 32 };
        
        // Check for wall right in front
        const wallAhead = obstaclesAhead.some(p => p.x < player.x + 60 && p.y < player.y);
        if (wallAhead) return { keyCode: 32 };
    }
    else if (gameState.controlMode === "TEST_2") {
        // Enemy Interaction: Try to jump on enemies
        if (enemiesAhead.length > 0) {
            const closest = enemiesAhead[0];
            const dist = closest.x - player.x;
            
            // Time jump to land on top
            if (dist < 100 && dist > 20) {
                return { keyCode: 32 };
            }
        }
        else if (pitsAhead) {
            return { keyCode: 32 };
        }
    }
    else if (gameState.controlMode === "TEST_3") {
        // Completionist: Handle everything better
        // Complex logic simplified: jump if anything dangerous ahead
        if (enemiesAhead.length > 0 || pitsAhead) {
             return { keyCode: 32 };
        }
        // Jump over tall pipes
        if (obstaclesAhead.some(p => p.y < player.y && p.x < player.x + 80)) {
            return { keyCode: 32 };
        }
    }

    return null;
}

window.get_automated_testing_action = get_automated_testing_action;