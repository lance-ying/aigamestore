// rendering.js - All rendering functions
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, CONFIG } from './globals.js';

export function renderStartScreen(p) {
  p.background(10, 10, 30);

  // Starfield background
  p.randomSeed(42);
  for (let i = 0; i < 100; i++) {
    const x = p.random(CANVAS_WIDTH);
    const y = p.random(CANVAS_HEIGHT);
    const brightness = p.random(100, 255);
    p.fill(brightness);
    p.noStroke();
    p.circle(x, y, p.random(1, 3));
  }

  // Title
  p.fill(100, 200, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("R-TYPE", CANVAS_WIDTH / 2, 80);

  // Subtitle
  p.fill(150, 200, 255);
  p.textSize(16);
  p.text("SPACE FIGHTER", CANVAS_WIDTH / 2, 120);

  // Instructions
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.LEFT);
  const instructions = [
    "Navigate your spaceship through waves of enemies",
    "Manage your Force pod for offense and defense",
    "Collect power-ups to upgrade your weapons",
    "Defeat bosses to progress through levels",
    "",
    "Arrow Keys: Move",
    "Space: Shoot (hold to charge beam)",
    "Z: Detach/Attach Force Pod",
    "Shift: Launch Force Pod",
    "ESC: Pause"
  ];

  let yPos = 180;
  instructions.forEach(line => {
    p.text(line, 50, yPos);
    yPos += 20;
  });

  // Start prompt
  const flash = p.sin(p.frameCount * 0.1) > 0;
  if (flash) {
    p.fill(255, 255, 100);
    p.textSize(20);
    p.textAlign(p.CENTER);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
  }
}

export function renderGame(p) {
  // Space background
  p.background(5, 5, 20);

  // Scrolling stars
  p.randomSeed(42);
  const starSpeed = 2;
  for (let i = 0; i < 100; i++) {
    const baseX = p.random(CANVAS_WIDTH * 2);
    const x = (baseX - (p.frameCount * starSpeed * 0.5) % (CANVAS_WIDTH * 2)) % CANVAS_WIDTH;
    const y = p.random(CANVAS_HEIGHT);
    const brightness = p.random(100, 200);
    const size = p.random(1, 2);
    p.fill(brightness);
    p.noStroke();
    p.circle(x, y, size);
  }

  // Render entities
  gameState.particles.forEach(particle => particle.render());
  gameState.powerups.forEach(powerup => powerup.render());
  gameState.bullets.forEach(bullet => bullet.render());
  gameState.enemyBullets.forEach(bullet => bullet.render());
  gameState.enemies.forEach(enemy => enemy.render());
  
  if (gameState.forcePod) gameState.forcePod.render();
  if (gameState.player) gameState.player.render();

  // UI
  renderUI(p);
}

export function renderUI(p) {
  // Score
  p.fill(255);
  p.textAlign(p.LEFT);
  p.textSize(16);
  p.text(`Score: ${gameState.score}`, 10, 20);

  // Level
  p.text(`Level: ${gameState.currentLevel}`, 10, 40);

  // Lives
  p.text(`Lives: ${gameState.lives}`, 10, 60);

  // Health bar
  if (gameState.player) {
    const healthRatio = gameState.player.health / CONFIG.PLAYER_MAX_HEALTH;
    p.fill(50);
    p.rect(10, CANVAS_HEIGHT - 30, 150, 20);
    p.fill(healthRatio > 0.3 ? [0, 255, 0] : [255, 0, 0]);
    p.rect(10, CANVAS_HEIGHT - 30, 150 * healthRatio, 20);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text("HEALTH", 85, CANVAS_HEIGHT - 20);
  }

  // Weapon level indicator
  p.fill(255);
  p.textAlign(p.LEFT);
  p.textSize(12);
  p.text(`Weapon Lv.${gameState.weaponLevel}`, 170, CANVAS_HEIGHT - 20);

  // Power-up indicators
  let indicatorX = 280;
  if (gameState.hasMissiles) {
    p.fill(255, 150, 50);
    p.rect(indicatorX, CANVAS_HEIGHT - 30, 20, 20);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("M", indicatorX + 10, CANVAS_HEIGHT - 20);
    indicatorX += 25;
  }

  if (gameState.speedBoost > 1) {
    p.fill(100, 255, 100);
    p.rect(indicatorX, CANVAS_HEIGHT - 30, 20, 20);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("S", indicatorX + 10, CANVAS_HEIGHT - 20);
  }

  // Charge meter
  if (gameState.chargeTime > 0) {
    const chargeRatio = gameState.chargeTime / CONFIG.CHARGE_TIME;
    p.fill(100, 200, 255);
    p.rect(CANVAS_WIDTH - 110, 10, 100 * chargeRatio, 15);
    p.noFill();
    p.stroke(255);
    p.strokeWeight(2);
    p.rect(CANVAS_WIDTH - 110, 10, 100, 15);
    p.noStroke();
  }

  // Boss warning
  if (gameState.bossActive && gameState.boss && p.frameCount % 30 < 15) {
    p.fill(255, 0, 0);
    p.textAlign(p.CENTER);
    p.textSize(24);
    p.text("WARNING - BOSS APPROACHING", CANVAS_WIDTH / 2, 50);
  }
}

export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);

  p.textSize(20);
  p.text("Press ESC to continue", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

export function renderGameOver(p) {
  p.background(10, 10, 30);

  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;

  // Title
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "MISSION COMPLETE" : "GAME OVER", CANVAS_WIDTH / 2, 100);

  // Stats
  p.fill(255);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
  p.text(`Level Reached: ${gameState.currentLevel}`, CANVAS_WIDTH / 2, 220);

  // Message
  p.textSize(16);
  if (isWin) {
    p.fill(150, 255, 150);
    p.text("You defeated all enemies and saved the galaxy!", CANVAS_WIDTH / 2, 260);
  } else {
    p.fill(255, 150, 150);
    p.text("Your ship was destroyed...", CANVAS_WIDTH / 2, 260);
  }

  // Restart prompt
  const flash = p.sin(p.frameCount * 0.1) > 0;
  if (flash) {
    p.fill(255, 255, 100);
    p.textSize(20);
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
  }
}