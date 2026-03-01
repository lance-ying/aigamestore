/**
 * Procedural Level Generation
 */
import { 
    CANVAS_WIDTH, CANVAS_HEIGHT, gameState
} from './globals.js';
import { Wall, Spike, Enemy, Fruit, Checkpoint, Trophy, ShieldItem } from './entities.js';

export function generateLevel(p) {
    // Clear existing
    gameState.walls = [];
    gameState.hazards = [];
    gameState.collectibles = [];
    gameState.checkpoints = [];
    gameState.enemies = [];
    gameState.entities = [];
    
    const floorHeight = 120; // Lowered from 150
    const levelHeight = gameState.worldHeight;
    const numFloors = Math.floor(levelHeight / floorHeight);
    
    // Create Border Walls
    // Left Wall
    const leftWall = new Wall(0, 0, 20, levelHeight + 200);
    gameState.walls.push(leftWall);
    gameState.entities.push(leftWall);
    
    // Right Wall
    const rightWall = new Wall(CANVAS_WIDTH - 20, 0, 20, levelHeight + 200);
    gameState.walls.push(rightWall);
    gameState.entities.push(rightWall);
    
    // Starting Floor
    const startFloor = new Wall(0, levelHeight - 40, CANVAS_WIDTH, 40);
    gameState.walls.push(startFloor);
    gameState.entities.push(startFloor);
    
    // Procedural Floors
    let currentY = levelHeight - 200;
    
    // We use seeded random via p.random() which is seeded in setup
    for (let i = 0; i < numFloors; i++) {
        const floorType = Math.floor(p.random(4));
        
        // Generate a floor pattern
        switch(floorType) {
            case 0: // Platforms Left and Right
                createPlatform(p, 20, currentY, 150);
                createPlatform(p, CANVAS_WIDTH - 170, currentY - 50, 150);
                if (p.random() > 0.5) createEnemy(p, 20, currentY - 30, 120);
                break;
                
            case 1: // Center Platform with Spikes
                createPlatform(p, CANVAS_WIDTH/2 - 100, currentY, 200);
                if (p.random() > 0.3) createSpike(p, CANVAS_WIDTH/2 - 20, currentY - 20);
                createFruit(p, 40, currentY);
                createFruit(p, CANVAS_WIDTH - 60, currentY);
                break;
                
            case 2: // Zig Zag Walls
                createPlatform(p, 20, currentY, 250);
                createPlatform(p, CANVAS_WIDTH - 270, currentY - 80, 250);
                createFruit(p, CANVAS_WIDTH/2, currentY - 40);
                break;
                
            case 3: // Steps - adjusted for narrower width (400px)
                createPlatform(p, 50, currentY, 100);
                createPlatform(p, 150, currentY - 40, 100);
                createPlatform(p, 250, currentY - 80, 100);
                if (p.random() > 0.6) createEnemy(p, 150, currentY - 70, 70);
                break;
        }

        // Spawn items strategically
        if (i === 2) {
            // Early shield
            createShield(p, CANVAS_WIDTH/2 + 40, currentY - 60);
        } else if (i % 4 === 0 && i > 0) {
            // Shield every 4 floors
            createShield(p, p.random(60, CANVAS_WIDTH - 80), currentY - 60);
        }
        
        // Add checkpoint every 5 floors
        if (i > 0 && i % 5 === 0) {
            createCheckpoint(p, CANVAS_WIDTH/2 - 20, currentY - 40);
        } else {
            // Chance for random fruit
            if (p.random() > 0.5) {
                // Constrain fruit x to be within walls
                createFruit(p, p.random(40, CANVAS_WIDTH - 60), currentY - 100);
            }
        }
        
        currentY -= floorHeight;
    }
    
    // Goal
    const goalPlatform = new Wall(CANVAS_WIDTH/2 - 50, 100, 100, 20);
    gameState.walls.push(goalPlatform);
    gameState.entities.push(goalPlatform);
    
    const trophy = new Trophy(CANVAS_WIDTH/2 - 20, 60);
    gameState.entities.push(trophy);
    // Note: trophy checks its own collision logic
}

function createPlatform(p, x, y, w) {
    const wall = new Wall(x, y, w, 20);
    gameState.walls.push(wall);
    gameState.entities.push(wall);
}

function createSpike(p, x, y) {
    const spike = new Spike(x, y, 20);
    gameState.hazards.push(spike);
    gameState.entities.push(spike);
}

function createEnemy(p, x, y, range) {
    const enemy = new Enemy(x, y, range);
    gameState.enemies.push(enemy);
    gameState.entities.push(enemy);
}

function createFruit(p, x, y) {
    const fruit = new Fruit(x, y);
    gameState.collectibles.push(fruit);
    gameState.entities.push(fruit);
}

function createShield(p, x, y) {
    const shield = new ShieldItem(x, y);
    gameState.collectibles.push(shield);
    gameState.entities.push(shield);
}

function createCheckpoint(p, x, y) {
    const cp = new Checkpoint(x, y);
    gameState.checkpoints.push(cp);
    gameState.entities.push(cp);
    
    // Ensure there is a platform under the checkpoint
    const wall = new Wall(x - 20, y + 40, 80, 20);
    gameState.walls.push(wall);
    gameState.entities.push(wall);
}