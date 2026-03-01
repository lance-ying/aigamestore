import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CONFIG } from './globals.js';

export function setupRenderer() {
    // Scene
    gameState.scene = new THREE.Scene();
    gameState.scene.background = new THREE.Color(CONFIG.COLORS.BACKGROUND);
    gameState.scene.fog = new THREE.Fog(CONFIG.COLORS.BACKGROUND, 20, 60);
    
    // Camera
    gameState.camera = new THREE.PerspectiveCamera(
        60,
        CONFIG.CANVAS_WIDTH / CONFIG.CANVAS_HEIGHT,
        0.1,
        1000
    );
    
    // Renderer
    gameState.renderer = new THREE.WebGLRenderer({ antialias: true });
    gameState.renderer.setSize(CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    gameState.renderer.shadowMap.enabled = true;
    gameState.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // DOM
    gameState.gameContainer = document.getElementById('game-container');
    // Ensure container exists if not present in HTML (fallback)
    if (!gameState.gameContainer) {
        gameState.gameContainer = document.createElement('div');
        gameState.gameContainer.id = 'game-container';
        gameState.gameContainer.style.width = CONFIG.CANVAS_WIDTH + 'px';
        gameState.gameContainer.style.height = CONFIG.CANVAS_HEIGHT + 'px';
        gameState.gameContainer.style.position = 'relative';
        gameState.gameContainer.style.overflow = 'hidden';
        document.body.appendChild(gameState.gameContainer);
    }
    
    gameState.gameContainer.appendChild(gameState.renderer.domElement);
}

export function setupLighting() {
    // Ambient - Reduced intensity to increase contrast and volume perception
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    gameState.scene.add(ambientLight);
    
    // Directional (Sun)
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(20, 50, 20);
    sunLight.castShadow = true;
    
    // Shadow config
    sunLight.shadow.mapSize.width = CONFIG.SHADOW_MAP_SIZE;
    sunLight.shadow.mapSize.height = CONFIG.SHADOW_MAP_SIZE;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 100;
    sunLight.shadow.camera.left = -30;
    sunLight.shadow.camera.right = 30;
    sunLight.shadow.camera.top = 30;
    sunLight.shadow.camera.bottom = -30;
    
    gameState.scene.add(sunLight);
}