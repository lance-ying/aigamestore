// ui.js - HUD and Menus
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { LEVEL_NAMES } from './level.js';

export function renderUI(p) {
    // HUD
    p.textAlign(p.LEFT, p.TOP);
    p.textStyle(p.BOLD);
    
    // Score
    p.textSize(20);
    p.fill(255, 255, 0); // Yellow text
    p.stroke(0);
    p.strokeWeight(3);
    p.text("SCORE", 20, 20);
    p.fill(255);
    p.text(gameState.score, 100, 20);
    
    // Time
    p.fill(255, 255, 0);
    p.text("TIME", 20, 50);
    p.fill(255);
    const mins = Math.floor(gameState.time / 60);
    const secs = Math.floor(gameState.time % 60);
    const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
    p.text(timeStr, 100, 50);
    
    // Rings
    p.fill(255, 255, 0);
    if (gameState.rings === 0 && p.frameCount % 60 < 30) {
        p.fill(255, 0, 0); // Flash red if 0 rings
    }
    p.text("RINGS", 20, 80);
    p.fill(255);
    p.text(gameState.rings, 100, 80);
    
    // Level name
    p.textSize(14);
    p.fill(100, 200, 255);
    p.text(`Level ${gameState.currentLevel + 1}/${LEVEL_NAMES.length}`, 20, 110);
    p.textSize(12);
    p.fill(200, 200, 255);
    if (LEVEL_NAMES[gameState.currentLevel]) {
        p.text(LEVEL_NAMES[gameState.currentLevel], 20, 130);
    }
}

export function renderStartScreen(p) {
    p.background(0, 100, 200); // Sky blue
    
    // Checkerboard floor effect
    p.noStroke();
    for(let y = 300; y < 400; y += 20) {
        for(let x = 0; x < 600; x += 20) {
            if ((Math.floor(x/20) + Math.floor(y/20)) % 2 === 0) p.fill(139, 69, 19);
            else p.fill(160, 82, 45);
            p.rect(x, y, 20, 20);
        }
    }

    p.textAlign(p.CENTER, p.CENTER);
    
    // Title Shadow
    p.fill(0, 0, 0, 100);
    p.textSize(50);
    p.text("SONIC JS", CANVAS_WIDTH/2 + 4, CANVAS_HEIGHT/3 + 4);
    
    // Title
    p.fill(255, 255, 0);
    p.stroke(0, 0, 255);
    p.strokeWeight(4);
    p.text("SONIC JS", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
    
    p.noStroke();
    p.fill(255);
    p.textSize(20);
    if (p.frameCount % 60 < 40) {
        p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    }
    
    p.textSize(14);
    p.text("Arrows to Move | Space to Jump | Down to Roll", CANVAS_WIDTH/2, CANVAS_HEIGHT - 50);
    p.text("N = Next Level | P = Previous Level", CANVAS_WIDTH/2, CANVAS_HEIGHT - 30);
}

export function renderPausedOverlay(p) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
}

export function renderGameOver(p) {
    const win = gameState.gamePhase === "GAME_OVER_WIN";
    
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    
    if (win) {
        p.fill(0, 255, 0);
        p.text("ACT CLEARED!", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
        p.textSize(20);
        p.fill(255);
        p.text(`Total Score: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
        p.textSize(16);
        p.text("Press ENTER for Next Level", CANVAS_WIDTH/2, CANVAS_HEIGHT * 0.65);
    } else {
        p.fill(255, 0, 0);
        p.text("GAME OVER", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
    }
    
    p.fill(255);
    p.textSize(18);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT * 0.7);
}