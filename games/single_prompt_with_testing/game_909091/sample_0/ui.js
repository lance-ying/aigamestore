// UI Rendering
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';

export function renderStartScreen(p) {
    p.background('#1a2f1a'); // Dark Greenish bg
    
    // Draw decorations (Coins falling)
    p.push();
    if (p.frameCount % 20 === 0) {
        // Just static logic here, actual particles cleared on reset
    }
    p.pop();

    p.textAlign(p.CENTER, p.CENTER);
    
    // Title
    p.fill('#FFD700');
    p.textSize(60);
    p.textStyle(p.BOLD);
    p.stroke(0);
    p.strokeWeight(4);
    p.text("Lep's Adventure", CANVAS_WIDTH / 2, 120);
    
    p.noStroke();
    p.fill(255);
    p.textSize(18);
    p.textStyle(p.NORMAL);
    p.text("Help Lep find his Pot of Gold!", CANVAS_WIDTH / 2, 180);
    
    // Instructions Box
    p.rectMode(p.CENTER);
    p.fill(0, 100);
    p.rect(CANVAS_WIDTH/2, 280, 400, 140, 10);
    
    p.fill('#EEE');
    p.textSize(16);
    p.text("ARROWS: Move   |   SPACE: Jump", CANVAS_WIDTH/2, 250);
    p.text("Z: Throw Pinecone", CANVAS_WIDTH/2, 280);
    p.text("Collect Clovers for Health!", CANVAS_WIDTH/2, 310);
    
    // Prompt
    p.fill('#4CAF50');
    p.textSize(24);
    const scale = 1 + Math.sin(p.frameCount * 0.1) * 0.1;
    p.push();
    p.translate(CANVAS_WIDTH/2, 380);
    p.scale(scale);
    p.text("PRESS ENTER TO START", 0, -20);
    p.pop();
}

export function renderHUD(p) {
    p.push();
    p.resetMatrix(); // Ensure HUD is static relative to screen
    
    // Health (Clovers)
    p.fill(255);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(20);
    p.text("Health:", 10, 10);
    
    for(let i=0; i<gameState.player.maxHealth; i++) {
        const x = 90 + i * 25;
        const y = 20;
        
        if (i < gameState.player.health) {
             p.fill(COLORS.CLOVER); // Green for active health
        } else {
             p.fill(50); // Grey for empty
        }
        
        // Simple clover shape
        p.circle(x, y, 15);
    }
    
    // Score
    p.fill('#FFD700');
    p.textAlign(p.RIGHT, p.TOP);
    p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 20, 10);
    
    p.pop();
}

export function renderPauseScreen(p) {
    p.push();
    p.resetMatrix();
    p.fill(0, 150);
    p.rectMode(p.CORNER);
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
    p.resetMatrix();
    
    const isWin = gameState.gamePhase === "GAME_OVER_WIN";
    const bgColor = isWin ? p.color(255, 215, 0, 200) : p.color(50, 0, 0, 200);
    
    p.fill(bgColor);
    p.rectMode(p.CORNER);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.stroke(0);
    p.strokeWeight(4);
    p.fill(isWin ? '#FFF' : '#F00');
    p.textSize(50);
    p.text(isWin ? "LEVEL COMPLETE!" : "GAME OVER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    
    p.noStroke();
    p.fill(255);
    p.textSize(24);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    
    p.textSize(20);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
    p.pop();
}