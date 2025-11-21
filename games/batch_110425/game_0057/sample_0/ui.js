// ui.js - UI rendering functions

import { gameState, OBJECT_TYPES, AI_BEHAVIORS, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 30, 50);
  
  // Title
  p.fill(255, 200, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("FUN WITH RAGDOLLS", CANVAS_WIDTH / 2, 100);
  
  // Description
  p.fill(200, 220, 255);
  p.textSize(14);
  p.text("A Physics-Based Sandbox", CANVAS_WIDTH / 2, 160);
  p.textSize(12);
  p.text("Create chaos with ragdolls and interactive objects!", CANVAS_WIDTH / 2, 185);
  
  // Instructions
  p.fill(150, 200, 255);
  p.textSize(11);
  p.textAlign(p.LEFT);
  const startX = 80;
  let y = 230;
  p.text("• Arrow Keys: Navigate menu & adjust properties", startX, y);
  y += 20;
  p.text("• SPACE: Place object or spawn ragdoll", startX, y);
  y += 20;
  p.text("• 1-5: Quick select (Ragdoll, Cannon, Mine, Fan, Wall)", startX, y);
  y += 20;
  p.text("• D: Toggle delete mode  |  Z: Clear all", startX, y);
  y += 20;
  p.text("• ESC: Pause  |  R: Restart", startX, y);
  
  // Start prompt
  p.fill(100, 255, 100);
  p.textAlign(p.CENTER);
  p.textSize(18);
  const alpha = 128 + 127 * Math.sin(p.frameCount * 0.1);
  p.fill(100, 255, 100, alpha);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
}

export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  p.textSize(16);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
}

export function renderGameOver(p) {
  p.background(20, 30, 50);
  
  p.fill(255, 200, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("SESSION COMPLETE", CANVAS_WIDTH / 2, 150);
  
  p.fill(200, 220, 255);
  p.textSize(24);
  p.text(`Objects Placed: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  p.text(`Ragdolls Spawned: ${gameState.ragdollCount}`, CANVAS_WIDTH / 2, 260);
  
  p.fill(100, 255, 100);
  p.textSize(18);
  p.text("Press R to restart", CANVAS_WIDTH / 2, 340);
}

export function renderUI(p) {
  // Background for UI
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 80);
  
  // Object count
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text(`Objects: ${gameState.objectCount}`, 10, 10);
  p.text(`Ragdolls: ${gameState.ragdollCount}`, 10, 25);
  
  // Current selection
  p.textSize(14);
  p.fill(100, 255, 100);
  let objectName = gameState.selectedObjectType.toUpperCase();
  if (gameState.deleteMode) {
    objectName = "DELETE MODE";
    p.fill(255, 100, 100);
  }
  p.text(`Selected: ${objectName}`, 10, 45);
  
  // Properties display
  p.fill(200, 220, 255);
  p.textSize(10);
  let propY = 65;
  
  switch (gameState.selectedObjectType) {
    case OBJECT_TYPES.RAGDOLL:
      p.text(`Scale: ${gameState.ragdollScale.toFixed(1)}x`, 10, propY);
      p.text(`AI: ${gameState.ragdollBehavior}`, 120, propY);
      break;
    case OBJECT_TYPES.CANNON:
      p.text(`Force: ${gameState.cannonForce.toFixed(1)}x`, 10, propY);
      break;
    case OBJECT_TYPES.MINE:
      p.text(`Radius: ${gameState.mineRadius.toFixed(1)}x`, 10, propY);
      break;
    case OBJECT_TYPES.FAN:
      p.text(`Strength: ${gameState.fanStrength.toFixed(1)}x`, 10, propY);
      break;
    case OBJECT_TYPES.WALL:
      p.text(`Length: ${gameState.wallLength.toFixed(1)}x`, 10, propY);
      break;
  }
  
  // Cursor preview
  if (!gameState.deleteMode) {
    p.push();
    p.translate(gameState.cursorX, gameState.cursorY);
    p.stroke(100, 255, 100, 150);
    p.strokeWeight(2);
    p.noFill();
    
    switch (gameState.selectedObjectType) {
      case OBJECT_TYPES.RAGDOLL:
        p.circle(0, 0, 30 * gameState.ragdollScale);
        break;
      case OBJECT_TYPES.CANNON:
        p.rect(-25, -12.5, 50, 25);
        break;
      case OBJECT_TYPES.MINE:
        p.circle(0, 0, 30);
        break;
      case OBJECT_TYPES.FAN:
        p.rect(-20, -20, 40, 40);
        break;
      case OBJECT_TYPES.WALL:
        p.rect(-50 * gameState.wallLength, -10, 100 * gameState.wallLength, 20);
        break;
    }
    p.pop();
  } else {
    // Delete cursor
    p.push();
    p.translate(gameState.cursorX, gameState.cursorY);
    p.stroke(255, 100, 100);
    p.strokeWeight(3);
    p.line(-15, -15, 15, 15);
    p.line(-15, 15, 15, -15);
    p.pop();
  }
  
  // Instructions
  p.fill(150, 150, 150);
  p.textSize(9);
  p.textAlign(p.RIGHT, p.TOP);
  p.text("Arrows: Move/Adjust | Space: Place | 1-5: Quick Select | D: Delete | Z: Clear", CANVAS_WIDTH - 10, 10);
}