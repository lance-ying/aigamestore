import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASES } from './globals.js';
import { LEVELS } from './levels.js';

export function renderUI(p) {
    if (gameState.gamePhase === PHASES.START) {
        renderStartScreen(p);
    } else if (gameState.gamePhase === PHASES.GAME_OVER_WIN) {
        renderWinScreen(p);
    } else if (gameState.gamePhase === PHASES.PAUSED) {
        renderPauseScreen(p);
    }
    
    // HUD
    if (gameState.gamePhase !== PHASES.START) {
        p.fill(255);
        p.noStroke();
        p.textSize(12);
        p.textAlign(p.LEFT, p.TOP);
        p.text(`Level: ${LEVELS[gameState.currentLevelIndex].name}`, 10, 10);
        p.text(`Moves: ${gameState.movesTaken}`, 10, 25);
        p.text(`Score: ${gameState.totalScore}`, 10, 40);
        
        p.textAlign(p.RIGHT, p.TOP);
        p.text(`R: Reset | Z: Undo`, CANVAS_WIDTH - 10, 10);
    }
}

function renderStartScreen(p) {
    p.background(16, 16, 18);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    
    // Title
    p.textSize(48);
    p.text("LOGIC IS YOU", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
    
    p.textSize(16);
    p.text("Move Blocks. Change Rules. Win.", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    
    p.textSize(20);
    p.fill(255, 255, 0);
    if (p.frameCount % 60 < 30) {
        p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT * 0.7);
    }
}

function renderWinScreen(p) {
    p.fill(0, 0, 0, 100);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255, 255, 0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text("YOU WIN!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    
    p.fill(255, 255, 0); // Highlight score
    p.textSize(24);
    p.text(`Final Score: ${gameState.totalScore}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 10); // Display total score
    
    p.fill(255);
    p.textSize(16);
    p.text("Press ENTER for Next Level", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 50); // Adjusted Y
}

function renderPauseScreen(p) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(255);
    p.textSize(30);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
}