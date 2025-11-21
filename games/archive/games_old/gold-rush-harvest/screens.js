// screens.js - Game state screens

import { gameState, GAME_PHASES } from './globals.js';

export function renderStartScreen(p) {
  p.background(40, 80, 60);
  
  // Title
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text('GOLD RUSH HARVEST', 300, 80);
  
  // Subtitle
  p.fill(255);
  p.textSize(16);
  p.text('Build Your Northern Farm Empire', 300, 120);
  
  // Instructions
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.fill(200, 200, 200);
  
  const instructions = [
    'ARROW KEYS - Navigate farm grid',
    'SPACE - Interact with selected object',
    '  • Plant crops on empty plots',
    '  • Harvest ready crops',
    '  • Collect from animals & buildings',
    'SHIFT (hold) - View object details',
    'Z - Open menus / Cancel action',
    'ESC - Pause game',
    '',
    'OBJECTIVE:',
    'Complete all 5 levels by fulfilling',
    'objectives and building your farm!',
  ];
  
  let yPos = 160;
  for (const line of instructions) {
    p.text(line, 100, yPos);
    yPos += 18;
  }
  
  // Start prompt
  p.fill(255, 255, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  const flash = Math.floor(p.frameCount / 30) % 2 === 0;
  if (flash) {
    p.text('PRESS ENTER TO START', 300, 370);
  }
}

export function renderGameOverScreen(p, won) {
  if (won) {
    p.background(40, 100, 40);
    p.fill(0, 255, 0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text('VICTORY!', 300, 120);
    
    p.fill(255);
    p.textSize(24);
    p.text('You achieved the Klondike Dream!', 300, 180);
  } else {
    p.background(80, 40, 40);
    p.fill(255, 0, 0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text('GAME OVER', 300, 120);
    
    p.fill(255);
    p.textSize(20);
    p.text('The expedition failed...', 300, 180);
  }
  
  // Final score
  p.fill(255, 215, 0);
  p.textSize(28);
  const scoreStr = String(gameState.score).padStart(6, '0');
  p.text(`FINAL SCORE: ${scoreStr}`, 300, 240);
  
  // Stats
  p.fill(200, 200, 200);
  p.textSize(16);
  p.text(`Level Reached: ${gameState.currentLevel}`, 300, 280);
  p.text(`Gold Earned: ${gameState.playerGold}G`, 300, 305);
  
  // Restart prompt
  p.fill(255, 255, 0);
  p.textSize(20);
  const flash = Math.floor(p.frameCount / 30) % 2 === 0;
  if (flash) {
    p.text('PRESS R TO RESTART', 300, 360);
  }
}