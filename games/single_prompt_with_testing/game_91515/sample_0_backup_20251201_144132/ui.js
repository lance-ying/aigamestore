import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderUI(p) {
    p.push();
    
    // HUD
    p.fill(255);
    p.textSize(16);
    p.textAlign(p.LEFT, p.TOP);
    
    // Health Bar
    p.noStroke();
    p.fill(50);
    p.rect(20, 20, 200, 20); // BG
    
    if (gameState.player) {
        const hp = gameState.player.mode === 'MECH' ? gameState.player.mechHealth : gameState.player.catHealth * 33;
        const maxHp = 100;
        const ratio = Math.max(0, hp / maxHp);
        
        p.fill(ratio > 0.3 ? p.color(0, 255, 0) : p.color(255, 0, 0));
        p.rect(20, 20, 200 * ratio, 20);
        
        p.fill(255);
        p.text(gameState.player.mode === 'MECH' ? "MECH SUIT" : "CAT FORM", 20, 45);
    }
    
    p.textAlign(p.RIGHT, p.TOP);
    p.text("SCORE: " + gameState.score, CANVAS_WIDTH - 20, 20);
    
    p.pop();
}

export function renderStartScreen(p) {
    p.background(10, 10, 20);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    
    p.textSize(40);
    p.text("GATO ROBOTO", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 60);
    
    p.textSize(16);
    p.text("Pilot the Mech. Save the Captain.", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.text("Arrows: Move | Space: Jump | Z: Shoot | Shift: Eject", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 30);
    
    if (p.frameCount % 60 < 40) {
        p.textSize(20);
        p.fill(0, 255, 0);
        p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 80);
    }
}

export function renderPausedOverlay(p) {
    p.push();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(30);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.pop();
}

export function renderGameOver(p) {
    p.push();
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    const win = gameState.gamePhase === "GAME_OVER_WIN";
    p.fill(win ? p.color(0, 255, 0) : p.color(255, 0, 0));
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text(win ? "MISSION ACCOMPLISHED" : "CRITICAL FAILURE", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    
    p.fill(255);
    p.textSize(20);
    p.text("Final Score: " + gameState.score, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 10);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 50);
    p.pop();
}