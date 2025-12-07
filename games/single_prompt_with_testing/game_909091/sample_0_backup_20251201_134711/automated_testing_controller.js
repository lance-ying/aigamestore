// Automated Testing Logic
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE } from './globals.js';
import { checkTileCollision } from './physics.js';

function getTest1Action() {
    // Win Strategy: Move right, jump over obstacles
    if (!gameState.player) return null;
    
    const p = gameState.player;
    let action = { keyCode: 0 }; // Default none
    
    // Always move right
    // Simulate pressing RIGHT arrow
    gameState.keys[39] = true;
    
    // Simple AI: Raycast ahead to see if we need to jump
    // Check tile in front
    const tileX = Math.floor((p.x + p.width + 10) / TILE_SIZE);
    const tileY = Math.floor((p.y + p.height - 5) / TILE_SIZE);
    
    // Check for wall or pit
    // Look for blocks in front
    const wallAhead = gameState.tiles.find(t => 
        t.x > p.x && t.x < p.x + 80 && 
        t.y < p.y + p.height && t.y + t.height > p.y &&
        t.isSolid
    );
    
    // Look for pit (lack of blocks below future position)
    const groundAhead = gameState.tiles.find(t =>
        t.x > p.x + 40 && t.x < p.x + 80 &&
        t.y > p.y && t.y < p.y + 150
    );
    
    const enemyAhead = gameState.entities.find(e => 
        e.x > p.x && e.x < p.x + 100 &&
        e.y < p.y + p.height && e.y + e.height > p.y &&
        e !== p
    );
    
    const shouldJump = (wallAhead || !groundAhead || enemyAhead) && p.onGround;
    
    if (shouldJump) {
        gameState.keys[32] = true; // Press Jump
    } else {
        // Release jump occasionally to allow falling/short hops
        if (Math.random() > 0.8) gameState.keys[32] = false;
    }
    
    // Attack occasionally
    if (enemyAhead && Math.random() > 0.9) {
        gameState.keys[90] = true;
    } else {
        gameState.keys[90] = false;
    }

    return null; // Direct state manipulation used for simplicity with existing input polling
}

function getTest2Action() {
    // Random Inputs
    const keys = [37, 38, 39, 40, 32, 90, 16];
    
    // Clear all keys first randomly
    if(Math.random() > 0.5) {
        keys.forEach(k => gameState.keys[k] = false);
    }
    
    // Press random keys
    const count = Math.floor(Math.random() * 3);
    for(let i=0; i<count; i++) {
        const k = keys[Math.floor(Math.random() * keys.length)];
        gameState.keys[k] = true;
    }
    
    return null;
}

export function updateAutomatedTesting() {
    if (gameState.controlMode === 'TEST_1') {
        getTest1Action();
    } else if (gameState.controlMode === 'TEST_2') {
        getTest2Action();
    }
}