// render.js - Rendering functions

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
  p.background(135, 206, 235); // Sky blue

  // Title
  p.fill(255);
  p.stroke(0);
  p.strokeWeight(4);
  p.textSize(48);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("LEP'S ADVENTURE", CANVAS_WIDTH / 2, 80);

  // Description
  p.noStroke();
  p.fill(255);
  p.textSize(16);
  p.textAlign(p.CENTER, p.CENTER);
  const desc = "Help Lep the Leprechaun reach the flag!\nCollect coins and avoid enemies.";
  p.text(desc, CANVAS_WIDTH / 2, 150);

  // Instructions
  p.textSize(14);
  p.textAlign(p.LEFT);
  p.text("Controls:", 180, 220);
  p.text("← → or A D: Move", 180, 245);
  p.text("SPACE: Jump (hold for higher)", 180, 265);
  p.text("ESC: Pause", 180, 285);

  // Start prompt
  p.fill(255, 255, 0);
  p.textSize(24);
  p.textAlign(p.CENTER);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 340);
}

export function renderGame(p) {
  // Sky background
  p.background(135, 206, 235);

  // Update camera to follow player
  if (gameState.player) {
    const playerX = gameState.player.body.position.x;
    const targetCameraX = playerX - CANVAS_WIDTH / 3;
    gameState.camera.x = Math.max(0, targetCameraX);
  }

  const offsetX = gameState.camera.x;

  // Draw all entities with camera offset
  gameState.entities.forEach(entity => {
    if (entity && entity.render) {
      entity.render(offsetX);
    }
  });

  // Draw UI (fixed to screen)
  renderUI(p);
}

export function renderUI(p) {
  // Score
  p.fill(255);
  p.stroke(0);
  p.strokeWeight(3);
  p.textSize(20);
  p.textAlign(p.LEFT);
  p.text(`Score: ${gameState.score}`, 10, 25);

  // Health
  p.text("Health:", 10, 55);
  for (let i = 0; i < gameState.player.maxHealth; i++) {
    if (i < gameState.player.health) {
      p.fill(255, 0, 0);
    } else {
      p.fill(100, 0, 0);
    }
    p.noStroke();
    p.circle(90 + i * 30, 50, 20);
  }

  // Level
  p.fill(255);
  p.stroke(0);
  p.strokeWeight(3);
  p.textAlign(p.RIGHT);
  p.text(`Level ${gameState.currentLevel}`, CANVAS_WIDTH - 10, 25);
}

export function renderPausedOverlay(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Paused text
  p.fill(255, 255, 0);
  p.stroke(0);
  p.strokeWeight(4);
  p.textSize(48);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

  p.textSize(20);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

export function renderGameOver(p) {
  p.background(135, 206, 235);

  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;

  // Title
  p.fill(isWin ? [0, 255, 0] : [255, 0, 0]);
  p.stroke(0);
  p.strokeWeight(4);
  p.textSize(56);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(isWin ? "LEVEL COMPLETE!" : "GAME OVER", CANVAS_WIDTH / 2, 100);

  // Score
  p.fill(255);
  p.textSize(32);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);

  // Message
  p.textSize(20);
  if (isWin) {
    p.text("You reached the flag!", CANVAS_WIDTH / 2, 240);
  } else {
    p.text("Better luck next time!", CANVAS_WIDTH / 2, 240);
  }

  // Restart prompt
  p.fill(255, 255, 0);
  p.textSize(24);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
}