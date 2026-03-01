import { gameState } from './globals.js';
import { Platform, Coin, Hazard, ExitPipe, Player, Monster, HeartItem } from './entities.js';

export function loadLevel(levelIndex) {
    gameState.platforms = [];
    gameState.coins = [];
    gameState.hazards = [];
    gameState.monsters = [];
    gameState.heartPickups = [];
    gameState.exit = null;
    gameState.particles = [];
    
    if (levelIndex === 0) {
        // LEVEL 1: EASY - Introduction
        gameState.worldWidth = 1200;
        gameState.worldHeight = 500;
        
        gameState.platforms.push(new Platform(0, 350, 400, 50));
        gameState.platforms.push(new Platform(500, 300, 300, 50));
        gameState.platforms.push(new Platform(900, 350, 300, 50));
        gameState.platforms.push(new Platform(600, 200, 100, 20));
        
        gameState.coins.push(new Coin(200, 320));
        gameState.coins.push(new Coin(300, 320));
        gameState.coins.push(new Coin(650, 170));
        gameState.coins.push(new Coin(950, 320));
        
        gameState.hazards.push(new Hazard(400, 380, 100, 20));
        
        // Add a monster to introduce them safely
        gameState.monsters.push(new Monster(650, 300, 100));
        
        gameState.exit = new ExitPipe(1100, 290);
        gameState.player = new Player(50, 300);
    }
    else if (levelIndex === 1) {
        // LEVEL 2: EASY - Verticality
        gameState.worldWidth = 1200;
        gameState.worldHeight = 800;
        
        gameState.platforms.push(new Platform(0, 700, 300, 50));
        gameState.platforms.push(new Platform(350, 600, 150, 20));
        gameState.platforms.push(new Platform(550, 500, 150, 20));
        gameState.platforms.push(new Platform(350, 400, 150, 20));
        gameState.platforms.push(new Platform(550, 300, 150, 20));
        gameState.platforms.push(new Platform(200, 200, 400, 20));
        gameState.platforms.push(new Platform(800, 700, 400, 50));
        
        gameState.coins.push(new Coin(425, 570));
        gameState.coins.push(new Coin(625, 470));
        gameState.coins.push(new Coin(425, 370));
        gameState.coins.push(new Coin(400, 170));
        gameState.coins.push(new Coin(700, 400));
        gameState.coins.push(new Coin(750, 550));
        
        // Monster patrolling the top
        gameState.monsters.push(new Monster(400, 200, 150));
        
        // Heart pickup
        gameState.heartPickups.push(new HeartItem(50, 650)); // Free heart at start
        
        gameState.exit = new ExitPipe(1000, 640);
        gameState.player = new Player(50, 650);
    }
    else if (levelIndex === 2) {
        // LEVEL 3: MEDIUM
        gameState.worldWidth = 1500;
        gameState.worldHeight = 600;
        
        gameState.platforms.push(new Platform(0, 400, 200, 50));
        gameState.platforms.push(new Platform(300, 400, 80, 20));
        gameState.platforms.push(new Platform(500, 350, 80, 20));
        gameState.platforms.push(new Platform(700, 400, 80, 20));
        gameState.platforms.push(new Platform(900, 300, 80, 20));
        gameState.platforms.push(new Platform(1100, 350, 400, 50));
        
        gameState.hazards.push(new Hazard(200, 580, 900, 20));
        
        gameState.coins.push(new Coin(340, 370));
        gameState.coins.push(new Coin(540, 320));
        gameState.coins.push(new Coin(740, 370));
        gameState.coins.push(new Coin(940, 270));
        
        // Monsters on islands
        gameState.monsters.push(new Monster(1300, 350, 150));
        
        // Heart
        gameState.heartPickups.push(new HeartItem(740, 350));
        
        gameState.exit = new ExitPipe(1400, 290);
        gameState.player = new Player(50, 350);
    }
    else if (levelIndex === 3) {
        // LEVEL 4: MEDIUM - The Tunnel
        gameState.worldWidth = 1600;
        gameState.worldHeight = 600;
        
        gameState.platforms.push(new Platform(0, 300, 200, 50));
        gameState.platforms.push(new Platform(300, 400, 1000, 50));
        gameState.platforms.push(new Platform(300, 200, 1000, 50));
        gameState.platforms.push(new Platform(500, 350, 50, 50)); 
        gameState.platforms.push(new Platform(800, 250, 50, 50)); 
        
        gameState.hazards.push(new Hazard(600, 390, 100, 20));
        gameState.hazards.push(new Hazard(900, 390, 100, 20));
        
        gameState.coins.push(new Coin(400, 370));
        gameState.coins.push(new Coin(650, 350)); 
        gameState.coins.push(new Coin(1000, 370));
        
        // Monsters in tunnel
        gameState.monsters.push(new Monster(700, 400, 100));
        gameState.monsters.push(new Monster(1100, 400, 100));
        
        gameState.exit = new ExitPipe(1400, 340); 
        gameState.player = new Player(50, 250);
    }
    else if (levelIndex === 4) {
        // LEVEL 5: HARD
        gameState.worldWidth = 2000;
        gameState.worldHeight = 800;
        
        gameState.platforms.push(new Platform(0, 600, 200, 50));
        gameState.platforms.push(new Platform(300, 500, 100, 20));
        gameState.platforms.push(new Platform(500, 400, 100, 20));
        gameState.platforms.push(new Platform(700, 300, 100, 20));
        gameState.platforms.push(new Platform(900, 200, 100, 20)); 
        gameState.platforms.push(new Platform(1300, 500, 100, 20));
        gameState.platforms.push(new Platform(1600, 400, 400, 50));
        
        gameState.hazards.push(new Hazard(200, 780, 1400, 20));
        
        gameState.coins.push(new Coin(350, 470));
        gameState.coins.push(new Coin(550, 370));
        gameState.coins.push(new Coin(750, 270));
        gameState.coins.push(new Coin(950, 170));
        gameState.coins.push(new Coin(1100, 300)); 
        
        // Monsters
        gameState.monsters.push(new Monster(1700, 400, 150));
        
        gameState.heartPickups.push(new HeartItem(950, 150));
        
        gameState.exit = new ExitPipe(1800, 340);
        gameState.player = new Player(50, 550);
    }
    else if (levelIndex === 5) {
        // LEVEL 6: HARD
        gameState.worldWidth = 2000;
        gameState.worldHeight = 600;
        
        gameState.platforms.push(new Platform(0, 300, 150, 50));
        gameState.platforms.push(new Platform(250, 300, 60, 20));
        gameState.platforms.push(new Platform(400, 300, 60, 20));
        gameState.platforms.push(new Platform(550, 250, 60, 20)); 
        gameState.platforms.push(new Platform(700, 350, 60, 20)); 
        gameState.platforms.push(new Platform(900, 300, 60, 20));
        gameState.hazards.push(new Hazard(850, 500, 300, 20));
        gameState.platforms.push(new Platform(1200, 300, 60, 20));
        gameState.platforms.push(new Platform(1400, 250, 60, 20));
        gameState.platforms.push(new Platform(1600, 300, 400, 50));
        gameState.hazards.push(new Hazard(1650, 290, 50, 20));
        
        gameState.coins.push(new Coin(280, 270));
        gameState.coins.push(new Coin(580, 220));
        gameState.coins.push(new Coin(730, 320));
        gameState.coins.push(new Coin(1230, 270));
        
        // Monsters
        gameState.monsters.push(new Monster(1800, 300, 100));
        
        gameState.heartPickups.push(new HeartItem(550, 200));
        
        gameState.exit = new ExitPipe(1900, 240);
        gameState.player = new Player(50, 250);
    }
    else {
        loadLevel(0);
    }
    
    gameState.totalCoinsInLevel = gameState.coins.length;
}