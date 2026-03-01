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
        this.createPlatform(currentPos, 4, 4, true);
        gameState.playerSpawn = currentPos.clone().add(new THREE.Vector3(0, 2, 0));
        
        // Generate path
        for (let i = 0; i < segmentCount; i++) {
            // Move forward
            const length = this.rng.rangeInt(6, 12);
            const nextPos = currentPos.clone().add(direction.clone().multiplyScalar(length));
            const midPos = currentPos.clone().lerp(nextPos, 0.5);
            
            // Create Corridor
            const width = 4;
            const corridorSize = new THREE.Vector3(
                Math.abs(direction.x) > 0.5 ? length + width : width,
                1,
                Math.abs(direction.z) > 0.5 ? length + width : width
            );
            
            // Adjust midPos based on orientation to align boxes correctly
            if (Math.abs(direction.z) > 0.5) {
                // Moving Z
                this.createPlatform(midPos, width, length, false);
            } else {
                // Moving X
                this.createPlatform(midPos, length, width, false);
            }
            
            currentPos = nextPos;
            
            // Turn?
            if (i < segmentCount - 1) {
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
                // 20% chance to go straight
            }
        }
        
        // End Platform
        this.createPlatform(currentPos, 6, 6, true);
        
        // Goal
        gameState.goal = new GoalZone(currentPos.clone().add(new THREE.Vector3(0, 0.6, 0)), 1.5);
        gameState.worldContainer.add(gameState.goal.mesh);
    }
    
    createPlatform(center, width, depth, isSafeZone) {
        const thickness = 1;
        
        // Floor
        const floor = new LevelBlock(
            center, 
            new THREE.Vector3(width, thickness, depth), 
            'FLOOR'
        );
        this.addToLevel(floor);
        
        // Walls
        // Add walls on sides to guide player, but leave holes for challenge
        const wallHeight = 1.5;
        const wallThickness = 0.5;
        
        // If not safe zone, randomly remove some walls for difficulty
        const hasLeftWall = isSafeZone || this.rng.random() > 0.3;
        const hasRightWall = isSafeZone || this.rng.random() > 0.3;
        
        if (hasLeftWall) {
            // Logic for "Left" relative to width/depth is tricky in absolute coords
            // Just placing walls on perimeter of the box
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
        
        // Front/Back walls only if it's the very start or end of segment?
        // Simplifying to just side walls for corridors.
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