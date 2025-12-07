import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, COLORS } from './globals.js';

export function renderStartScreen(p) {
    p.background(COLORS.SKY);
    
    // Decor
    p.noStroke();
    p.fill(COLORS.GRASS);
    p.rect(0, 350, CANVAS_WIDTH, 50);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    p.stroke(0);
    p.strokeWeight(4);
    p.textSize(60);
    p.text("LEP'S QUEST", CANVAS_WIDTH/2, 150);
    
    p.textSize(24);
    p.strokeWeight(2);
    p.text("Help Lep find his gold!", CANVAS_WIDTH/2, 220);
    
    p.textSize(20);
    p.fill(255, 255, 0);
    if (p.frameCount % 60 < 30) {
        p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, 300);
    }
}

export function renderHUD(p) {
    // Score
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(20);
    p.fill(255);
    p.stroke(0);
    p.strokeWeight(2);
    p.text(`SCORE: ${gameState.score}`, 10, 10);
    
    // Health (Clovers)
    if (gameState.player) {
        p.text(`LIVES:`, 10, 35);
        for(let i=0; i<gameState.player.health; i++) {
            p.fill(0, 255, 0);
            p.noStroke();
            p.circle(80 + i * 25, 45, 15);
        }
    }
}

export function renderGameOver(p) {
    p.push();
    p.translate(gameState.cameraX, gameState.cameraY); // Untranslate logic handled in game loop, but here we assume drawing on screen coords
    p.pop(); // Reset to screen space
    
    p.fill(0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.stroke(0);
    p.strokeWeight(3);
    
    if (gameState.gamePhase === "GAME_OVER_WIN") {
        p.fill(255, 215, 0);
        p.textSize(50);
        p.text("YOU FOUND THE GOLD!", CANVAS_WIDTH/2, 150);
    } else {
        p.fill(255, 50, 50);
        p.textSize(50);
        p.text("GAME OVER", CANVAS_WIDTH/2, 150);
    }
    
    p.fill(255);
    p.textSize(30);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, 220);
    
    p.textSize(20);
    p.text("Press 'R' to Restart", CANVAS_WIDTH/2, 300);
}

export function renderPaused(p) {
    p.fill(0, 100);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
}