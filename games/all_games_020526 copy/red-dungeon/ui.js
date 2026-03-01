import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderUI(p) {
    // HUD
    p.push();
    p.resetMatrix(); // Ensure UI is drawn over everything fixed to screen
    
    // Score
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(24);
    p.fill(255);
    p.stroke(0);
    p.strokeWeight(4);
    p.text(`Score: ${Math.floor(gameState.score)}`, 20, 20);
    
    p.fill(255, 215, 0);
    p.text(`Coins: ${gameState.coins}`, 20, 50);
    
    p.pop();
}

export function renderStartScreen(p) {
    p.background(10, 10, 20);
    p.textAlign(p.CENTER, p.CENTER);
    
    // Replaced main title with "press enter to begin" (blinking)
    p.fill(255, 255, 0); // Yellow color for prompt
    p.textSize(36); // Make it more prominent
    if (p.frameCount % 60 < 30) {
        p.text("press enter to begin", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 60);
    }
    
    // Preserved subtitle
    p.fill(200);
    p.textSize(20);
    p.text("Escape the Doom Wall!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    
    // Preserved controls on canvas
    p.text("Arrow Keys to Move, Space to Wait", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 30);
    
}

export function renderGameOver(p) {
    // Overlay
    p.push();
    p.resetMatrix();
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255, 50, 50);
    p.textSize(50);
    p.text("YOU DIED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 50);
    
    p.fill(255);
    p.textSize(30);
    p.text(`Final Score: ${Math.floor(gameState.score)}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 10);
    
    p.textSize(20);
    p.fill(200);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
    p.pop();
}