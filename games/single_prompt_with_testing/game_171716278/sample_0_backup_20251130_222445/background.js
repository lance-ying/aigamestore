// background.js
// Parallax background rendering

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderBackground(p) {
    // Sky Gradient
    drawSky(p);
    
    // Sun / Moon
    // Position depends on relative time or just visual
    const camParallax = gameState.cameraX * 0.05;
    const sunX = CANVAS_WIDTH - 100 - (camParallax % (CANVAS_WIDTH + 200));
    const sunY = 80;
    
    p.fill(255, 255, 200);
    p.noStroke();
    p.circle(sunX, sunY, 60);
    p.fill(255, 255, 200, 100);
    p.circle(sunX, sunY, 80);
    
    // Clouds
    drawClouds(p, 0.2, 50, 200);
    drawClouds(p, 0.5, 100, 240);
}

function drawSky(p) {
    // Simple gradient
    p.noFill();
    for (let i = 0; i < CANVAS_HEIGHT; i+=10) {
        const inter = p.map(i, 0, CANVAS_HEIGHT, 0, 1);
        const c = p.lerpColor(p.color(135, 206, 235), p.color(255, 250, 240), inter);
        p.stroke(c);
        p.strokeWeight(10);
        p.line(0, i, CANVAS_WIDTH, i);
    }
}

function drawClouds(p, parallaxSpeed, yBase, alpha) {
    const offset = gameState.cameraX * parallaxSpeed;
    p.noStroke();
    p.fill(255, 255, 255, alpha);
    
    // Procedural clouds based on noise
    for (let x = 0; x < CANVAS_WIDTH + 200; x += 5) {
        // Map screen X to world X for noise continuity
        const worldX = x + offset;
        const noiseVal = p.noise(worldX * 0.01, yBase);
        
        if (noiseVal > 0.6) {
            const cloudH = (noiseVal - 0.6) * 100;
            p.ellipse(x - (offset % 200), yBase + noiseVal * 20, 40, cloudH);
        }
    }
}