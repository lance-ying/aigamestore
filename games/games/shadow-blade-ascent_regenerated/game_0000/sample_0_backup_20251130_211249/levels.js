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

    // Procedural generation based on level
    let xCursor = 300;
    const difficulty = levelNum;

    for (let i = 0; i < 10 + (levelNum * 2); i++) {
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
        if (Math.random() < 0.5 + (difficulty * 0.1)) {
            const type = Math.random() > 0.7 ? 'ARCHER' : 'MINION';
            const e = new Enemy(xCursor + w/2, y - 50, levelNum > 2 && Math.random() > 0.8 ? 'GUARD' : type);
            // Scale stats by level
            e.hp += levelNum * 5;
            e.damage += levelNum * 2;
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