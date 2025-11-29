import { gameState, CANVAS_WIDTH, GROUND_Y } from './globals.js';

// Controller for TEST modes
export function get_automated_testing_action(gameState) {
    if (!gameState.player || !gameState.boss) return null;

    const player = gameState.player;
    const boss = gameState.boss;

    const action = {
        moveLeft: false,
        moveRight: false,
        jump: false,
        shoot: false,
        dash: false,
        duck: false
    };

    if (gameState.controlMode === 'TEST_1') {
        // Basic Survival: Move back and forth, jump randomly, shoot constantly
        
        // Always shoot
        action.shoot = true;
        
        // Random Movement
        const time = Date.now();
        if (Math.floor(time / 1000) % 2 === 0) {
            action.moveRight = true;
        } else {
            action.moveLeft = true;
        }
        
        // Jump occasionally
        if (Math.random() < 0.05 && player.onGround) {
            action.jump = true;
        }
        
        // Avoid walls
        if (player.x < 50) action.moveRight = true;
        if (player.x > CANVAS_WIDTH - 200) action.moveLeft = true;
    } 
    else if (gameState.controlMode === 'TEST_2') {
        // AI: Win against boss
        
        // 1. Offensive: Always face boss and shoot
        if (player.x < boss.x) {
            // Face right (handled by movement usually, but we want to shoot right)
            // If standing still, we need to tap right to face right? 
            // Player faces last movement direction.
            // If facing wrong way, move slight right
            if (player.facing === -1) action.moveRight = true;
        } else {
             if (player.facing === 1) action.moveLeft = true;
        }
        action.shoot = true;
        
        // 2. Defensive: Dodge Projectiles
        let threat = null;
        let minDist = 200;
        
        // Find closest threat
        gameState.projectiles.forEach(proj => {
            if (proj.type !== 'PLAYER') {
                const dx = proj.x - player.x;
                const dy = proj.y - player.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                // Only care if moving towards us or close
                if (dist < minDist) {
                    minDist = dist;
                    threat = proj;
                }
            }
        });
        
        if (threat) {
            // Dodge Logic
            if (threat.y > player.y - 20 && threat.y < player.y + 60) {
                // Threat is at player height
                if (Math.abs(threat.x - player.x) < 100) {
                     if (player.onGround) action.jump = true;
                }
            }
            
            // Move away from threat horizontally if in air
            if (!player.onGround) {
                if (threat.x > player.x) action.moveLeft = true;
                else action.moveRight = true;
            }
        }
        
        // 3. Positioning
        // Try to stay at mid range
        const idealDist = 300;
        const distToBoss = Math.abs(player.x - boss.x);
        
        if (!threat) {
            if (distToBoss < 150) {
                // Too close
                if (player.x < boss.x) action.moveLeft = true;
                else action.moveRight = true;
            } else if (distToBoss > 400) {
                // Too far
                if (player.x < boss.x) action.moveRight = true;
                else action.moveLeft = true;
            }
        }
    }
    
    return action;
}

window.get_automated_testing_action = get_automated_testing_action;