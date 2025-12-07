import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, checkAABB } from './globals.js';
import { checkAABB as utilsCheckAABB } from './utils.js';

export function updatePhysics(dt) {
    // Collision detection
    if (!gameState.player) return;
    
    const playerBox = gameState.player.collider;
    
    // Check Coins
    for (let i = gameState.entities.length - 1; i >= 0; i--) {
        const ent = gameState.entities[i];
        if (!ent.active) continue;
        
        // Rough distance check first
        if (ent.mesh.position.distanceTo(gameState.player.mesh.position) > 5) continue;
        
        if (utilsCheckAABB(playerBox, ent.collider)) {
            if (ent instanceof gameState.CoinClass) {
                ent.collect();
                gameState.score += 50;
                gameState.coins++;
            } else if (ent instanceof gameState.ObstacleClass) {
                // Hit obstacle
                gameState.player.die();
            }
        }
    }
}