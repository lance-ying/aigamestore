// Level Design

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Obstacle, Target } from './entities.js';

export function loadLevel(index) {
    gameState.physicsBodies = [];
    gameState.staticBodies = [];
    gameState.targets = [];
    gameState.particles = [];
    gameState.inputString = "";
    gameState.starsCollected = 0;
    
    // Bounds
    const floor = new Obstacle(CANVAS_WIDTH/2, CANVAS_HEIGHT + 10, CANVAS_WIDTH, 20);
    // gameState.staticBodies.push(floor); // Don't add floor by default, let items fall off
    
    switch(index) {
        case 0: // The Drop
            gameState.spawnX = 100;
            gameState.spawnY = 100;
            gameState.staticBodies.push(new Obstacle(100, 300, 200, 20)); // Platform
            gameState.targets.push(new Target(100, 250)); // Target on platform
            break;
            
        case 1: // The Ramp
            gameState.spawnX = 50;
            gameState.spawnY = 50;
            gameState.staticBodies.push(new Obstacle(150, 200, 300, 20, Math.PI/6)); // Ramp
            gameState.staticBodies.push(new Obstacle(500, 350, 100, 20)); // Catch
            gameState.targets.push(new Target(500, 320));
            break;
            
        case 2: // The Gap
            gameState.spawnX = 50;
            gameState.spawnY = 100;
            gameState.staticBodies.push(new Obstacle(100, 300, 200, 20)); // Left
            gameState.staticBodies.push(new Obstacle(500, 300, 200, 20)); // Right
            gameState.targets.push(new Target(500, 250));
            break;
            
        case 3: // The Tower
            gameState.spawnX = 300;
            gameState.spawnY = 100;
            gameState.staticBodies.push(new Obstacle(300, 380, 200, 20));
            gameState.targets.push(new Target(300, 200)); // High up
            break;

        case 4: // The P Hook
            gameState.spawnX = 300;
            gameState.spawnY = 50;
            // A peg to hook onto
            gameState.staticBodies.push(new Obstacle(300, 200, 20, 20));
            gameState.targets.push(new Target(300, 250)); // Below peg
            break;
            
        default:
            gameState.gamePhase = "GAME_OVER_WIN";
            return;
    }
    
    gameState.totalStarsInLevel = gameState.targets.length;
}

export function nextLevel() {
    gameState.currentLevelIndex++;
    gameState.gamePhase = "PLANNING";
    loadLevel(gameState.currentLevelIndex);
}

export function resetLevel() {
    gameState.gamePhase = "PLANNING";
    loadLevel(gameState.currentLevelIndex);
}