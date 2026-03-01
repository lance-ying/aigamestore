/**
 * User Interface Rendering
 */
import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, COLORS } from './globals.js';

export function renderUI(p) {
    // Top HUD Background
    p.push();
    p.fill(0, 0, 0, 100);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, 60);
    
    // Score
    p.fill(COLORS.fruit);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(18);
    p.text(`SCORE: ${gameState.score}`, 10, 15);
    
    // Lives
    p.textAlign(p.RIGHT, p.CENTER);
    p.fill(COLORS.player);
    p.text(`LIVES: ${gameState.lives}`, CANVAS_WIDTH - 10, 15);
    
    // Shields
    if (gameState.player && gameState.player.shieldCount > 0) {
        p.textAlign(p.LEFT, p.CENTER);
        p.fill(COLORS.shield);
        p.text(`SHIELDS: ${gameState.player.shieldCount}`, 10, 40);
    }
    
    // Height / Progress
    if (gameState.player) {
        const progress = Math.floor(p.map(gameState.player.y, gameState.worldHeight, 0, 0, 100));
        p.textAlign(p.CENTER, p.CENTER);
        p.fill(255);
        p.textSize(14);
        p.text(`ALTITUDE: ${Math.max(0, progress)}%`, CANVAS_WIDTH / 2, 40);
    }
    p.pop();
}

export function renderStartScreen(p) {
    p.background(COLORS.background);
    
    p.push();
    p.textAlign(p.CENTER, p.CENTER);
    
    // Main message: "press enter to begin"
    p.fill(COLORS.player); // Use a prominent color
    p.textSize(40); // Make it stand out
    p.stroke(0);
    p.strokeWeight(3);
    p.text("press enter to begin", CANVAS_WIDTH/2, CANVAS_HEIGHT/3); // Place it where the title was
    
    // Preserved control instructions (canvas-rendered)
    p.textSize(16);
    p.fill(200);
    p.text("Controls: Arrow Keys to Move, Space to Jump", CANVAS_WIDTH/2, CANVAS_HEIGHT - 60);
    p.text("Collect shields to protect yourself from demons!", CANVAS_WIDTH/2, CANVAS_HEIGHT - 40);
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