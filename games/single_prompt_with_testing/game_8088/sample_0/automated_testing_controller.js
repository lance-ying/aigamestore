/**
 * Automated testing logic.
 */
import { CANVAS_WIDTH } from './globals.js';

export function get_automated_testing_action(gameState) {
    const player = gameState.player;
    
    // Only valid if playing
    if (gameState.gamePhase === "START") {
        // Automatically select class based on test
        if (gameState.controlMode === "TEST_1") {
            // Select Knight (Index 0)
            if (gameState.selectedClassIndex !== 0) return { keys: [37] }; // Left
            return { keys: [13] }; // Enter
        } else if (gameState.controlMode === "TEST_2") {
            // Select Wizard (Index 1)
            if (gameState.selectedClassIndex < 1) return { keys: [39] }; // Right
            if (gameState.selectedClassIndex > 1) return { keys: [37] }; // Left
            return { keys: [13] };
        } else if (gameState.controlMode === "TEST_3") {
            // Select Knave (Index 2)
            if (gameState.selectedClassIndex < 2) return { keys: [39] };
            return { keys: [13] };
        }
        return { keys: [13] }; // Default start
    }
    
    if (gameState.gamePhase !== "PLAYING" || !player) return null;

    const enemies = gameState.enemies;
    const nearestEnemy = getNearestEnemy(player, enemies);

    // --- TEST 1: KNIGHT SURVIVAL ---
    if (gameState.controlMode === "TEST_1") {
        if (!nearestEnemy) {
             // Center if no enemies
             if (player.x < CANVAS_WIDTH/2) return { keys: [39] };
             return { keys: [37] };
        }
        
        const dist = Math.abs(player.x - nearestEnemy.x);
        const keys = [];
        
        // Evade if too close
        if (dist < 100) {
            // Move away
            if (player.x < nearestEnemy.x) keys.push(37); // Left
            else keys.push(39); // Right
            
            // Jump if cornered
            if ((player.x < 50 || player.x > CANVAS_WIDTH - 50) && dist < 60) {
                keys.push(32);
            }
        }
        // Attack if very close accidentally
        if (dist < 40) keys.push(90); // Z
        
        return { keys };
    }

    // --- TEST 2: WIZARD AGGRO ---
    if (gameState.controlMode === "TEST_2") {
        const keys = [];
        if (!nearestEnemy) return { keys: [39] }; // Patrol
        
        const dx = nearestEnemy.x - player.x;
        
        // Face enemy
        if (dx > 0) keys.push(39); // Right
        else keys.push(37); // Left
        
        // Shoot constantly
        if (gameState.frameCount % 5 === 0) keys.push(90); // Z
        
        // Keep distance
        if (Math.abs(dx) < 150) {
            // Back up
            if (dx > 0) {
                const idx = keys.indexOf(39);
                if(idx > -1) keys.splice(idx, 1);
                keys.push(37);
            } else {
                const idx = keys.indexOf(37);
                if(idx > -1) keys.splice(idx, 1);
                keys.push(39);
            }
        }
        
        return { keys };
    }
    
    // --- TEST 3: KNAVE DASH ---
    if (gameState.controlMode === "TEST_3") {
         const keys = [];
         if (!nearestEnemy) return { keys: [39] };
         
         const dx = nearestEnemy.x - player.x;
         const dist = Math.abs(dx);
         
         // Move close
         if (dist > 80) {
             if (dx > 0) keys.push(39);
             else keys.push(37);
         } else {
             // Dash attack
             keys.push(90); // Z
             if (dx > 0) keys.push(39);
             else keys.push(37);
         }
         return { keys };
    }

    return null;
}

function getNearestEnemy(player, enemies) {
    if (enemies.length === 0) return null;
    let nearest = null;
    let minMsg = Infinity;
    
    enemies.forEach(e => {
        if(e.dead) return;
        const d = Math.abs(player.x - e.x);
        if (d < minMsg) {
            minMsg = d;
            nearest = e;
        }
    });
    return nearest;
}