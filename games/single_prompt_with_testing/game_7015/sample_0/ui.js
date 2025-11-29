import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, CONSTANTS } from './globals.js';

export function renderUI(p) {
    // HUD
    
    // Top Bar Background
    p.push();
    p.fill(0, 0, 0, 100);
    p.rect(0, 0, CANVAS_WIDTH, 40);
    
    // Gems Counter (Left)
    p.textAlign(p.LEFT, p.CENTER);
    p.fill(200, 0, 255);
    p.textSize(18);
    p.text(`GEMS: ${gameState.gemsCollected} / ${gameState.winningGemCount}`, 20, 20);
    
    // Score (Right)
    p.textAlign(p.RIGHT, p.CENTER);
    p.fill(255);
    p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 20, 20);

    // Super Charge Meter (Bottom Center)
    if (gameState.player) {
        const barW = 200;
        const barH = 10;
        const bx = CANVAS_WIDTH / 2 - barW / 2;
        const by = CANVAS_HEIGHT - 20;
        
        // Background
        p.fill(50);
        p.noStroke();
        p.rect(bx, by, barW, barH);
        
        // Fill
        const ratio = gameState.player.superCharge / CONSTANTS.MAX_SUPER_CHARGE;
        p.fill(255, 255, 0); // Yellow for Super
        p.rect(bx, by, barW * ratio, barH);
        
        // Border
        p.stroke(255);
        p.noFill();
        p.rect(bx, by, barW, barH);
        
        // Text
        p.fill(255);
        p.noStroke();
        p.textAlign(p.CENTER, p.BOTTOM);
        p.textSize(10);
        p.text(ratio >= 1 ? "SUPER READY (PRESS Z)" : "SUPER CHARGING", CANVAS_WIDTH / 2, by - 5);
    }
    
    // Countdown Timer (Center Screen if Active)
    if (gameState.isCountdownActive) {
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(60);
        p.fill(255, 0, 0);
        p.stroke(0);
        p.strokeWeight(4);
        p.text(Math.ceil(gameState.countdownTimer), CANVAS_WIDTH/2, 100);
        
        p.textSize(20);
        p.fill(255);
        p.noStroke();
        p.text("HOLD THE GEMS!", CANVAS_WIDTH/2, 140);
    }
    
    p.pop();
}

export function renderStartScreen(p) {
    p.background(30, 30, 40);
    p.textAlign(p.CENTER, p.CENTER);
    
    p.fill(255, 200, 0);
    p.textSize(50);
    p.text("BRAWL ARENA", CANVAS_WIDTH/2, 120);
    
    p.fill(200);
    p.textSize(16);
    p.text("Collect 10 Gems and Survive!", CANVAS_WIDTH/2, 180);
    p.text("Arrow Keys: Move | Space: Shoot | Z: Super | Shift: Dash", CANVAS_WIDTH/2, 220);
    
    p.fill(255);
    p.textSize(20);
    if (p.frameCount % 60 < 30) {
        p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, 320);
    }
}

export function renderGameOver(p) {
    p.push();
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    
    if (gameState.gamePhase === "GAME_OVER_WIN") {
        p.fill(0, 255, 0);
        p.textSize(60);
        p.text("VICTORY!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    } else {
        p.fill(255, 0, 0);
        p.textSize(60);
        p.text("DEFEAT", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    }
    
    p.fill(255);
    p.textSize(24);
    p.text("Final Score: " + gameState.score, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    
    p.textSize(18);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 80);
    p.pop();
}

export function renderPaused(p) {
    p.push();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.pop();
}