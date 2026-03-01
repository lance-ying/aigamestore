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
    
    if (gameState.gamePhase === "PLAYING") {
        // HUD
        uiContext.fillStyle = "white";
        uiContext.font = "bold 20px Arial";
        
        // Lap
        uiContext.fillText(`LAP ${p.lap} / ${gameState.lapsTotal}`, 20, 30);
        
        // Position
        // Simple rank calc based on distance/checkpoint
        // For now hardcoded or simple logic could be added
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
        uiContext.fillText("KART TOUR 3D", CANVAS_WIDTH/2, 150);
        
        uiContext.font = "20px Arial";
        uiContext.fillText("Press ENTER to Start", CANVAS_WIDTH/2, 220);
        
        uiContext.font = "14px Arial";
        uiContext.fillText("Controls: Arrow Keys to Drive | Space for Item | Shift to Drift", CANVAS_WIDTH/2, 260);
        
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
        uiContext.fillText(msg, CANVAS_WIDTH/2, 150);
        
        uiContext.fillStyle = "white";
        uiContext.font = "20px Arial";
        uiContext.fillText("Press R to Restart", CANVAS_WIDTH/2, 220);
    }
}