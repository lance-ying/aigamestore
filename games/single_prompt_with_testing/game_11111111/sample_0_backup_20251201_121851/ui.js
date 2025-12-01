/**
 * UI Rendering
 */
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, THEMES } from './globals.js';

export function renderBackground(p) {
    const theme = THEMES[gameState.worldTheme];
    p.background(theme.bg);
    
    // Draw background grid or stars
    if (gameState.worldTheme === "SPACE") {
        p.randomSeed(42); // Consistent stars
        p.fill(255);
        p.noStroke();
        for(let i=0; i<100; i++) {
            let x = p.random(CANVAS_WIDTH);
            let y = (p.random(CANVAS_HEIGHT) + gameState.score * 0.2) % CANVAS_HEIGHT;
            let s = p.random(1, 3);
            p.circle(x, y, s);
        }
    } else if (gameState.worldTheme === "GRASS") {
        p.stroke(200, 240, 200);
        p.strokeWeight(1);
        for(let i=0; i<CANVAS_WIDTH; i+=40) {
            p.line(i, 0, i, CANVAS_HEIGHT);
        }
        for(let i=0; i<CANVAS_HEIGHT; i+=40) {
            let y = (i + gameState.score * 0.5) % CANVAS_HEIGHT;
            p.line(0, y, CANVAS_WIDTH, y);
        }
    }
    
    p.randomSeed(gameState.frameCount); // Restore random for other things
}

export function renderUI(p) {
    // Score
    p.fill(0);
    if (gameState.worldTheme === "SPACE") p.fill(255);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(20);
    p.text("Score: " + Math.floor(gameState.score), 10, 10);
}

export function renderStartScreen(p) {
    renderBackground(p);
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    p.textSize(48);
    p.text("SKY DOODLE", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 60);
    
    p.textSize(20);
    p.text("Press ENTER to Start", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    
    p.textSize(16);
    p.fill(200);
    p.text("Arrows to Move | Space to Shoot", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
}

export function renderGameOver(p) {
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255, 50, 50);
    p.textSize(48);
    p.text("GAME OVER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 50);
    
    p.fill(255);
    p.textSize(24);
    p.text("Final Score: " + Math.floor(gameState.score), CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 10);
    
    p.textSize(18);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
}

export function renderPausedOverlay(p) {
    p.fill(0, 0, 0, 100);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
}