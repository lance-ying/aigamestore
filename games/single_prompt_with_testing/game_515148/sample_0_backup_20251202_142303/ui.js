/**
 * UI Rendering
 */
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, RAIN_CYCLE_DURATION, COLORS } from './globals.js';

export function renderHUD(p) {
    if (!gameState.player) return;

    // --- Food Pips (Bottom Left) ---
    const startX = 30;
    const startY = CANVAS_HEIGHT - 30;
    const pipSize = 10;
    const padding = 5;

    for (let i = 0; i < gameState.player.maxFood; i++) {
        // Filled if food > i
        if (i < gameState.player.food) {
            p.fill(COLORS.FOOD);
        } else {
            p.noFill();
            p.stroke(100);
            p.strokeWeight(1);
        }
        
        // Draw circles
        p.circle(startX + i * (pipSize + padding), startY, pipSize);
        p.noStroke();
    }
    
    // Hibernate Threshold Line
    p.stroke(255);
    p.line(startX + 3 * (pipSize + padding) + 2, startY - 10, startX + 3 * (pipSize + padding) + 2, startY + 10);
    p.noStroke();

    // --- Rain Timer (Bottom Left, around pips maybe? Or separate) ---
    // Let's put Rain Timer in Bottom Right
    const timerX = CANVAS_WIDTH - 40;
    const timerY = CANVAS_HEIGHT - 40;
    const timerRadius = 20;
    
    const timeLeftRatio = Math.max(0, gameState.rainTimer / RAIN_CYCLE_DURATION);
    
    p.noFill();
    p.strokeWeight(3);
    p.stroke(50);
    p.circle(timerX, timerY, timerRadius * 2);
    
    // Progress Arc
    p.stroke(timeLeftRatio < 0.2 ? '#ff0000' : COLORS.RAIN);
    p.arc(timerX, timerY, timerRadius * 2, timerRadius * 2, -p.PI/2, -p.PI/2 + (timeLeftRatio * p.TWO_PI));
    p.noStroke();
    
    // Debug Text
    // p.fill(255);
    // p.text(Math.floor(gameState.rainTimer), timerX, timerY);
}

export function renderStartScreen(p) {
    p.background(COLORS.BACKGROUND);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    
    p.textSize(40);
    p.text("RAIN WORLD: P5 EDITION", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 60);
    
    p.textSize(16);
    p.fill(200);
    p.text("Survive. Eat. Hibernate.", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 10);
    
    p.fill(COLORS.FOOD);
    p.text("Press ENTER to Start", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 50);
}

export function renderPauseScreen(p) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255);
    p.textSize(30);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.textSize(15);
    p.text("Press ESC to Resume", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
}

export function renderGameOver(p, win) {
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    
    if (win) {
        p.fill(COLORS.SHELTER);
        p.textSize(40);
        p.text("HIBERNATION SUCCESSFUL", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
        p.fill(255);
        p.textSize(16);
        p.text("The cycle continues...", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 30);
    } else {
        p.fill('#ff0000');
        p.textSize(40);
        p.text("GAME OVER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
        p.fill(255);
        p.textSize(16);
        p.text("You did not survive.", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 30);
    }
    
    p.fill(150);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT - 50);
}