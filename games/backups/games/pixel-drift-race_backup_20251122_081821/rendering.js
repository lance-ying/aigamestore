// rendering.js - Rendering functions

import { 
  gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START,
  PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE, TRACK_X_OFFSET, TRACK_WIDTH,
  LANE_WIDTH, NUM_LANES, LEVELS
} from './globals.js';

export function renderGame(p) {
  p.background(40, 40, 40);

  if (gameState.gamePhase === PHASE_START) {
    renderStartScreen(p);
  } else if (gameState.gamePhase === PHASE_PLAYING) {
    renderPlayingScreen(p);
  } else if (gameState.gamePhase === PHASE_PAUSED) {
    renderPlayingScreen(p);
    renderPauseOverlay(p);
  } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
    renderGameOverScreen(p);
  }
}

function renderStartScreen(p) {
  // Background gradient
  for (let i = 0; i < CANVAS_HEIGHT; i++) {
    const inter = p.map(i, 0, CANVAS_HEIGHT, 0, 1);
    const c = p.lerpColor(p.color(20, 30, 40), p.color(60, 40, 30), inter);
    p.stroke(c);
    p.line(0, i, CANVAS_WIDTH, i);
  }

  // Title
  p.fill(255, 220, 50);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("PIXEL DRIFT RACE", CANVAS_WIDTH / 2, 80);

  // Decorative elements
  p.fill(100, 220, 100);
  p.noStroke();
  p.rect(CANVAS_WIDTH / 2 - 15, 130, 30, 50, 5);
  p.fill(40);
  p.rect(CANVAS_WIDTH / 2 - 12, 135, 7, 10);
  p.rect(CANVAS_WIDTH / 2 + 5, 135, 7, 10);

  // Description
  p.fill(200, 200, 200);
  p.textSize(14);
  p.text("Race through challenging tracks!", CANVAS_WIDTH / 2, 200);
  p.text("Avoid obstacles, drift for bonuses, defeat the boss!", CANVAS_WIDTH / 2, 220);

  // Instructions
  p.fill(150, 200, 255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.CENTER);
  const startX = 100;
  const startY = 260;
  p.text("↑/W: Accelerate", startX, startY);
  p.text("←/→ or A/D: Steer", startX, startY + 20);
  p.text("SPACE: Drift/Brake", startX, startY + 40);
  p.text("ESC: Pause", startX, startY + 60);

  p.textAlign(p.RIGHT, p.CENTER);
  const rightX = CANVAS_WIDTH - 100;
  p.text("Complete levels to progress", rightX, startY);
  p.text("Collect cash for upgrades", rightX, startY + 20);
  p.text("Master drifting for bonuses", rightX, startY + 40);
  p.text("Defeat The Enforcer to win!", rightX, startY + 60);

  // Start prompt
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  const flash = p.sin(p.frameCount * 0.1) > 0;
  if (flash) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
  }
}

function renderPlayingScreen(p) {
  // Render background based on level theme
  renderBackground(p);

  // Render track
  renderTrack(p);

  // Render entities
  gameState.obstacles.forEach(obstacle => obstacle.render());
  gameState.coins.forEach(coin => coin.render());
  gameState.rivals.forEach(rival => rival.render());
  if (gameState.boss) {
    gameState.boss.render();
  }
  gameState.projectiles.forEach(projectile => projectile.render());
  
  if (gameState.player) {
    gameState.player.render();
  }

  // Render particles
  gameState.particles.forEach(particle => particle.render());

  // Render UI
  renderUI(p);
}

function renderBackground(p) {
  const level = LEVELS[gameState.currentLevel - 1];
  const theme = level.theme;

  if (theme === 'suburban') {
    // Green background with trees
    p.background(80, 150, 80);
    for (let i = 0; i < 5; i++) {
      const x = (i * 150 + (gameState.cameraY % 150)) % CANVAS_HEIGHT;
      p.fill(40, 100, 40);
      p.noStroke();
      p.circle(50, x, 30);
      p.circle(CANVAS_WIDTH - 50, x, 30);
    }
  } else if (theme === 'city') {
    // City buildings
    p.background(60, 60, 80);
    for (let i = 0; i < 10; i++) {
      const x = (i * 100 + (gameState.cameraY % 100)) % CANVAS_HEIGHT;
      p.fill(40, 40, 60);
      p.rect(10, x, 40, 60);
      p.rect(CANVAS_WIDTH - 50, x, 40, 60);
      p.fill(100, 100, 80);
      for (let w = 0; w < 3; w++) {
        p.rect(15 + w * 10, x + 10, 6, 8);
      }
    }
  } else if (theme === 'mountain') {
    // Rocky mountain background
    p.background(100, 80, 60);
    for (let i = 0; i < 8; i++) {
      const x = (i * 120 + (gameState.cameraY % 120)) % CANVAS_HEIGHT;
      p.fill(80, 60, 40);
      p.triangle(30, x + 60, 10, x + 10, 50, x + 10);
      p.triangle(CANVAS_WIDTH - 30, x + 60, CANVAS_WIDTH - 10, x + 10, CANVAS_WIDTH - 50, x + 10);
    }
  } else if (theme === 'arena') {
    // Arena with grid pattern
    p.background(30, 30, 50);
    p.stroke(50, 50, 80);
    p.strokeWeight(1);
    for (let i = 0; i < CANVAS_WIDTH; i += 30) {
      p.line(i, 0, i, CANVAS_HEIGHT);
    }
    for (let i = 0; i < CANVAS_HEIGHT; i += 30) {
      p.line(0, i, CANVAS_WIDTH, i);
    }
  }
}

