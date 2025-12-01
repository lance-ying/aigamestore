import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_OPTS } from './globals.js';

export function renderUI(p) {
    // Score / Distance
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(20);
    p.fill(255);
    p.stroke(0);
    p.strokeWeight(2);
    p.text(`Distance: ${Math.floor(gameState.distance)}m`, 20, 20);
    p.text(`Goal: ${GAME_OPTS.levelLength}m`, 20, 50);
    
    // Fever Bar
    const barW = 200;
    const barH = 20;
    const barX = CANVAS_WIDTH - 220;
    const barY = 20;
    
    p.stroke(255);
    p.fill(0, 100);
    p.rect(barX, barY, barW, barH);
    
    if (gameState.feverMode) {
        // Timer bar
        const ratio = gameState.feverTimer / GAME_OPTS.feverDuration;
        p.noStroke();
        p.fill(255, 0, 100);
        p.rect(barX + 2, barY + 2, (barW - 4) * ratio, barH - 4);
        
        p.fill(255);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(16);
        p.text("FEVER MODE!", barX + barW/2, barY + barH/2);
    } else {
        // Progress to fever (landings)
        const ratio = Math.min(gameState.landings / GAME_OPTS.landingTarget, 1);
        p.noStroke();
        p.fill(255, 255, 0);
        p.rect(barX + 2, barY + 2, (barW - 4) * ratio, barH - 4);
        
        p.fill(255);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(12);
        p.text(`${gameState.landings}/${GAME_OPTS.landingTarget} Landings`, barX + barW/2, barY + barH/2);
    }
}

export function renderStartScreen(p) {
    p.background(0, 0, 0, 200);
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    
    p.textSize(40);
    p.text("SQUARE BIRD TOWER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 60);
    
    p.textSize(20);
    p.text("Press SPACE to lay eggs and build a tower.", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.text("Clear obstacles. Don't hit walls with your face.", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 30);
    p.text("Land 3 times to enter FEVER MODE.", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
    
    p.textSize(24);
    p.fill(0, 255, 0);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 120);
}

export function renderGameOver(p) {
    const win = gameState.gamePhase === "GAME_OVER_WIN";
    p.background(0, 0, 0, 200);
    p.textAlign(p.CENTER, p.CENTER);
    
    if (win) {
        p.fill(0, 255, 0);
        p.textSize(50);
        p.text("LEVEL CLEARED!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    } else {
        p.fill(255, 0, 0);
        p.textSize(50);
        p.text("GAME OVER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    }
    
    p.fill(255);
    p.textSize(30);
    p.text(`Distance: ${Math.floor(gameState.distance)}m`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    
    p.textSize(20);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 70);
}

export function renderPausedOverlay(p) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
}