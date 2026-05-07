/**
 * background.js
 * Procedural scrolling background ("Cyberspace" effect).
 */
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';

class GridLine {
    constructor(y) {
        this.y = y;
        this.speed = 2;
    }
    update() {
        this.y += this.speed;
        if (this.y > CANVAS_HEIGHT) {
            this.y = 0;
        }
    }
    render(p) {
        p.stroke(0, 50, 200, 100); // Dark Blue lines
        p.strokeWeight(1);
        p.line(0, this.y, CANVAS_WIDTH, this.y);
    }
}

class Star {
    constructor() {
        this.reset();
        this.y = Math.random() * CANVAS_HEIGHT;
    }
    reset() {
        this.x = Math.random() * CANVAS_WIDTH;
        this.y = 0;
        this.z = Math.random() * 2 + 1; // Depth/Speed
        this.size = Math.random() * 2;
    }
    update() {
        this.y += this.z * 4; // Fast scrolling
        if (this.y > CANVAS_HEIGHT) this.reset();
    }
    render(p) {
        p.fill(255, 255, 255, 150);
        p.noStroke();
        p.circle(this.x, this.y, this.size);
    }
}

export const Background = {
    stars: [],
    gridLines: [],
    
    init: () => {
        Background.stars = [];
        for (let i = 0; i < 50; i++) Background.stars.push(new Star());
        Background.gridLines = [];
        for (let i = 0; i < CANVAS_HEIGHT; i+= 40) Background.gridLines.push(new GridLine(i));
    },
    
    update: () => {
        Background.stars.forEach(s => s.update());
        Background.gridLines.forEach(g => g.update());
    },
    
    render: (p) => {
        p.background(COLORS.BACKGROUND);
        
        // Draw Vertical Grid Lines (static perspective)
        p.stroke(0, 50, 200, 50);
        for (let x = 0; x < CANVAS_WIDTH; x += 40) {
            p.line(x, 0, x, CANVAS_HEIGHT);
        }
        
        // Draw Horizontal Scrolling Lines
        Background.gridLines.forEach(g => g.render(p));
        
        // Draw Stars
        Background.stars.forEach(s => s.render(p));
    }
};