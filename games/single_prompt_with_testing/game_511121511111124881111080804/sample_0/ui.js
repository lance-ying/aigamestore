// ui.js - UI rendering for all game screens

import {
  gameState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  COLORS
} from './globals.js';

// Render start screen
export function renderStartScreen(p) {
  p.background(...COLORS.background);
  
  // Title with glow effect
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  // Glow
  for (let i = 0; i < 3; i++) {
    p.fill(100, 180, 255, 50);
    p.textSize(56 + i * 2);
    p.text('CRUMBLE', CANVAS_WIDTH / 2, 80);
  }
  
  // Main title
  p.fill(...COLORS.ui);
  p.textSize(56);
  p.text('CRUMBLE', CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(...COLORS.uiDark);
  p.textSize(16);
  p.text('Physics Platformer', CANVAS_WIDTH / 2, 120);
  
  // Instructions box
  p.fill(30, 30, 40, 200);
  p.noStroke();
  p.rect(CANVAS_WIDTH / 2 - 200, 160, 400, 140, 8);
  
  p.fill(...COLORS.ui);
  p.textSize(14);
  p.textAlign(p.LEFT, p.CENTER);
  
  const instructions = [
    'Arrow Keys: Move left and right',
    'Space: Jump',
    'Z: Launch grappling tongue',
    'Hold Z: Swing on grapple',
    '',
    'Reach the goal before platforms crumble!'
  ];
  
  let yPos = 180;
  instructions.forEach(line => {
    if (line) {
      p.text(line, CANVAS_WIDTH / 2 - 180, yPos);
    }
    yPos += 22;
  });
  
  // Start prompt with pulsing effect
  p.textAlign(p.CENTER, p.CENTER);
  const pulse = Math.sin(gameState.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(100, 255, 150, pulse * 255);
  p.textSize(24);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 340);
  
  p.pop();
}

// Render game HUD
export function renderHUD(p) {
  p.push();
  
  // Score display
  p.fill(40, 40, 50, 200);
  p.noStroke();
  p.rect(10, 10, 200, 60, 5);
  
  p.fill(...COLORS.ui);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(18);
  p.text('SCORE', 20, 20);
  p.textSize(24);
  p.text(gameState.score, 20, 40);
  
  // Stars collected
  p.fill(40, 40, 50, 200);
  p.rect(220, 10, 120, 60, 5);
  
  p.fill(...COLORS.star);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(18);
  p.text('STARS', 230, 20);
  p.textSize(24);
  p.text(`${gameState.starsCollected}/${gameState.totalStars}`, 230, 40);
  
  // Timer
  const seconds = Math.floor(gameState.levelTime / 60);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const timeString = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  
  p.fill(40, 40, 50, 200);
  p.rect(CANVAS_WIDTH - 110, 10, 100, 60, 5);
  
  p.fill(...COLORS.ui);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(18);
  p.text('TIME', CANVAS_WIDTH - 100, 20);
  p.textSize(24);
  p.text(timeString, CANVAS_WIDTH - 100, 40);
  
  // Grapple indicator
  if (gameState.player && gameState.isGrappling) {
    p.fill(40, 40, 50, 200);
    p.rect(10, 80, 180, 40, 5);
    
    p.fill(...COLORS.grappleLine);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(16);
    p.text('GRAPPLING', 20, 100);
  }
  
  p.pop();
}

// Render paused overlay
export function renderPausedOverlay(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Paused box
  p.fill(40, 40, 50, 230);
  p.rect(CANVAS_WIDTH / 2 - 150, CANVAS_HEIGHT / 2 - 80, 300, 160, 8);
  
  // Paused text
  p.fill(...COLORS.ui);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  p.textSize(20);
  p.fill(...COLORS.uiDark);
  p.text('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

// Render game over screen
export function renderGameOver(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Result box
  p.fill(40, 40, 50, 240);
  p.rect(CANVAS_WIDTH / 2 - 200, CANVAS_HEIGHT / 2 - 120, 400, 240, 8);
  
  // Result text
  p.textAlign(p.CENTER, p.CENTER);
  
  if (isWin) {
    // Win text with glow
    for (let i = 0; i < 3; i++) {
      p.fill(100, 255, 150, 80);
      p.textSize(52 + i * 2);
      p.text('GOAL REACHED!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 70);
    }
    p.fill(100, 255, 150);
    p.textSize(52);
    p.text('GOAL REACHED!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 70);
  } else {
    // Lose text
    p.fill(255, 100, 100);
    p.textSize(52);
    p.text('FELL OFF!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 70);
  }
  
  // Stats
  p.fill(...COLORS.ui);
  p.textSize(20);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
  
  p.textSize(18);
  p.fill(...COLORS.uiDark);
  p.text(`Stars: ${gameState.starsCollected}/${gameState.totalStars}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  
  const seconds = Math.floor(gameState.levelTime / 60);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const timeString = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  p.text(`Time: ${timeString}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 45);
  
  // Restart prompt with pulse
  const pulse = Math.sin(gameState.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(100, 180, 255, pulse * 255);
  p.textSize(24);
  p.text('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 85);
  
  p.pop();
}

// Render tutorial hints (optional)
export function renderTutorial(p) {
  if (!gameState.showTutorial) return;
  
  p.push();
  
  // Tutorial box
  p.fill(40, 40, 50, 220);
  p.noStroke();
  p.rect(CANVAS_WIDTH / 2 - 150, CANVAS_HEIGHT - 80, 300, 60, 5);
  
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(16);
  
  let tutorialText = '';
  
  if (gameState.levelTime < 120) {
    tutorialText = 'Use Arrow Keys to move!';
  } else if (gameState.levelTime < 240) {
    tutorialText = 'Press Space to jump!';
  } else if (gameState.levelTime < 360) {
    tutorialText = 'Press Z near anchor points to grapple!';
  } else {
    gameState.showTutorial = false;
  }
  
  if (tutorialText) {
    p.text(tutorialText, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
  }
  
  p.pop();
}