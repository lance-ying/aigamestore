import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, LANE_WIDTH, COLORS, RAMP_LENGTH } from './globals.js';
import { Orb, Ramp, TrackSegment } from './entities.js';
import { getRandomGameColor, getRandomElement, getRandomRange } from './utils.js';

// World Generation State
let nextSpawnZ = 0;
const SEGMENT_LENGTH = 50;
const SPAWN_AHEAD_DISTANCE = 150;

export function initWorld() {
    nextSpawnZ = 10; // Start slightly ahead
    // Clear existing
    clearWorld();
    
    // Initial safe zone
    spawnTrackSegment(50, false); 
}

export function updateWorld(playerZ) {
    // Spawn new segments as player moves
    while (nextSpawnZ > playerZ - SPAWN_AHEAD_DISTANCE) {
        spawnTrackSegment(SEGMENT_LENGTH, true);
    }
    
    // Cleanup old segments and objects behind player
    const deleteThreshold = playerZ + 20; // 20 units behind player
    
    // Clean segments
    for (let i = gameState.trackSegments.length - 1; i >= 0; i--) {
        const seg = gameState.trackSegments[i];
        if (seg.zStart > deleteThreshold) { // Remember Z is negative
             // Actually, Z decreases as we go forward. Player Z becomes -10, -20, etc.
             // So "Behind" means Z > PlayerZ + offset
             // Wait, logic check: Player starts 0, moves -Z. 
             // Behind player is Positive Z (or less negative).
             if (seg.zEnd > deleteThreshold) {
                 seg.destroy();
                 gameState.trackSegments.splice(i, 1);
             }
        }
    }

    // Clean entities
    const cleanEntityList = (list) => {
        for (let i = list.length - 1; i >= 0; i--) {
            if (list[i].mesh.position.z > deleteThreshold) {
                list[i].destroy();
                list.splice(i, 1);
            }
        }
    };
    cleanEntityList(gameState.orbs);
    cleanEntityList(gameState.ramps);
}

function clearWorld() {
    gameState.orbs.forEach(o => o.destroy());
    gameState.orbs = [];
    
    gameState.ramps.forEach(r => r.destroy());
    gameState.ramps = [];
    
    gameState.trackSegments.forEach(t => t.destroy());
    gameState.trackSegments = [];
}

function spawnTrackSegment(length, spawnObjects) {
    // Create floor
    const segment = new TrackSegment(nextSpawnZ, length);
    gameState.trackSegments.push(segment);
    
    if (spawnObjects) {
        spawnObstaclesForSegment(nextSpawnZ, length);
    }
    
    nextSpawnZ -= length;
}

function spawnObstaclesForSegment(startZ, length) {
    const numRows = Math.floor(length / 15); // One row every 15 units
    
    for (let i = 0; i < numRows; i++) {
        const z = startZ - (i * 15) - 10;
        
        const type = Math.random();
        
        if (type < 0.2) {
            // Spawn Ramp
            const lane = getRandomElement([-1, 0, 1]);
            const color = getRandomGameColor();
            const ramp = new Ramp(lane * LANE_WIDTH, z, color);
            gameState.ramps.push(ramp);
        } else {
            // Spawn Orbs
            // Pattern: 3 orbs, at least one matches player color if we can predict?
            // Actually, just random is fine, but ensures solvability.
            // Solvability: If we have a color, we need at least one safe path OR a ramp before.
            // Simplified: Just spawn random rows.
            
            const lanes = [-1, 0, 1];
            // Ensure at least one lane is "safe" (matches a potential color) 
            // Since player color changes, we pick random colors.
            
            lanes.forEach(lane => {
                const color = getRandomGameColor();
                const orb = new Orb(lane * LANE_WIDTH, z, color);
                gameState.orbs.push(orb);
            });
        }
    }
}