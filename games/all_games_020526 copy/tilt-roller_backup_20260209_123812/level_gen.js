import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CONFIG } from './globals.js';
import { LevelBlock, GoalZone } from './entities.js';
import { RNG } from './utils.js';

export class LevelGenerator {
    constructor() {
        this.rng = null;
    }

    generate(levelIndex) {
        this.rng = new RNG(levelIndex * 42); // Seed based on level
        
        // Cleanup existing
        this.clearLevel();
        
        // Init world container
        gameState.worldContainer = new THREE.Group();
        gameState.scene.add(gameState.worldContainer);
        
        // Level parameters
        const segmentCount = 5 + Math.floor(levelIndex * 1.5);
        let currentPos = new THREE.Vector3(0, 0, 0);
        let direction = new THREE.Vector3(0, 0, -1); // Forward
        
        // Start Platform
        this.createPlatform(currentPos, 6, 6, true); // Increased from 4,4
        gameState.playerSpawn = currentPos.clone().add(new THREE.Vector3(0, 2, 0));
        
        // Generate path
        for (let i = 0; i < segmentCount; i++) {
            // Move forward
            const length = this.rng.rangeInt(8, 14); // Increased length from 6,12 to 8,14 to match width increase
            
            // For Level 3, we pre-calculate the turn to avoid blocking walls
            let turnDir = null;
            if (levelIndex === 3 && i < segmentCount - 1) {
                const r = this.rng.random();
                if (r < 0.4) turnDir = 'LEFT';
                else if (r < 0.8) turnDir = 'RIGHT';
                else turnDir = 'NONE';
            }

            const nextPos = currentPos.clone().add(direction.clone().multiplyScalar(length));
            const midPos = currentPos.clone().lerp(nextPos, 0.5);
            
            // Create Corridor
            const width = 6; // Increased width from 4
            
            // Adjust midPos based on orientation to align boxes correctly
            if (Math.abs(direction.z) > 0.5) {
                // Moving Z
                // Passing turnDir and direction ONLY for Level 3 fixes
                this.createPlatform(midPos, width, length, false, turnDir, direction);
            } else {
                // Moving X
                this.createPlatform(midPos, length, width, false, turnDir, direction);
            }
            
            currentPos = nextPos;
            
            // Turn?
            if (i < segmentCount - 1) {
                if (levelIndex === 3) {
                    // Use pre-calculated turn
                    if (turnDir === 'LEFT') {
                        const temp = direction.x; direction.x = direction.z; direction.z = -temp;
                    } else if (turnDir === 'RIGHT') {
                        const temp = direction.x; direction.x = -direction.z; direction.z = temp;
                    }
                } else {
                    // Original Logic for other levels (preserves seed sequence)
                    const turn = this.rng.random();
                    if (turn < 0.4) {
                        // Turn Left
                        const temp = direction.x;
                        direction.x = direction.z;
                        direction.z = -temp;
                    } else if (turn < 0.8) {
                        // Turn Right
                        const temp = direction.x;
                        direction.x = -direction.z;
                        direction.z = temp;
                    }
                }
            }
        }
        
        // End Platform
        this.createPlatform(currentPos, 8, 8, true); // Increased from 6,6
        
        // Goal
        gameState.goal = new GoalZone(currentPos.clone().add(new THREE.Vector3(0, 0.6, 0)), 1.5);
        gameState.worldContainer.add(gameState.goal.mesh);
    }
    
