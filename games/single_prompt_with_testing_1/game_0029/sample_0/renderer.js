// renderer.js - Render game graphics

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, CULTIVATION_STAGES } from './globals.js';

export function drawStartScreen(p) {
  p.background(10, 10, 30);

  // Draw decorative background
  p.noStroke();
  for (let i = 0; i < 50; i++) {
    const x = (p.frameCount * 0.5 + i * 50) % (CANVAS_WIDTH + 100) - 50;
    const y = (i * 30) % CANVAS_HEIGHT;
    p.fill(100, 150, 255, 30);
    p.circle(x, y, 20);
  }

  // Title
  p.fill(255, 220, 150);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("八荒修仙录", CANVAS_WIDTH / 2, 80);

  p.textSize(24);
  p.fill(200, 200, 255);
  p.text("Eight Desolations Cultivation", CANVAS_WIDTH / 2, 120);

  // Instructions
  p.textSize(16);
  p.fill(200, 220, 255);
  p.textAlign(p.CENTER, p.CENTER);

  const instructions = [
    "Embark on your journey to immortality",
    "",
    "Collect Qi orbs to advance cultivation stages",
    "Defeat demonic beasts using your techniques",
    "Achieve Immortality to win!",
    "",
    "Arrow Keys: Move",
    "Space: Attack",
    "Z: Spirit Burst (costs 10 Qi)",
    "",
    "ESC: Pause    R: Restart"
  ];

  let yPos = 180;
  for (const line of instructions) {
    p.text(line, CANVAS_WIDTH / 2, yPos);
    yPos += 20;
  }

  // Press ENTER prompt
  const flash = p.sin(p.frameCount * 0.1) * 0.5 + 0.5;
  p.fill(255, 255, 100, 150 + flash * 105);
  p.textSize(20);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
}

export function drawGame(p) {
  // Background
  p.background(20, 30, 50);

  // Draw grid pattern
  p.stroke(40, 50, 80);
  p.strokeWeight(1);
  const gridSize = 50;
  const offsetX = gameState.worldOffsetX % gridSize;
  const offsetY = gameState.worldOffsetY % gridSize;

  for (let x = -offsetX; x < CANVAS_WIDTH; x += gridSize) {
    p.line(x, 0, x, CANVAS_HEIGHT);
  }
  for (let y = -offsetY; y < CANVAS_HEIGHT; y += gridSize) {
    p.line(0, y, CANVAS_WIDTH, y);
  }

  // Draw particles (behind everything)
  for (const particle of gameState.particles) {
    particle.draw(gameState.worldOffsetX, gameState.worldOffsetY);
  }

  // Draw Qi orbs
  for (const orb of gameState.qiOrbs) {
    orb.draw(gameState.worldOffsetX, gameState.worldOffsetY);
  }

  // Draw enemies
  for (const enemy of gameState.enemies) {
    enemy.draw(gameState.worldOffsetX, gameState.worldOffsetY);
  }

  // Draw player
  gameState.player.draw();

  // Draw UI
  drawUI(p);

  // Draw pause indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.fill(255, 255, 255);
    p.textSize(14);
    p.textAlign(p.RIGHT, p.TOP);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }
}

