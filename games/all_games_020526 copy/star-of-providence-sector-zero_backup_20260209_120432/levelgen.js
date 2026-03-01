/**
 * levelgen.js
 * Generates rooms and enemy spawns.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, COLOR_PALETTE } from './globals.js';
import { Wall, Enemy, Door, Player } from './entities.js';

export function loadLevel(p, floor) {
    // 1. Clear previous
    gameState.walls = [];
    gameState.enemies = [];
    gameState.pickups = [];
    gameState.projectiles = [];
    gameState.entities = [];
    gameState.particles = [];
    
    // 2. Map generation (Simple grid based)
    // Create Border Walls
    createWall(0, 0, CANVAS_WIDTH, TILE_SIZE); // Top
    createWall(0, CANVAS_HEIGHT - TILE_SIZE, CANVAS_WIDTH, TILE_SIZE); // Bottom
    createWall(0, 0, TILE_SIZE, CANVAS_HEIGHT); // Left
    createWall(CANVAS_WIDTH - TILE_SIZE, 0, TILE_SIZE, CANVAS_HEIGHT); // Right
    
    // Internal obstacles
    // Procedural placement: 5 to 10 random blocks
    const numObstacles = 5 + Math.floor(Math.random() * 5);
    for(let i=0; i<numObstacles; i++) {
        const w = (Math.floor(Math.random() * 3) + 1) * TILE_SIZE;
        const h = (Math.floor(Math.random() * 3) + 1) * TILE_SIZE;
        const x = Math.floor(Math.random() * (CANVAS_WIDTH - 200) / TILE_SIZE) * TILE_SIZE + 100;
        const y = Math.floor(Math.random() * (CANVAS_HEIGHT - 200) / TILE_SIZE) * TILE_SIZE + 100;
        
        // Ensure not covering center entirely
        if (Math.abs(x - CANVAS_WIDTH/2) > 50 || Math.abs(y - CANVAS_HEIGHT/2) > 50) {
            createWall(x, y, w, h);
        }
    }

    // 3. Spawn Player
    // Start at left
    gameState.player = new Player(80, CANVAS_HEIGHT / 2);
    gameState.entities.push(gameState.player);

    // 4. Spawn Door
    // End at right
    gameState.door = new Door(CANVAS_WIDTH - 40, CANVAS_HEIGHT / 2);
    gameState.entities.push(gameState.door);

    // 5. Spawn Enemies
    if (floor === 5) {
        // Boss Room
        const boss = new Enemy(CANVAS_WIDTH - 150, CANVAS_HEIGHT / 2, 'boss');
        gameState.enemies.push(boss);
        gameState.entities.push(boss);
    } else {
        const difficulty = floor * 2 + 2; // num enemies
        for(let i=0; i<difficulty; i++) {
            const ex = Math.random() * (CANVAS_WIDTH - 200) + 150;
            const ey = Math.random() * (CANVAS_HEIGHT - 100) + 50;
            const type = (floor > 2 && Math.random() > 0.7) ? 'tank' : 'drone';
            
            // Validate pos
            let valid = true;
            for(let wall of gameState.walls) {
                if (ex > wall.x && ex < wall.x + wall.width && ey > wall.y && ey < wall.y + wall.height) {
                    valid = false; 
                    break;
                }
            }
            if (valid) {
                const enemy = new Enemy(ex, ey, type);
                gameState.enemies.push(enemy);
                gameState.entities.push(enemy);
            } else {
                i--; // Retry
            }
        }
    }
}

function createWall(x, y, w, h) {
    const wall = new Wall(x, y, w, h);
    gameState.walls.push(wall);
}