    createPlatform(center, width, depth, isSafeZone, turnDir = null, moveDir = null) {
        const thickness = 1;
        
        // Floor
        const floor = new LevelBlock(
            center, 
            new THREE.Vector3(width, thickness, depth), 
            'FLOOR'
        );
        this.addToLevel(floor);
        
        // Walls
        const wallHeight = 1.5;
        const wallThickness = 0.5;
        
        const isLevel3 = (gameState.levelIndex === 3);

        // For Level 3, fix wall generation for X-aligned segments and turns
        if (isLevel3 && width > depth) {
            // X-Aligned Segment (Moving along X axis)
            // Walls should be at +/- Z (sides), not +/- X (ends)
            
            let skipPosZ = false; // Skip wall at +Z
            let skipNegZ = false; // Skip wall at -Z
            
            if (turnDir && moveDir) {
                if (moveDir.x > 0.5) { // Moving +X
                    // Left is -Z, Right is +Z
                    if (turnDir === 'LEFT') skipNegZ = true;
                    if (turnDir === 'RIGHT') skipPosZ = true;
                } else if (moveDir.x < -0.5) { // Moving -X
                    // Left is +Z, Right is -Z
                    if (turnDir === 'LEFT') skipPosZ = true;
                    if (turnDir === 'RIGHT') skipNegZ = true;
                }
            }

            const hasNegZ = !skipNegZ && (isSafeZone || this.rng.random() > 0.3);
            if (hasNegZ) {
                const pos = center.clone().add(new THREE.Vector3(0, wallHeight/2, -depth/2 - wallThickness/2));
                const wall = new LevelBlock(pos, new THREE.Vector3(width, wallHeight + thickness, wallThickness), 'WALL');
                this.addToLevel(wall);
            }

            const hasPosZ = !skipPosZ && (isSafeZone || this.rng.random() > 0.3);
            if (hasPosZ) {
                const pos = center.clone().add(new THREE.Vector3(0, wallHeight/2, depth/2 + wallThickness/2));
                const wall = new LevelBlock(pos, new THREE.Vector3(width, wallHeight + thickness, wallThickness), 'WALL');
                this.addToLevel(wall);
            }

        } else {
            // Standard Logic (Z-Aligned or Legacy behavior for other levels)
            // Walls are at +/- X
            
            let skipPosX = false; // Skip wall at +X
            let skipNegX = false; // Skip wall at -X
            
            if (isLevel3 && turnDir && moveDir) {
                // Moving Z
                if (moveDir.z < -0.5) { // North (-Z)
                    // Left is -X, Right is +X
                    if (turnDir === 'LEFT') skipNegX = true;
                    if (turnDir === 'RIGHT') skipPosX = true;
                } else if (moveDir.z > 0.5) { // South (+Z)
                    // Left is +X, Right is -X
                    if (turnDir === 'LEFT') skipPosX = true;
                    if (turnDir === 'RIGHT') skipNegX = true;
                }
            }

            // Note: Original code logic maps "Left" var to -X position, "Right" var to +X position
            const hasLeftWall = !skipNegX && (isSafeZone || this.rng.random() > 0.3);
            const hasRightWall = !skipPosX && (isSafeZone || this.rng.random() > 0.3);
            
            if (hasLeftWall) {
                const leftPos = center.clone().add(new THREE.Vector3(-width/2 - wallThickness/2, wallHeight/2, 0));
                const leftWall = new LevelBlock(
                    leftPos,
                    new THREE.Vector3(wallThickness, wallHeight + thickness, depth),
                    'WALL'
                );
                this.addToLevel(leftWall);
            }
            
            if (hasRightWall) {
                const rightPos = center.clone().add(new THREE.Vector3(width/2 + wallThickness/2, wallHeight/2, 0));
                const rightWall = new LevelBlock(
                    rightPos,
                    new THREE.Vector3(wallThickness, wallHeight + thickness, depth),
                    'WALL'
                );
                this.addToLevel(rightWall);
            }
        }
    }

    addToLevel(block) {
        gameState.levelObjects.push(block);
        gameState.worldContainer.add(block.mesh);
    }

    clearLevel() {
        if (gameState.worldContainer) {
            gameState.scene.remove(gameState.worldContainer);
            // Dispose logic ideally here
        }
        gameState.levelObjects = [];
        gameState.goal = null;
    }
}