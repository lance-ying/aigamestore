// render.js - Main rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';
import { renderUI, renderGrid } from './ui.js';

export function renderGame(p) {
  // Clear background
  p.background(220, 210, 200);
  
  if (gameState.gamePhase === PHASE_START) {
    renderStartScreen(p);
  } else if (gameState.gamePhase === PHASE_PLAYING || gameState.gamePhase === PHASE_PAUSED) {
    renderPlayingScreen(p);
    if (gameState.gamePhase === PHASE_PAUSED) {
      renderPausedOverlay(p);
    }
  } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
    renderGameOverScreen(p);
  }
}

function renderStartScreen(p) {
  p.push();
  
  // Background gradient effect
  for (let i = 0; i < CANVAS_HEIGHT; i++) {
    const inter = p.map(i, 0, CANVAS_HEIGHT, 0, 1);
    const c = p.lerpColor(p.color(139, 90, 60), p.color(220, 180, 140), inter);
    p.stroke(c);
    p.line(0, i, CANVAS_WIDTH, i);
  }
  
  // Title
  p.fill(255, 240, 200);
  p.stroke(80, 50, 30);
  p.strokeWeight(4);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('喫茶ブレンド物語', CANVAS_WIDTH / 2, 80);
  
  p.textSize(28);
  p.text('Cafe Blend Story', CANVAS_WIDTH / 2, 130);
  
  // Description box
  p.noStroke();
  p.fill(255, 255, 255, 200);
  p.rect(50, 170, CANVAS_WIDTH - 100, 120, 10);
  
  p.fill(60, 40, 20);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(14);
  const desc = [
    'Build and manage your dream cafe!',
    'Create delicious recipes and serve customers',
    'Earn money to expand and upgrade your cafe',
    'Achieve a 5-star rating to win!'
  ];
  for (let i = 0; i < desc.length; i++) {
    p.text(desc[i], CANVAS_WIDTH / 2, 180 + i * 25);
  }
  
  // Controls
  p.fill(255, 220, 150);
  p.textSize(16);
  p.textAlign(p.LEFT, p.TOP);
  p.text('CONTROLS:', 70, 310);
  
  p.fill(220, 200, 170);
  p.textSize(12);
  const controls = [
    'Shift: Open Menu',
    'Space: Serve/Confirm',
    'Arrows: Navigate',
    'Z: Cancel/Back'
  ];
  for (let i = 0; i < controls.length; i++) {
    p.text(controls[i], 70 + (i % 2) * 200, 335 + Math.floor(i / 2) * 20);
  }
  
  // Start prompt
  p.fill(255, 255, 100);
  p.stroke(100, 80, 0);
  p.strokeWeight(2);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  
  // Blinking effect
  if (p.frameCount % 60 < 40) {
    p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 375);
  }
  
  p.pop();
}

function renderPlayingScreen(p) {
  // Cafe background
  p.fill(245, 235, 220);
  p.noStroke();
  p.rect(0, 30, 240, CANVAS_HEIGHT - 55);
  
  // Grid area
  renderGrid(p);
  
  // Render customers
  for (const customer of gameState.customers) {
    customer.render();
  }
  
  // UI overlay
  renderUI(p);
}

function renderPausedOverlay(p) {
  p.push();
  p.fill(255, 255, 255, 230);
  p.noStroke();
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text('PAUSED', CANVAS_WIDTH - 10, 35);
  p.pop();
}

function renderGameOverScreen(p) {
  p.push();
  
  // Background
  const bgColor = gameState.gamePhase === PHASE_GAME_OVER_WIN ? 
    [100, 180, 100] : [180, 100, 100];
  
  for (let i = 0; i < CANVAS_HEIGHT; i++) {
    const inter = p.map(i, 0, CANVAS_HEIGHT, 0, 1);
    const c = p.lerpColor(p.color(...bgColor), p.color(220, 210, 200), inter);
    p.stroke(c);
    p.line(0, i, CANVAS_WIDTH, i);
  }
  
  // Title
  if (gameState.gamePhase === PHASE_GAME_OVER_WIN) {
    p.fill(255, 255, 100);
    p.stroke(100, 100, 0);
    p.strokeWeight(4);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text('CONGRATULATIONS!', CANVAS_WIDTH / 2, 100);
    
    p.fill(255);
    p.textSize(24);
    p.text('5-Star Cafe Achieved!', CANVAS_WIDTH / 2, 150);
  } else {
    p.fill(255, 200, 200);
    p.stroke(100, 0, 0);
    p.strokeWeight(4);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text('GAME OVER', CANVAS_WIDTH / 2, 100);
  }
  
  // Stats
  p.noStroke();
  p.fill(255, 255, 255, 200);
  p.rect(100, 180, CANVAS_WIDTH - 200, 140, 10);
  
  p.fill(60, 40, 20);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(18);
  p.text('Final Statistics', CANVAS_WIDTH / 2, 195);
  
  p.textSize(14);
  const stats = [
    `Cafe Rating: ${gameState.cafeRating} / 5 ⭐`,
    `Total Revenue: $${gameState.totalRevenue}`,
    `Customers Served: ${gameState.totalCustomersServed}`,
    `Final Reputation: ${gameState.reputation}`
  ];
  for (let i = 0; i < stats.length; i++) {
    p.text(stats[i], CANVAS_WIDTH / 2, 230 + i * 25);
  }
  
  // Restart prompt
  p.fill(255, 255, 100);
  p.stroke(100, 80, 0);
  p.strokeWeight(2);
  p.textSize(20);
  
  if (p.frameCount % 60 < 40) {
    p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 360);
  }
  
  p.pop();
}