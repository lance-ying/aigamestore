// ui.js - UI rendering on canvas overlay
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

let uiCanvas = null;
let uiContext = null;

export function setupUI() {
    // Create 2D canvas overlay for UI
    uiCanvas = document.createElement('canvas');
    uiCanvas.width = CANVAS_WIDTH;
    uiCanvas.height = CANVAS_HEIGHT;
    uiCanvas.style.position = 'absolute';
    uiCanvas.style.top = '0';
    uiCanvas.style.left = '0';
    uiCanvas.style.pointerEvents = 'none';
    uiCanvas.style.zIndex = '1000';
    uiCanvas.style.margin = '0';
    uiCanvas.style.padding = '0';
    
    // Append to game container
    if (gameState.gameContainer) {
        gameState.gameContainer.appendChild(uiCanvas);
    }
    
    uiContext = uiCanvas.getContext('2d');
}

export function renderUI() {
    if (!uiContext) return;
    
    // Clear canvas
    uiContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    switch (gameState.gamePhase) {
        case "START":
            renderStartScreen();
            break;
        case "PLAYING":
            renderHUD();
            renderCrosshair();
            break;
        case "PAUSED":
            renderHUD();
            renderPauseScreen();
            break;
        case "GAME_OVER_WIN":
            renderWinScreen();
            break;
        case "GAME_OVER_LOSE":
            renderLoseScreen();
            break;
    }
}

function renderStartScreen() {
    // Semi-transparent background
    uiContext.fillStyle = 'rgba(0, 0, 0, 0.8)';
    uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Title
    uiContext.fillStyle = '#00ccff';
    uiContext.font = 'bold 48px Arial';
    uiContext.textAlign = 'center';
    uiContext.fillText('PORTAL CHAMBERS', CANVAS_WIDTH / 2, 100);
    
    // Subtitle
    uiContext.fillStyle = '#ffffff';
    uiContext.font = '20px Arial';
    uiContext.fillText('A 3D Puzzle Adventure', CANVAS_WIDTH / 2, 140);
    
    // Description
    uiContext.font = '14px Arial';
    uiContext.fillStyle = '#cccccc';
    const desc = [
        'Navigate test chambers using your portal device.',
        'Fire blue and orange portals on white surfaces.',
        'Use momentum to solve puzzles and reach the exit!',
    ];
    desc.forEach((line, i) => {
        uiContext.fillText(line, CANVAS_WIDTH / 2, 180 + i * 20);
    });
    
    // Controls
    uiContext.fillStyle = '#ffaa00';
    uiContext.font = 'bold 16px Arial';
    uiContext.fillText('CONTROLS', CANVAS_WIDTH / 2, 260);
    
    uiContext.fillStyle = '#ffffff';
    uiContext.font = '14px Arial';
    const controls = [
        'WASD / Arrow Keys: Move',
        'Space: Jump',
        'Z / Mouse Click: Blue Portal',
        'X / Shift: Orange Portal',
        'ESC: Pause',
    ];
    controls.forEach((line, i) => {
        uiContext.fillText(line, CANVAS_WIDTH / 2, 285 + i * 18);
    });
    
    // Start prompt
    uiContext.fillStyle = '#00ff00';
    uiContext.font = 'bold 20px Arial';
    const flash = Math.sin(gameState.frameCount * 0.1) > 0;
    if (flash) {
        uiContext.fillText('PRESS ENTER TO START', CANVAS_WIDTH / 2, 380);
    }
}

