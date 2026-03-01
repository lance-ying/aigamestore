import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function setupRenderer() {
    // Create container
    const container = document.createElement('div');
    container.id = 'game-container';
    container.style.width = `${CANVAS_WIDTH}px`;
    container.style.height = `${CANVAS_HEIGHT}px`;
    container.style.position = 'relative';
    container.style.overflow = 'hidden';
    document.body.appendChild(container);
    gameState.gameContainer = container;

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    gameState.renderer = renderer;
    
    // UI Canvas
    const uiCanvas = document.createElement('canvas');
    uiCanvas.width = CANVAS_WIDTH;
    uiCanvas.height = CANVAS_HEIGHT;
    uiCanvas.style.position = 'absolute';
    uiCanvas.style.top = '0';
    uiCanvas.style.left = '0';
    uiCanvas.style.pointerEvents = 'none';
    uiCanvas.style.zIndex = '100';
    container.appendChild(uiCanvas);
    gameState.uiCanvas = uiCanvas;
    gameState.uiContext = uiCanvas.getContext('2d');
}

export function renderUI() {
    const ctx = gameState.uiContext;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    if (gameState.gamePhase === "PLAYING") {
        ctx.fillText(`Score: ${gameState.score}`, 20, 20);
        // ctx.fillText(`Speed: ${gameState.speed.toFixed(1)}`, 20, 50);
        
        // Draw controls hint
        ctx.font = '14px Arial';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.textAlign = 'center';
        ctx.fillText("UP/DOWN: Switch Shape | LEFT/RIGHT: Scale | SPACE: Jump", CANVAS_WIDTH/2, 370);
    } else if (gameState.gamePhase === "START") {
        // Changed title to "press enter to begin" and removed redundant subtitle
        drawOverlay(ctx, "press enter to begin", "", "UP/DOWN: Switch Shape | LEFT/RIGHT: Scale | SPACE: Jump");
    } else if (gameState.gamePhase === "PAUSED") {
        drawOverlay(ctx, "PAUSED", "Press ESC to Resume");
    } else if (gameState.gamePhase === "GAME_OVER_LOSE") {
        drawOverlay(ctx, "CRASHED!", "Press R to Restart", `Final Score: ${gameState.score}`, '#ff4444');
    }
}

function drawOverlay(ctx, title, subtitle, subtitle2 = "", color = 'white') {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.fillStyle = color;
    ctx.font = 'bold 40px Arial';
    ctx.fillText(title, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(subtitle, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    
    if (subtitle2) {
        ctx.font = '16px Arial';
        ctx.fillStyle = '#cccccc';
        ctx.fillText(subtitle2, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
    }
}