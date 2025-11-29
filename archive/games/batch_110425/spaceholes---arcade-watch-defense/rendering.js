import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, CENTER_X, CENTER_Y, TUNNEL_RADIUS, PLAYER_ORBIT_RADIUS } from './globals.js';

export function drawStartScreen(p) {
  p.background(10, 10, 30);
  drawTunnelBackground(p);

  // Title
  p.fill(255, 200, 50);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("SPACEHOLES", CENTER_X, 80);

  // Subtitle
  p.fill(150, 150, 255);
  p.textSize(20);
  p.text("Arcade Watch Defense", CENTER_X, 120);

  // Description box
  p.fill(20, 20, 40, 200);
  p.rect(50, 160, CANVAS_WIDTH - 100, 120, 10);

  p.fill(200, 200, 255);
  p.textSize(14);
  p.textAlign(p.CENTER, p.TOP);
  p.text("Defend the spacehole from incoming alien bugs!", CENTER_X, 170);
  p.text("Your ship auto-fires. Rotate to aim at enemies.", CENTER_X, 190);
  p.text("Survive waves of increasing difficulty!", CENTER_X, 210);
  p.text("Goal: Survive 90 seconds and destroy 100 enemies", CENTER_X, 230);
  p.textSize(12);
  p.fill(255, 255, 100);
  p.text("Destroy enemies for points • Don't let them reach you!", CENTER_X, 255);

  // Controls
  p.fill(100, 255, 100);
  p.textSize(16);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("← → : Rotate Ship", CENTER_X, 310);
  p.textSize(12);
  p.text("ESC: Pause  |  R: Restart", CENTER_X, 335);

  // Start prompt
  p.fill(255, 255, 255);
  p.textSize(24);
  const pulse = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(255, 200, 100, pulse * 255);
  p.text("PRESS ENTER TO START", CENTER_X, 370);
}

export function drawPlayingScreen(p) {
  p.background(10, 10, 30);
  drawTunnelBackground(p);
  
  // Draw entities
  gameState.particles.forEach(particle => particle.draw(p));
  gameState.enemies.forEach(enemy => enemy.draw(p));
  gameState.projectiles.forEach(proj => proj.draw(p));
  if (gameState.player) {
    gameState.player.draw(p);
  }

  // UI
  drawUI(p);

  // Pause indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.fill(255, 255, 255);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }
}

export function drawGameOverScreen(p) {
  p.background(10, 10, 30);
  drawTunnelBackground(p);

  // Dim overlay
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;

  // Title
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "MISSION SUCCESS!" : "MISSION FAILED", CENTER_X, 120);

  // Stats box
  p.fill(20, 20, 40, 230);
  p.rect(100, 160, CANVAS_WIDTH - 200, 140, 10);

  p.fill(255, 255, 255);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CENTER_X, 190);

  p.textSize(16);
  p.fill(200, 200, 255);
  p.text(`Enemies Destroyed: ${gameState.enemiesDestroyed}`, CENTER_X, 220);
  p.text(`Waves Survived: ${gameState.waveNumber}`, CENTER_X, 245);
  const survivalSeconds = Math.floor(gameState.survivalTime / 1000);
  p.text(`Survival Time: ${survivalSeconds}s`, CENTER_X, 270);

  // Restart prompt
  p.fill(255, 255, 100);
  p.textSize(20);
  const pulse = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(255, 200, 100, pulse * 255);
  p.text("PRESS R TO RESTART", CENTER_X, 340);
}

function drawTunnelBackground(p) {
  // Outer space
  p.fill(5, 5, 15);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Draw stars
  p.randomSeed(42);
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * CANVAS_WIDTH;
    const y = Math.random() * CANVAS_HEIGHT;
    const size = Math.random() * 2;
    const brightness = 150 + Math.random() * 105;
    p.fill(brightness);
    p.circle(x, y, size);
  }

  // Tunnel rings
  for (let i = 0; i < 5; i++) {
    const radius = TUNNEL_RADIUS - i * 15;
    const alpha = 30 - i * 5;
    p.stroke(100, 100, 200, alpha);
    p.strokeWeight(2);
    p.noFill();
    p.circle(CENTER_X, CENTER_Y, radius * 2);
  }

  // Player orbit ring
  p.stroke(100, 200, 255, 80);
  p.strokeWeight(1);
  p.noFill();
  p.circle(CENTER_X, CENTER_Y, PLAYER_ORBIT_RADIUS * 2);

  // Center core
  const coreRadius = 30;
  p.fill(50, 50, 100);
  p.noStroke();
  p.circle(CENTER_X, CENTER_Y, coreRadius * 2);
  p.fill(80, 80, 150);
  p.circle(CENTER_X, CENTER_Y, coreRadius * 1.5);
  p.fill(100, 100, 200);
  p.circle(CENTER_X, CENTER_Y, coreRadius);
}

function drawUI(p) {
  // Score
  p.fill(255, 255, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(18);
  p.text(`Score: ${gameState.score}`, 10, 10);

  // Wave
  p.textSize(14);
  p.fill(150, 200, 255);
  p.text(`Wave: ${gameState.waveNumber}`, 10, 35);

  // Enemies destroyed
  p.fill(255, 200, 100);
  p.text(`Destroyed: ${gameState.enemiesDestroyed}`, 10, 55);

  // Survival time
  const survivalSeconds = Math.floor(gameState.survivalTime / 1000);
  p.fill(100, 255, 100);
  p.text(`Time: ${survivalSeconds}s`, 10, 75);

  // Difficulty indicator
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(12);
  p.fill(255, 150, 150);
  p.text(`Difficulty: x${gameState.difficultyMultiplier.toFixed(1)}`, CANVAS_WIDTH - 10, 10);

  // Win progress
  const destroyProgress = Math.min(gameState.enemiesDestroyed / 100, 1);
  const timeProgress = Math.min(gameState.survivalTime / 90000, 1);
  
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(11);
  p.fill(200, 200, 200);
  p.text("Win Progress:", CANVAS_WIDTH - 10, 30);
  
  // Progress bars
  const barWidth = 100;
  const barHeight = 8;
  const barX = CANVAS_WIDTH - 110;
  
  // Enemies bar
  p.fill(50, 50, 50);
  p.noStroke();
  p.rect(barX, 45, barWidth, barHeight);
  p.fill(255, 200, 100);
  p.rect(barX, 45, barWidth * destroyProgress, barHeight);
  p.fill(255, 255, 255);
  p.textSize(9);
  p.textAlign(p.LEFT, p.CENTER);
  p.text(`${gameState.enemiesDestroyed}/100`, barX + 2, 49);
  
  // Time bar
  p.fill(50, 50, 50);
  p.noStroke();
  p.rect(barX, 58, barWidth, barHeight);
  p.fill(100, 255, 100);
  p.rect(barX, 58, barWidth * timeProgress, barHeight);
  p.fill(255, 255, 255);
  p.textSize(9);
  p.textAlign(p.LEFT, p.CENTER);
  p.text(`${survivalSeconds}/90s`, barX + 2, 62);
}