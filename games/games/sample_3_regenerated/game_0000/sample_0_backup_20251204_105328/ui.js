/**
 * Renders the HUD, Start Screen, Pause Screen, and Game Over Screen.
 */
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, MAX_JUMP_POWER } from './globals.js';

export function renderUI(p) {
    // HUD is always drawn in playing phase
    if (gameState.gamePhase === "PLAYING" || gameState.gamePhase === "PAUSED") {
        renderHUD(p);
    }

    if (gameState.gamePhase === "START") {
        renderStartScreen(p);
    } else if (gameState.gamePhase === "PAUSED") {
        renderPausedOverlay(p);
    } else if (gameState.gamePhase === "GAME_OVER_WIN") {
        renderGameOver(p, true);
    } else if (gameState.gamePhase === "GAME_OVER_LOSE") {
        renderGameOver(p, false); // Technically hard to lose unless we add permadeath
    }
}

function renderHUD(p) {
    p.push();
    p.resetMatrix(); // Ensure HUD is static relative to screen
    
    // Score / Height
    p.fill(255);
    p.stroke(0);
    p.strokeWeight(2);
    p.textSize(20);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`Height: ${gameState.currentHeight}m`, 20, 20);
    p.text(`Best: ${gameState.score}m`, 20, 50);
    
    // Charge Bar
    if (gameState.player) {
        const barW = 200;
        const barH = 20;
        const barX = CANVAS_WIDTH - 220;
        const barY = 20;
        
        p.fill(0, 100);
        p.rect(barX, barY, barW, barH);
        
        const fillRatio = gameState.player.chargeLevel / MAX_JUMP_POWER;
        p.fill(255, 100 + fillRatio*155, 0); // Yellow to Red
        p.rect(barX, barY, barW * fillRatio, barH);
        
        p.noFill();
        p.stroke(255);
        p.rect(barX, barY, barW, barH);
        
        p.textAlign(p.CENTER);
        p.fill(255);
        p.noStroke();
        p.textSize(12);
        p.text("JUMP POWER", barX + barW/2, barY + 15);
    }
    
    p.pop();
}

function renderStartScreen(p) {
    p.push();
    p.background(20, 20, 40);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    
    // Title
    p.textSize(60);
    p.stroke(0);
    p.strokeWeight(4);
    p.fill(255, 215, 0);
    p.text("JUMP KING LEGEND", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
    
    p.textSize(24);
    p.fill(200);
    p.noStroke();
    p.text("Ascend the Tower. Find the Babe.", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    
    p.textSize(16);
    p.text("Arrow Keys to Move", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 50);
    p.text("HOLD SPACE to Charge Jump", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 75);
    p.text("WARNING: No Air Control!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 100);
    
    // Blinking Text
    if (p.frameCount % 60 < 30) {
        p.textSize(28);
        p.fill(255, 255, 0);
        p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.8);
    }
    
    p.pop();
}

function renderPausedOverlay(p) {
    p.push();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    p.textSize(20);
    p.text("Press ESC to Resume", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 30);
    p.pop();
}

function renderGameOver(p, win) {
    p.push();
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    
    if (win) {
        p.fill(255, 215, 0);
        p.textSize(50);
        p.text("LEGENDARY VICTORY!", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
        
        p.fill(255);
        p.textSize(20);
        p.text("You reached the top!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
        p.text(`Falls: ${gameState.falls} | Jumps: ${gameState.attempts}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    } else {
        // Technically unused in this version unless we add permadeath
        p.fill(200, 50, 50);
        p.text("YOU GAVE UP", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
    }
    
    p.fill(200);
    p.textSize(20);
    p.text("Press R to Play Again", CANVAS_WIDTH/2, CANVAS_HEIGHT*0.8);
    
    p.pop();
}