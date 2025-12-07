import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

let uiCanvas, uiContext;

export function setupUI() {
    uiCanvas = document.createElement('canvas');
    uiCanvas.width = CANVAS_WIDTH;
    uiCanvas.height = CANVAS_HEIGHT;
    uiCanvas.style.position = 'absolute';
    uiCanvas.style.top = '0';
    uiCanvas.style.left = '0';
    uiCanvas.style.pointerEvents = 'none';
    uiCanvas.style.zIndex = '10';
    
    if (gameState.gameContainer) {
        gameState.gameContainer.appendChild(uiCanvas);
    }
    
    uiContext = uiCanvas.getContext('2d');
}

export function renderUI() {
    if (!uiContext) return;
    
    // Clear
    uiContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // 1. Draw Floating Texts (World to Screen)
    renderFloatingTexts();
    
    // 2. Game Phase UI
    switch (gameState.gamePhase) {
        case "START":
            drawStartScreen();
            break;
        case "PLAYING":
            drawHUD();
            break;
        case "PAUSED":
            drawHUD(); // Show HUD in background
            drawPauseScreen();
            break;
        case "GAME_OVER_WIN":
        case "GAME_OVER_LOSE":
            drawGameOverScreen();
            break;
    }
}

function renderFloatingTexts() {
    uiContext.save();
    uiContext.textAlign = 'center';
    uiContext.font = 'bold 16px Arial';
    
    for (const ft of gameState.floatingTexts) {
        ft.update(); // Update Logic mixed here for simplicity or call in game loop
        
        // Project to screen
        const screenPos = ft.position.clone().project(gameState.camera);
        const x = (screenPos.x * 0.5 + 0.5) * CANVAS_WIDTH;
        const y = (-(screenPos.y * 0.5) + 0.5) * CANVAS_HEIGHT;
        
        // Don't draw if behind camera
        if (screenPos.z < 1) {
            uiContext.globalAlpha = Math.max(0, ft.life);
            
            // Text Shadow
            uiContext.fillStyle = 'rgba(0,0,0,0.5)';
            uiContext.fillText(ft.text, x + 2, y + 2);
            
            // Text Main
            uiContext.fillStyle = '#00ffcc';
            if (ft.text.includes("+")) uiContext.fillStyle = '#ffff00';
            uiContext.fillText(ft.text, x, y);
        }
    }
    uiContext.restore();
}

function drawHUD() {
    uiContext.save();
    
    // Score
    uiContext.fillStyle = 'white';
    uiContext.font = 'bold 24px Arial';
    uiContext.textAlign = 'left';
    uiContext.fillText(`Score: ${Math.floor(gameState.score)}`, 20, 40);
    
    // Combo
    if (gameState.combo > 1) {
        uiContext.fillStyle = '#ff0055';
        uiContext.font = 'bold 20px Arial';
        uiContext.fillText(`Combo x${gameState.combo}`, 20, 70);
    }
    
    // Mode indicator
    if (gameState.controlMode !== "HUMAN") {
        uiContext.fillStyle = 'yellow';
        uiContext.font = '12px monospace';
        uiContext.textAlign = 'right';
        uiContext.fillText(`MODE: ${gameState.controlMode}`, CANVAS_WIDTH - 10, 20);
    }
    
    uiContext.restore();
}

function drawStartScreen() {
    drawOverlay();
    
    uiContext.fillStyle = '#00ffcc';
    uiContext.font = 'bold 48px Arial';
    uiContext.textAlign = 'center';
    uiContext.shadowColor = '#ff0055';
    uiContext.shadowBlur = 10;
    uiContext.fillText('HOP 3D', CANVAS_WIDTH / 2, 150);
    
    uiContext.shadowBlur = 0;
    uiContext.fillStyle = 'white';
    uiContext.font = '18px Arial';
    uiContext.fillText('Bounce on tiles. Don\'t fall.', CANVAS_WIDTH / 2, 200);
    uiContext.fillText('Use Arrow Keys / A & D to Move', CANVAS_WIDTH / 2, 230);
    
    // Blink effect
    const alpha = (Math.sin(Date.now() / 300) + 1) / 2;
    uiContext.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    uiContext.font = 'bold 24px Arial';
    uiContext.fillText('PRESS ENTER TO START', CANVAS_WIDTH / 2, 300);
}

function drawPauseScreen() {
    drawOverlay();
    uiContext.fillStyle = 'white';
    uiContext.font = 'bold 32px Arial';
    uiContext.textAlign = 'center';
    uiContext.fillText('PAUSED', CANVAS_WIDTH / 2, 200);
    uiContext.font = '16px Arial';
    uiContext.fillText('Press ESC to Resume', CANVAS_WIDTH / 2, 240);
}

function drawGameOverScreen() {
    drawOverlay(0.85);
    
    const isWin = gameState.gamePhase === "GAME_OVER_WIN";
    uiContext.fillStyle = isWin ? '#00ff00' : '#ff0055';
    uiContext.font = 'bold 40px Arial';
    uiContext.textAlign = 'center';
    uiContext.fillText(isWin ? 'YOU WIN!' : 'GAME OVER', CANVAS_WIDTH / 2, 150);
    
    uiContext.fillStyle = 'white';
    uiContext.font = '24px Arial';
    uiContext.fillText(`Final Score: ${Math.floor(gameState.score)}`, CANVAS_WIDTH / 2, 210);
    
    uiContext.font = '16px Arial';
    uiContext.fillText('Press R to Restart', CANVAS_WIDTH / 2, 280);
}

function drawOverlay(alpha = 0.7) {
    uiContext.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}