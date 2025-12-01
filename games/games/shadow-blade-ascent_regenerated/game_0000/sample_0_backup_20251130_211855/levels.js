import { gameState, CANVAS_HEIGHT } from './globals.js';
import { Platform, Enemy, Collectible } from './entities.js';

export function loadLevel(levelNum) {
    gameState.platforms = [];
    gameState.enemies = [];
    gameState.collectibles = [];
    gameState.projectiles = [];
    gameState.particles = [];
    gameState.entities = []; // Rebuilt with Player + lists

    // Basic Floor for all levels
    gameState.platforms.push(new Platform(0, CANVAS_HEIGHT - 40, 2000, 40, 'NORMAL', false));

    // Determine Difficulty Tier
    // Levels 1-2: Easy
    // Levels 3-4: Medium
    // Levels 5-6: Hard
    let difficulty = 1;
    if (levelNum >= 3) difficulty = 2;
    if (levelNum >= 5) difficulty = 3;

    // Procedural generation based on level
    let xCursor = 300;
    
    // Length increases with level
    const segments = 10 + (levelNum * 2);

    for (let i = 0; i < segments; i++) {
        // Platforms
        const h = Math.random() * 100 + 100;
        const y = CANVAS_HEIGHT - 40 - h;
        const w = 100 + Math.random() * 100;
        
        gameState.platforms.push(new Platform(xCursor, y, w, 20, 'NORMAL', true));
        
        // Ladder sometimes
        if (Math.random() < 0.3) {
            gameState.platforms.push(new Platform(xCursor + w/2 - 20, y, 40, h, 'LADDER', false));
        }

        // Enemies
        // Spawn chance increases with difficulty
        const spawnChance = 0.3 + (difficulty * 0.15);
        if (Math.random() < spawnChance) {
            let type = 'MINION';
            // Harder enemies in later tiers
            if (difficulty >= 2 && Math.random() > 0.6) type = 'ARCHER';
            if (difficulty >= 3 && Math.random() > 0.7) type = 'GUARD';
            
            const e = new Enemy(xCursor + w/2, y - 50, type);
            // Scale stats slightly by level, but less aggressively than before
            e.hp += (levelNum - 1) * 5;
            e.damage += (levelNum - 1) * 1; // Reduced scaling
            gameState.enemies.push(e);
        }

        // Collectibles
        if (Math.random() < 0.3) {
            gameState.collectibles.push(new Collectible(xCursor + w/2, y - 40, 'GOLD'));
        }

        xCursor += w + 50 + Math.random() * 100;
    }

    // Boss at end
    gameState.levelWidth = xCursor + 500;
    gameState.platforms.push(new Platform(gameState.levelWidth - 400, CANVAS_HEIGHT - 150, 400, 20, 'NORMAL', false));
    gameState.enemies.push(new Enemy(gameState.levelWidth - 200, CANVAS_HEIGHT - 240, 'BOSS'));

    // Add everything to main entities list for update loop
    // (Player added in game reset)
}