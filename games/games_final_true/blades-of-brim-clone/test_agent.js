import { gameState, LANE_WIDTH } from './globals.js';
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// Automated Testing Logic
export function updateTestAgent() {
    if (gameState.gamePhase !== 'PLAYING' || !gameState.player) return;
    
    const mode = gameState.controlMode;
    if (mode === 'HUMAN') return;

    // Reset inputs
    gameState.input.left = false;
    gameState.input.right = false;
    gameState.input.up = false;
    gameState.input.down = false;
    gameState.input.attack = false;

    const player = gameState.player;
    const lookAheadDist = 15;
    
    // 1. Scan lanes for obstacles
    const lanes = [-1, 0, 1];
    const laneStatus = {
        "-1": { danger: 0, coins: 0, enemy: 0 },
        "0": { danger: 0, coins: 0, enemy: 0 },
        "1": { danger: 0, coins: 0, enemy: 0 }
    };

    gameState.entities.forEach(ent => {
        if (!ent.active) return;
        
        // Relative Z position (Entity Z - Player Z)
        // Remember player moves -Z usually, but in this treadmill logic?
        // Wait, logic in entities.js: Player moves forward? 
        // No, player moves towards -Z. World is generated in -Z.
        // Wait, standard Three.js: -Z is forward.
        // Let's check World generation: `zPosition - CHUNK_LENGTH`. 
        // Yes, world extends into negative Z.
        // Player starts at 0.
        
        const relZ = ent.mesh.position.z - player.mesh.position.z;
        
        // Interested in things in front (negative relZ) within range
        if (relZ < 0 && relZ > -lookAheadDist) {
            // Determine lane
            let lane = Math.round(ent.mesh.position.x / LANE_WIDTH);
            if (lane < -1) lane = -1;
            if (lane > 1) lane = 1;
            
            // Check type
            // Identify by constructor name or properties
            const type = ent.constructor.name;
            
            if (type === 'Obstacle') {
                laneStatus[lane].danger += 10;
            } else if (type === 'Enemy') {
                laneStatus[lane].enemy += 1;
                // Enemies are dangerous but also targets in TEST_2
            } else if (type === 'Collectible') {
                laneStatus[lane].coins += 1;
            }
        }
    });

    // Decision Logic
    const currentLane = player.currentLane;
    const currentStatus = laneStatus[currentLane];
    
    // TEST 1: Survival - Just avoid danger
    if (mode === 'TEST_1') {
        if (currentStatus.danger > 0 || currentStatus.enemy > 0) {
            // Need to move
            // Check neighbors
            const leftLane = currentLane - 1;
            const rightLane = currentLane + 1;
            
            const leftSafe = leftLane >= -1 && laneStatus[leftLane].danger === 0 && laneStatus[leftLane].enemy === 0;
            const rightSafe = rightLane <= 1 && laneStatus[rightLane].danger === 0 && laneStatus[rightLane].enemy === 0;
            
            if (leftSafe) {
                gameState.input.left = true;
            } else if (rightSafe) {
                gameState.input.right = true;
            } else {
                // Both blocked? Jump!
                gameState.input.up = true;
            }
        }
    }
    
    // TEST 2: Aggressive - Attack enemies, collect coins
    else if (mode === 'TEST_2') {
        // Attack logic: If enemy in current lane and close, attack
        if (currentStatus.enemy > 0) {
             // Find closest enemy distance
             // Simplified: just attack if enemy detected in range
             gameState.input.attack = true;
        } else if (currentStatus.danger > 0) {
            // Dodge obstacles like TEST_1
             const leftLane = currentLane - 1;
            const rightLane = currentLane + 1;
            
            const leftSafe = leftLane >= -1 && laneStatus[leftLane].danger === 0;
            const rightSafe = rightLane <= 1 && laneStatus[rightLane].danger === 0;
            
            if (leftSafe) gameState.input.left = true;
            else if (rightSafe) gameState.input.right = true;
            else gameState.input.up = true;
        } else {
            // Seek Coins or Enemies if safe
            const leftLane = currentLane - 1;
            const rightLane = currentLane + 1;
            
            const leftScore = (leftLane >= -1) ? laneStatus[leftLane].coins + laneStatus[leftLane].enemy * 2 : -1;
            const rightScore = (rightLane <= 1) ? laneStatus[rightLane].coins + laneStatus[rightLane].enemy * 2 : -1;
            
            if (leftScore > 0 && leftScore > rightScore) gameState.input.left = true;
            else if (rightScore > 0 && rightScore > leftScore) gameState.input.right = true;
        }
    }
}