/**
 * Rendering functions
 */
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';

export function drawBody(p, body, color) {
    p.push();
    p.fill(color);
    p.noStroke();
    
    p.beginShape();
    body.vertices.forEach(v => {
        p.vertex(v.x, v.y);
    });
    p.endShape(p.CLOSE);
    p.pop();
}

export function renderBackground(p) {
    // Lerp sky color based on time
    const ratio = 1 - (gameState.timeRemaining / (60 * 60)); // 0 to 1
    const r = p.lerp(COLORS.skyStart[0], COLORS.skyEnd[0], ratio);
    const g = p.lerp(COLORS.skyStart[1], COLORS.skyEnd[1], ratio);
    const b = p.lerp(COLORS.skyStart[2], COLORS.skyEnd[2], ratio);
    
    p.background(r, g, b);
    
    // Draw Sun setting
    const sunX = CANVAS_WIDTH - 50 - (ratio * (CANVAS_WIDTH - 100));
    const sunY = 50 + (ratio * 100);
    
    p.push();
    // Do not translate sun by camera, make it sticky to screen or parallax
    // We want it to be "UI" layer for the timer effect, or "World" layer for immersion
    // Let's make it screen space for the "timer" visual
    p.resetMatrix(); 
    p.fill(COLORS.sun);
    p.noStroke();
    p.circle(sunX, sunY, 60);
    p.pop();
}

export function renderUI(p) {
    p.push();
    p.resetMatrix(); // Ensure UI is drawn on top relative to screen
    
    // Score
    p.fill(COLORS.text);
    p.textSize(24);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`Distance: ${Math.floor(gameState.distance)}m`, 20, 20);
    p.text(`Score: ${gameState.score}`, 20, 50);
    
    // Time/Sun bar
    // const barWidth = 200;
    // p.noFill();
    // p.stroke(255);
    // p.rect(CANVAS_WIDTH - barWidth - 20, 20, barWidth, 15);
    // p.fill(255, 200, 0);
    // p.noStroke();
    // const timeRatio = gameState.timeRemaining / (60*60);
    // p.rect(CANVAS_WIDTH - barWidth - 20, 20, barWidth * timeRatio, 15);
    
    // Debug state info
    if (gameState.controlMode !== "HUMAN") {
        p.fill(255, 0, 0);
        p.textSize(12);
        p.text(`MODE: ${gameState.controlMode}`, 20, 80);
    }
    
    p.pop();
}

export function renderStartScreen(p) {
    p.background(COLORS.skyStart);
    p.fill(0, 0, 0, 100);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    
    p.textSize(48);
    p.text("TINY GLIDERS", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 60);
    
    p.textSize(18);
    p.text("Press ENTER to Start", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    p.text("SPACE to Dive (Downhill)", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 50);
    p.text("Release to Glide (Uphill)", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 80);
}

export function renderGameOver(p) {
    p.push();
    p.resetMatrix();
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    
    const isWin = gameState.gamePhase === "GAME_OVER_WIN";
    const title = isWin ? "YOU ESCAPED THE NIGHT!" : "THE SUN HAS SET";
    
    p.textSize(36);
    p.text(title, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    
    p.textSize(24);
    p.text(`Total Distance: ${Math.floor(gameState.distance)}m`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 10);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    
    p.textSize(16);
    p.text("Press R to Play Again", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 90);
    p.pop();
}

export function renderPaused(p) {
    p.push();
    p.resetMatrix();
    p.fill(0, 0, 0, 100);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.pop();
}