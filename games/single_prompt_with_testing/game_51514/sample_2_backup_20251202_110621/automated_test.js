// automated_test.js - Bot logic
import { gameState } from './globals.js';
import { checkAABB } from './physics.js';

// Predefined actions for Test 1
// Each step: { x: targetX, action: 'JUMP'|'BOMB'|'WAIT', condition: fn }
// This is a simplified behavior tree
let currentStep = 0;
let waitTimer = 0;

export function get_automated_testing_action() {
    if (!gameState.player) return;
    const player = gameState.player;
    
    if (gameState.controlMode === "TEST_2") {
        // Random Chaos
        const r = Math.random();
        if (r < 0.05) player.jump();
        if (r < 0.01) player.placeBomb();
        
        if (Math.random() < 0.4) {
             player.vx = -4; // Left
        } else if (Math.random() < 0.8) {
             player.vx = 4; // Right
        }
        return;
    }

    if (gameState.controlMode === "TEST_1") {
        // Structured Walkthrough to win
        
        // Very basic AI: Move right, jump over holes, bomb walls
        
        // 1. Move Right primarily
        player.vx = 4;
        player.facing = 1;

        // 2. Check for Obstacles ahead
        // Look ahead for walls
        let blocked = false;
        // Simple raycast logic using existing blocks
        for (let block of gameState.blocks) {
            if (Math.abs(block.y - player.y) < 50 && block.x > player.x && block.x < player.x + 60) {
                blocked = true;
                break;
            }
        }
        
        // 3. Look for gaps (lack of platforms)
        let groundAhead = false;
        const checkX = player.x + 40;
        const checkY = player.y + 40;
        for (let plat of gameState.platforms) {
            if (plat.x < checkX && plat.x + plat.width > checkX && plat.y > player.y) {
                groundAhead = true;
                break;
            }
        }

        // Actions
        
        if (blocked) {
            // Stop, place bomb, wait
            player.vx = 0;
            if (player.bombCooldown <= 0 && gameState.bombs.length === 0) {
                player.placeBomb();
                waitTimer = 140; // Wait for explosion
            }
        }
        
        if (waitTimer > 0) {
            player.vx = -2; // Back up slightly to avoid own bomb
            waitTimer--;
            return;
        }

        if (!groundAhead && player.onGround) {
            player.jump();
        }
        
        // Handle high walls (bomb jump)
        // If stopped but no block, maybe a high wall?
        if (Math.abs(player.vx) < 0.1 && !blocked && player.onGround) {
             // Try to jump
             player.jump();
        }
    }
}