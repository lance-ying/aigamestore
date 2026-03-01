/**
 * User Interface Rendering
 */
import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, COLORS } from './globals.js';

export function renderUI(p) {
    // Top HUD Background
    p.push();
    p.fill(0, 0, 0, 100);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, 40);
    
    // Score
    p.fill(COLORS.fruit);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(20);
    p.text(`SCORE: ${gameState.score}`, 20, 20);
    
    // Lives
    p.textAlign(p.RIGHT, p.CENTER);
    p.fill(COLORS.player);
    p.text(`LIVES: ${gameState.lives}`, CANVAS_WIDTH - 20, 20);
    
    // Height / Progress
    if (gameState.player) {
        const progress = Math.floor(p.map(gameState.player.y, gameState.worldHeight, 0, 0, 100));
        p.textAlign(p.CENTER, p.CENTER);
        p.fill(255);
        p.textSize(14);
        p.text(`ALTITUDE: ${Math.max(0, progress)}%`, CANVAS_WIDTH / 2, 20);
    }
    p.pop();
}

export function renderStartScreen(p) {
    p.background(COLORS.background);
    
    p.push();
    p.textAlign(p.CENTER, p.CENTER);
    
    // Title
    p.fill(COLORS.player);
    p.textSize(60);
    p.stroke(0);
    p.strokeWeight(4);
    p.text("LEAP DAY CLONE", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
    
    p.noStroke();
    p.fill(255);
    p.textSize(18);
    p.text("A new level every day!", CANVAS_WIDTH/2, CANVAS_HEIGHT/3 + 40);
    
    // Instructions
    p.textSize(24);
    p.fill(COLORS.wallTop);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
    
    p.textSize(16);
    p.fill(200);
    p.text("Controls: Arrow Keys to Move, Space to Jump", CANVAS_WIDTH/2, CANVAS_HEIGHT - 60);
    p.text("Wall Jump to climb high!", CANVAS_WIDTH/2, CANVAS_HEIGHT - 40);
    p.pop();
}

export function renderPausedScreen(p) {
    p.push();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.fill(255);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.textSize(20);
    p.text("Press ESC to Resume", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    p.pop();
}

export function renderGameOver(p, won) {
    p.push();
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(50);
    
    if (won) {
        p.fill(COLORS.trophy);
        p.text("LEVEL CLEARED!", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
    } else {
        p.fill(COLORS.spike);
        p.text("GAME OVER", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
    }
    
    p.fill(255);
    p.textSize(30);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    
    p.textSize(20);
    p.fill(200);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
    p.pop();
}