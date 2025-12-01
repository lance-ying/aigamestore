/**
 * Physics setup and collision handling using Matter.js
 */
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events, World, Body, Vector, Composite } = Matter;
import { gameState, WORLD_GRAVITY } from './globals.js';

export function setupPhysics(engine) {
    // Basic configuration
    engine.world.gravity.y = WORLD_GRAVITY;
    engine.world.gravity.x = 0;
    
    // Collision Events
    Events.on(engine, 'collisionStart', (event) => {
        event.pairs.forEach((pair) => {
            const { bodyA, bodyB } = pair;
            
            // Check Player vs Terrain (Ground detection)
            if (isPlayer(bodyA) && isTerrain(bodyB) || isPlayer(bodyB) && isTerrain(bodyA)) {
                if (gameState.player) {
                    gameState.player.onGround = true;
                }
            }
            
            // Check Player vs Coin
            if (isPlayer(bodyA) && isCoin(bodyB)) {
                collectCoin(bodyB);
            } else if (isPlayer(bodyB) && isCoin(bodyA)) {
                collectCoin(bodyA);
            }
        });
    });

    Events.on(engine, 'collisionEnd', (event) => {
        event.pairs.forEach((pair) => {
            const { bodyA, bodyB } = pair;
            
            // Player left ground
            if (isPlayer(bodyA) && isTerrain(bodyB) || isPlayer(bodyB) && isTerrain(bodyA)) {
                if (gameState.player) {
                    gameState.player.onGround = false;
                }
            }
        });
    });
}

// Helper functions for identifying bodies
function isPlayer(body) {
    return body.label === 'player';
}

function isTerrain(body) {
    return body.label === 'terrain';
}

function isCoin(body) {
    return body.label === 'coin';
}

function collectCoin(coinBody) {
    // Find coin entity to remove
    const coinIndex = gameState.coins.findIndex(c => c.body === coinBody);
    if (coinIndex !== -1) {
        const coin = gameState.coins[coinIndex];
        gameState.score += coin.value;
        coin.collected = true;
        
        // Remove physics body
        World.remove(gameState.world, coinBody);
        
        // Remove from array
        gameState.coins.splice(coinIndex, 1);
        
        // Also remove from main entities list if present
        const entityIndex = gameState.entities.indexOf(coin);
        if (entityIndex !== -1) {
            gameState.entities.splice(entityIndex, 1);
        }
    }
}