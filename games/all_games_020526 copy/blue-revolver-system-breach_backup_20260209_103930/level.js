/**
 * level.js
 * Controls enemy spawning waves and game progression.
 */

import { gameState, CANVAS_WIDTH } from './globals.js';
import { Enemy } from './entities.js';

export const LevelDirector = {
    update: () => {
        const frame = gameState.waveFrame;
        
        // Wave definitions
        
        // Wave 1: Drones
        if (frame % 100 === 0 && frame < 500) {
            const x = Math.random() * (CANVAS_WIDTH - 100) + 50;
            new Enemy(x, -20, 'drone');
        }
        
        // Wave 2: Interceptors from sides
        if (frame > 600 && frame < 1200 && frame % 80 === 0) {
            new Enemy(50, -20, 'interceptor');
            new Enemy(CANVAS_WIDTH - 50, -20, 'interceptor');
        }
        
        // Wave 3: Heavy Tanks
        if (frame > 1300 && frame % 300 === 0) {
            new Enemy(CANVAS_WIDTH / 2, -50, 'tank');
        }
        
        // Infinite scaling loop after 2000 frames
        if (frame > 2000) {
            if (frame % 60 === 0) {
                const type = Math.random() < 0.2 ? 'tank' : (Math.random() < 0.5 ? 'interceptor' : 'drone');
                const x = Math.random() * (CANVAS_WIDTH - 40) + 20;
                new Enemy(x, -20, type);
            }
        }
    }
};