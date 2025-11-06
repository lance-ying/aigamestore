// rendering.js
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y, CHECKPOINT_DISTANCE } from './globals.js';
import { renderUpgradeShop } from './upgrades.js';

export function renderStartScreen(p) {
  p.background(20, 20, 40);
  
  // Title
  p.fill(255, 80, 80);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("EARN TO DIE", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(200, 200, 200);
  p.textSize(18);
  p.text("Zombie Wasteland Edition", CANVAS_WIDTH / 2, 130);
  
  // Instructions
  p.fill(255, 255, 255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    "OBJECTIVE:",
    `• Drive through zombie hordes and reach ${CHECKPOINT_DISTANCE}m`,
    "• Earn cash by covering distance and killing zombies",
    "• Upgrade your vehicle to survive longer runs",
    "",
    "CONTROLS:",
    "• UP ARROW / SPACE: Activate Nitro Boost",
    "• DOWN ARROW: Brake/Reverse",
    "• LEFT/RIGHT ARROWS: Control pitch in air",
    "",
    "TIPS:",
    "• Watch your fuel - runs end when fuel depletes",
    "• Land flat to avoid damage",
    "• Upgrade regularly to progress further"
  ];
  
  let y = 160;
  instructions.forEach(line => {
    if (line.startsWith("•")) {
      p.fill(200, 200, 200);
    } else {
      p.fill(255, 200, 100);
    }
    p.text(line, 80, y);
    y += 20;
  });
  
  // Stats
  p.fill(100, 255, 100);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(16);
  p.text(`Total Cash: $${Math.floor(gameState.totalCash)}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 80);
  p.text(`Best Distance: ${Math.floor(gameState.maxDistance)}m`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 60);
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textSize(20);
  const flash = p.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(255 * flash, 255 * flash, 100);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
}

export function renderPlaying(p) {
  // Sky gradient
  for (let y = 0; y < GROUND_Y; y++) {
    const amt = y / GROUND_Y;
    const r = p.lerp(20, 80, amt);
    const g = p.lerp(20, 60, amt);
    const b = p.lerp(40, 40, amt);
    p.stroke(r, g, b);
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Ground
  p.noStroke();
  p.fill(60, 50, 40);
  p.rect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
  
  // Ground details
  p.stroke(50, 40, 30);
  for (let i = 0; i < 20; i++) {
    const x = (i * 50 + gameState.cameraX * 0.5) % CANVAS_WIDTH;
    p.line(x, GROUND_Y, x, CANVAS_HEIGHT);
  }
  
  // Distant mountains
  p.noStroke();
  p.fill(40, 40, 60, 100);
  for (let i = 0; i < 10; i++) {
    const x = (i * 100 - gameState.cameraX * 0.3) % (CANVAS_WIDTH + 200) - 100;
    const h = 80 + p.sin(i) * 30;
    p.triangle(x, GROUND_Y, x + 50, GROUND_Y - h, x + 100, GROUND_Y);
  }
  
  // Particles
  gameState.particles.forEach(particle => {
    const screenX = particle.x - gameState.cameraX;
    if (screenX > -20 && screenX < CANVAS_WIDTH + 20) {
      const alpha = (particle.life / 40) * 255;
      p.fill(...particle.color, alpha);
      p.noStroke();
      p.circle(screenX, particle.y, 4);
    }
  });
  
  // Zombies
  gameState.zombies.forEach(zombie => {
    if (zombie.health > 0) {
      zombie.render();
    }
  });
  
  // Player
  if (gameState.player) {
    gameState.player.render();
  }
  
  // HUD
  renderHUD(p);
  
  // Upgrade shop overlay
  if (gameState.upgradeShopOpen) {
    renderUpgradeShop(p);
  }
}

function renderHUD(p) {
  const padding = 10;
  const barWidth = 150;
  const barHeight = 20;
  
  // Distance
  p.fill(255, 255, 255);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(18);
  p.text(`Distance: ${Math.floor(gameState.distance)}m`, padding, padding);
  
  // Score
  p.text(`Score: ${gameState.score}`, padding, padding + 25);
  
  // Cash (current run)
  const runCash = Math.floor(gameState.distance * 0.5 + gameState.zombiesKilled * 10);
  p.fill(100, 255, 100);
  p.text(`Cash: $${runCash}`, padding, padding + 50);
  
  // Health bar
  const healthPercent = gameState.health / gameState.maxHealth;
  p.fill(100, 100, 100);
  p.rect(CANVAS_WIDTH - padding - barWidth, padding, barWidth, barHeight, 3);
  p.fill(healthPercent > 0.5 ? 100 : 255, healthPercent > 0.5 ? 255 : 100, 100);
  p.rect(CANVAS_WIDTH - padding - barWidth, padding, barWidth * healthPercent, barHeight, 3);
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(12);
  p.text("HEALTH", CANVAS_WIDTH - padding - barWidth / 2, padding + barHeight / 2);
  
  // Fuel bar
  const fuelPercent = gameState.fuel / gameState.maxFuel;
  p.fill(100, 100, 100);
  p.rect(CANVAS_WIDTH - padding - barWidth, padding + 30, barWidth, barHeight, 3);
  p.fill(fuelPercent > 0.3 ? 255 : 255, fuelPercent > 0.3 ? 200 : 100, 100);
  p.rect(CANVAS_WIDTH - padding - barWidth, padding + 30, barWidth * fuelPercent, barHeight, 3);
  p.fill(255);
  p.text("FUEL", CANVAS_WIDTH - padding - barWidth / 2, padding + 30 + barHeight / 2);
  
  // Nitro bar
  const nitroPercent = gameState.nitro / gameState.maxNitro;
  p.fill(100, 100, 100);
  p.rect(CANVAS_WIDTH - padding - barWidth, padding + 60, barWidth, barHeight, 3);
  p.fill(255, 150, 50);
  p.rect(CANVAS_WIDTH - padding - barWidth, padding + 60, barWidth * nitroPercent, barHeight, 3);
  p.fill(255);
  p.text("NITRO", CANVAS_WIDTH - padding - barWidth / 2, padding + 60 + barHeight / 2);
  
  // Checkpoint progress
  const checkpointPercent = p.min(1, gameState.distance / CHECKPOINT_DISTANCE);
  p.fill(100, 100, 100);
  p.rect(padding, CANVAS_HEIGHT - padding - barHeight, CANVAS_WIDTH - padding * 2, barHeight, 3);
  p.fill(100, 200, 255);
  p.rect(padding, CANVAS_HEIGHT - padding - barHeight, (CANVAS_WIDTH - padding * 2) * checkpointPercent, barHeight, 3);
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(`CHECKPOINT: ${Math.floor(checkpointPercent * 100)}%`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - padding - barHeight / 2);
  
  // Paused indicator
  if (gameState.gamePhase === "PAUSED") {
    p.fill(255, 255, 100);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.text("PAUSED", CANVAS_WIDTH - padding, padding);
  }
}

export function renderGameOver(p) {
  p.background(20, 20, 30);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Title
  p.fill(isWin ? 100 : 255, isWin ? 255 : 100, isWin ? 100 : 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "CHECKPOINT REACHED!" : "RUN ENDED", CANVAS_WIDTH / 2, 80);
  
  // Stats
  p.fill(255, 255, 255);
  p.textSize(20);
  p.text(`Distance: ${Math.floor(gameState.distance)}m`, CANVAS_WIDTH / 2, 150);
  p.text(`Zombies Killed: ${gameState.zombiesKilled}`, CANVAS_WIDTH / 2, 180);
  
  // Cash earned
  const earnedCash = Math.floor(gameState.distance * 0.5 + gameState.zombiesKilled * 10);
  p.fill(100, 255, 100);
  p.textSize(24);
  p.text(`Cash Earned: $${earnedCash}`, CANVAS_WIDTH / 2, 220);
  
  // Total cash
  p.fill(255, 200, 100);
  p.textSize(18);
  p.text(`Total Cash: $${Math.floor(gameState.totalCash)}`, CANVAS_WIDTH / 2, 260);
  
  // End condition
  p.fill(200, 200, 200);
  p.textSize(16);
  let endReason = "";
  if (isWin) {
    endReason = "You reached the checkpoint!";
  } else if (gameState.fuel <= 0) {
    endReason = "Out of fuel";
  } else if (gameState.health <= 0) {
    endReason = "Vehicle destroyed";
  }
  p.text(endReason, CANVAS_WIDTH / 2, 300);
  
  // Instructions
  p.fill(255, 255, 100);
  p.textSize(20);
  const flash = p.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(255 * flash, 255 * flash, 100);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}