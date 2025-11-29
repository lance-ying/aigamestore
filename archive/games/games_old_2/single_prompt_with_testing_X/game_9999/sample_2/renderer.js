// renderer.js
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y } from './globals.js';
import { calculateFinalScore, getRank } from './scoring.js';

export function drawGame(p) {
  // Update camera to follow player
  if (gameState.player) {
    const targetX = gameState.player.x - CANVAS_WIDTH / 3;
    gameState.camera.x += (targetX - gameState.camera.x) * 0.1;
    
    // Clamp camera
    gameState.camera.x = Math.max(0, gameState.camera.x);
  }

  p.push();
  p.translate(-gameState.camera.x, 0);

  // Draw background
  drawBackground(p);

  // Draw ground
  p.fill(101, 67, 33);
  p.rect(0, GROUND_Y, CANVAS_WIDTH * 5, CANVAS_HEIGHT - GROUND_Y);
  
  // Grass on ground
  p.fill(34, 139, 34);
  p.rect(0, GROUND_Y, CANVAS_WIDTH * 5, 10);

  // Draw all entities
  for (let platform of gameState.platforms) {
    platform.draw(p);
  }

  for (let coin of gameState.coins) {
    coin.draw(p);
  }

  for (let enemy of gameState.enemies) {
    enemy.draw(p);
  }

  for (let pickup of gameState.pickups) {
    pickup.draw(p);
  }

  for (let entity of gameState.entities) {
    if (entity.draw && entity !== gameState.player && 
        !gameState.platforms.includes(entity) && 
        !gameState.coins.includes(entity) && 
        !gameState.enemies.includes(entity) && 
        !gameState.pickups.includes(entity)) {
      entity.draw(p);
    }
  }

  // Draw player last (on top)
  if (gameState.player) {
    gameState.player.draw(p);
  }

  p.pop();

  // Draw UI (not affected by camera)
  drawUI(p);

  // Paused indicator
  if (gameState.gamePhase === "PAUSED") {
    p.fill(255);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }
}

function drawBackground(p) {
  // Sky gradient
  for (let y = 0; y < GROUND_Y; y++) {
    const t = y / GROUND_Y;
    const r = p.lerp(135, 200, t);
    const g = p.lerp(206, 230, t);
    const b = p.lerp(235, 255, t);
    p.stroke(r, g, b);
    p.line(0, y, CANVAS_WIDTH * 5, y);
  }

  // Clouds
  p.noStroke();
  p.fill(255, 255, 255, 150);
  const cloudPositions = [
    { x: 100, y: 50 }, { x: 400, y: 80 }, { x: 700, y: 60 },
    { x: 1000, y: 70 }, { x: 1300, y: 55 }, { x: 1600, y: 85 }
  ];
  
  for (let cloud of cloudPositions) {
    p.ellipse(cloud.x, cloud.y, 60, 30);
    p.ellipse(cloud.x + 20, cloud.y - 5, 50, 35);
    p.ellipse(cloud.x + 40, cloud.y, 60, 30);
  }
}

function drawUI(p) {
  p.fill(0, 0, 0, 100);
  p.rect(0, 0, CANVAS_WIDTH, 40);

  // Health hearts
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text("Health:", 10, 10);

  for (let i = 0; i < gameState.maxHealth; i++) {
    if (i < gameState.health) {
      p.fill(255, 0, 0);
    } else {
      p.fill(100, 100, 100);
    }
    p.noStroke();
    // Draw heart
    p.beginShape();
    const hx = 80 + i * 25;
    const hy = 18;
    p.vertex(hx, hy + 3);
    p.bezierVertex(hx, hy, hx - 5, hy - 3, hx - 8, hy);
    p.bezierVertex(hx - 8, hy + 3, hx - 5, hy + 6, hx, hy + 10);
    p.bezierVertex(hx + 5, hy + 6, hx + 8, hy + 3, hx + 8, hy);
    p.bezierVertex(hx + 8, hy - 3, hx + 5, hy, hx, hy + 3);
    p.endShape(p.CLOSE);
  }

  // Score
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 10);

  // Coins collected
  p.textAlign(p.CENTER, p.TOP);
  p.text(`Coins: ${gameState.coinsCollected}/${gameState.totalCoins}`, CANVAS_WIDTH / 2, 10);

  // Time
  if (gameState.stageStartTime > 0) {
    const elapsed = Math.floor((Date.now() - gameState.stageStartTime) / 1000);
    p.textAlign(p.CENTER, p.TOP);
    p.text(`Time: ${elapsed}s / ${gameState.parTime}s`, CANVAS_WIDTH / 2, 25);
  }
}

