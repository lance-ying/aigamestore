// ui.js - User interface rendering

import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, gameState } from './globals.js';

export function renderUI(p, levelManager) {
  const player = gameState.player;
  
  // HUD during gameplay
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    p.push();
    p.fill(255);
    p.textSize(16);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`Score: ${gameState.score}`, 10, 10);
    p.text(`Level: ${gameState.currentLevel + 1}/${gameState.totalLevels}`, 10, 30);
    
    // Time slow charge bar
    p.fill(100, 200, 255);
    p.rect(10, 50, gameState.timeSlowCharge * 2, 10);
    p.noFill();
    p.stroke(255);
    p.rect(10, 50, 200, 10);
    
    // Dash cooldown indicator
    if (player && player.dashCooldown > 0) {
      p.fill(255, 100, 100);
      p.noStroke();
      p.text('DASH COOLDOWN', 10, 70);
    }
    
    // Level description
    const desc = levelManager.getCurrentLevelDescription();
    if (desc && gameState.frameCounter < 180) {
      p.fill(255, 255, 255, 255 - (gameState.frameCounter / 180) * 255);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(20);
      p.text(desc, CANVAS_WIDTH / 2, 50);
    }
    
    p.pop();
  }
  
  // Paused indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.push();
    p.fill(255);
    p.textSize(16);
    p.textAlign(p.RIGHT, p.TOP);
    p.text('PAUSED', CANVAS_WIDTH - 10, 10);
    p.pop();
  }
}

export function renderStartScreen(p) {
  p.background(10, 10, 20);
  
  // Decorative elements
  p.push();
  p.noFill();
  p.stroke(255, 50, 50, 100);
  p.strokeWeight(2);
  for (let i = 0; i < 3; i++) {
    p.rect(50 + i * 10, 50 + i * 10, CANVAS_WIDTH - 100 - i * 20, CANVAS_HEIGHT - 100 - i * 20);
  }
  p.pop();
  
  p.fill(255, 50, 50);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text('KATANA ZERO', CANVAS_WIDTH / 2, 80);
  
  p.fill(200, 200, 220);
  p.textSize(14);
  p.text('Neo-noir action platformer', CANVAS_WIDTH / 2, 120);
  
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.CENTER, p.TOP);
  p.text('Slash through enemies with your katana', CANVAS_WIDTH / 2, 160);
  p.text('Use time manipulation to survive', CANVAS_WIDTH / 2, 180);
  p.text('One hit kills - for you and them', CANVAS_WIDTH / 2, 200);
  
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  p.text('Controls:', 50, 240);
  p.textSize(11);
  p.text('Arrow Keys - Move, Look up/Crouch', 50, 260);
  p.text('SPACE - Jump', 50, 275);
  p.text('SHIFT - Dash (invincibility)', 50, 290);
  p.text('Z - Slash (hold arrow for direction)', 50, 305);
  p.text('X - Slow Time (limited)', 50, 320);
  
  p.fill(255, 255, 100);
  p.textSize(16);
  p.textAlign(p.CENTER, p.CENTER);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}

export function renderGameOverScreen(p) {
  p.push();
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  p.pop();
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  p.fill(isWin ? p.color(100, 255, 100) : p.color(255, 50, 50));
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? 'MISSION COMPLETE' : 'TERMINATED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  
  p.fill(255);
  p.textSize(20);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  
  if (isWin) {
    p.textSize(16);
    p.fill(200, 200, 220);
    p.text('All enemies eliminated', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
  }
  
  p.fill(255, 255, 100);
  p.textSize(18);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}