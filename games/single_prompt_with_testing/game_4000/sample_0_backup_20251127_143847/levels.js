// levels.js - Level generation and management
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';
import { Platform, ExitDoor, Collectible } from './entities.js';

export function loadLevel(levelNumber) {
    // Clear existing level
    clearLevel();
    
    switch (levelNumber) {
        case 1:
            createLevel1();
            break;
        case 2:
            createLevel2();
            break;
        case 3:
            createLevel3();
            break;
        default:
            createLevel1();
    }
    
    gameState.currentLevel = levelNumber;
}

function clearLevel() {
    // Remove platforms
    gameState.platforms.forEach(platform => {
        gameState.scene.remove(platform.mesh);
    });
    gameState.platforms = [];
    gameState.portalSurfaces = [];
    
    // Remove collectibles
    gameState.collectibles.forEach(item => {
        if (!item.collected) {
            gameState.scene.remove(item.mesh);
        }
    });
    gameState.collectibles = [];
    
    // Remove exit door
    if (gameState.exitDoor) {
        gameState.scene.remove(gameState.exitDoor.frameMesh);
        gameState.scene.remove(gameState.exitDoor.doorMesh);
        gameState.exitDoor = null;
    }
    
    // Deactivate portals
    if (gameState.bluePortal) {
        gameState.bluePortal.deactivate();
    }
    if (gameState.orangePortal) {
        gameState.orangePortal.deactivate();
    }
}

function createLevel1() {
    // Simple introductory level
    // Ground floor
    new Platform(0, -0.5, 0, 20, 1, 20, false);
    
    // Left wall (portal surface)
    new Platform(-10, 5, 0, 1, 12, 20, true);
    
    // Right wall (portal surface)
    new Platform(10, 5, 0, 1, 12, 20, true);
    
    // Back wall
    new Platform(0, 5, -10, 20, 12, 1, false);
    
    // Front wall sections (leaving space for exit)
    new Platform(-5, 5, 10, 8, 12, 1, true);
    new Platform(7, 5, 10, 4, 12, 1, true);
    
    // Elevated platform
    new Platform(5, 3, -5, 4, 1, 4, true);
    
    // Exit on elevated platform
    gameState.exitDoor = new ExitDoor(5, 5, -5);
    
    // Collectibles
    gameState.collectibles.push(new Collectible(-5, 2, -5));
    gameState.collectibles.push(new Collectible(5, 1, 5));
    gameState.collectibles.push(new Collectible(-5, 1, 5));
}

function createLevel2() {
    // More complex level with multiple platforms
    // Ground floor
    new Platform(0, -0.5, 0, 30, 1, 30, false);
    
    // Walls
    new Platform(-15, 8, 0, 1, 18, 30, true);
    new Platform(15, 8, 0, 1, 18, 30, true);
    new Platform(0, 8, -15, 30, 18, 1, true);
    new Platform(0, 8, 15, 30, 18, 1, false);
    
    // Platform stairs
    new Platform(-10, 1.5, -10, 4, 2, 4, true);
    new Platform(-5, 3.5, -5, 4, 2, 4, true);
    new Platform(0, 5.5, 0, 4, 2, 4, true);
    new Platform(5, 7.5, 5, 4, 2, 4, true);
    
    // Final platform with exit
    new Platform(10, 10, 10, 6, 1, 6, true);
    gameState.exitDoor = new ExitDoor(10, 12.5, 10);
    
    // Collectibles
    gameState.collectibles.push(new Collectible(-10, 3, -10));
    gameState.collectibles.push(new Collectible(-5, 5, -5));
    gameState.collectibles.push(new Collectible(0, 7, 0));
    gameState.collectibles.push(new Collectible(5, 9, 5));
}

function createLevel3() {
    // Advanced level with complex geometry
    // Ground floor
    new Platform(0, -0.5, 0, 40, 1, 40, false);
    
    // Walls
    new Platform(-20, 10, 0, 1, 22, 40, true);
    new Platform(20, 10, 0, 1, 22, 40, true);
    new Platform(0, 10, -20, 40, 22, 1, true);
    new Platform(0, 10, 20, 40, 22, 1, false);
    
    // Ceiling
    new Platform(0, 20, 0, 40, 1, 40, true);
    
    // Floating platforms
    new Platform(-15, 3, -15, 5, 1, 5, true);
    new Platform(-10, 6, 0, 5, 1, 5, true);
    new Platform(0, 9, 15, 5, 1, 5, true);
    new Platform(10, 12, -10, 5, 1, 5, true);
    new Platform(15, 15, 5, 5, 1, 5, true);
    
    // Exit platform (very high)
    new Platform(0, 18, 0, 6, 1, 6, true);
    gameState.exitDoor = new ExitDoor(0, 20.5, 0);
    
    // Collectibles
    gameState.collectibles.push(new Collectible(-15, 5, -15));
    gameState.collectibles.push(new Collectible(-10, 8, 0));
    gameState.collectibles.push(new Collectible(0, 11, 15));
    gameState.collectibles.push(new Collectible(10, 14, -10));
    gameState.collectibles.push(new Collectible(15, 17, 5));
}