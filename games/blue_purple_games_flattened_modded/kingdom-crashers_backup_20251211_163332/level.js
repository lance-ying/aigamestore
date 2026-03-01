/**
 * level.js
 * Manages game levels, enemy spawning waves, and background rendering.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, LEVEL_WIDTH, COLORS, GROUND_Y, HORIZON_Y } from './globals.js';
import { Enemy } from './entities.js';

export class LevelManager {
    constructor() {
        this.waves = [
            { count: 3, type: "BARBARIAN", triggerX: 400 },
            { count: 4, type: "BARBARIAN", triggerX: 1000 },
            { count: 1, type: "BOSS", triggerX: 1600 }
        ];
        this.currentWaveIndex = 0;
        this.waveActive = false;
        this.levelClear = false;
        
        // Decorative elements
        this.clouds = [];
        for (let i = 0; i < 10; i++) {
            this.clouds.push({
                x: Math.random() * LEVEL_WIDTH,
                y: Math.random() * 150,
                size: Math.random() * 30 + 30
            });
        }
    }

    update(p) {
        if (gameState.gamePhase !== "PLAYING") return;
        
        // Check Wave Triggers
        if (this.currentWaveIndex < this.waves.length) {
            const wave = this.waves[this.currentWaveIndex];
            
            // If player crosses trigger line and wave not active
            if (gameState.player.x >= wave.triggerX && !this.waveActive) {
                this.startWave(wave);
            }
        } else if (gameState.enemies.length === 0 && !this.levelClear) {
            // All waves done
            this.levelClear = true;
            gameState.gamePhase = "GAME_OVER_WIN";
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
        // Lock camera or show "GO" sign logic could go here
        
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
        // Sky
        p.background(COLORS.background);
        
        const camX = gameState.cameraX;

        // Parallax Mountains
        p.push();
        p.noStroke();
        p.fill(60, 100, 160); // Distant mountains
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
        p.fill(COLORS.groundDark);
        p.rect(0, HORIZON_Y - gameState.cameraY, CANVAS_WIDTH, CANVAS_HEIGHT); // Fill bottom
        
        // Gradient Ground effect logic (simulated by drawing strips)
        for (let y = HORIZON_Y; y < CANVAS_HEIGHT; y+=10) {
            let inter = p.map(y, HORIZON_Y, CANVAS_HEIGHT, 0, 1);
            let c = p.lerpColor(p.color(COLORS.groundDark), p.color(COLORS.ground), inter);
            p.fill(c);
            p.rect(0, y - gameState.cameraY, CANVAS_WIDTH, 10);
        }
        p.pop();
    }

    renderForeground(p) {
        // Perhaps some bushes in front
    }
}