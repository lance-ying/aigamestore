import { gameState, LANE_WIDTH } from './globals.js';
import { inputQueue } from './input.js';
import { random } from './utils.js';

export function updateAI(deltaTime) {
    if (gameState.controlMode === 'HUMAN') return;

    gameState.testTimer += deltaTime;

    if (gameState.controlMode === 'TEST_1') {
        // Random chaotic movement
        if (gameState.testTimer > 0.5) {
            gameState.testTimer = 0;
            const r = random();
            if (r < 0.3) inputQueue.push('LEFT');
            else if (r < 0.6) inputQueue.push('RIGHT');
            else if (r < 0.8) inputQueue.push('JUMP');
            else inputQueue.push('SLIDE');
        }
    } else if (gameState.controlMode === 'TEST_2') {
        // Smart AI
        runSmartAI(deltaTime);
    }
}

function runSmartAI(deltaTime) {
    // Scan ahead
    if (!gameState.player) return;
    
    // Reaction speed limiter
    if (gameState.testTimer < 0.2) return; 
    
    const pZ = gameState.player.mesh.position.z;
    const currentLane = gameState.player.currentLane;
    const currentX = (currentLane - 1) * LANE_WIDTH;

    // Look for closest obstacle in front
    let closestObs = null;
    let minDist = 999;

    gameState.obstacles.forEach(obs => {
        const obsZ = obs.mesh.position.z;
        // Only care about obstacles in front, within 20 units
        if (obsZ < pZ && obsZ > pZ - 20) {
            const dist = pZ - obsZ;
            if (dist < minDist) {
                minDist = dist;
                closestObs = obs;
            }
        }
    });

    if (closestObs && minDist < 10) { // React when close
        gameState.testTimer = 0; // Reset timer on action
        
        // Is it in our lane?
        const obsX = closestObs.mesh.position.x;
        // Simple X check (assuming grid alignment)
        const inLane = Math.abs(obsX - currentX) < 1.0;
        
        if (inLane) {
            // Must act!
            if (closestObs.type === 'WALL') {
                inputQueue.push('JUMP');
            } else if (closestObs.type === 'BEAM') {
                inputQueue.push('SLIDE');
            } else if (closestObs.type === 'PIT') {
                // Must change lane or jump? Pits are usually jumpable in this version
                inputQueue.push('JUMP');
                // Or try to dodge if possible?
                // Let's bias jumping for pits
            }
        } else {
            // Maybe move towards coins if safe?
            // (Simple AI: just stay safe)
        }
    } else {
        // No immediate threat, collect coins?
        if (gameState.testTimer > 0.5) {
             // Look for coins
             // Simple random lane change to keep it interesting if safe
             gameState.testTimer = 0;
             // Don't kill self with random moves, only move if no obstacle there
             // For now, just run straight mostly
        }
    }
}