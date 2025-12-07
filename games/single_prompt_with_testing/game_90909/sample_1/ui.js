import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderUI(p) {
    p.push();
    
    // HUD
    // Score
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(20);
    p.fill(255);
    p.stroke(0);
    p.strokeWeight(3);
    p.text(`Score: ${gameState.score}`, 10, 10);
    
    // Health (Clovers)
    p.text("Health: ", 10, 40);
    for(let i=0; i<gameState.player.maxHealth; i++) {
        p.stroke(0);
        if (i < gameState.player.health) {
            p.fill(0, 255, 0); // Active
        } else {
            p.fill(50); // Empty
        }
        p.circle(100 + (i * 25), 50, 10);
    }
    
    // Ammo
    p.fill(101, 67, 33);
    p.text(`Ammo: ${gameState.player.ammo}`, 10, 70);
    
    p.pop();
}

export function renderStartScreen(p) {
    p.background(0, 100, 0); // Green bg
    p.textAlign(p.CENTER, p.CENTER);
    
    p.fill(255);
    p.stroke(0);
    p.strokeWeight(4);
    p.textSize(50);
    p.text("LEP'S ADVENTURE", CANVAS_WIDTH/2, 100);
    
    p.textSize(20);
    p.strokeWeight(2);
    p.text("Help Lep find his gold!", CANVAS_WIDTH/2, 180);
    p.text("Arrow Keys to Move/Jump", CANVAS_WIDTH/2, 220);
    p.text("Z to Shoot Pinecones", CANVAS_WIDTH/2, 250);
    
    p.textSize(30);
    p.fill(255, 255, 0);
    if (p.frameCount % 60 < 30) {
        p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, 320);
    }
}

export function renderPauseScreen(p) {
    p.push();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
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
    p.textAlign(p.CENTER, p.CENTER);
    
    let isWin = gameState.gamePhase === "GAME_OVER_WIN";
    
    p.textSize(50);
    if (isWin) {
        p.fill(0, 255, 0);
        p.text("YOU WIN!", CANVAS_WIDTH/2, 120);
        p.textSize(20);
        p.fill(255);
        p.text("Lep found the Rainbow!", CANVAS_WIDTH/2, 170);
    } else {
        p.fill(255, 0, 0);
        p.text("GAME OVER", CANVAS_WIDTH/2, 120);
        p.textSize(20);
        p.fill(255);
        p.text("Lep lost his gold...", CANVAS_WIDTH/2, 170);
    }
    
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, 230);
    
    p.fill(200);
    p.text("Press R to Restart", CANVAS_WIDTH/2, 300);
    p.pop();
}