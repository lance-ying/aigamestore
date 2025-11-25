// designer.js - Designer mode UI and logic

import { gameState, DESIGNER_OPTIONS, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { renderCrosshairPreview } from './crosshair.js';

export function updateDesigner(p) {
  // Designer doesn't need per-frame updates
}

export function renderDesigner(p) {
  // Background
  p.background(30, 35, 45);
  
  // Title
  p.fill(255);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(24);
  p.text("CROSSHAIR DESIGNER", CANVAS_WIDTH / 2, 20);
  
  // Instructions
  p.textSize(12);
  p.fill(180);
  p.text("Arrow Keys: Navigate | Space: Adjust | Shift: Fine-tune | Z: Test Mode", CANVAS_WIDTH / 2, 50);
  
  // Crosshair preview
  const previewX = CANVAS_WIDTH * 0.7;
  const previewY = CANVAS_HEIGHT / 2;
  
  // Preview background
  p.fill(45, 50, 60);
  p.noStroke();
  p.rect(previewX - 100, previewY - 100, 200, 200);
  
  // Grid
  p.stroke(60, 65, 75);
  p.strokeWeight(1);
  for (let i = -100; i <= 100; i += 20) {
    p.line(previewX - 100, previewY + i, previewX + 100, previewY + i);
    p.line(previewX + i, previewY - 100, previewX + i, previewY + 100);
  }
  
  // Center indicator
  p.stroke(100, 100, 120);
  p.strokeWeight(1);
  p.line(previewX - 10, previewY, previewX + 10, previewY);
  p.line(previewX, previewY - 10, previewX, previewY + 10);
  
  // Render crosshair
  renderCrosshairPreview(p, previewX, previewY, 2);
  
  p.fill(200);
  p.textSize(10);
  p.text("PREVIEW", previewX, previewY + 110);
  
  // Options list
  const listX = 30;
  const listStartY = 90;
  const lineHeight = 22;
  
  p.textAlign(p.LEFT, p.CENTER);
  
  DESIGNER_OPTIONS.forEach((option, index) => {
    const y = listStartY + index * lineHeight;
    const value = gameState.crosshairDesign[option.id];
    const isSelected = index === gameState.selectedOptionIndex;
    
    // Background for selected
    if (isSelected) {
      p.fill(60, 120, 200, 100);
      p.noStroke();
      p.rect(listX - 5, y - 10, 300, 20, 4);
    }
    
    // Option name
    p.fill(isSelected ? 255 : 180);
    p.textSize(13);
    p.text(option.name, listX, y);
    
    // Value bar
    const barX = listX + 130;
    const barWidth = 100;
    const barHeight = 8;
    const percentage = (value - option.min) / (option.max - option.min);
    
    // Bar background
    p.fill(50, 55, 65);
    p.noStroke();
    p.rect(barX, y - barHeight / 2, barWidth, barHeight, 2);
    
    // Bar fill
    p.fill(80, 180, 255);
    p.rect(barX, y - barHeight / 2, barWidth * percentage, barHeight, 2);
    
    // Value text
    p.fill(isSelected ? 255 : 200);
    p.textSize(12);
    p.textAlign(p.RIGHT, p.CENTER);
    p.text(Math.round(value), barX + barWidth + 40, y);
  });
  
  p.textAlign(p.LEFT, p.TOP);
}

export function handleDesignerInput(keyCode, p) {
  const option = DESIGNER_OPTIONS[gameState.selectedOptionIndex];
  const step = p.keyIsDown(16) ? 1 : 5; // Shift for fine control
  
  if (keyCode === 38) { // Up arrow
    gameState.selectedOptionIndex = (gameState.selectedOptionIndex - 1 + DESIGNER_OPTIONS.length) % DESIGNER_OPTIONS.length;
  } else if (keyCode === 40) { // Down arrow
    gameState.selectedOptionIndex = (gameState.selectedOptionIndex + 1) % DESIGNER_OPTIONS.length;
  } else if (keyCode === 37) { // Left arrow
    gameState.crosshairDesign[option.id] = Math.max(
      option.min,
      gameState.crosshairDesign[option.id] - step
    );
  } else if (keyCode === 39) { // Right arrow
    gameState.crosshairDesign[option.id] = Math.min(
      option.max,
      gameState.crosshairDesign[option.id] + step
    );
  } else if (keyCode === 32) { // Space - reset to default
    gameState.crosshairDesign[option.id] = option.default;
  }
}