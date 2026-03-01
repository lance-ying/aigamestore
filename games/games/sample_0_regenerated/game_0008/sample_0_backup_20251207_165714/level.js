/**
 * Procedural Level Generation
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, getSpacing, getSpeed, LEVEL_LENGTH, PALETTES, COLOR_BG } from './globals.js';
import { Tile, Collectible } from './entities.js';
import { randomRange, randomInt, lerp } from './utils.js';

let nextSpawnZ = 0;
let lastX = 0;

export function initLevel() {
    nextSpawnZ = 0;
    lastX = 0;
    gameState.level = 1;
    
    // Reset background to initial
    if (gameState.scene) {
        gameState.scene.background = new THREE.Color(COLOR_BG);
        gameState.scene.fog = new THREE.FogExp2(COLOR_BG, 0.02);
    }
    
    // Spawn initial platform
    new Tile(0, 0, PALETTES[0]);
    nextSpawnZ += getSpacing(1);
    
    // Pre-spawn some tiles
    for (let i = 0; i < 10; i++) {
        spawnNextTile();
    }
}

export function updateLevelGeneration() {
    if (!gameState.player) return;
    
    const playerZ = gameState.player.position.z;
    const renderDistance = 100;
    
    // Generate ahead
    while (nextSpawnZ < playerZ + renderDistance) {
        spawnNextTile();
    }
    
    // Update Environment (Level Transition)
    updateEnvironment(playerZ);
}

function updateEnvironment(playerZ) {
    // Determine current level based on player position
    const currentLevel = Math.floor(playerZ / LEVEL_LENGTH) + 1;
    gameState.level = currentLevel;
    
    // Get palette for current level
    const paletteIndex = (currentLevel - 1) % PALETTES.length;
    const targetBgHex = PALETTES[paletteIndex].bg;
    
    // Smoothly lerp background color
    if (gameState.scene) {
        const currentBg = gameState.scene.background;
        const targetBg = new THREE.Color(targetBgHex);
        
        currentBg.lerp(targetBg, 0.05);
        gameState.scene.fog.color.copy(currentBg);
    }
}

function spawnNextTile() {
    // Determine level for this specific tile
    const tileLevel = Math.floor(nextSpawnZ / LEVEL_LENGTH) + 1;
    const paletteIndex = (tileLevel - 1) % PALETTES.length;
    const palette = PALETTES[paletteIndex];
    
    // Difficulty Scaling
    // Base deviation increased to 7 (was 4) to make initial levels harder
    const difficultyMultiplier = Math.min(tileLevel - 1, 10);
    const maxDev = Math.min(7 + (difficultyMultiplier * 1.5), 14);
    
    // Determine next position
    let nextX = lastX + randomRange(-maxDev, maxDev);
    
    // Clamp to lane width
    const laneWidth = 12;
    if (nextX > laneWidth) nextX = laneWidth;
    if (nextX < -laneWidth) nextX = -laneWidth;
    
    lastX = nextX;
    
    new Tile(nextX, nextSpawnZ, palette);
    
    // Chance for collectible
    if (Math.random() > 0.7) {
        new Collectible(nextX, nextSpawnZ);
    }
    
    // Calculate spacing based on the speed of the level this tile belongs to
    // This ensures the jump arc matches the distance
    nextSpawnZ += getSpacing(tileLevel);
}