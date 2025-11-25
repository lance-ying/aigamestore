import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function setupRenderer() {
  gameState.renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: false,
    powerPreference: "high-performance"
  });
  
  gameState.renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
  gameState.renderer.shadowMap.enabled = true;
  gameState.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  
  document.body.appendChild(gameState.renderer.domElement);
}

export function render() {
  gameState.renderer.render(gameState.scene, gameState.camera);
}