/**
 * User Interface rendering.
 */
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderUI(p) {
    if (gameState.gamePhase === 'PLAYING') {
        renderHUD(p);
    } else if (gameState.gamePhase === 'START') {
        renderStartScreen(p);
    } else if (gameState.gamePhase === 'PAUSED') {
        renderPaused(p);
    } else if (gameState.gamePhase.includes('GAME_OVER')) {
        renderGameOver(p);
    }
}

function renderHUD(p) {
    // Leaderboard / Status
    // Top Right
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    
    let yPos = 10;
    
    // Filter runners
    const runners = gameState.entities.filter(e => e.constructor.name === "Runner");
    // Sort by x position (descending)
    runners.sort((a, b) => b.x - a.x);
    
    runners.forEach((runner, index) => {
        p.fill(runner.eliminated ? 100 : runner.color);
        p.text(
            `${index + 1}. ${runner.isBot ? "CPU" : "YOU"} ${runner.eliminated ? "(OUT)" : ""}`, 
            CANVAS_WIDTH - 10, 
            yPos
        );
        yPos += 20;
    });
    
    // Distance / Laps
    p.textAlign(p.CENTER, p.TOP);
    p.fill(255);
    // p.text(`Distance: ${Math.floor(gameState.player.x)}`, CANVAS_WIDTH/2, 10);
}

function renderStartScreen(p) {
    p.background(0, 0, 0, 200);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    
    p.textSize(40);
    p.textStyle(p.BOLD);
    p.text("VELOCITY RIVALS", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
    
    p.textSize(18);
    p.textStyle(p.NORMAL);
    p.text("Run Fast. Use Hooks. Eliminate Opponents.", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    
    p.textSize(16);
    p.fill(200, 255, 200);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT * 0.7);
    
    p.fill(150);
    p.textSize(12);
    p.text("Arrows: Move | Z: Jump | Shift: Grapple", CANVAS_WIDTH/2, CANVAS_HEIGHT * 0.85);
}

function renderPaused(p) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(30);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
}

function renderGameOver(p) {
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    
    if (gameState.gamePhase === 'GAME_OVER_WIN') {
        p.fill(0, 255, 0);
        p.text("VICTORY!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    } else {
        p.fill(255, 0, 0);
        p.text("ELIMINATED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    }
    
    p.fill(255);
    p.textSize(20);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
}