function renderTrack(p) {
  // Road surface
  p.fill(60, 60, 60);
  p.noStroke();
  p.rect(TRACK_X_OFFSET, 0, TRACK_WIDTH, CANVAS_HEIGHT);

  // Lane dividers
  p.stroke(255, 255, 255);
  p.strokeWeight(2);
  const dashLength = 20;
  const gapLength = 20;
  const offset = (gameState.cameraY % (dashLength + gapLength));

  for (let lane = 1; lane < NUM_LANES; lane++) {
    const x = TRACK_X_OFFSET + lane * LANE_WIDTH;
    for (let y = -offset; y < CANVAS_HEIGHT; y += dashLength + gapLength) {
      p.line(x, y, x, y + dashLength);
    }
  }

  // Track edges
  p.stroke(255, 200, 0);
  p.strokeWeight(4);
  p.line(TRACK_X_OFFSET, 0, TRACK_X_OFFSET, CANVAS_HEIGHT);
  p.line(TRACK_X_OFFSET + TRACK_WIDTH, 0, TRACK_X_OFFSET + TRACK_WIDTH, CANVAS_HEIGHT);
}

function renderUI(p) {
  // Score
  p.fill(255);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`SCORE: ${gameState.score}`, 10, 10);

  // Level
  p.textAlign(p.RIGHT, p.TOP);
  const level = LEVELS[gameState.currentLevel - 1];
  p.text(`LEVEL ${gameState.currentLevel}: ${level.name}`, CANVAS_WIDTH - 10, 10);

  // Cash
  p.textAlign(p.LEFT, p.BOTTOM);
  p.text(`CASH: $${gameState.cash}`, 10, CANVAS_HEIGHT - 10);

  // Speed
  if (gameState.player) {
    p.textAlign(p.RIGHT, p.BOTTOM);
    const mph = Math.floor(gameState.player.speed * 15);
    p.text(`${mph} MPH`, CANVAS_WIDTH - 10, CANVAS_HEIGHT - 10);
  }

  // Drift chain multiplier
  if (gameState.driftChainMultiplier > 1) {
    p.textAlign(p.CENTER, p.TOP);
    p.fill(255, 255, 100);
    p.textSize(20);
    p.text(`DRIFT x${gameState.driftChainMultiplier.toFixed(1)}`, CANVAS_WIDTH / 2, 40);
  }

  // Level progress for race levels
  if (!level.isBoss && gameState.levelLength > 0) {
    const progress = gameState.levelDistance / gameState.levelLength;
    const barWidth = 200;
    const barHeight = 10;
    const barX = CANVAS_WIDTH / 2 - barWidth / 2;
    const barY = 35;

    p.fill(50);
    p.noStroke();
    p.rect(barX, barY, barWidth, barHeight);

    p.fill(100, 220, 100);
    p.rect(barX, barY, barWidth * progress, barHeight);

    p.fill(255);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(10);
    p.text("PROGRESS", CANVAS_WIDTH / 2, barY - 12);
  }
}

function renderPauseOverlay(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Pause text
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

  p.textSize(20);
  p.text("ESC to Resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  p.text("R to Restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);

  // Small indicator in top right
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

function renderGameOverScreen(p) {
  // Background gradient
  for (let i = 0; i < CANVAS_HEIGHT; i++) {
    const inter = p.map(i, 0, CANVAS_HEIGHT, 0, 1);
    const c = gameState.gamePhase === PHASE_GAME_OVER_WIN ? 
      p.lerpColor(p.color(20, 40, 20), p.color(40, 80, 40), inter) :
      p.lerpColor(p.color(40, 20, 20), p.color(80, 40, 40), inter);
    p.stroke(c);
    p.line(0, i, CANVAS_WIDTH, i);
  }

  // Title
  if (gameState.gamePhase === PHASE_GAME_OVER_WIN) {
    p.fill(100, 255, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(56);
    p.text("VICTORY!", CANVAS_WIDTH / 2, 100);
    
    p.textSize(24);
    p.fill(200, 255, 200);
    p.text("You defeated The Enforcer!", CANVAS_WIDTH / 2, 150);
  } else {
    p.fill(255, 100, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(56);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 100);
    
    p.textSize(24);
    p.fill(255, 200, 200);
    p.text("Your car was destroyed", CANVAS_WIDTH / 2, 150);
  }

  // Stats
  p.fill(255);
  p.textSize(20);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  p.text(`Total Cash: $${gameState.cash}`, CANVAS_WIDTH / 2, 250);
  p.text(`Level Reached: ${gameState.currentLevel}`, CANVAS_WIDTH / 2, 280);

  // Instructions
  p.textSize(24);
  p.fill(255, 255, 150);
  const flash = p.sin(p.frameCount * 0.1) > 0;
  if (flash) {
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);
  }
}