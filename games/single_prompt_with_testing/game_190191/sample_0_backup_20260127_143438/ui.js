// UI Rendering

import { gameState, COLORS, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(COLORS.TEXT);
    p.textSize(40);
    p.text("Letter Drop Physics", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 60);
    
    p.textSize(18);
    p.fill(COLORS.PLAYER_OBJ);
    p.text("How does a 'p' fall?", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 10);
    
    p.fill(COLORS.TEXT);
    p.textSize(16);
    p.text("Type letters to solve puzzles.", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 30);
    p.text("Press ENTER to Start", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 80);
}

export function renderHUD(p) {
    // Level Info
    p.textAlign(p.LEFT, p.TOP);
    p.fill(COLORS.TEXT);
    p.textSize(16);
    p.text(`Level ${gameState.currentLevelIndex + 1}`, 10, 10);
    
    p.textAlign(p.RIGHT, p.TOP);
    p.text("R: Restart | ESC: Pause", CANVAS_WIDTH - 10, 10);

    // Typing Line
    if (gameState.gamePhase === "PLANNING") {
        renderTypingLine(p);
    }
}

function renderTypingLine(p) {
    const x = gameState.spawnX;
    const y = gameState.spawnY;
    
    // Spawn Marker
    p.noFill();
    p.stroke(COLORS.ACCENT);
    p.circle(x, y, 10);
    p.line(x-15, y, x+15, y); // Baseline
    
    // Typed Text
    p.fill(COLORS.TEXT);
    p.noStroke();
    p.textSize(24);
    p.textAlign(p.LEFT, p.BOTTOM);
    
    // Draw text being typed
    const spacing = 18; // Approx width per char
    for(let i=0; i<gameState.inputString.length; i++) {
        p.text(gameState.inputString[i], x + i * spacing, y);
    }
    
    // Cursor blink
    if (p.frameCount % 60 < 30) {
        const cursorX = x + gameState.inputString.length * spacing;
        p.stroke(COLORS.ACCENT);
        p.line(cursorX, y - 25, cursorX, y);
    }
    
    // Instructions
    p.textAlign(p.CENTER, p.BOTTOM);
    p.textSize(14);
    p.fill(150);
    p.text("Type & Press ENTER", x, y - 40);
}

export function renderPauseScreen(p) {
    p.fill(0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(COLORS.TEXT);
    p.textSize(32);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
}

export function renderGameOverWin(p) {
    p.fill(0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(COLORS.SUCCESS);
    p.textSize(40);
    p.text("ALL LEVELS CLEARED!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    p.fill(COLORS.TEXT);
    p.textSize(20);
    p.text("You are a Physics Master.", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 30);
}