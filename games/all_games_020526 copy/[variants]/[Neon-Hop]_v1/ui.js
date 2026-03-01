/**
 * UI Rendering using 2D Canvas overlay
 */
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, WIN_DISTANCE, getLeaderboard } from './globals.js';

let uiCanvas, ctx;

export function setupUI() {
    uiCanvas = document.createElement('canvas');
    uiCanvas.width = CANVAS_WIDTH;
    uiCanvas.height = CANVAS_HEIGHT;
    uiCanvas.style.position = 'absolute';
    uiCanvas.style.top = '0';
    uiCanvas.style.left = '0';
    uiCanvas.style.pointerEvents = 'none'; // Click-through
    uiCanvas.style.zIndex = '10';
    
    if (gameState.gameContainer) {
        gameState.gameContainer.appendChild(uiCanvas);
    } else {
        // Fallback
        document.body.appendChild(uiCanvas);
    }
    
    ctx = uiCanvas.getContext('2d');
}

export function renderUI() {
    if (!ctx) return;
    
    // Clear
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    const phase = gameState.gamePhase;
    
    // HUD (always show if playing or paused)
    if (phase === "PLAYING" || phase === "PAUSED") {
        drawHUD();
    }
    
    // Screens
    if (phase === "START") {
        drawStartScreen();
    } else if (phase === "GAME_OVER_WIN") {
        drawWinScreen();
    } else if (phase === "GAME_OVER_LOSE") {
        drawLoseScreen();
    }
    // Note: PAUSED phase intentionally renders no additional overlay or text per user feedback
}

function drawHUD() {
    ctx.fillStyle = "white";
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`Score: ${Math.floor(gameState.score)}`, 20, 30);
    ctx.fillText(`Level: ${gameState.level}`, 20, 55);
    
    ctx.textAlign = "right";
    const dist = gameState.player ? Math.floor(gameState.player.position.z) : 0;
    
    // Handle infinite distance display
    let distText = `Dist: ${dist}m`;
    if (WIN_DISTANCE !== Infinity) {
        distText += ` / ${WIN_DISTANCE}m`;
    }
    ctx.fillText(distText, CANVAS_WIDTH - 20, 30);
    
    // Combo bar
    if (gameState.combo > 1) {
        ctx.textAlign = "center";
        ctx.fillStyle = "#ff00ff";
        ctx.fillText(`${gameState.combo}x COMBO!`, CANVAS_WIDTH / 2, 60);
    }
}

function drawStartScreen() {
    drawOverlay();
    
    ctx.fillStyle = "#ffff00"; // Use the existing yellow color for the start message
    ctx.font = "bold 30px Arial"; // Slightly larger font for main message
    ctx.textAlign = "center";
    ctx.fillText("press enter to begin", CANVAS_WIDTH / 2, 100); // New main message position
    
    // Draw leaderboard with enhanced styling, adjusted position
    drawLeaderboardEnhanced(150); 
}

function drawWinScreen() {
    drawOverlay();
    ctx.fillStyle = "#00ff00";
    ctx.font = "bold 40px Arial";
    ctx.textAlign = "center";
    ctx.fillText("VICTORY!", CANVAS_WIDTH / 2, 80);
    
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText(`Final Score: ${Math.floor(gameState.score)}`, CANVAS_WIDTH / 2, 130);
    
    ctx.fillStyle = "#ffff00";
    ctx.font = "16px Arial";
    ctx.fillText("Press R to Restart", CANVAS_WIDTH / 2, 165);
    
    // Draw leaderboard with enhanced styling
    drawLeaderboardEnhanced(190);
}

