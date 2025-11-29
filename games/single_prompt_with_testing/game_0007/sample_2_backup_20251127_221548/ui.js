import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';

export function renderUI(p) {
    // Player Health (Cards/Hearts)
    const player = gameState.player;
    if (player) {
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(20);
        p.fill(0);
        p.text("HP:", 10, 10);
        
        for (let i = 0; i < player.maxHealth; i++) {
            if (i < player.health) {
                p.fill(255, 0, 0); // Full Heart
            } else {
                p.fill(50); // Empty Heart
            }
            p.noStroke();
            p.circle(50 + i * 25, 20, 15);
        }
    }
    
    // Score / Time
    p.fill(0);
    p.textAlign(p.RIGHT, p.TOP);
    p.text("SCORE: " + gameState.score, CANVAS_WIDTH - 10, 10);
}

export function renderStartScreen(p) {
    drawVintageBackground(p);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(0);
    p.textSize(40);
    p.text("MUGMAN'S BRAWL", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 50);
    
    p.textSize(20);
    p.text("vs. THE RAGING RADISH", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    
    p.textSize(16);
    if (p.frameCount % 60 < 30) {
        p.text("- PRESS ENTER TO START -", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
    }
}

export function renderGameOver(p, win) {
    p.push();
    p.fill(0, 0, 0, 150);
    p.rectMode(p.CORNER);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(50);
    
    // Rotation for jaunty text
    p.translate(CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.rotate(-0.1);
    
    if (win) {
        p.fill(255, 215, 0); // Gold
        p.stroke(0);
        p.strokeWeight(2);
        p.text("KNOCKOUT!", 0, 0);
    } else {
        p.fill(200, 50, 50); // Red
        p.stroke(0);
        p.strokeWeight(2);
        p.text("YOU DIED!", 0, 0);
    }
    
    p.rotate(0.1);
    p.textSize(20);
    p.fill(255);
    p.noStroke();
    p.text("Press 'R' to Try Again", 0, 60);
    p.pop();
}

export function renderPauseScreen(p) {
    p.fill(0, 0, 0, 100);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    p.textSize(30);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
}

// Vintage film effects
export function drawVintageBackground(p) {
    p.background(COLORS.BACKGROUND);
    
    // Vignette
    // Cannot use image, draw radial gradient manually-ish or just corners
    // Simple corner darkening
    /* 
       Optimized vignette: use a very thick stroke rect on outside? 
       Or just skip for performance if complex. 
       Let's do simple noise grain.
    */
}

export function renderFilmGrain(p) {
    p.loadPixels();
    // Too slow to do full pixel manipulation in JS every frame for 600x400 usually?
    // Let's use random points instead, faster
    
    p.stroke(0, 0, 0, 50);
    p.strokeWeight(1);
    for(let i=0; i<500; i++) {
        const x = Math.random() * CANVAS_WIDTH;
        const y = Math.random() * CANVAS_HEIGHT;
        p.point(x, y);
    }
    
    // Vertical scratches
    if (p.random() < 0.1) {
        const x = Math.random() * CANVAS_WIDTH;
        p.stroke(0, 0, 0, 100);
        p.line(x, 0, x, CANVAS_HEIGHT);
    }
}