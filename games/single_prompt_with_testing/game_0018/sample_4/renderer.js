import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

export function setupRenderer() {
  const gameContainer = document.createElement('div');
  gameContainer.id = 'game-container';
  gameContainer.style.width = '600px';
  gameContainer.style.height = '400px';
  gameContainer.style.position = 'relative';
  gameContainer.style.overflow = 'hidden';
  gameContainer.style.margin = '0';
  gameContainer.style.padding = '0';
  gameContainer.style.border = 'none';
  document.body.appendChild(gameContainer);
  
  document.body.style.margin = '0';
  document.body.style.padding = '0';
  document.body.style.overflow = 'hidden';
  
  const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: false,
    powerPreference: "high-performance"
  });
  
  renderer.setSize(600, 400);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  
  gameContainer.appendChild(renderer.domElement);
  
  gameState.renderer = renderer;
  gameState.gameContainer = gameContainer;
}