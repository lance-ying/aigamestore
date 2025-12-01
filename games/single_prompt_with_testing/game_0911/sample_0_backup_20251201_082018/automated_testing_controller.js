import { gameState, TILE, TILE_SIZE, TOOL, WORLD_WIDTH_TILES, WORLD_HEIGHT_TILES } from './globals.js';
import { getTileAt } from './physics.js';

function getNearestGold(player) {
    let nearest = null;
    let minDist = Infinity;
    
    // Scan world for gold
    for(let x=0; x<WORLD_WIDTH_TILES; x++) {
        for(let y=0; y<WORLD_HEIGHT_TILES; y++) {
            if(gameState.worldMap[x][y] === TILE.GOLD) {
                const wx = x * TILE_SIZE;
                const wy = y * TILE_SIZE;
                const dist = Math.sqrt(Math.pow(wx - player.x, 2) + Math.pow(wy - player.y, 2));
                if(dist < minDist) {
                    minDist = dist;
                    nearest = {x: wx, y: wy, gridX: x, gridY: y};
                }
            }
        }
    }
    return nearest;
}

function getNearestEnemy(player) {
    let nearest = null;
    let minDist = 300; // Detection range
    
    gameState.enemies.forEach(enemy => {
        const dist = Math.sqrt(Math.pow(enemy.x - player.x, 2) + Math.pow(enemy.y - player.y, 2));
        if (dist < minDist) {
            minDist = dist;
            nearest = enemy;
        }
    });
    return nearest;
}

export function get_automated_testing_action(gameState) {
    if (!gameState.player) return null;
    const player = gameState.player;
    
    // TEST 1: Basic Movement Stability
    if (gameState.controlMode === "TEST_1") {
        const time = Date.now() / 1000;
        // Move Left/Right
        if (Math.sin(time) > 0) return { keyCode: 39 }; // Right
        else return { keyCode: 37 }; // Left
        
        // Occasional Jump
        if (Math.random() < 0.05) return { keyCode: 32 };
    }
    
    // TEST 2: Mining / Win Condition
    if (gameState.controlMode === "TEST_2") {
        const target = getNearestGold(player);
        
        // Ensure pickaxe
        if (player.currentTool !== TOOL.PICKAXE) return { keyCode: 16 };
        
        if (target) {
            const dx = target.x - player.x;
            const dy = target.y - player.y;
            
            // Move towards X
            if (dx > 20) return { keyCode: 39 }; // Right
            if (dx < -20) return { keyCode: 37 }; // Left
            
            // If aligned X, handle Y or mining
            // Aim at target
            if (dy > 0) return { keyCode: 40 }; // Down
            if (dy < 0) return { keyCode: 38 }; // Up
            
            // Dig!
            return { keyCode: 90 };
        } else {
             // No gold found? Just dig down
             return { keyCode: 90 }; 
        }
    }
    
    // TEST 3: Combat (Implicit via custom button if added, or extending logic)
    // Adding hypothetical logic for robustness
    const enemy = getNearestEnemy(player);
    if (enemy && Math.random() < 0.5) { // 50% chance to engage if nearby
         // Ensure Sword
         if (player.currentTool !== TOOL.SWORD) return { keyCode: 16 };
         
         const dx = enemy.x - player.x;
         if (dx > 40) return { keyCode: 39 };
         if (dx < -40) return { keyCode: 37 };
         return { keyCode: 90 }; // Attack
    }
    
    return null;
}

window.get_automated_testing_action = get_automated_testing_action;