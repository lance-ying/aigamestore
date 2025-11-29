/**
 * Renderer setup and configuration
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

/**
 * Setup WebGL renderer
 */
export function setupRenderer() {
  // Create container for the game
  const gameContainer = document.createElement('div');
  gameContainer.id = 'game-container';
  gameContainer.style.width = `${CANVAS_WIDTH}px`;
  gameContainer.style.height = `${CANVAS_HEIGHT}px`;
  gameContainer.style.position = 'relative';
  gameContainer.style.overflow = 'hidden';
  gameContainer.style.margin = '0';
  gameContainer.style.padding = '0';
  gameContainer.style.border = 'none';
  document.body.appendChild(gameContainer);
  
  // Create WebGL renderer
  gameState.renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: false,
    powerPreference: "high-performance"
  });
  
  gameState.renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
  gameState.renderer.shadowMap.enabled = true;
  gameState.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  gameState.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  
  // Append to container
  gameContainer.appendChild(gameState.renderer.domElement);
  gameState.gameContainer = gameContainer;
}