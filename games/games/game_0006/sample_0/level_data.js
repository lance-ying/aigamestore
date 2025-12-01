import { Platform, Coin, Hazard, Switch, Door, Player } from './entities.js';
import { gameState, resetLevelState } from './globals.js';

export const LEVEL_DATA = [
    {
        // Level 1: Basics
        worldWidth: 1200,
        worldHeight: 600,
        setup: (p) => {
            // Ground
            gameState.platforms.push(new Platform(0, 350, 400, 50));
            gameState.platforms.push(new Platform(500, 300, 700, 300)); // Step up
            
            // Floating Tutorial
            gameState.platforms.push(new Platform(200, 200, 100, 20));
            
            // Coins
            gameState.coins.push(new Coin(250, 150));
            gameState.coins.push(new Coin(300, 300));
            gameState.coins.push(new Coin(600, 250));
            gameState.coins.push(new Coin(800, 250));
            gameState.coins.push(new Coin(1100, 250)); // Exit coin
            
            // Player
            gameState.player = new Player(50, 300);
        }
    },
    {
        // Level 2: Hazards & Diving
        worldWidth: 1500,
        worldHeight: 800,
        setup: (p) => {
            // Ground segments
            gameState.platforms.push(new Platform(0, 350, 300, 50));
            gameState.platforms.push(new Platform(400, 450, 200, 50));
            gameState.platforms.push(new Platform(700, 350, 800, 450));
            
            // Hazards
            gameState.hazards.push(new Hazard(320, 500, 30, 30)); // Pit hazard
            gameState.hazards.push(new Hazard(650, 500, 30, 30));
            
            // High platforms (require Float)
            gameState.platforms.push(new Platform(100, 200, 100, 20));
            gameState.platforms.push(new Platform(300, 150, 100, 20));
            
            // Coins
            gameState.coins.push(new Coin(150, 150));
            gameState.coins.push(new Coin(350, 100));
            gameState.coins.push(new Coin(500, 400));
            gameState.coins.push(new Coin(1400, 300));
            
            gameState.player = new Player(50, 300);
        }
    },
    {
        // Level 3: Puzzle
        worldWidth: 1000,
        worldHeight: 600,
        setup: (p) => {
            // Floor
            gameState.platforms.push(new Platform(0, 500, 1000, 100));
            
            // Wall blocking exit
            gameState.platforms.push(new Platform(800, 0, 50, 500));
            
            // Door in the wall
            let door = new Door(800, 350, 50, 150, 1);
            gameState.doors.push(door);
            
            // Switch platform high up
            gameState.platforms.push(new Platform(400, 200, 100, 20));
            
            // Switch
            gameState.switches.push(new Switch(450, 200, 1));
            
            // Coins path to switch
            gameState.coins.push(new Coin(200, 400));
            gameState.coins.push(new Coin(300, 300));
            gameState.coins.push(new Coin(450, 150));
            
            // Exit coin
            gameState.coins.push(new Coin(900, 450));
            
            gameState.player = new Player(50, 450);
        }
    }
];

export function loadLevel(index, p) {
    resetLevelState();
    
    // Bounds check
    if (index >= LEVEL_DATA.length) {
        // Game Complete / Loop
        index = 0; 
    }
    
    gameState.currentLevelIndex = index;
    const data = LEVEL_DATA[index];
    gameState.worldWidth = data.worldWidth;
    gameState.worldHeight = data.worldHeight;
    
    data.setup(p);
    
    // Count total coins
    gameState.totalCoinsInLevel = gameState.coins.length;
    
    // Reset Camera
    gameState.cameraX = 0;
    gameState.cameraY = 0;
}