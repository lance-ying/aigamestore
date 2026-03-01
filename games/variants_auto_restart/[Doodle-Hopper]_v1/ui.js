/**
 * UI Rendering
 */
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
    p.textAlign(p.CENTER, p.CENTER);
    
    // Background doodle pattern
    drawBackgroundPattern(p);
    
    // Replace the main title and subtitle with "press enter to begin"
    p.noStroke(); // Ensure no stroke from previous title box drawing
    p.fill(255); // Simple white color for the message
    p.textSize(32); // Appropriate size for the main message
    p.text("press enter to begin", CANVAS_WIDTH/2, CANVAS_HEIGHT/2); // Centered on the canvas
    
    // Removed specific game title and subtitle drawing.
    // Removed redundant controls drawing ("Arrows to Move | Space to Shoot") as the primary controls
    // are preserved in the HTML <p id="gameControls"> element, which is visible above the canvas.
    
    drawDoodleDecorations(p);
}

export function renderHUD(p) {
    // Score Top Left
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(20);
    p.fill(0);
    p.noStroke();
    p.text(`Score: ${Math.floor(gameState.score)}`, 10, 10);
    
    // High Score Top Right
    p.textAlign(p.RIGHT, p.TOP);
    p.text(`High: ${Math.floor(gameState.highScore)}`, CANVAS_WIDTH - 10, 10);
}

export function renderPausedOverlay(p) {
    p.fill(0, 0, 0, 100);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
}

export function renderGameOver(p) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(50);
    p.text("GAME OVER", CANVAS_WIDTH/2, 150);
    
    p.textSize(30);
    p.text(`Score: ${Math.floor(gameState.score)}`, CANVAS_WIDTH/2, 220);
    
    p.textSize(20);
    p.text("Press R to Restart", CANVAS_WIDTH/2, 300);
}

function drawBackgroundPattern(p) {
    p.stroke(200, 200, 220);
    p.strokeWeight(1);
    
    // Graph paper lines
    for (let x = 0; x < CANVAS_WIDTH; x += 20) {
        p.line(x, 0, x, CANVAS_HEIGHT);
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 20) {
        p.line(0, y, CANVAS_WIDTH, y);
    }
}

function drawDoodleDecorations(p) {
    // Just some static deco logic for the menu
    p.push();
    p.translate(100, 300);
    p.rotate(-0.2);
    p.noFill();
    p.stroke(0);
    p.strokeWeight(2);
    // Draw a cloud
    p.beginShape();
    p.vertex(0, 0);
    p.bezierVertex(-20, -20, 20, -40, 40, -20);
    p.bezierVertex(60, -40, 80, -20, 60, 0);
    p.endShape();
    p.pop();
}