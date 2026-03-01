import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function setupRenderer() {
    // Container logic
    let container = document.getElementById('game-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'game-container';
        container.style.width = `${CANVAS_WIDTH}px`;
        container.style.height = `${CANVAS_HEIGHT}px`;
        container.style.position = 'relative';
        container.style.overflow = 'hidden';
        document.body.appendChild(container);
    }
    gameState.gameContainer = container;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        powerPreference: "high-performance"
    });
    renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    
    container.appendChild(renderer.domElement);
    gameState.renderer = renderer;

    // Scene
    gameState.scene = new THREE.Scene();
    gameState.scene.background = new THREE.Color(0x111111);
    gameState.scene.fog = new THREE.FogExp2(0x111111, 0.015);
}