// renderer.js - WebGL renderer setup and configuration
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export function setupRenderer() {
    // Create container div to properly contain the game canvas
    const gameContainer = document.createElement('div');
    gameContainer.id = 'game-container';
    gameContainer.style.width = CANVAS_WIDTH + 'px';
    gameContainer.style.height = CANVAS_HEIGHT + 'px';
    gameContainer.style.position = 'relative';
    gameContainer.style.overflow = 'hidden';
    gameContainer.style.margin = '0';
    gameContainer.style.padding = '0';
    gameContainer.style.border = '2px solid #333';
    document.body.appendChild(gameContainer);
    
    // Create WebGL renderer
    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance"
    });
    
    renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Append canvas to container
    gameContainer.appendChild(renderer.domElement);
    
    gameState.renderer = renderer;
    gameState.gameContainer = gameContainer;
    
    return renderer;
}