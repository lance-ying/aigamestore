import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLOR_SKY } from './globals.js';

export function setupRenderer() {
    // Container
    const container = document.createElement('div');
    container.id = 'game-container';
    container.style.width = `${CANVAS_WIDTH}px`;
    container.style.height = `${CANVAS_HEIGHT}px`;
    container.style.position = 'relative';
    container.style.overflow = 'hidden';
    container.style.margin = '0 auto';
    document.body.appendChild(container);
    gameState.gameContainer = container;

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        powerPreference: "high-performance"
    });
    renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Tone mapping
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    
    container.appendChild(renderer.domElement);
    gameState.renderer = renderer;
    
    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(COLOR_SKY);
    scene.fog = new THREE.FogExp2(COLOR_SKY, gameState.fogDensity);
    gameState.scene = scene;
}

export function handleWindowResize() {
    // Fixed size canvas for this specific challenge, but usually handle resize here
    // Leaving empty as hard constraints say 600x400
}