// levels.js - Level management and goals

import { gameState, CANVAS_HEIGHT } from './globals.js';
import { createLevelTerrain } from './terrain.js';
import { OldMan } from './oldman.js';

export function initializeLevel(p, levelIndex) {
  // Clear existing entities
  gameState.entities = [];
  gameState.terrainLayers = [];
  
  // Create terrain for this level
  gameState.terrainLayers = createLevelTerrain(p, levelIndex);
  gameState.selectedLayerIndex = 0;
  
  // Update selection
  updateLayerSelection();
  
  // Create old man at start
  let startX = 50;
  let startY = 250;
  
  // Find ground at start position
  for (let layer of gameState.terrainLayers) {
    const height = layer.getHeightAtX(startX);
    if (height !== null) {
      startY = height - 10;
      break;
    }
  }
  
  if (gameState.oldMan) {
    gameState.oldMan.reset(startX, startY);
  } else {
    gameState.oldMan = new OldMan(p, startX, startY);
  }
  
  // Set goal position
  gameState.goalPosition = {
    x: 550,
    y: 200
  };
  
  // Reset level state
  gameState.isMoving = false;
  gameState.levelComplete = false;
  gameState.cameraOffsetX = 0;
}

export function updateLayerSelection() {
  // Update which layer is selected
  gameState.terrainLayers.forEach((layer, index) => {
    layer.isSelected = (index === gameState.selectedLayerIndex && layer.canMove);
  });
}

export function selectNextLayer() {
  // Find next movable layer
  let attempts = 0;
  do {
    gameState.selectedLayerIndex = (gameState.selectedLayerIndex + 1) % gameState.terrainLayers.length;
    attempts++;
  } while (!gameState.terrainLayers[gameState.selectedLayerIndex].canMove && attempts < gameState.terrainLayers.length);
  
  updateLayerSelection();
}

export function selectPreviousLayer() {
  // Find previous movable layer
  let attempts = 0;
  do {
    gameState.selectedLayerIndex--;
    if (gameState.selectedLayerIndex < 0) {
      gameState.selectedLayerIndex = gameState.terrainLayers.length - 1;
    }
    attempts++;
  } while (!gameState.terrainLayers[gameState.selectedLayerIndex].canMove && attempts < gameState.terrainLayers.length);
  
  updateLayerSelection();
}

export function renderGoal(p, cameraX = 0) {
  // Draw goal marker
  p.push();
  p.translate(gameState.goalPosition.x - cameraX, gameState.goalPosition.y);
  
  // Animated glow
  const glowSize = 30 + Math.sin(p.frameCount * 0.1) * 5;
  p.noStroke();
  p.fill(255, 200, 100, 50);
  p.ellipse(0, 0, glowSize, glowSize);
  
  // Flag
  p.stroke(150, 100, 50);
  p.strokeWeight(3);
  p.line(0, 0, 0, -30);
  
  // Flag cloth
  const waveOffset = Math.sin(p.frameCount * 0.15) * 3;
  p.fill(200, 50, 50);
  p.noStroke();
  p.beginShape();
  p.vertex(0, -30);
  p.vertex(20 + waveOffset, -25);
  p.vertex(20 + waveOffset * 0.5, -15);
  p.vertex(0, -20);
  p.endShape(p.CLOSE);
  
  p.pop();
}