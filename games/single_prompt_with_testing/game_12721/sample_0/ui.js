/**
 * UI Rendering and Screens
 */
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';
import { updateParticles } from './particles.js';

export function renderUI(p) {
    // HUD
    p.push();
    p.fill(COLORS.UI_TEXT);
    p.textSize(20);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`Score: ${gameState.score}`, 20, 20);
    p.textAlign(p.RIGHT, p.TOP);
    p.text(`High Score: ${Math.max(gameState.score, gameState.highScore)}`, CANVAS_WIDTH - 20, 20);
    p.textAlign(p.CENTER, p.TOP);
    p.text(`Balls: ${gameState.ballCount}`, CANVAS_WIDTH / 2, 20);
    p.pop();
    
    // Particles are rendered on top of everything except Pause/Game Over screens
    updateParticles(p);
}

export function renderStartScreen(p) {
    p.background(COLORS.BACKGROUND);
    p.push();
    p.textAlign(p.CENTER, p.CENTER);
    
    // Logo effect
    p.textSize(60);
    p.fill(255, 0, 100);
    p.text("NEON", CANVAS_WIDTH/2 - 2, CANVAS_HEIGHT/2 - 62);
    p.fill(0, 255, 255);
    p.text("NEON", CANVAS_WIDTH/2 + 2, CANVAS_HEIGHT/2 - 58);
    p.fill(255);
    p.text("NEON", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 60);
    
    p.textSize(40);
    p.text("BRICK BREAKER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    
    p.textSize(20);
    if (p.frameCount % 60 < 30) {
        p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
    }
    
    p.textSize(14);
    p.fill(200);
    p.text("Controls: Arrows to Aim | Space to Fire", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 100);
    p.text("Collect '+' Items to increase ball chain!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 120);
    p.pop();
}

export function renderPausedOverlay(p) {
    p.push();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.textSize(20);
    p.text("Press ESC to Resume", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    p.pop();
}

export function renderGameOver(p) {
    p.push();
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255, 50, 50);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(50);
    p.text("GAME OVER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    
    p.fill(255);
    p.textSize(30);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    
    p.textSize(20);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
    p.pop();
}