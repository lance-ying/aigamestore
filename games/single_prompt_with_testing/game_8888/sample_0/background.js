/**
 * Parallax Background System.
 * Renders decorative hills, trees, and cookie houses.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PALETTE } from './globals.js';
import { worldToScreen } from './physics.js';

class BackgroundLayer {
    constructor(speed, renderFn) {
        this.speed = speed;
        this.renderFn = renderFn;
    }
    
    render(p) {
        const offsetX = -(gameState.cameraX * this.speed) % CANVAS_WIDTH;
        
        p.push();
        p.translate(offsetX, 0);
        this.renderFn(p, -CANVAS_WIDTH);      // Left buffer
        this.renderFn(p, 0);                  // Center
        this.renderFn(p, CANVAS_WIDTH);       // Right buffer
        p.pop();
    }
}

export function initBackgrounds() {
    // Generate static assets/shapes if needed? 
    // We will draw procedural shapes in the render functions.
}

export function renderBackground(p) {
    // 1. Sky Gradient
    p.background(PALETTE.SKY_BOTTOM);
    
    // 2. Far Hills (Slowest)
    const farScroll = -(gameState.cameraX * 0.1) % CANVAS_WIDTH;
    drawHills(p, farScroll, CANVAS_HEIGHT - 100, PALETTE.SKY_TOP, 100);
    drawHills(p, farScroll + CANVAS_WIDTH, CANVAS_HEIGHT - 100, PALETTE.SKY_TOP, 100);
    
    // 3. Mid Hills (Medium)
    const midScroll = -(gameState.cameraX * 0.3) % CANVAS_WIDTH;
    drawHills(p, midScroll, CANVAS_HEIGHT - 50, '#C5E1A5', 50); // Lighter green
    drawHills(p, midScroll + CANVAS_WIDTH, CANVAS_HEIGHT - 50, '#C5E1A5', 50);
    
    // 4. Decor (Cookie Houses, Trees) - Need to be locked to world space but far back
    // For simplicity, we'll draw them relative to camera with parallax
    drawDecor(p, midScroll, CANVAS_HEIGHT - 80);
    drawDecor(p, midScroll + CANVAS_WIDTH, CANVAS_HEIGHT - 80);
}

function drawHills(p, x, y, color, height) {
    p.fill(color);
    p.noStroke();
    p.beginShape();
    p.vertex(x, CANVAS_HEIGHT);
    p.vertex(x, y);
    // Beziers for icing look
    p.bezierVertex(x + 100, y - 50, x + 200, y + 50, x + 300, y);
    p.bezierVertex(x + 400, y - 50, x + 500, y + 50, x + 600, y);
    p.vertex(x + CANVAS_WIDTH, CANVAS_HEIGHT);
    p.endShape(p.CLOSE);
}

function drawDecor(p, x, y) {
    // Simple Lollipop trees
    p.push();
    p.translate(x, y);
    
    // Tree 1
    p.stroke(100, 50, 0);
    p.strokeWeight(4);
    p.line(100, 0, 100, -60);
    p.noStroke();
    p.fill(PALETTE.RED_JELLY);
    p.circle(100, -60, 30);
    p.fill(255);
    p.circle(100, -60, 20);
    p.fill(PALETTE.RED_JELLY);
    p.circle(100, -60, 10);
    
    // Cookie House
    p.translate(350, -20);
    p.fill(PALETTE.GROUND_TOP);
    p.rect(0, 0, 60, 40); // Base
    p.fill(PALETTE.ICING);
    p.triangle(-10, 0, 70, 0, 30, -40); // Roof
    p.fill(PALETTE.YELLOW_JELLY);
    p.rect(20, 20, 20, 20); // Door
    
    p.pop();
}