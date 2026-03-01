import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

let uiContext = null;

export function initUI() {
    const uiCanvas = document.createElement('canvas');
    uiCanvas.width = CANVAS_WIDTH;
    uiCanvas.height = CANVAS_HEIGHT;
    uiCanvas.style.position = 'absolute';
    uiCanvas.style.top = '0';
    uiCanvas.style.left = '0';
    uiCanvas.style.pointerEvents = 'none';
    
    if (gameState.gameContainer) {
        gameState.gameContainer.appendChild(uiCanvas);
        uiContext = uiCanvas.getContext('2d');
    }
}

export function renderUI() {
    if (!uiContext) return;
    
    // Clear
    uiContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    const p = gameState.player;
    
    // NEW: Always display score if player exists, as requested
    if (p) {
        uiContext.fillStyle = "#FFD700"; // Gold color for score
        uiContext.font = "bold 20px Arial";
        uiContext.textAlign = "left";
        uiContext.fillText(`SCORE: ${gameState.score}`, 20, 90); // Position it below coins
    }

    if (gameState.gamePhase === "PLAYING") {
        // HUD
        uiContext.fillStyle = "white";
        uiContext.font = "bold 20px Arial";
        
        // Lap
        uiContext.textAlign = "left";
        uiContext.fillText(`LAP ${p.lap} / ${gameState.lapsTotal}`, 20, 30);
        
        // Coins
        uiContext.fillStyle = "#FFD700";
        uiContext.fillText(`COINS: ${p.coins}`, 20, 60);
        
        // Position
        uiContext.fillStyle = "white";
        uiContext.textAlign = "right";
        uiContext.fillText(`POS ${p.rank} / 4`, CANVAS_WIDTH - 20, 30);
        
        // Speed
        uiContext.textAlign = "left";
        const speedKmh = Math.abs(Math.floor(p.speed * 3));
        uiContext.fillText(`${speedKmh} KM/H`, 20, CANVAS_HEIGHT - 20);
        
        // Item
        uiContext.strokeStyle = "white";
        uiContext.lineWidth = 2;
        uiContext.strokeRect(CANVAS_WIDTH/2 - 30, 20, 60, 60);
        if (p.item) {
            uiContext.textAlign = "center";
            uiContext.fillStyle = "#FFFF00";
            uiContext.fillText(p.item[0], CANVAS_WIDTH/2, 55); // Draw first letter
        }
        
    } else if (gameState.gamePhase === "START") {
        uiContext.fillStyle = "rgba(0,0,0,0.5)";
        uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        uiContext.fillStyle = "white";
        uiContext.textAlign = "center";
        uiContext.font = "bold 40px Arial";
        uiContext.fillText("press enter to begin", CANVAS_WIDTH/2, 150);
        
    } else if (gameState.gamePhase === "PAUSED") {
        uiContext.fillStyle = "rgba(0,0,0,0.5)";
        uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        uiContext.fillStyle = "white";
        uiContext.textAlign = "center";
        uiContext.font = "bold 30px Arial";
        uiContext.fillText("PAUSED", CANVAS_WIDTH/2, 200);
        
    } else if (gameState.gamePhase.startsWith("GAME_OVER")) {
        uiContext.fillStyle = "rgba(0,0,0,0.7)";
        uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        uiContext.fillStyle = gameState.gamePhase === "GAME_OVER_WIN" ? "#00FF00" : "#FF0000";
        uiContext.textAlign = "center";
        uiContext.font = "bold 40px Arial";
        const msg = gameState.gamePhase === "GAME_OVER_WIN" ? "YOU WON!" : "GAME OVER";
        uiContext.fillText(msg, CANVAS_WIDTH/2, 140);
        
        // Score Calculation - Removed local calculation, now using gameState.score
        // const rankBonus = (5 - p.rank) * 1000; 
        // const coinBonus = p.coins * 100;
        // const totalScore = rankBonus + coinBonus;
        
        uiContext.fillStyle = "white";
        uiContext.font = "bold 24px Arial";
        uiContext.fillText(`Rank: ${p.rank}/4  |  Coins: ${p.coins}`, CANVAS_WIDTH/2, 190);
        uiContext.fillStyle = "#FFD700";
        uiContext.fillText(`TOTAL SCORE: ${gameState.score}`, CANVAS_WIDTH/2, 230); // Use gameState.score
        
        uiContext.fillStyle = "white";
        uiContext.font = "20px Arial";
        uiContext.fillText("Press R to Restart", CANVAS_WIDTH/2, 280);
    }
}