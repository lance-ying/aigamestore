/**
 * automated_testing_controller.js
 * Logic for automated testing bots.
 */

export function get_automated_testing_action(gameState) {
    if (!gameState.player) return null;
    
    const player = gameState.player;
    const action = {
        left: false, right: false, up: false, down: false,
        shoot: false, dodge: false, jump: false, interact: false
    };
    
    if (gameState.controlMode === 'TEST_1') {
        // TEST 1: Survival & Combat
        // Strategy: Run towards nearest enemy and shoot. Jump if blocked.
        
        let nearestEnemy = null;
        let minDist = Infinity;
        
        gameState.enemies.forEach(e => {
            const d = Math.sqrt(Math.pow(e.x - player.x, 2) + Math.pow(e.y - player.y, 2));
            if (d < minDist) {
                minDist = d;
                nearestEnemy = e;
            }
        });
        
        if (nearestEnemy) {
            // Aiming logic (Left/Right)
            if (nearestEnemy.x < player.x) action.left = true;
            else action.right = true;
            
            // Shoot constantly
            action.shoot = true;
            
            // Keep distance if too close
            if (minDist < 100) {
                 // Retreat
                 action.left = !action.left;
                 action.right = !action.right;
            }
        } else {
             // Patrol if no enemies
             if (Math.floor(gameState.frameCount / 60) % 2 === 0) action.left = true;
             else action.right = true;
        }
        
        // Jump randomly or if stuck (vx ~ 0)
        if (player.vx === 0 && player.onGround && Math.random() < 0.1) {
            action.jump = true;
        }
        
    } else if (gameState.controlMode === 'TEST_2') {
        // TEST 2: Teleporter Rush
        // Strategy: Go to teleporter X coordinate. Activate it.
        
        const tp = gameState.teleporter;
        if (!tp) return action; // Should not happen
        
        const distToTp = Math.abs(player.x - tp.x);
        
        if (distToTp > 20) {
            if (tp.x < player.x) action.left = true;
            else action.right = true;
            
            // Simple jump over gaps logic (blind)
            if (player.onGround && Math.random() < 0.05) action.jump = true;
            
        } else {
            // At teleporter
            if (gameState.teleporterState === 'IDLE') {
                action.down = true; // Activate
                action.interact = true;
            } else {
                // Defend mode
                action.shoot = true;
                // Random strafe
                if (Math.random() > 0.5) action.left = true;
                else action.right = true;
            }
        }
    }
    
    return action;
}

window.get_automated_testing_action = get_automated_testing_action;