import { gameState, CANVAS_HEIGHT, CANVAS_WIDTH } from './globals.js';
import { Player, Platform, Enemy, Collectible } from './entities.js';

export function resetGame(p) {
    loadLevel(p, gameState.currentLevel);
}

export function loadLevel(p, levelIndex) {
    gameState.entities = [];
    gameState.platforms = [];
    gameState.particles = [];
    
    // Player start position
    gameState.player = new Player(50, CANVAS_HEIGHT - 100);
    gameState.entities.push(gameState.player);

    // Floor (exists in all levels)
    gameState.platforms.push(new Platform(-100, CANVAS_HEIGHT - 20, 4000, 40));

    // Level Specific Generation
    if (levelIndex === 1) { // Rookie
        gameState.worldWidth = 1200;
        
        // Platforms
        gameState.platforms.push(new Platform(200, 300, 100, 20));
        gameState.platforms.push(new Platform(400, 250, 150, 20));
        gameState.platforms.push(new Platform(700, 300, 100, 20));

        // Enemies (4 Slimes)
        gameState.entities.push(new Enemy(300, 350, 30, 30, 'SLIME', 10));
        gameState.entities.push(new Enemy(500, 350, 30, 30, 'SLIME', 10));
        gameState.entities.push(new Enemy(800, 350, 30, 30, 'SLIME', 10));
        gameState.entities.push(new Enemy(1000, 350, 30, 30, 'SLIME', 10));

    } else if (levelIndex === 2) { // Forest
        gameState.worldWidth = 1500;
        
        gameState.platforms.push(new Platform(200, 320, 80, 20));
        gameState.platforms.push(new Platform(350, 250, 80, 20));
        gameState.platforms.push(new Platform(500, 180, 200, 20)); // High platform
        gameState.platforms.push(new Platform(800, 300, 100, 20));
        gameState.platforms.push(new Platform(1000, 250, 100, 20));

        // Enemies
        gameState.entities.push(new Enemy(400, 350, 30, 30, 'SLIME', 10));
        gameState.entities.push(new Enemy(600, 150, 30, 30, 'SLIME', 10)); // On platform
        gameState.entities.push(new Enemy(900, 100, 30, 20, 'BAT', 15));
        gameState.entities.push(new Enemy(1200, 150, 30, 20, 'BAT', 15));

        gameState.entities.push(new Collectible(550, 140, 'POTION'));

    } else if (levelIndex === 3) { // Cavern
        gameState.worldWidth = 1800;
        // More verticality
        gameState.platforms.push(new Platform(200, 300, 100, 20));
        gameState.platforms.push(new Platform(300, 220, 100, 20));
        gameState.platforms.push(new Platform(150, 150, 100, 20));
        gameState.platforms.push(new Platform(450, 150, 300, 20));
        gameState.platforms.push(new Platform(800, 300, 100, 20));
        gameState.platforms.push(new Platform(1000, 200, 100, 20));
        
        gameState.entities.push(new Enemy(500, 120, 30, 30, 'SLIME', 15));
        gameState.entities.push(new Enemy(600, 120, 30, 30, 'SLIME', 15));
        gameState.entities.push(new Enemy(300, 100, 30, 20, 'BAT', 20));
        gameState.entities.push(new Enemy(900, 100, 30, 20, 'BAT', 20));
        
        gameState.entities.push(new Collectible(160, 110, 'POTION'));

    } else if (levelIndex === 4) { // Castle
        gameState.worldWidth = 2000;
        gameState.platforms.push(new Platform(300, 300, 200, 20));
        gameState.platforms.push(new Platform(600, 250, 200, 20));
        gameState.platforms.push(new Platform(900, 200, 400, 20)); // Bridge
        
        gameState.entities.push(new Enemy(1000, 160, 40, 60, 'KNIGHT', 50)); // MiniBoss
        gameState.entities.push(new Enemy(400, 270, 30, 30, 'SLIME', 20));
        gameState.entities.push(new Enemy(700, 200, 30, 20, 'BAT', 25));
        
        gameState.entities.push(new Collectible(950, 160, 'POTION'));

    } else if (levelIndex === 5) { // Boss
        gameState.worldWidth = 1000;
        // Arena
        gameState.platforms.push(new Platform(100, 300, 200, 20));
        gameState.platforms.push(new Platform(700, 300, 200, 20));
        
        gameState.entities.push(new Enemy(500, 250, 80, 80, 'BOSS', 200));
        
        gameState.entities.push(new Collectible(150, 260, 'POTION'));
        gameState.entities.push(new Collectible(800, 260, 'BOOST'));
    }
}