function renderHUD() {
    // HUD background
    uiContext.fillStyle = 'rgba(0, 0, 0, 0.6)';
    uiContext.fillRect(10, 10, 220, 80);
    
    // Score
    uiContext.fillStyle = '#ffff00';
    uiContext.font = 'bold 18px Arial';
    uiContext.textAlign = 'left';
    uiContext.fillText(`Score: ${gameState.score}`, 20, 35);
    
    // Level
    uiContext.fillStyle = '#00ccff';
    uiContext.fillText(`Chamber: ${gameState.currentLevel}/${gameState.maxLevels}`, 20, 60);
    
    // Portal status
    const blueActive = gameState.bluePortal && gameState.bluePortal.active;
    const orangeActive = gameState.orangePortal && gameState.orangePortal.active;
    
    uiContext.fillStyle = blueActive ? '#00aaff' : '#444444';
    uiContext.fillText('Blue Portal', 20, 80);
    
    uiContext.fillStyle = orangeActive ? '#ff6600' : '#444444';
    uiContext.fillText('Orange Portal', 130, 80);
}

function renderCrosshair() {
    // Draw crosshair in center
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;
    const size = 10;
    
    uiContext.strokeStyle = '#00ff00';
    uiContext.lineWidth = 2;
    
    // Horizontal line
    uiContext.beginPath();
    uiContext.moveTo(centerX - size, centerY);
    uiContext.lineTo(centerX + size, centerY);
    uiContext.stroke();
    
    // Vertical line
    uiContext.beginPath();
    uiContext.moveTo(centerX, centerY - size);
    uiContext.lineTo(centerX, centerY + size);
    uiContext.stroke();
    
    // Center dot
    uiContext.fillStyle = '#00ff00';
    uiContext.beginPath();
    uiContext.arc(centerX, centerY, 2, 0, Math.PI * 2);
    uiContext.fill();
}

function renderPauseScreen() {
    // Semi-transparent overlay
    uiContext.fillStyle = 'rgba(0, 0, 0, 0.7)';
    uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Paused text
    uiContext.fillStyle = '#ffffff';
    uiContext.font = 'bold 48px Arial';
    uiContext.textAlign = 'center';
    uiContext.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    
    // Instructions
    uiContext.font = '20px Arial';
    uiContext.fillText('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
    uiContext.fillText('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
}

function renderWinScreen() {
    // Background
    uiContext.fillStyle = 'rgba(0, 100, 0, 0.8)';
    uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Win text
    uiContext.fillStyle = '#00ff00';
    uiContext.font = 'bold 56px Arial';
    uiContext.textAlign = 'center';
    uiContext.fillText('CHAMBER COMPLETE!', CANVAS_WIDTH / 2, 140);
    
    // Score
    uiContext.fillStyle = '#ffffff';
    uiContext.font = '24px Arial';
    uiContext.fillText(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 190);
    
    // Next level or complete
    if (gameState.currentLevel < gameState.maxLevels) {
        uiContext.fillStyle = '#ffff00';
        uiContext.font = '20px Arial';
        uiContext.fillText('Next Chamber Unlocked!', CANVAS_WIDTH / 2, 240);
        uiContext.fillText('Press ENTER to Continue', CANVAS_WIDTH / 2, 270);
    } else {
        uiContext.fillStyle = '#ffaa00';
        uiContext.font = 'bold 28px Arial';
        uiContext.fillText('ALL CHAMBERS COMPLETED!', CANVAS_WIDTH / 2, 240);
        uiContext.fillStyle = '#ffffff';
        uiContext.font = '18px Arial';
        uiContext.fillText('You have mastered the Portal Device!', CANVAS_WIDTH / 2, 275);
    }
    
    uiContext.fillStyle = '#cccccc';
    uiContext.font = '16px Arial';
    uiContext.fillText('Press R to Return to Main Menu', CANVAS_WIDTH / 2, 330);
}

function renderLoseScreen() {
    // Background
    uiContext.fillStyle = 'rgba(100, 0, 0, 0.8)';
    uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Lose text
    uiContext.fillStyle = '#ff0000';
    uiContext.font = 'bold 48px Arial';
    uiContext.textAlign = 'center';
    uiContext.fillText('TEST FAILED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
    
    // Score
    uiContext.fillStyle = '#ffffff';
    uiContext.font = '20px Arial';
    uiContext.fillText(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    
    // Restart prompt
    uiContext.fillText('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
}