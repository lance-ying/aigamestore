import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';

export function renderStartScreen(p) {
    p.background(COLORS.background);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(COLORS.leo[0], COLORS.leo[1], COLORS.leo[2]);
    p.textSize(50);
    p.text("LEO'S FORTUNE", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 60);
    
    p.fill(255);
    p.textSize(18);
    p.text("Recover your stolen gold!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    
    p.textSize(14);
    p.fill(200);
    p.text("ARROWS to Move", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    p.text("UP to Float | DOWN to Sink", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
    
    p.fill(255, 215, 0); // Gold
    p.textSize(20);
    
    if (Math.floor(p.frameCount / 30) % 2 === 0) {
        p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 100);
    }
}

export function renderUI(p) {
    // HUD
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(20);
    p.fill(255, 215, 0);
    p.text(`$ ${gameState.score}`, 20, 20);
    
    p.fill(255);
    p.textSize(16);
    p.text(`Level ${gameState.currentLevelIndex + 1}`, 20, 50);
}

export function renderPausedOverlay(p) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
}

export function renderGameOver(p) {
    let isWin = gameState.gamePhase === "GAME_OVER_WIN";
    
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    if (isWin) {
        p.fill(46, 204, 113);
        p.text("YOU RECOVERED THE GOLD!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    } else {
        p.fill(231, 76, 60);
        p.text("OUCH!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    }
    
    p.fill(255);
    p.textSize(24);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    
    p.textSize(16);
    p.fill(180);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
}