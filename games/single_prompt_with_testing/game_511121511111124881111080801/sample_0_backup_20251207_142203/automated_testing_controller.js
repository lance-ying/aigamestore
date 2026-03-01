/**
 * Cavern Tale - Automated Testing Controller
 * Provides input simulation for testing scenarios.
 */

// Helper to check if player exists
function hasPlayer(gameState) {
    return gameState.player && gameState.player.active;
}

// TEST 1: Movement & Jumping
function testMovement(gameState) {
    if (!hasPlayer(gameState)) return null;
    const frame = gameState.frameCount;
    
    // Move Right constantly
    // Jump every 60 frames
    return {
        right: true,
        jump: frame % 60 === 0
    };
}

// TEST 2: Shooting & Level Up
function testShooting(gameState) {
    if (!hasPlayer(gameState)) return null;
    const frame = gameState.frameCount;

    // Simulate collecting XP by artificially adding it to player
    // This is "cheating" for the test to verify logic without needing precise movement to collect items
    if (frame % 30 === 0) {
        gameState.player.addXP(2);
    }

    return {
        shoot: frame % 10 === 0, // Rapid fire
        up: frame % 120 > 60 // Alternate aim up/down
    };
}

// TEST 3: Damage
function testDamage(gameState) {
    if (!hasPlayer(gameState)) return null;
    
    // Find nearest enemy
    let target = null;
    let minDist = 9999;
    
    gameState.enemies.forEach(e => {
        const d = Math.abs(e.x - gameState.player.x);
        if (d < minDist) {
            minDist = d;
            target = e;
        }
    });

    if (target) {
        // Move towards enemy
        if (target.x > gameState.player.x) return { right: true };
        else return { left: true };
    }
    
    return { right: true }; // Search
}

// TEST 4: Death (Suicide)
function testDeath(gameState) {
    if (!hasPlayer(gameState)) return null;
    
    // Assuming spikes are at bottom or find a spike tile
    // For this map, spikes are at (row 11, col 23-30)
    // Just run right until we hit them
    return { right: true };
}

// TEST 5: Win
function testWin(gameState) {
    if (!hasPlayer(gameState)) return null;
    
    // Teleport close to door for verification (cheat)
    // Door is at bottom right
    if (gameState.player.x < 800) { // arbitrary far right
         gameState.player.x = 900; // Near door location in map (approx 45 tiles * 20 = 900)
         gameState.player.y = 360; 
    }
    
    return { right: true };
}


export function get_automated_testing_action(gameState) {
    if (gameState.gamePhase !== "PLAYING") {
        // Auto-start game if in menu
        if (gameState.gamePhase === "START") {
            // Simulate Enter press via logic (not key) - wait, this function returns inputs for player update loop
            // To start game, we need to handle it in global key handler or here.
            // But since this returns Player Inputs, we can't control Game Phase directly here easily without hacks.
            // We'll rely on the user or the test harness pressing Enter, OR we can hack it:
            gameState.gamePhase = "PLAYING";
        }
        return null;
    }

    switch (gameState.controlMode) {
        case "TEST_1": return testMovement(gameState);
        case "TEST_2": return testShooting(gameState);
        case "TEST_3": return testDamage(gameState);
        case "TEST_4": return testDeath(gameState);
        case "TEST_5": return testWin(gameState);
        default: return null;
    }
}