function drawLoseScreen() {
    drawOverlay();
    ctx.fillStyle = "#ff0000";
    ctx.font = "bold 40px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", CANVAS_WIDTH / 2, 70);
    
    ctx.fillStyle = "white";
    ctx.font = "18px Arial";
    ctx.fillText(`Score: ${Math.floor(gameState.score)}`, CANVAS_WIDTH / 2, 110);
    ctx.fillText(`Level Reached: ${gameState.level}`, CANVAS_WIDTH / 2, 135);
    
    ctx.fillStyle = "#ffff00";
    ctx.font = "14px Arial";
    ctx.fillText("Press R to Restart", CANVAS_WIDTH / 2, 165);
    
    // Draw leaderboard with enhanced styling
    drawLeaderboardEnhanced(190);
}

function drawLeaderboardEnhanced(startY) {
    const leaderboard = getLeaderboard();
    
    // Always draw the leaderboard frame, even if empty
    const boxWidth = 360;
    const boxHeight = 180;
    const boxX = (CANVAS_WIDTH - boxWidth) / 2;
    const boxY = startY;
    
    // Draw background box with border
    ctx.fillStyle = "rgba(0, 20, 40, 0.85)";
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    
    // Draw border with neon glow effect
    ctx.strokeStyle = "#00ffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
    
    // Inner glow
    ctx.strokeStyle = "rgba(0, 255, 255, 0.3)";
    ctx.lineWidth = 4;
    ctx.strokeRect(boxX + 2, boxY + 2, boxWidth - 4, boxHeight - 4);
    
    // Title
    ctx.fillStyle = "#00ffff";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.fillText("═══ HIGH SCORES ═══", CANVAS_WIDTH / 2, startY + 25);
    
    if (leaderboard.length === 0) {
        ctx.fillStyle = "#888";
        ctx.font = "14px Arial";
        ctx.fillText("No scores yet!", CANVAS_WIDTH / 2, startY + 60);
        ctx.fillText("Be the first to set a record!", CANVAS_WIDTH / 2, startY + 85);
        return;
    }
    
    // Column headers
    ctx.fillStyle = "#aaa";
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "left";
    ctx.fillText("RANK", boxX + 20, startY + 50);
    ctx.textAlign = "center";
    ctx.fillText("SCORE", CANVAS_WIDTH / 2 - 40, startY + 50);
    ctx.fillText("LEVEL", CANVAS_WIDTH / 2 + 40, startY + 50);
    ctx.textAlign = "right";
    ctx.fillText("DISTANCE", boxX + boxWidth - 20, startY + 50);
    
    // Draw separator line
    ctx.strokeStyle = "rgba(0, 255, 255, 0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(boxX + 15, startY + 57);
    ctx.lineTo(boxX + boxWidth - 15, startY + 57);
    ctx.stroke();
    
    // Leaderboard entries
    const maxEntries = Math.min(7, leaderboard.length);
    for (let i = 0; i < maxEntries; i++) {
        const entry = leaderboard[i];
        const y = startY + 75 + (i * 18);
        
        // Highlight top 3 with different colors
        let entryColor = "white";
        if (i === 0) entryColor = "#ffd700"; // Gold
        else if (i === 1) entryColor = "#c0c0c0"; // Silver
        else if (i === 2) entryColor = "#cd7f32"; // Bronze
        
        ctx.fillStyle = entryColor;
        ctx.font = "12px monospace";
        
        // Rank
        ctx.textAlign = "left";
        const rankText = `#${i + 1}`;
        ctx.fillText(rankText, boxX + 20, y);
        
        // Score
        ctx.textAlign = "center";
        ctx.fillText(entry.score.toString(), CANVAS_WIDTH / 2 - 40, y);
        
        // Level
        ctx.fillText(`Lv.${entry.level}`, CANVAS_WIDTH / 2 + 40, y);
        
        // Distance
        ctx.textAlign = "right";
        ctx.fillText(`${entry.distance}m`, boxX + boxWidth - 20, y);
    }
}

function drawLeaderboard(startY) {
    // Legacy function kept for compatibility, calls enhanced version
    drawLeaderboardEnhanced(startY);
}

function drawOverlay() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}