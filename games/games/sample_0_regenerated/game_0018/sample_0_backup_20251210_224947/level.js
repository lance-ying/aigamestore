/**
 * Level Generation and Management
 */
import { gameState, CANVAS_HEIGHT } from './globals.js';
import { Player, Enemy, Barrel, Flag } from './entities.js';
import { PhysicsBody } from './physics.js';

class Platform extends PhysicsBody {
    constructor(x, y, w, h) {
        super(x, y, w, h, true);
        this.type = 'ground';
    }
}

export function generateLevel() {
    gameState.platforms = [];
    gameState.entities = [];
    
    // 1. Ground Floor (with gaps)
    gameState.platforms.push(new Platform(0, CANVAS_HEIGHT - 40, 800, 40));
    gameState.platforms.push(new Platform(900, CANVAS_HEIGHT - 40, 600, 40)); // Gap 800-900
    gameState.platforms.push(new Platform(1600, CANVAS_HEIGHT - 40, 1400, 40)); // Gap 1500-1600
    
    // 2. Vertical Structures & Platforms
    
    // Zone 1: Intro
    gameState.platforms.push(new Platform(300, 250, 200, 20));
    gameState.platforms.push(new Platform(600, 150, 100, 20));
    
    // Zone 2: The Tower
    gameState.platforms.push(new Platform(1000, 250, 100, 20));
    gameState.platforms.push(new Platform(1150, 180, 100, 20));
    gameState.platforms.push(new Platform(1000, 110, 300, 20)); // Top deck
    
    // Zone 3: Barrel Hell
    gameState.platforms.push(new Platform(1700, 300, 100, 20));
    gameState.platforms.push(new Platform(1900, 250, 100, 20));
    gameState.platforms.push(new Platform(2100, 200, 400, 20));
    
    // Walls
    gameState.platforms.push(new Platform(-20, 0, 20, CANVAS_HEIGHT)); // Left wall
    gameState.platforms.push(new Platform(3000, 0, 20, CANVAS_HEIGHT)); // Right wall
    
    // 3. Entities
    
    // Player
    gameState.player = new Player(50, 300);
    
    // Enemies
    gameState.entities.push(new Enemy(400, 210, 'grunt'));
    gameState.entities.push(new Enemy(620, 110, 'grunt'));
    gameState.entities.push(new Enemy(1100, 320, 'bomber')); // Under tower
    gameState.entities.push(new Enemy(1200, 70, 'grunt')); // On tower
    
    gameState.entities.push(new Enemy(1800, 320, 'grunt'));
    gameState.entities.push(new Enemy(2200, 160, 'bomber'));
    gameState.entities.push(new Enemy(2300, 160, 'grunt'));
    gameState.entities.push(new Enemy(2400, 160, 'grunt'));
    
    // Boss guarding exit
    gameState.entities.push(new Enemy(2800, 300, 'boss'));
    
    // Barrels
    gameState.entities.push(new Barrel(550, 320));
    gameState.entities.push(new Barrel(1100, 70)); // Tower explosive
    
    // Chain reaction setup
    gameState.entities.push(new Barrel(2150, 160));
    gameState.entities.push(new Barrel(2200, 160));
    
    // Flag
    gameState.entities.push(new Flag(2900, 260));
}

export function renderLevel(p) {
    // Render Background
    // Parallax would be nice, but simple gradient/rects for now
    p.background(30, 30, 40); // Dark sky
    
    // Distant mountains (fake parallax)
    p.push();
    p.translate(gameState.camera.x * 0.5, 0); // Move slower
    p.fill(20, 20, 30);
    p.triangle(100, 400, 300, 100, 500, 400);
    p.triangle(400, 400, 600, 150, 800, 400);
    p.pop();
    
    // Platforms
    p.fill(40, 30, 20); // Dirt color
    p.stroke(20, 15, 10);
    for (let plat of gameState.platforms) {
        // Culling
        if (plat.x + plat.width > gameState.camera.x && plat.x < gameState.camera.x + p.width) {
            p.rect(plat.x, plat.y, plat.width, plat.height);
            // Grass top
            p.push();
            p.fill(30, 100, 30);
            p.noStroke();
            p.rect(plat.x, plat.y, plat.width, 5);
            p.pop();
        }
    }
}