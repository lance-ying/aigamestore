/**
 * Procedural Level Generation
 */
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Platform, Enemy, Collectible } from './entities.js';

let nextPlatformY = 0;

export function initLevel() {
    gameState.platforms = [];
    gameState.enemies = [];
    gameState.collectibles = [];
    gameState.projectiles = [];
    gameState.particles = [];
    
    // Initial platform under player
    gameState.platforms.push(new Platform(CANVAS_WIDTH/2 - 30, CANVAS_HEIGHT - 50));
    
    // Generate initial set
    nextPlatformY = CANVAS_HEIGHT - 100;
    while (nextPlatformY > -100) {
        generatePlatformRow();
        nextPlatformY -= 60 + Math.random() * 40;
    }
}

export function updateLevelGeneration() {
    // Generate new content as we go up (which is actually negative Y relative to start, 
    // but we shift world down, so we need to fill the top of the screen)
    // Actually, in our scrolling logic, we shift objects DOWN. So the top of the screen (y=0) becomes empty.
    // We need to check the highest platform (lowest Y value).
    
    let highestPlatformY = CANVAS_HEIGHT;
    gameState.platforms.forEach(p => {
        if (p.y < highestPlatformY) highestPlatformY = p.y;
    });

    // If gap at top, generate
    if (highestPlatformY > 50) {
        // Generate a new platform above the screen
        generatePlatformAt(-20);
    }

    // Cleanup entities below screen
    cleanup(gameState.platforms);
    cleanup(gameState.enemies);
    cleanup(gameState.collectibles);
}

function generatePlatformAt(y) {
    const x = Math.random() * (CANVAS_WIDTH - 60);
    
    // Determine Type based on score/difficulty
    let type = "NORMAL";
    const rand = Math.random();
    
    if (gameState.score > 2000 && rand < 0.2) type = "MOVING";
    else if (gameState.score > 1000 && rand < 0.15) type = "BREAKABLE";
    
    gameState.platforms.push(new Platform(x, y, type));
    
    // Chance for enemy
    if (Math.random() < 0.05 && gameState.score > 500) {
        gameState.enemies.push(new Enemy(Math.random() * (CANVAS_WIDTH - 40), y - 40));
    }
    
    // Chance for collectible
    if (Math.random() < 0.1) {
        gameState.collectibles.push(new Collectible(x + 30, y - 30));
    }
}

function generatePlatformRow() {
    generatePlatformAt(nextPlatformY);
}

function cleanup(array) {
    for (let i = array.length - 1; i >= 0; i--) {
        if (array[i].y > CANVAS_HEIGHT + 50) {
            array.splice(i, 1);
        }
    }
}

export function handleScrolling(p) {
    const player = gameState.player;
    if (!player) return;
    
    // If player reaches top half of screen
    const threshold = CANVAS_HEIGHT * 0.45;
    
    if (player.y < threshold) {
        const diff = threshold - player.y;
        player.y = threshold;
        
        // Move everything down
        gameState.platforms.forEach(e => e.y += diff);
        gameState.enemies.forEach(e => e.y += diff);
        gameState.collectibles.forEach(e => e.y += diff);
        gameState.projectiles.forEach(e => e.y += diff);
        gameState.particles.forEach(sys => {
            sys.particles.forEach(pt => pt.y += diff);
            sys.y += diff;
        });
        
        // Add Score
        gameState.score += Math.floor(diff);
        
        // Update Level Theme based on score
        if (gameState.score > 5000) gameState.worldTheme = "SPACE";
        else if (gameState.score > 2500) gameState.worldTheme = "RAIN";
        else gameState.worldTheme = "GRASS";
    }
}