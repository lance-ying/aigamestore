/**
 * automated_testing_controller.js
 * Controls automated testing behaviors.
 */

export function get_automated_testing_action(gameState) {
    const player = gameState.player;
    if (!player) return null;

    if (gameState.controlMode === "TEST_1") {
        // Random Survival Test
        // Randomly move left/right and jump periodically
        const left = Math.random() < 0.2;
        const right = Math.random() < 0.2;
        const jump = Math.random() < 0.05;
        const attack = Math.random() < 0.05;
        
        return {
            left: left,
            right: right,
            jump: jump,
            attack: attack
        };
    } 
    else if (gameState.controlMode === "TEST_2") {
        // AI Pathfinding / Level Completion
        // Heuristic: Move right. If obstacle or gap, jump. Attack if enemy close.
        
        let action = {
            left: false, right: true, // Always bias right
            jump: false,
            attack: false,
            up: false
        };
        
        // Check for enemies nearby
        const nearbyEnemy = gameState.enemies.find(e => 
            !e.isDead && Math.abs(e.x - player.x) < 80 && Math.abs(e.y - player.y) < 50
        );
        
        if (nearbyEnemy) {
            action.attack = true;
            if (nearbyEnemy.x < player.x) {
                action.left = true;
                action.right = false;
            }
        }
        
        // Simple Obstacle Avoidance (Raycast simulation)
        // If wall in front, jump
        // We can check platform array for blocks in front
        const lookAhead = 60;
        const wallInFront = gameState.platforms.some(p => 
            p.x < player.x + lookAhead && 
            p.x + p.width > player.x + 10 &&
            p.y < player.y + player.height && 
            p.y + p.height > player.y - 20
        );
        
        if (wallInFront && player.onGround) {
            action.jump = true;
        }
        
        // Gap detection logic could go here (check if ground exists at x + velocity)
        
        return action;
    }

    return null;
}