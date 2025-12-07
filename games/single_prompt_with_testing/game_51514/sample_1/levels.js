/**
 * levels.js
 * Manages level generation and data.
 */

import { gameState, CANVAS_HEIGHT } from './globals.js';
import { Player, Platform, Hazard, Enemy, Collectible, Portal } from './entities.js';

export class LevelManager {
    constructor() {
        this.levels = [this.getLevel1, this.getLevel2, this.getLevel3];
    }
    
    loadLevel(levelIndex) {
        // Clear entities
        gameState.platforms = [];
        gameState.hazards = [];
        gameState.enemies = [];
        gameState.collectibles = [];
        gameState.particles = [];
        gameState.gravityDirection = 1;
        gameState.cameraX = 0;
        
        // Safety check
        if (levelIndex > this.levels.length) {
            gameState.gamePhase = "GAME_OVER_WIN";
            return;
        }
        
        gameState.level = levelIndex;
        
        // Construct level
        const build = this.levels[levelIndex - 1].bind(this);
        build();
        
        console.log(`Level ${levelIndex} loaded.`);
    }
    
    // --- Level Definitions ---
    
    getLevel1() {
        // Intro Level: Gravity Mechanics
        gameState.player = new Player(100, 300);
        
        // Ground Floor
        gameState.platforms.push(new Platform(0, 350, 1000, 50));
        
        // Ceiling
        gameState.platforms.push(new Platform(300, 50, 800, 50));
        
        // Obstacles requiring flip
        // Spike on floor
        this.addSpike(400, 350, 'UP');
        this.addSpike(550, 350, 'UP');
        
        // Spike on ceiling
        this.addSpike(700, 100, 'DOWN'); // Ceiling platform is at y=50, height=50 => bottom is 100
        
        // Platforming section
        gameState.platforms.push(new Platform(1100, 350, 400, 50));
        gameState.platforms.push(new Platform(1200, 200, 200, 20));
        
        // Collectibles
        gameState.collectibles.push(new Collectible(1250, 170));
        gameState.collectibles.push(new Collectible(1350, 170));
        
        // End
        gameState.platforms.push(new Platform(1600, 350, 200, 50));
        gameState.portal = new Portal(1700, 270);
    }
    
    getLevel2() {
        // Enemies and Gaps
        gameState.player = new Player(50, 300);
        
        // Section 1
        gameState.platforms.push(new Platform(0, 350, 500, 50));
        gameState.enemies.push(new Enemy(300, 320, 150));
        
        // Section 2 - Ceiling Run
        gameState.platforms.push(new Platform(400, 50, 600, 50)); // Ceiling starts
        this.addSpike(600, 100, 'DOWN');
        this.addSpike(800, 100, 'DOWN');
        
        // Pitfall on ground
        gameState.platforms.push(new Platform(600, 350, 200, 50)); // Island
        gameState.platforms.push(new Platform(900, 350, 600, 50)); // Landing
        
        // Saws
        gameState.hazards.push(new Hazard(1100, 300, 'SAW'));
        gameState.hazards.push(new Hazard(1300, 250, 'SAW'));
        
        // Goal
        gameState.portal = new Portal(1400, 270);
    }
    
    getLevel3() {
        // Precision
        gameState.player = new Player(50, 300);
        
        // Start
        gameState.platforms.push(new Platform(0, 350, 300, 50));
        
        // Floating platforms requiring gravity flips
        // 1. Floor to Ceiling
        gameState.platforms.push(new Platform(300, 50, 300, 50)); // Ceiling
        this.addSpike(280, 350, 'UP'); // Force jump/flip
        
        // 2. Ceiling to Floor
        gameState.platforms.push(new Platform(600, 350, 300, 50));
        this.addSpike(600, 100, 'DOWN');
        
        // 3. Gauntlet
        gameState.platforms.push(new Platform(1000, 350, 800, 50));
        gameState.platforms.push(new Platform(1000, 50, 800, 50));
        
        // Alternating spikes
        for(let i=0; i<5; i++) {
            this.addSpike(1100 + i*150, 350, 'UP');
            this.addSpike(1175 + i*150, 100, 'DOWN');
            gameState.collectibles.push(new Collectible(1175 + i*150, 200));
        }
        
        // Final Boss (just a lot of saws)
        gameState.hazards.push(new Hazard(1900, 200, 'SAW'));
        gameState.hazards.push(new Hazard(2000, 200, 'SAW'));
        
        gameState.platforms.push(new Platform(2100, 350, 200, 50));
        gameState.portal = new Portal(2200, 270);
    }
    
    addSpike(x, y, orientation) {
        // Adjust y based on orientation so x,y is base point
        const spike = new Hazard(x, y, 'SPIKE');
        spike.orientation = orientation;
        if (orientation === 'UP') spike.y = y - spike.height;
        if (orientation === 'DOWN') spike.y = y; // Spike hangs down
        gameState.hazards.push(spike);
    }
}

export const levelManager = new LevelManager();