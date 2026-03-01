/**
 * background.js
 * Handles the rendering of the parallax background.
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, COLOR_BACKGROUND } from './globals.js';

class MountainLayer {
    constructor(color, speedMult, heightScale, yOffset, p) {
        this.color = color;
        this.speedMult = speedMult;
        this.yOffset = yOffset;
        this.points = [];
        this.chunkSize = 50;
        
        // Generate initial points
        let x = -50;
        while (x < CANVAS_WIDTH + 100) {
            this.points.push({
                x: x,
                y: p.noise(x * 0.01 * speedMult) * heightScale
            });
            x += this.chunkSize;
        }
    }
    
    update(p) {
        // Shift points based on player movement
        const dx = gameState.worldSpeed * this.speedMult;
        
        for (let pt of this.points) {
            pt.x -= dx;
        }
        
        // Remove offscreen points
        if (this.points[0].x < -100) {
            this.points.shift();
        }
        
        // Add new points
        const lastPt = this.points[this.points.length - 1];
        if (lastPt.x < CANVAS_WIDTH + 100) {
            const newX = lastPt.x + this.chunkSize;
            // Use time or a running offset to generate noise so it doesn't repeat identically
            const noiseVal = p.noise(newX * 0.01 * this.speedMult + gameState.distanceTraveled * 0.0001); 
            this.points.push({
                x: newX,
                y: noiseVal * 150 // height variance
            });
        }
    }
    
    render(p) {
        p.fill(this.color);
        p.noStroke();
        p.beginShape();
        p.vertex(0, CANVAS_HEIGHT); // Bottom left screen
        p.vertex(this.points[0].x, CANVAS_HEIGHT); // Bottom left anchor
        
        for (let pt of this.points) {
            p.vertex(pt.x, CANVAS_HEIGHT - this.yOffset - pt.y);
        }
        
        p.vertex(this.points[this.points.length-1].x, CANVAS_HEIGHT); // Bottom right anchor
        p.vertex(CANVAS_WIDTH, CANVAS_HEIGHT); // Bottom right screen
        p.endShape();
    }
}

let layers = [];

export function initBackground(p) {
    layers = [
        new MountainLayer([30, 35, 50], 0.1, 100, 50, p), // Far back
        new MountainLayer([40, 45, 65], 0.3, 80, 20, p),  // Mid
        new MountainLayer([50, 55, 80], 0.5, 60, 0, p)    // Close
    ];
}

export function updateBackground(p) {
    layers.forEach(l => l.update(p));
}

export function renderBackground(p) {
    p.background(COLOR_BACKGROUND);
    layers.forEach(l => l.render(p));
}