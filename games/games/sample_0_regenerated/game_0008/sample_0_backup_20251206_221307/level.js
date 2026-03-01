/**
 * Procedural Level Generation
 */
import { gameState, TILE_SPACING, TILE_SIZE } from './globals.js';
import { Tile, Collectible } from './entities.js';
import { randomRange, randomInt } from './utils.js';

let nextSpawnZ = 0;
let lastX = 0;

export function initLevel() {
    nextSpawnZ = 0;
    lastX = 0;
    
    // Spawn initial platform
    new Tile(0, 0);
    nextSpawnZ += TILE_SPACING;
    
    // Pre-spawn some tiles
    for (let i = 0; i < 10; i++) {
        spawnNextTile();
    }
}

export function updateLevelGeneration() {
    if (!gameState.player) return;
    
    const playerZ = gameState.player.position.z;
    const renderDistance = 100;
    
    while (nextSpawnZ < playerZ + renderDistance) {
        spawnNextTile();
    }
}

function spawnNextTile() {
    // Determine next position
    // Random deviation for X, constrained
    const maxDev = 4;
    let nextX = lastX + randomRange(-maxDev, maxDev);
    
    // Clamp to lane width roughly to prevent going too far out
    if (nextX > 10) nextX = 10;
    if (nextX < -10) nextX = -10;
    
    lastX = nextX;
    
    new Tile(nextX, nextSpawnZ);
    
    // Chance for collectible
    if (Math.random() > 0.7) {
        new Collectible(nextX, nextSpawnZ);
    }
    
    nextSpawnZ += TILE_SPACING;
}