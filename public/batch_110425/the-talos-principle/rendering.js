// rendering.js - All rendering functions
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';

export function drawStartScreen(p) {
  p.background(20, 25, 35);

  // Title
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text('The Talos Principle', CANVAS_WIDTH / 2, 80);

  // Subtitle
  p.fill(200, 200, 220);
  p.textSize(16);
  p.text('Philosophical Puzzle Adventure', CANVAS_WIDTH / 2, 120);

  // Instructions box
  p.fill(40, 45, 55);
  p.stroke(100, 110, 130);
  p.strokeWeight(2);
  p.rect(100, 150, 400, 180, 10);

  // Instructions
  p.fill(220, 220, 240);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  const instructions = [
    'Navigate ancient ruins and solve puzzles',
    'Collect all Sigils to complete your journey',
    '',
    'Arrow Keys: Move and turn',
    'SPACE: Interact/Place tools',
    'Z: Drop held tool',
    'SHIFT: Sprint',
    'ESC: Pause'
  ];

  let y = 165;
  for (let line of instructions) {
    p.text(line, 120, y);
    y += 22;
  }

  // Start prompt
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  const pulse = Math.sin(p.frameCount * 0.1) * 30 + 225;
  p.fill(pulse, pulse * 0.84, 0);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 360);
}

export function drawPlayingScreen(p) {
  // Background - stone ruins aesthetic
  p.background(60, 55, 50);

  // Floor pattern
  p.stroke(50, 45, 40);
  p.strokeWeight(1);
  for (let x = 0; x < CANVAS_WIDTH; x += 40) {
    for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
      p.fill(65 + Math.sin(x * 0.1 + y * 0.1) * 5, 60 + Math.sin(x * 0.1) * 5, 55);
      p.rect(x, y, 40, 40);
    }
  }

  // Draw entities
  for (let entity of gameState.entities) {
    if (entity.draw) {
      entity.draw(p);
    }
  }

  // Draw tools
  for (let tool of gameState.tools) {
    if (tool.draw) {
      tool.draw(p);
    }
  }

  // Draw player
  if (gameState.player) {
    gameState.player.draw(p);
  }

  // Draw UI
  drawUI(p);

  // Draw messages
  drawMessages(p);
}

export function drawUI(p) {
  // Health bar
  p.fill(40, 40, 50, 200);
  p.noStroke();
  p.rect(10, 10, 200, 30, 5);

  p.fill(200, 50, 50);
  p.rect(15, 15, 190 * (gameState.player.health / gameState.player.maxHealth), 20, 3);

  p.fill(255);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(14);
  p.text(`Health: ${gameState.player.health}/${gameState.player.maxHealth}`, 20, 25);

  // Score and Sigils
  p.fill(40, 40, 50, 200);
  p.rect(10, 50, 200, 30, 5);
  p.fill(255, 215, 0);
  p.text(`Sigils: ${gameState.sigilsCollected}/${gameState.totalSigils}`, 20, 65);

  p.fill(40, 40, 50, 200);
  p.rect(10, 90, 200, 30, 5);
  p.fill(220, 220, 240);
  p.text(`Score: ${gameState.score}`, 20, 105);

  // Current puzzle
  if (gameState.puzzles && gameState.puzzles[gameState.currentPuzzle]) {
    const puzzle = gameState.puzzles[gameState.currentPuzzle];
    p.fill(40, 40, 50, 200);
    p.rect(CANVAS_WIDTH - 210, 10, 200, 50, 5);
    p.fill(255, 215, 0);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    p.text(puzzle.name, CANVAS_WIDTH - 20, 15);
    p.fill(200, 200, 220);
    p.textSize(11);
    p.text(puzzle.description, CANVAS_WIDTH - 20, 35);
  }

  // Held tool indicator
  if (gameState.player && gameState.player.heldTool) {
    p.fill(40, 40, 50, 200);
    p.rect(CANVAS_WIDTH / 2 - 100, CANVAS_HEIGHT - 50, 200, 40, 5);
    p.fill(255, 215, 0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.text(`Holding: ${gameState.player.heldTool.type}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
  }
}

export function drawMessages(p) {
  let y = CANVAS_HEIGHT - 100;
  for (let i = gameState.messages.length - 1; i >= 0; i--) {
    const msg = gameState.messages[i];
    msg.frames--;

    if (msg.frames <= 0) {
      gameState.messages.splice(i, 1);
      continue;
    }

    const alpha = Math.min(255, msg.frames * 4);
    p.fill(40, 40, 50, alpha * 0.8);
    p.noStroke();
    p.rect(CANVAS_WIDTH / 2 - 150, y - 15, 300, 30, 5);

    p.fill(255, 255, 255, alpha);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.text(msg.text, CANVAS_WIDTH / 2, y);

    y -= 35;
  }
}

export function drawPausedScreen(p) {
  // Dim overlay
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Paused text
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

  p.fill(220, 220, 240);
  p.textSize(16);
  p.text('Press ESC to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  p.text('Press R to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 65);

  // Small indicator in top right
  p.fill(255, 215, 0);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text('PAUSED', CANVAS_WIDTH - 10, 10);
}

export function drawGameOverScreen(p, win) {
  p.background(20, 25, 35);

  // Result message
  if (win) {
    p.fill(100, 255, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text('JOURNEY COMPLETE', CANVAS_WIDTH / 2, 120);

    p.fill(220, 220, 240);
    p.textSize(20);
    p.text('You have collected all Sigils', CANVAS_WIDTH / 2, 170);
    p.text('and completed the trials!', CANVAS_WIDTH / 2, 200);
  } else {
    p.fill(255, 100, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text('FAILED', CANVAS_WIDTH / 2, 120);

    p.fill(220, 220, 240);
    p.textSize(20);
    p.text('The turrets have defeated you', CANVAS_WIDTH / 2, 170);
  }

  // Stats box
  p.fill(40, 45, 55);
  p.stroke(100, 110, 130);
  p.strokeWeight(2);
  p.rect(150, 230, 300, 80, 10);

  p.fill(255, 215, 0);
  p.noStroke();
  p.textSize(18);
  p.text('Final Statistics', CANVAS_WIDTH / 2, 250);

  p.fill(220, 220, 240);
  p.textSize(16);
  p.text(`Sigils Collected: ${gameState.sigilsCollected}/${gameState.totalSigils}`, CANVAS_WIDTH / 2, 280);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 305);

  // Restart prompt
  p.fill(255, 215, 0);
  p.textSize(20);
  const pulse = Math.sin(p.frameCount * 0.1) * 30 + 225;
  p.fill(pulse, pulse * 0.84, 0);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 360);
}