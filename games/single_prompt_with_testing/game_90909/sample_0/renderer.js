import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function setupRenderer() {
    // Create Container
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
    container.appendChild(uiCanvas);
    gameState.uiContext = uiCanvas.getContext('2d');
}

export function setupLighting() {
    const scene = gameState.scene;
    
    const amb = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(amb);
    
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(20, 50, 20);
    dir.castShadow = true;
    dir.shadow.camera.left = -50;
    dir.shadow.camera.right = 50;
    dir.shadow.camera.top = 50;
    dir.shadow.camera.bottom = -50;
    scene.add(dir);
    
    // Fog
    scene.fog = new THREE.Fog(0x87CEEB, 10, 50);
    scene.background = new THREE.Color(0x87CEEB);
}

export function renderUI() {
    const ctx = gameState.uiContext;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Common Text Settings
    ctx.fillStyle = 'white';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 2;
    
    if (gameState.gamePhase === "START") {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0,0,CANVAS_WIDTH, CANVAS_HEIGHT);
        
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'white';
        ctx.fillText("TEMPLE ESCAPE 3D", CANVAS_WIDTH/2, 150);
        ctx.font = '16px Arial';
        ctx.fillText("Arrows to Move/Turn/Jump/Slide", CANVAS_WIDTH/2, 200);
        ctx.fillText("Press ENTER to Start", CANVAS_WIDTH/2, 250);
        
    } else if (gameState.gamePhase === "PLAYING") {
        // HUD
        ctx.font = '20px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${Math.floor(gameState.score)}`, 20, 30);
        ctx.fillText(`Coins: ${gameState.coins}`, 20, 60);
        
        // Speed indicator
        ctx.fillRect(20, 80, gameState.speed * 2, 10);
        
    } else if (gameState.gamePhase === "GAME_OVER_LOSE") {
        ctx.fillStyle = 'rgba(50,0,0,0.6)';
        ctx.fillRect(0,0,CANVAS_WIDTH, CANVAS_HEIGHT);
        
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'red';
        ctx.fillText("GAME OVER", CANVAS_WIDTH/2, 150);
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText(`Final Score: ${Math.floor(gameState.score)}`, CANVAS_WIDTH/2, 200);
        ctx.fillText("Press R to Restart", CANVAS_WIDTH/2, 250);
    }
}