import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, LANE_X_POSITIONS, GROUND_Y } from './globals.js';

export function renderGame(p) {
  // Clear background
  p.background(135, 206, 235);

  if (gameState.gamePhase === 'START') {
    renderStartScreen(p);
  } else if (gameState.gamePhase === 'PLAYING') {
    renderPlayingScreen(p);
  } else if (gameState.gamePhase === 'PAUSED') {
    renderPlayingScreen(p);
    renderPauseOverlay(p);
  } else if (gameState.gamePhase.startsWith('GAME_OVER')) {
    renderGameOverScreen(p);
  }
}

function renderStartScreen(p) {
  // Background gradient effect
  for (let i = 0; i < CANVAS_HEIGHT; i++) {
    const inter = p.map(i, 0, CANVAS_HEIGHT, 0, 1);
    p.stroke(135 - inter * 35, 206 - inter * 106, 235 - inter * 135);
    p.line(0, i, CANVAS_WIDTH, i);
  }

  // Title
  p.fill(50, 50, 50);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('RAIL RUNNER', CANVAS_WIDTH / 2, 80);
  
  p.textSize(24);
  p.fill(70, 70, 70);
  p.text('Endless Railway Adventure', CANVAS_WIDTH / 2, 120);

  // Description
  p.textSize(14);
  p.fill(40, 40, 40);
  p.text('Sprint through parallel train tracks!', CANVAS_WIDTH / 2, 160);
  p.text('Dodge trains, jump barriers, collect coins.', CANVAS_WIDTH / 2, 180);
  p.text('Survive as long as possible at increasing speeds!', CANVAS_WIDTH / 2, 200);

  // Controls
  p.textSize(16);
  p.fill(0, 100, 200);
  p.text('CONTROLS', CANVAS_WIDTH / 2, 240);
  
  p.textSize(13);
  p.fill(40, 40, 40);
  p.text('← / → : Switch lanes', CANVAS_WIDTH / 2, 265);
  p.text('↑ / SPACE : Jump over low obstacles', CANVAS_WIDTH / 2, 285);
  p.text('↓ : Slide under high barriers', CANVAS_WIDTH / 2, 305);
  p.text('ESC : Pause game', CANVAS_WIDTH / 2, 325);

  // Start prompt
  p.textSize(20);
  p.fill(255, 100, 100);
  const blinkAlpha = p.map(Math.sin(p.frameCount * 0.1), -1, 1, 100, 255);
  p.fill(255, 100, 100, blinkAlpha);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 365);
}

function renderPlayingScreen(p) {
  // Draw moving background
  renderBackground(p);
  
  // Draw tracks
  renderTracks(p);
  
  // Draw coins
  for (const coin of gameState.coins) {
    coin.render();
  }
  
  // Draw obstacles
  for (const obstacle of gameState.obstacles) {
    obstacle.render();
  }
  
  // Draw player
  if (gameState.player) {
    gameState.player.render();
  }
  
  // Draw HUD
  renderHUD(p);
}

function renderBackground(p) {
  // Sky gradient
  for (let i = 0; i < CANVAS_HEIGHT; i++) {
    const inter = p.map(i, 0, CANVAS_HEIGHT, 0, 1);
    p.stroke(135 - inter * 35, 206 - inter * 106, 235 - inter * 135);
    p.line(0, i, CANVAS_WIDTH, i);
  }
  
  // Moving clouds
  p.noStroke();
  const cloudOffset = (p.frameCount * gameState.gameSpeed * 0.3) % 800;
  for (let i = 0; i < 3; i++) {
    const x = (i * 300 - cloudOffset + 800) % 800 - 100;
    const y = 50 + i * 40;
    p.fill(255, 255, 255, 150);
    p.ellipse(x, y, 60, 30);
    p.ellipse(x + 20, y, 50, 25);
    p.ellipse(x - 20, y, 50, 25);
  }
}

function renderTracks(p) {
  // Ground
  p.fill(100, 100, 100);
  p.noStroke();
  p.rect(0, GROUND_Y + 10, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y - 10);
  
  // Rails
  for (let i = 0; i < LANE_X_POSITIONS.length; i++) {
    const x = LANE_X_POSITIONS[i];
    
    // Rail ties (moving)
    p.fill(80, 60, 40);
    const tieOffset = (p.frameCount * gameState.gameSpeed) % 40;
    for (let y = -tieOffset; y < CANVAS_HEIGHT; y += 40) {
      p.rect(x - 30, y, 60, 8);
    }
    
    // Rails
    p.fill(180, 180, 180);
    p.rect(x - 25, 0, 6, CANVAS_HEIGHT);
    p.rect(x + 19, 0, 6, CANVAS_HEIGHT);
    
    // Rail shine
    p.fill(220, 220, 220);
    p.rect(x - 24, 0, 2, CANVAS_HEIGHT);
    p.rect(x + 20, 0, 2, CANVAS_HEIGHT);
  }
}

function renderHUD(p) {
  // Score
  p.fill(255, 255, 255);
  p.stroke(0, 0, 0);
  p.strokeWeight(3);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(20);
  p.text(`Score: ${gameState.score}`, 15, 15);
  
  // Distance
  p.text(`Distance: ${Math.floor(gameState.distance)}m`, 15, 40);
  
  // Speed indicator
  const speedPercent = Math.floor((gameState.gameSpeed / gameState.baseSpeed - 1) * 100);
  p.text(`Speed: +${speedPercent}%`, 15, 65);
  
  p.noStroke();
}

function renderPauseOverlay(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 100);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Pause text
  p.fill(255, 255, 255);
  p.stroke(0, 0, 0);
  p.strokeWeight(2);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text('PAUSED', CANVAS_WIDTH - 15, 15);
  p.noStroke();
}

function renderGameOverScreen(p) {
  // Draw the final game state in background (faded)
  p.push();
  p.tint(255, 100);
  renderBackground(p);
  renderTracks(p);
  for (const obstacle of gameState.obstacles) {
    obstacle.render();
  }
  for (const coin of gameState.coins) {
    coin.render();
  }
  if (gameState.player) {
    gameState.player.render();
  }
  p.pop();
  
  // Dark overlay
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Game Over text
  p.fill(255, 255, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  
  if (gameState.gamePhase === 'GAME_OVER_WIN') {
    p.fill(100, 255, 100);
    p.text('AMAZING RUN!', CANVAS_WIDTH / 2, 120);
  } else {
    p.fill(255, 100, 100);
    p.text('GAME OVER', CANVAS_WIDTH / 2, 120);
  }
  
  // Stats
  p.fill(255, 255, 255);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
  p.text(`Distance: ${Math.floor(gameState.distance)}m`, CANVAS_WIDTH / 2, 215);
  
  // Restart prompt
  p.textSize(18);
  const blinkAlpha = p.map(Math.sin(p.frameCount * 0.1), -1, 1, 100, 255);
  p.fill(255, 255, 100, blinkAlpha);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 280);
  
  p.textSize(14);
  p.fill(200, 200, 200);
  p.text('(Returns to start screen)', CANVAS_WIDTH / 2, 310);
}