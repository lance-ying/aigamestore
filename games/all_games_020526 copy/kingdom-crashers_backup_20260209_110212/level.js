/**
 * level.js
 * Manages game levels, enemy spawning waves, and background rendering.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, LEVEL_WIDTH, COLORS, GROUND_Y, HORIZON_Y } from './globals.js';
import { Enemy } from './entities.js';

export class LevelManager {
    constructor() {
        // Define Levels Configuration
        this.levels = [
            {
                name: "Green Fields",
                theme: {
                    sky: [100, 149, 237], // Cornflower Blue
                    ground: [34, 139, 34], // Forest Green
                    groundDark: [0, 100, 0]
                },
                waves: [
                    { count: 2, type: "BARBARIAN", triggerX: 400 },
                    { count: 3, type: "BARBARIAN", triggerX: 1200 }
                ]
            },
            {
                name: "Sunset Plains",
                theme: {
                    sky: [200, 100, 50], // Orange/Red Sunset
                    ground: [160, 82, 45], // Sienna/Brown
                    groundDark: [100, 50, 20]
                },
                waves: [
                    { count: 3, type: "BARBARIAN", triggerX: 400 },
                    { count: 4, type: "BARBARIAN", triggerX: 1200 }
                ]
            },
            {
                name: "Dark Lands",
                theme: {
                    sky: [40, 20, 60], // Dark Purple
                    ground: [70, 70, 80], // Greyish
                    groundDark: [20, 20, 30]
                },
                waves: [
                    { count: 4, type: "BARBARIAN", triggerX: 500 },
                    { count: 1, type: "BOSS", triggerX: 1500 }
                ]
            }
        ];

        this.currentLevelIndex = 0;
        this.clouds = [];
        
        // Initialize Clouds
        for (let i = 0; i < 10; i++) {
            this.clouds.push({
                x: Math.random() * LEVEL_WIDTH,
                y: Math.random() * 150,
                size: Math.random() * 30 + 30
            });
        }

        this.loadLevel(0);
    }

    loadLevel(index) {
        this.currentLevelIndex = index;
        this.currentLevel = this.levels[index];
        this.currentWaveIndex = 0;
        this.waveActive = false;
        this.levelClear = false;
        
        // Reset Player Position for new level
        if (gameState.player) {
            gameState.player.x = 100;
            gameState.cameraX = 0;
        }
        
        // Clear enemies
        gameState.enemies = [];
        // Filter out old enemies from entities list
        if (gameState.entities) {
            gameState.entities = gameState.entities.filter(e => e === gameState.player);
        }
        
        console.log("Level Loaded: " + this.currentLevel.name);
    }

    update(p) {
        if (gameState.gamePhase !== "PLAYING") return;
        
        const waves = this.currentLevel.waves;

        // Check Wave Triggers
        if (this.currentWaveIndex < waves.length) {
            const wave = waves[this.currentWaveIndex];
            
            // If player crosses trigger line and wave not active
            if (gameState.player.x >= wave.triggerX && !this.waveActive) {
                this.startWave(wave);
            }
        } else if (gameState.enemies.length === 0 && !this.waveActive) {
            // All waves in this level finished
            
            // Check for Level End (Walk to right side)
            if (gameState.player.x > 1800) {
                if (this.currentLevelIndex < this.levels.length - 1) {
                    // Load Next Level
                    this.loadLevel(this.currentLevelIndex + 1);
                    // Heal player slightly between levels
                    gameState.player.health = Math.min(gameState.player.health + 30, gameState.player.maxHealth);
                } else if (!this.levelClear) {
                    // Game Win
                    this.levelClear = true;
                    gameState.gamePhase = "GAME_OVER_WIN";
                }
            }
        }
        
        // Check Wave Completion
        if (this.waveActive && gameState.enemies.length === 0) {
            this.waveActive = false;
            this.currentWaveIndex++;
            // Reward health
            if (gameState.player.health < 100) gameState.player.health += 20;
            if (gameState.player.health > 100) gameState.player.health = 100;
        }
    }

    startWave(wave) {
        this.waveActive = true;
        
        for (let i = 0; i < wave.count; i++) {
            // Spawn enemies around trigger point
            const ex = wave.triggerX + 400 + Math.random() * 200;
            const ey = HORIZON_Y + Math.random() * (GROUND_Y - HORIZON_Y);
            
            const enemy = new Enemy(ex, ey, wave.type);
            gameState.enemies.push(enemy);
            gameState.entities.push(enemy);
        }
    }

    renderBackground(p) {
        const theme = this.currentLevel.theme;

        // Sky
        p.background(theme.sky);
        
        const camX = gameState.cameraX;

        // Parallax Mountains
        p.push();
        p.noStroke();
        // Darker version of sky for mountains base
        p.fill(p.color(theme.sky).levels.map((c, i) => i < 3 ? c * 0.5 : c)); 

        p.beginShape();
        p.vertex(0, CANVAS_HEIGHT);
        p.vertex(0, 150);
        for (let x = 0; x <= CANVAS_WIDTH; x += 50) {
            // Simple noise-like mountain generation based on world position
            let h = p.noise((x + camX * 0.2) * 0.01) * 100 + 150;
            p.vertex(x, h);
        }
        p.vertex(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.endShape(p.CLOSE);
        p.pop();

        // Clouds
        p.push();
        p.fill(255, 255, 255, 200);
        p.noStroke();
        this.clouds.forEach(cloud => {
            const screenX = cloud.x - camX * 0.5; // Parallax
            if (screenX > -100 && screenX < CANVAS_WIDTH + 100) {
                p.circle(screenX, cloud.y, cloud.size);
                p.circle(screenX + 20, cloud.y + 10, cloud.size * 0.8);
                p.circle(screenX - 20, cloud.y + 10, cloud.size * 0.8);
            }
        });
        p.pop();

        // Ground (Playable Area)
        p.push();
        p.noStroke();
        
        // Horizon/Grass Transition
        p.fill(theme.groundDark);
        p.rect(0, HORIZON_Y - gameState.cameraY, CANVAS_WIDTH, CANVAS_HEIGHT); // Fill bottom
        
        // Gradient Ground effect logic (simulated by drawing strips)
        for (let y = HORIZON_Y; y < CANVAS_HEIGHT; y+=10) {
            let inter = p.map(y, HORIZON_Y, CANVAS_HEIGHT, 0, 1);
            let c = p.lerpColor(p.color(theme.groundDark), p.color(theme.ground), inter);
            p.fill(c);
            p.rect(0, y - gameState.cameraY, CANVAS_WIDTH, 10);
        }
        p.pop();
        
        // Level Indicator
        p.push();
        p.fill(255);
        p.stroke(0);
        p.strokeWeight(2);
        p.textSize(16);
        p.textAlign(p.RIGHT, p.TOP);
        p.text(this.currentLevel.name, CANVAS_WIDTH - 20, 20);
        p.pop();
    }

    renderForeground(p) {
        // Perhaps some bushes in front
    }
}