// ui.js - UI rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
  p.background(30, 30, 40);
  
  // Title
  p.fill(255, 80, 80);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text('RED WRECKER', CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(200);
  p.textSize(16);
  p.textStyle(p.NORMAL);
  p.text('Physics Puzzle Challenge', CANVAS_WIDTH / 2, 120);
  
  // Instructions
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    'OBJECTIVE:',
    '• Remove all RED shapes by clicking on them',
    '• Keep all GREEN shapes on the platform',
    '• Use physics to your advantage!',
    '',
    'CONTROLS:',
    '• CLICK on shapes to remove them',
    '• Limited clicks per level - choose wisely!',
    '',
    'TIPS:',
    '• Plan your moves carefully',
    '• Think about how shapes will fall',
    '• Some levels have gray support blocks'
  ];
  
  let y = 160;
  for (let line of instructions) {
    if (line.startsWith('•')) {
      p.fill(180, 220, 255);
    } else {
      p.fill(255, 255, 100);
    }
    p.text(line, 80, y);
    y += 20;
  }
  
  // Start prompt
  p.fill(100, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.textStyle(p.BOLD);
  const pulse = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(100 * pulse, 255 * pulse, 100 * pulse);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 370);
}

export function renderGameUI(p) {
  // Top bar background
  p.fill(20, 20, 30, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 40);
  
  // Level
  p.fill(255, 255, 100);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(16);
  p.textStyle(p.BOLD);
  p.text(`LEVEL ${gameState.currentLevel}`, 10, 20);
  
  // Clicks remaining
  p.fill(100, 200, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(`CLICKS: ${gameState.clicksRemaining}`, CANVAS_WIDTH / 2, 20);
  
  // Color legend
  p.textSize(12);
  p.textAlign(p.RIGHT, p.CENTER);
  p.fill(255, 100, 100);
  p.text('● REMOVE', CANVAS_WIDTH - 120, 20);
  p.fill(100, 255, 100);
  p.text('● KEEP', CANVAS_WIDTH - 30, 20);
}

export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  p.textSize(20);
  p.textStyle(p.NORMAL);
  p.text('Press ESC to continue', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

export function renderGameOver(p, won) {
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.textAlign(p.CENTER, p.CENTER);
  
  if (won) {
    // Win screen
    p.fill(100, 255, 100);
    p.textSize(48);
    p.textStyle(p.BOLD);
    p.text('LEVEL COMPLETE!', CANVAS_WIDTH / 2, 120);
    
    p.fill(255);
    p.textSize(24);
    p.textStyle(p.NORMAL);
    p.text(`Level ${gameState.currentLevel}`, CANVAS_WIDTH / 2, 170);
    
    p.textSize(18);
    p.text(`Clicks Used: ${gameState.maxClicks - gameState.clicksRemaining}`, CANVAS_WIDTH / 2, 210);
    
    if (gameState.currentLevel < gameState.maxLevel) {
      p.fill(100, 255, 100);
      p.textSize(20);
      const pulse = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
      p.fill(100 * pulse, 255 * pulse, 100 * pulse);
      p.text('PRESS SPACE FOR NEXT LEVEL', CANVAS_WIDTH / 2, 280);
    } else {
      p.fill(255, 255, 100);
      p.textSize(24);
      p.text('YOU COMPLETED ALL LEVELS!', CANVAS_WIDTH / 2, 280);
    }
    
    p.fill(200);
    p.textSize(16);
    p.text('Press R to restart', CANVAS_WIDTH / 2, 340);
  } else {
    // Lose screen
    p.fill(255, 100, 100);
    p.textSize(48);
    p.textStyle(p.BOLD);
    p.text('LEVEL FAILED', CANVAS_WIDTH / 2, 140);
    
    p.fill(255);
    p.textSize(20);
    p.textStyle(p.NORMAL);
    
    // Determine failure reason
    let reason = '';
    if (gameState.clicksRemaining <= 0) {
      reason = 'Out of clicks!';
    } else {
      let greenOffPlatform = false;
      for (let entity of gameState.entities) {
        if (!entity.removed && entity.type === 'green') {
          if (!entity.isOnPlatform() || entity.isOffScreen()) {
            greenOffPlatform = true;
            break;
          }
        }
      }
      if (greenOffPlatform) {
        reason = 'Green shape fell off!';
      } else {
        reason = 'Red shapes remain!';
      }
    }
    
    p.text(reason, CANVAS_WIDTH / 2, 200);
    
    p.fill(100, 200, 255);
    p.textSize(20);
    const pulse = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
    p.fill(100 * pulse, 200 * pulse, 255 * pulse);
    p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 280);
  }
}