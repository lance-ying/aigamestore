// screens.js - Game screen rendering

import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, gameState } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 15, 25);
  
  // Title
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title glow
  p.fill(255, 150, 0, 100);
  p.textSize(48);
  p.text('HOLLOW DEPTHS', CANVAS_WIDTH/2 + 2, 80 + 2);
  
  // Title text
  p.fill(255, 255, 255);
  p.text('HOLLOW DEPTHS', CANVAS_WIDTH/2, 80);
  
  // Subtitle
  p.fill(200, 200, 220);
  p.textSize(16);
  p.text('A Corrupted Kingdom Awaits', CANVAS_WIDTH/2, 120);
  
  // Description
  p.fill(180, 180, 200);
  p.textSize(13);
  const desc = [
    'Explore a vast underground kingdom',
    'Battle infected creatures and corrupted bosses',
    'Unlock powerful abilities to reach the depths',
    'Discover the source of the corruption'
  ];
  for (let i = 0; i < desc.length; i++) {
    p.text(desc[i], CANVAS_WIDTH/2, 160 + i * 22);
  }
  
  // Controls
  p.fill(150, 200, 255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.CENTER);
  const controls = [
    'Arrow Keys - Move and Look',
    'Space - Attack with Nail',
    'Shift - Dash (unlockable)',
    'Z - Cast Spell (unlockable)'
  ];
  for (let i = 0; i < controls.length; i++) {
    p.text(controls[i], 100, 270 + i * 20);
  }
  
  // Start prompt
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  p.fill(255, 255, 255, 200 + Math.sin(p.frameCount * 0.1) * 55);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH/2, 360);
  
  p.pop();
}

export function renderGameOverScreen(p) {
  p.push();
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 180);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.textAlign(p.CENTER, p.CENTER);
  
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    // Victory
    p.fill(100, 255, 100);
    p.textSize(48);
    p.text('CORRUPTION CLEANSED', CANVAS_WIDTH/2, 120);
    
    p.fill(200, 255, 200);
    p.textSize(20);
    p.text('You have saved the kingdom!', CANVAS_WIDTH/2, 180);
  } else {
    // Defeat
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text('VESSEL BROKEN', CANVAS_WIDTH/2, 120);
    
    p.fill(255, 200, 200);
    p.textSize(20);
    p.text('The corruption spreads...', CANVAS_WIDTH/2, 180);
  }
  
  // Final score
  p.fill(255, 255, 255);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, 240);
  
  // Stats
  p.textSize(16);
  p.fill(200, 200, 220);
  p.text(`Bosses Defeated: ${gameState.defeatedBosses.length}`, CANVAS_WIDTH/2, 280);
  
  // Restart prompt
  p.textSize(18);
  p.fill(255, 255, 255, 200 + Math.sin(p.frameCount * 0.1) * 55);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH/2, 340);
  
  p.pop();
}

export function renderPausedIndicator(p) {
  p.push();
  p.fill(255, 255, 255);
  p.textSize(16);
  p.textAlign(p.RIGHT, p.TOP);
  p.text('PAUSED', CANVAS_WIDTH - 10, 10);
  p.pop();
}