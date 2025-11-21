// ui.js - UI rendering
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
  p.background(30, 100, 200);
  
  // Animated background
  for (let i = 0; i < 20; i++) {
    const x = (i * 50 + p.frameCount * 2) % (CANVAS_WIDTH + 100);
    p.fill(255, 255, 255, 50);
    p.noStroke();
    p.circle(x, 100 + Math.sin(p.frameCount * 0.05 + i) * 50, 30);
  }
  
  // Title
  p.fill(255, 215, 0);
  p.textSize(48);
  p.textAlign(p.CENTER, p.CENTER);
  p.textStyle(p.BOLD);
  p.text('SONIC RUSH', CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(255);
  p.textSize(20);
  p.text('Act ' + gameState.act, CANVAS_WIDTH / 2, 130);
  
  // Instructions
  p.textSize(16);
  p.textAlign(p.LEFT);
  p.fill(255);
  
  const instructions = [
    'Collect rings for protection and points!',
    'Jump on enemies or use spin dash to defeat them.',
    'Reach the goal post to complete the act.',
    '',
    'CONTROLS:',
    'Arrow Keys / A-D: Move',
    'Space / W: Jump (press again in air for spin dash)',
    'ESC: Pause',
  ];
  
  let y = 160;
  instructions.forEach(line => {
    p.text(line, 80, y);
    y += 22;
  });
  
  // Press Enter prompt
  const alpha = 128 + Math.sin(p.frameCount * 0.1) * 127;
  p.fill(255, 255, 0, alpha);
  p.textSize(24);
  p.textAlign(p.CENTER);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}

export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textSize(48);
  p.textAlign(p.CENTER, p.CENTER);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  p.textSize(20);
  p.text('Press ESC to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

export function renderGameOver(p) {
  p.background(0);
  
  const isWin = gameState.gamePhase === 'GAME_OVER_WIN';
  
  // Title
  p.fill(isWin ? [255, 215, 0] : [255, 50, 50]);
  p.textSize(48);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(isWin ? 'ACT CLEAR!' : 'GAME OVER', CANVAS_WIDTH / 2, 100);
  
  // Score
  p.fill(255);
  p.textSize(32);
  p.text('Score: ' + gameState.score, CANVAS_WIDTH / 2, 180);
  p.text('Rings: ' + gameState.ringCount, CANVAS_WIDTH / 2, 220);
  
  if (isWin) {
    // Stars animation
    for (let i = 0; i < 20; i++) {
      const x = CANVAS_WIDTH / 2 + Math.cos(p.frameCount * 0.05 + i) * (100 + i * 10);
      const y = 100 + Math.sin(p.frameCount * 0.05 + i) * 50;
      p.fill(255, 255, 0, 200);
      p.textSize(20);
      p.text('★', x, y);
    }
  }
  
  // Restart prompt
  p.fill(255);
  p.textSize(20);
  p.text('Press R to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 60);
}

export function renderHUD(p) {
  // Score
  p.fill(255, 255, 255);
  p.textSize(18);
  p.textAlign(p.LEFT);
  p.text('Score: ' + gameState.score, 10, 25);
  
  // Rings
  p.fill(255, 215, 0);
  p.text('Rings: ' + gameState.ringCount, 10, 50);
  
  // Lives
  p.fill(255, 100, 100);
  p.text('Lives: ' + gameState.lives, 10, 75);
  
  // Control mode indicator
  if (gameState.controlMode !== 'HUMAN') {
    p.fill(255, 255, 0);
    p.textAlign(p.RIGHT);
    p.text('AUTO: ' + gameState.controlMode, CANVAS_WIDTH - 10, 25);
  }
  
  // Invincibility indicator
  if (gameState.invincibilityTimer > 0) {
    const alpha = Math.sin(p.frameCount * 0.5) * 127 + 128;
    p.fill(255, 255, 0, alpha);
    p.textAlign(p.CENTER);
    p.textSize(16);
    p.text('INVINCIBLE!', CANVAS_WIDTH / 2, 20);
  }
}