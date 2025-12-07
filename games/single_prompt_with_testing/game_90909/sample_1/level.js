import { gameState, WORLD_WIDTH, WORLD_HEIGHT, CANVAS_HEIGHT } from './globals.js';
import { Player, Block, Enemy, Collectible } from './entities.js';

export function generateLevel() {
    gameState.entities = [];
    gameState.particles = [];
    
    // Create Player
    gameState.player = new Player(100, 200);
    gameState.entities.push(gameState.player);
    
    // Generate Ground
    let blocks = [];
    // Floor
    for (let x = 0; x < WORLD_WIDTH; x += 50) {
        // Create gaps
        if (x > 500 && x < 800 && Math.random() < 0.2) continue;
        if (x > 1500 && x < 1800 && Math.random() < 0.3) continue;
        
        blocks.push(new Block(x, WORLD_HEIGHT - 40, 50, 40, 'grass'));
    }
    
    // Platforms
    blocks.push(new Block(300, 250, 150, 20, 'brick'));
    blocks.push(new Block(600, 200, 100, 20, 'brick'));
    blocks.push(new Block(800, 150, 100, 20, 'brick'));
    blocks.push(new Block(1000, 250, 50, 20, 'lucky'));
    blocks.push(new Block(1200, 200, 150, 20, 'brick'));
    blocks.push(new Block(1600, 280, 100, 20, 'brick'));
    blocks.push(new Block(1900, 200, 100, 20, 'brick'));
    blocks.push(new Block(2200, 150, 150, 20, 'brick'));
    
    // Walls
    blocks.push(new Block(-50, 0, 50, WORLD_HEIGHT, 'brick')); // Left wall
    // End goal block visually represented later, but barrier:
    
    gameState.entities.push(...blocks);
    gameState.levelData = { blocks: blocks }; // Store ref for collision optimization
    
    // Enemies
    gameState.entities.push(new Enemy(400, 300, 'snail'));
    gameState.entities.push(new Enemy(700, 200, 'bee'));
    gameState.entities.push(new Enemy(1300, 300, 'snail'));
    gameState.entities.push(new Enemy(1800, 100, 'bee'));
    gameState.entities.push(new Enemy(2300, 300, 'snail'));
    
    // Collectibles
    // Gold
    for(let i=0; i<30; i++) {
        let x = 200 + Math.random() * (WORLD_WIDTH - 400);
        let y = 100 + Math.random() * 200;
        gameState.entities.push(new Collectible(x, y, 'gold'));
    }
    // Clovers
    gameState.entities.push(new Collectible(900, 100, 'clover'));
    gameState.entities.push(new Collectible(2000, 100, 'clover'));
    
    gameState.score = 0;
}