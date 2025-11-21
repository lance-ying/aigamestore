// renderer.js - Rendering functions
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, GRID_X, GRID_Y, GRID_COLS, GRID_ROWS, CARD_WIDTH, CARD_HEIGHT } from './globals.js';
import { drawParticles } from './particles.js';

export function drawGame(p) {
  p.background(30, 30, 40);

  if (gameState.gamePhase === PHASE_START) {
    drawStartScreen(p);
  } else if (gameState.gamePhase === PHASE_PLAYING || gameState.gamePhase === PHASE_PAUSED) {
    drawPlayingScreen(p);
    if (gameState.gamePhase === PHASE_PAUSED) {
      drawPausedOverlay(p);
    }
  } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
    drawGameOverScreen(p);
  }
}

function drawStartScreen(p) {
  p.push();
  
  // Title
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(255, 215, 0);
  p.textSize(48);
  p.text('BALOOT BLITZ', CANVAS_WIDTH / 2, 80);

  // Description
  p.fill(200);
  p.textSize(14);
  p.text('Arrange falling cards to form Baloot combinations!', CANVAS_WIDTH / 2, 140);
  p.text('Clear combos to score points and advance levels.', CANVAS_WIDTH / 2, 160);

  // Combinations info
  p.fill(150, 200, 255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  const infoX = 100;
  let infoY = 190;
  
  p.text('COMBINATIONS:', infoX, infoY);
  infoY += 20;
  p.fill(255, 255, 150);
  p.text('• SARY: Four of a kind (100 pts)', infoX, infoY);
  infoY += 18;
  p.text('• KHAMSA: Five consecutive ranks (150 pts)', infoX, infoY);
  infoY += 18;
  p.text('• BALOOT: King + Queen same suit (50 pts)', infoX, infoY);
  infoY += 18;
  p.text('• ACE-TEN: Ace + Ten same suit (60 pts)', infoX, infoY);

  // Controls
  infoY += 30;
  p.fill(150, 200, 255);
  p.text('CONTROLS:', infoX, infoY);
  infoY += 20;
  p.fill(255);
  p.text('← →  Move card', infoX, infoY);
  infoY += 18;
  p.text('↓    Speed up fall', infoX, infoY);
  infoY += 18;
  p.text('SPACE  Drop instantly', infoX, infoY);
  infoY += 18;
  p.text('ESC  Pause', infoX, infoY);

  // Start prompt
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(255, 255, 0);
  p.textSize(20);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);

  p.pop();
}

function drawPlayingScreen(p) {
  // Draw grid background
  p.push();
  p.fill(40, 40, 50);
  p.stroke(60, 60, 70);
  p.strokeWeight(2);
  const gridWidth = GRID_COLS * (CARD_WIDTH + 5) - 5;
  const gridHeight = GRID_ROWS * (CARD_HEIGHT + 5) - 5;
  p.rect(GRID_X, GRID_Y, gridWidth, gridHeight);

  // Draw grid lines
  p.stroke(50, 50, 60);
  p.strokeWeight(1);
  for (let col = 0; col <= GRID_COLS; col++) {
    const x = GRID_X + col * (CARD_WIDTH + 5);
    p.line(x, GRID_Y, x, GRID_Y + gridHeight);
  }
  for (let row = 0; row <= GRID_ROWS; row++) {
    const y = GRID_Y + row * (CARD_HEIGHT + 5);
    p.line(GRID_X, y, GRID_X + gridWidth, y);
  }
  p.pop();

  // Draw settled cards
  gameState.entities.forEach(entity => {
    if (entity.draw) {
      entity.draw(p);
    }
  });

  // Draw particles
  drawParticles(p);

  // Draw falling card
  if (gameState.fallingCard) {
    gameState.fallingCard.draw(p);
  }

  // Draw UI
  drawUI(p);
}

function drawUI(p) {
  p.push();
  
  // Score
  p.textAlign(p.RIGHT, p.TOP);
  p.fill(255, 215, 0);
  p.textSize(20);
  p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 20, 20);

  // Level
  p.fill(150, 200, 255);
  p.textSize(16);
  p.text(`LEVEL: ${gameState.level}`, CANVAS_WIDTH - 20, 45);

  // Progress
  p.fill(200);
  p.textSize(14);
  p.text(`COMBOS: ${gameState.levelProgress}/${gameState.requiredCombos}`, CANVAS_WIDTH - 20, 65);

  // Time
  p.fill(...(gameState.timeRemaining < 20 ? [255, 100, 100] : [200, 200, 200]));
  p.text(`TIME: ${gameState.timeRemaining}s`, CANVAS_WIDTH - 20, 85);

  p.pop();
}

function drawPausedOverlay(p) {
  p.push();
  p.textAlign(p.RIGHT, p.TOP);
  p.fill(255, 255, 0);
  p.textSize(16);
  p.text('PAUSED', CANVAS_WIDTH - 20, 10);
  p.pop();
}

function drawGameOverScreen(p) {
  // Semi-transparent overlay
  p.push();
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Message
  p.textAlign(p.CENTER, p.CENTER);
  if (gameState.gamePhase === PHASE_GAME_OVER_WIN) {
    p.fill(100, 255, 100);
    p.textSize(48);
    p.text('YOU WIN!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
  } else {
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
  }

  // Final score
  p.fill(255, 215, 0);
  p.textSize(24);
  p.text(`FINAL SCORE: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

  // Level reached
  p.fill(200);
  p.textSize(18);
  p.text(`LEVEL REACHED: ${gameState.level}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);

  // Restart prompt
  p.fill(255);
  p.textSize(20);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);

  p.pop();
}