export function drawUI(p) {
  const player = gameState.player;
  const stage = CULTIVATION_STAGES[gameState.cultivationStage];

  // Health bar
  p.fill(50);
  p.noStroke();
  p.rect(10, 10, 200, 20);
  const healthPercent = player.health / player.maxHealth;
  p.fill(255, 50, 50);
  p.rect(10, 10, 200 * healthPercent, 20);
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Health: ${Math.floor(player.health)}/${player.maxHealth}`, 15, 12);

  // Qi bar
  p.fill(50);
  p.rect(10, 35, 200, 15);
  p.fill(100, 150, 255);
  const nextStage = gameState.cultivationStage < CULTIVATION_STAGES.length - 1 
    ? CULTIVATION_STAGES[gameState.cultivationStage + 1].qiRequired 
    : stage.qiRequired;
  const qiPercent = Math.min(gameState.qi / nextStage, 1);
  p.rect(10, 35, 200 * qiPercent, 15);
  p.fill(255);
  p.text(`Qi: ${gameState.qi}/${nextStage}`, 15, 36);

  // Cultivation stage
  p.fill(...stage.color);
  p.textSize(16);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Realm: ${stage.name}`, 10, 60);

  // Score
  p.fill(255, 220, 100);
  p.textSize(14);
  p.text(`Score: ${gameState.score}`, 10, 85);

  // Cooldown indicators
  p.fill(200);
  p.textSize(12);
  if (player.attackCooldown > 0) {
    p.text(`Attack CD: ${Math.ceil(player.attackCooldown / 60)}s`, 10, 105);
  }
  if (player.specialCooldown > 0) {
    p.text(`Spirit CD: ${Math.ceil(player.specialCooldown / 60)}s`, 10, 120);
  }

  // Enemy count
  p.fill(255, 100, 100);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text(`Enemies: ${gameState.enemies.length}`, CANVAS_WIDTH - 10, 10);

  // Mini map
  drawMiniMap(p);
}

export function drawMiniMap(p) {
  const mapSize = 100;
  const mapX = CANVAS_WIDTH - mapSize - 10;
  const mapY = CANVAS_HEIGHT - mapSize - 10;
  const worldSize = 2000;
  const scale = mapSize / worldSize;

  // Background
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(mapX, mapY, mapSize, mapSize);

  // Player
  const px = mapX + gameState.player.worldX * scale;
  const py = mapY + gameState.player.worldY * scale;
  p.fill(100, 255, 100);
  p.circle(px, py, 4);

  // Enemies
  p.fill(255, 100, 100);
  for (const enemy of gameState.enemies) {
    const ex = mapX + enemy.worldX * scale;
    const ey = mapY + enemy.worldY * scale;
    p.circle(ex, ey, 3);
  }

  // Qi orbs
  p.fill(100, 150, 255);
  for (const orb of gameState.qiOrbs) {
    const ox = mapX + orb.worldX * scale;
    const oy = mapY + orb.worldY * scale;
    p.circle(ox, oy, 2);
  }

  // Border
  p.noFill();
  p.stroke(255);
  p.strokeWeight(1);
  p.rect(mapX, mapY, mapSize, mapSize);
}

export function drawGameOver(p) {
  p.background(10, 10, 30);

  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;

  // Title
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(isWin ? [255, 215, 0] : [255, 100, 100]);
  p.textSize(48);
  p.text(isWin ? "IMMORTALITY ACHIEVED!" : "CULTIVATION FAILED", CANVAS_WIDTH / 2, 100);

  // Stats
  p.fill(200, 220, 255);
  p.textSize(20);
  const stats = [
    "",
    `Final Realm: ${CULTIVATION_STAGES[gameState.cultivationStage].name}`,
    `Final Score: ${gameState.score}`,
    `Total Qi: ${gameState.qi}`,
    `Enemies Defeated: ${Math.floor(gameState.score / 50)}`,
    ""
  ];

  let yPos = 180;
  for (const stat of stats) {
    p.text(stat, CANVAS_WIDTH / 2, yPos);
    yPos += 30;
  }

  if (isWin) {
    p.fill(255, 215, 0);
    p.textSize(18);
    p.text("You have transcended mortality and", CANVAS_WIDTH / 2, yPos);
    p.text("united the Eight Desolations!", CANVAS_WIDTH / 2, yPos + 25);
  } else {
    p.fill(255, 150, 150);
    p.textSize(18);
    p.text("Your cultivation journey ends here.", CANVAS_WIDTH / 2, yPos);
    p.text("Try again to reach immortality!", CANVAS_WIDTH / 2, yPos + 25);
  }

  // Restart prompt
  const flash = p.sin(p.frameCount * 0.1) * 0.5 + 0.5;
  p.fill(255, 255, 100, 150 + flash * 105);
  p.textSize(20);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 370);
}