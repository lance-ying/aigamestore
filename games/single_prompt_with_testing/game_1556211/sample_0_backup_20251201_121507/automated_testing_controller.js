import { TILE_SIZE } from './globals.js';

/**
 * Calculates the automated action for testing.
 * @param {Object} gameState 
 * @returns {Object|null} { move: {x,y}, attack: bool, shoot: bool, roll: bool }
 */
export function get_automated_testing_action(gameState) {
    if (gameState.gamePhase !== 'PLAYING' || !gameState.player) return null;
    
    const player = gameState.player;
    const mode = gameState.controlMode;
    
    if (mode === 'TEST_1') {
        // Random movement and attacks
        const time = Date.now();
        const moveX = Math.sin(time * 0.003);
        const moveY = Math.cos(time * 0.004);
        
        return {
            move: { x: moveX, y: moveY },
            attack: Math.random() < 0.05,
            shoot: Math.random() < 0.05,
            roll: Math.random() < 0.02
        };
    }
    
    if (mode === 'TEST_2') {
        // Pathfinding to goal
        const goal = gameState.endPoint;
        const dx = goal.x - player.x;
        const dy = goal.y - player.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < 10) return { move: { x: 0, y: 0 } };
        
        // Normalize direction
        const nx = dx / dist;
        const ny = dy / dist;
        
        // Roll if far
        const shouldRoll = dist > 100 && Math.random() < 0.1;
        
        // Attack if enemy close
        let attack = false;
        let shoot = false;
        
        for (let e of gameState.enemies) {
            const ed = Math.sqrt((e.x - player.x)**2 + (e.y - player.y)**2);
            if (ed < 60) attack = true;
            else if (ed < 200 && Math.random() < 0.05) shoot = true;
        }
        
        return {
            move: { x: nx, y: ny },
            attack: attack,
            shoot: shoot,
            roll: shouldRoll
        };
    }
    
    return null;
}