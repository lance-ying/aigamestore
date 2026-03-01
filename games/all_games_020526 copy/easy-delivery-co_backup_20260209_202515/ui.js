import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

let uiContext = null;

export function setupUI() {
    const uiCanvas = document.createElement('canvas');
    uiCanvas.width = CANVAS_WIDTH;
    uiCanvas.height = CANVAS_HEIGHT;
    uiCanvas.style.position = 'absolute';
    uiCanvas.style.top = '0';
    uiCanvas.style.left = '0';
    uiCanvas.style.pointerEvents = 'none';
    uiCanvas.style.zIndex = '100';
    
    gameState.gameContainer.appendChild(uiCanvas);
    uiContext = uiCanvas.getContext('2d');
}

export function renderUI() {
    if (!uiContext) return;
    
    // Clear
    uiContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    const phase = gameState.gamePhase;
    
    if (phase === "START") {
        renderStartScreen();
    } else if (phase === "PLAYING") {
        renderHUD();
        renderObjective();
        renderMysteryEffects();
    } else if (phase.startsWith("GAME_OVER")) {
        renderGameOver();
    }
}

function renderStartScreen() {
    drawOverlay('rgba(0,0,0,0.8)');
    
    uiContext.textAlign = 'center';
    
    // Replace game title with "press enter to begin"
    uiContext.fillStyle = '#ffcc00'; // Keep game's accent color
    uiContext.font = 'bold 30px Courier New'; // Make it prominent
    uiContext.fillText("press enter to begin", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20); // Centered
    
    // Keep controls section
    uiContext.fillStyle = '#aaa'; // Keep existing color for controls
    uiContext.font = '12px monospace'; // Keep existing font for controls
    uiContext.fillText("Arrows: Drive | WASD: Camera | Space: Interact", CANVAS_WIDTH/2, 330); // Keep original position
}

function renderHUD() {
    // Money/Score Top Left
    uiContext.textAlign = 'left';
    uiContext.font = 'bold 20px monospace';
    uiContext.fillStyle = '#00ff00';
    uiContext.fillText(`$${gameState.money.toFixed(2)}`, 20, 30);
    
    // Deliveries
    uiContext.fillStyle = '#fff';
    uiContext.font = '16px monospace';
    uiContext.fillText(`Deliveries: ${gameState.deliveriesCompleted}`, 20, 55);
    
    // Score Component
    uiContext.fillStyle = '#ffcc00';
    uiContext.fillText(`Score: ${gameState.score}`, 20, 80);
    
    // Fuel Bar Bottom Right
    const barW = 100;
    const barH = 10;
    uiContext.fillStyle = '#333';
    uiContext.fillRect(CANVAS_WIDTH - 120, CANVAS_HEIGHT - 30, barW, barH);
    
    uiContext.fillStyle = gameState.fuel > 20 ? '#ff9900' : '#ff0000';
    uiContext.fillRect(CANVAS_WIDTH - 120, CANVAS_HEIGHT - 30, barW * (gameState.fuel/100), barH);
    uiContext.fillText("FUEL", CANVAS_WIDTH - 120, CANVAS_HEIGHT - 35);
}

function renderObjective() {
    uiContext.textAlign = 'center';
    uiContext.font = '18px monospace';
    
    let text = "";
    if (gameState.hasPackage) {
        uiContext.fillStyle = '#00aaff';
        text = `DELIVER TO: ${gameState.currentObjective ? gameState.currentObjective.name : 'Unknown'}`;
    } else {
        uiContext.fillStyle = '#ffff00';
        text = "RETURN TO DEPOT FOR PICKUP";
    }
    
    uiContext.fillText(text, CANVAS_WIDTH/2, 40);
}

function renderGameOver() {
    drawOverlay('rgba(0,0,0,0.9)');
    uiContext.textAlign = 'center';
    
    if (gameState.gamePhase === "GAME_OVER_WIN") {
        uiContext.fillStyle = '#00ff00';
        uiContext.fillText("SHIFT COMPLETE", CANVAS_WIDTH/2, 150);
    } else {
        uiContext.fillStyle = '#ff0000';
        uiContext.fillText("OUT OF GAS", CANVAS_WIDTH/2, 150);
    }
    
    uiContext.fillStyle = '#fff';
    uiContext.font = '20px monospace';
    uiContext.fillText(`Total Earnings: $${gameState.money.toFixed(2)}`, CANVAS_WIDTH/2, 200);
    uiContext.fillText("PRESS R TO RESTART", CANVAS_WIDTH/2, 250);
}

function renderMysteryEffects() {
    // Glitch effect based on intensity
    if (gameState.worldState.glitchIntensity > 0) {
        if (Math.random() < gameState.worldState.glitchIntensity) {
            const h = Math.random() * 50;
            const y = Math.random() * CANVAS_HEIGHT;
            const offset = (Math.random() - 0.5) * 20;
            
            // Simple canvas copy/paste for glitch slice
            // Since we can't easily read back the 3D canvas efficiently here without composite,
            // we will just draw digital noise bars.
            uiContext.fillStyle = `rgba(${Math.random()*255}, 0, 0, 0.3)`;
            uiContext.fillRect(0, y, CANVAS_WIDTH, h);
            
            // Random text
            if (Math.random() < 0.1) {
                uiContext.fillStyle = '#000';
                uiContext.fillText("WAKE UP", Math.random()*CANVAS_WIDTH, Math.random()*CANVAS_HEIGHT);
            }
        }
    }
}

function drawOverlay(color) {
    uiContext.fillStyle = color;
    uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}