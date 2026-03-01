/**
 * User Interface rendering.
 */
import { gameState, CLASSES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderUI(p) {
    if (gameState.gamePhase === "PLAYING" || gameState.gamePhase === "PAUSED" || gameState.gamePhase.startsWith("GAME_OVER")) {
        renderHUD(p);
    }
    
    if (gameState.gamePhase === "START") {
        renderStartScreen(p);
    } else if (gameState.gamePhase === "PAUSED") {
        renderPauseScreen(p);
    } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
        renderGameOverScreen(p);
    }
    
    // Flash effect for damage
    if (gameState.cameraShake > 0) {
        gameState.cameraShake *= 0.9;
        if (gameState.cameraShake < 0.5) gameState.cameraShake = 0;
    }
}

function renderHUD(p) {
    // Top Bar Background
    p.fill(0, 0, 0, 150);
    p.rectMode(p.CORNER);
    p.rect(0, 0, CANVAS_WIDTH, 40);
    
    // Health Bar
    const player = gameState.player;
    if (player) {
        p.fill(100, 0, 0);
        p.rect(10, 10, 150, 20);
        p.fill(0, 200, 0);
        const hpPct = Math.max(0, player.hp / player.maxHp);
        p.rect(10, 10, 150 * hpPct, 20);
        
        p.fill(255);
        p.textSize(12);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(`${Math.floor(player.hp)}/${player.maxHp}`, 85, 20);
    }
    
    // Level & XP
    p.fill(255, 215, 0);
    p.textAlign(p.LEFT, p.CENTER);
    p.text(`LVL ${gameState.level}`, 180, 20);
    
    // Score
    p.textAlign(p.RIGHT, p.CENTER);
    p.fill(255);
    p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 20, 20);
}

function renderStartScreen(p) {
    p.background(20, 20, 30);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255, 200, 0);
    p.textSize(40);
    p.text("ENDLESS SLAYER", CANVAS_WIDTH/2, 80);
    
    p.fill(200);
    p.textSize(16);
    p.text("Select Your Hero", CANVAS_WIDTH/2, 130);
    
    // Class Selection
    const classNames = [CLASSES.KNIGHT, CLASSES.WIZARD, CLASSES.KNAVE];
    const boxW = 120;
    const spacing = 140;
    const startX = CANVAS_WIDTH/2 - spacing;
    
    for (let i = 0; i < 3; i++) {
        const x = startX + (i * spacing);
        const y = 220;
        
        // Highlight selection
        if (i === gameState.selectedClassIndex) {
            p.stroke(255, 215, 0);
            p.strokeWeight(4);
            p.fill(50, 50, 70);
        } else {
            p.noStroke();
            p.fill(30, 30, 40);
        }
        
        p.rectMode(p.CENTER);
        p.rect(x, y, boxW, 150, 10);
        p.noStroke();
        
        // Class Name
        p.fill(255);
        p.textSize(18);
        p.text(classNames[i], x, y - 50);
        
        // Description
        p.textSize(12);
        p.fill(200);
        let desc = "";
        if (i === 0) desc = "Melee Tank\nSword Swing";
        if (i === 1) desc = "Ranged Glass Cannon\nMagic Missiles";
        if (i === 2) desc = "Fast & Agile\nDash Attack";
        p.text(desc, x, y + 40);
    }
    
    p.fill(255);
    p.textSize(20);
    if (p.frameCount % 60 < 30) {
        p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, 350);
    }
}

function renderPauseScreen(p) {
    p.fill(0, 0, 0, 150);
    p.rectMode(p.CORNER);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
}

function renderGameOverScreen(p) {
    p.fill(0, 0, 0, 200);
    p.rectMode(p.CORNER);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255, 50, 50);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(50);
    p.text("GAME OVER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 50);
    
    p.fill(255);
    p.textSize(24);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 10);
    p.text(`Level Reached: ${gameState.level}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    
    p.textSize(20);
    p.fill(200);
    p.text("Press R to Try Again", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 100);
}