export function drawStartScreen(p) {
  // Background
  const bg = p.color(20, 60, 120);
  p.background(bg);

  // Title
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("LEP'S WORLD", CANVAS_WIDTH / 2, 80);

  // Subtitle
  p.fill(255);
  p.textSize(20);
  p.text("Jump n Run Adventure", CANVAS_WIDTH / 2, 130);

  // Instructions box
  p.fill(0, 0, 0, 150);
  p.rect(50, 160, CANVAS_WIDTH - 100, 180, 10);

  p.fill(255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  
  const instructions = [
    "OBJECTIVE:",
    "• Navigate through platformer stages",
    "• Collect coins and avoid enemies",
    "• Reach the goal flag to complete each stage",
    "• Earn higher ranks (S, A, B, C) with skill",
    "",
    "CONTROLS:",
    "• Arrow Keys / A,D: Move Left/Right",
    "• Space: Jump (hold for higher jump)",
    "• Shift: Sprint",
    "• ESC: Pause  |  R: Restart"
  ];

  let y = 170;
  for (let line of instructions) {
    p.text(line, 70, y);
    y += 18;
  }

  // Start prompt
  p.fill(255, 255, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  const flash = Math.floor(p.frameCount / 30) % 2 === 0;
  if (flash) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
  }
}

export function drawGameOverScreen(p) {
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  if (isWin) {
    const finalScore = calculateFinalScore();
    const rank = getRank(finalScore);

    // Victory message
    p.fill(255, 215, 0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(42);
    p.text("STAGE COMPLETE!", CANVAS_WIDTH / 2, 80);

    // Rank display
    const rankColors = {
      'S': [255, 215, 0],
      'A': [0, 255, 100],
      'B': [100, 150, 255],
      'C': [200, 200, 200]
    };
    
    p.fill(...rankColors[rank]);
    p.textSize(72);
    p.text(`RANK: ${rank}`, CANVAS_WIDTH / 2, 150);

    // Score breakdown
    p.fill(255);
    p.textSize(16);
    p.textAlign(p.LEFT, p.TOP);
    
    const timeTaken = Math.floor((Date.now() - gameState.stageStartTime) / 1000);
    const breakdown = [
      `Final Score: ${finalScore}`,
      `Time: ${timeTaken}s / ${gameState.parTime}s`,
      `Coins: ${gameState.coinsCollected}/${gameState.totalCoins}`,
      `Hits Taken: ${gameState.hitsTaken}`,
      `Enemies Defeated: ${gameState.damageStreak}`,
      gameState.hitsTaken === 0 ? "No-Hit Bonus: +300" : ""
    ].filter(line => line);

    let y = 230;
    for (let line of breakdown) {
      p.text(line, 150, y);
      y += 25;
    }
  } else {
    // Game Over - Lost
    p.fill(255, 0, 0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 150);

    p.fill(255);
    p.textSize(20);
    p.text("You ran out of health!", CANVAS_WIDTH / 2, 220);
  }

  // Restart prompt
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  const flash = Math.floor(p.frameCount / 30) % 2 === 0;
  if (flash) {
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
  }
}