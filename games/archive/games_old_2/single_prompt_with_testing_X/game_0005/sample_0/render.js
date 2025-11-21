// render.js - Rendering functions

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, ARENA, LEVELS } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 20, 40);
  
  // Title
  p.fill(255, 200, 50);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text("BOUNCE & COLLECT", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(200, 200, 255);
  p.textSize(18);
  p.textStyle(p.NORMAL);
  p.text("A Physics-Based Multiplier Game", CANVAS_WIDTH / 2, 130);
  
  // Instructions
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    "HOW TO PLAY:",
    "• Use LEFT/RIGHT arrows to position your drop point",
    "• Press SPACE to drop a ball",
    "• Guide balls through multiplier gates to boost score",
    "• Reach the target score to complete the level",
    "",
    "MULTIPLIERS:",
    "• x2, x3, x5, x10 = Score multipliers",
    "• +10, +15, +20 = Bonus points",
    "",
    "Complete all levels with strategic drops!"
  ];
  
  let y = 170;
  instructions.forEach(line => {
    p.text(line, 120, y);
    y += 20;
  });
  
  // Press ENTER prompt (animated)
  const alpha = 150 + Math.sin(p.frameCount * 0.1) * 100;
  p.fill(100, 255, 100, alpha);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.textStyle(p.BOLD);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
}

export function renderGame(p) {
  // Background gradient
  for (let y = 0; y < CANVAS_HEIGHT; y++) {
    const col = p.lerpColor(
      p.color(30, 30, 50),
      p.color(50, 50, 80),
      y / CANVAS_HEIGHT
    );
    p.stroke(col);
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Arena background
  p.fill(40, 40, 60, 150);
  p.noStroke();
  p.rect(ARENA.LEFT, ARENA.TOP, ARENA.WIDTH, ARENA.HEIGHT);
  
  // Arena border
  p.noFill();
  p.stroke(100, 100, 150);
  p.strokeWeight(3);
  p.rect(ARENA.LEFT, ARENA.TOP, ARENA.WIDTH, ARENA.HEIGHT);
  
  // Render multipliers
  gameState.multipliers.forEach(mult => mult.render());
  
  // Render moving obstacles
  gameState.movingObstacles.forEach(obs => obs.render());
  
  // Render pegs
  gameState.pegs.forEach(peg => peg.render());
  
  // Render balls
  gameState.balls.forEach(ball => ball.render());
  
  // Render particles
  gameState.particles.forEach(particle => particle.render());
  
  // Drop position indicator
  if (gameState.ballsRemaining > 0) {
    p.push();
    p.stroke(255, 255, 100);
    p.strokeWeight(2);
    p.fill(255, 255, 100, 100);
    
    // Arrow pointing down
    const arrowY = 60;
    p.line(gameState.dropX, arrowY, gameState.dropX, arrowY + 15);
    p.triangle(
      gameState.dropX - 5, arrowY + 15,
      gameState.dropX + 5, arrowY + 15,
      gameState.dropX, arrowY + 25
    );
    
    // Position marker
    p.circle(gameState.dropX, arrowY, 10);
    p.pop();
  }
  
  // UI Panel
  renderUI(p);
}

export function renderUI(p) {
  // Semi-transparent panel
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 50);
  
  const levelConfig = LEVELS[gameState.currentLevel - 1];
  
  // Level
  p.fill(255, 200, 50);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(18);
  p.textStyle(p.BOLD);
  p.text(`LEVEL ${gameState.currentLevel}`, 15, 25);
  
  // Score
  p.fill(100, 255, 100);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(16);
  p.text(`SCORE: ${gameState.score} / ${levelConfig.targetScore}`, 150, 25);
  
  // Balls remaining
  p.fill(100, 200, 255);
  p.textAlign(p.RIGHT, p.CENTER);
  p.textSize(16);
  p.text(`BALLS: ${gameState.ballsRemaining}`, CANVAS_WIDTH - 15, 25);
  
  // Control mode indicator
  if (gameState.controlMode !== "HUMAN") {
    p.fill(255, 100, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.text(`[${gameState.controlMode}]`, CANVAS_WIDTH / 2, 25);
  }
}

export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  p.textSize(18);
  p.textStyle(p.NORMAL);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

export function renderGameOver(p) {
  p.background(20, 20, 40);
  
  const won = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  const levelConfig = LEVELS[gameState.currentLevel - 1];
  
  // Title
  if (won) {
    p.fill(100, 255, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(56);
    p.textStyle(p.BOLD);
    p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, 100);
    
    // Stars animation
    for (let i = 0; i < 3; i++) {
      const x = CANVAS_WIDTH / 2 + (i - 1) * 80;
      const y = 160;
      const size = 30 + Math.sin(p.frameCount * 0.1 + i) * 5;
      drawStar(p, x, y, size, [255, 255, 100]);
    }
  } else {
    p.fill(255, 100, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(56);
    p.textStyle(p.BOLD);
    p.text("LEVEL FAILED", CANVAS_WIDTH / 2, 120);
  }
  
  // Stats
  p.fill(255);
  p.textSize(24);
  p.textStyle(p.NORMAL);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  
  if (!won) {
    p.fill(200, 200, 200);
    p.textSize(18);
    p.text(`Target: ${levelConfig.targetScore}`, CANVAS_WIDTH / 2, 250);
    p.text(`Needed: ${levelConfig.targetScore - gameState.score} more points`, CANVAS_WIDTH / 2, 280);
  } else if (gameState.currentLevel < LEVELS.length) {
    p.fill(200, 200, 200);
    p.textSize(18);
    p.text(`Next Level: ${gameState.currentLevel + 1}`, CANVAS_WIDTH / 2, 250);
  } else {
    p.fill(255, 200, 50);
    p.textSize(24);
    p.text("ALL LEVELS COMPLETED!", CANVAS_WIDTH / 2, 250);
  }
  
  // Instructions
  const alpha = 150 + Math.sin(p.frameCount * 0.1) * 100;
  p.fill(100, 200, 255, alpha);
  p.textSize(20);
  p.textStyle(p.BOLD);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);
}

function drawStar(p, x, y, size, color) {
  p.push();
  p.translate(x, y);
  p.rotate(p.frameCount * 0.02);
  
  p.fill(color[0], color[1], color[2]);
  p.stroke(255, 255, 255, 200);
  p.strokeWeight(2);
  
  p.beginShape();
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * p.PI / 5) - p.PI / 2;
    const r = i % 2 === 0 ? size : size / 2;
    p.vertex(r * Math.cos(angle), r * Math.sin(angle));
  }
  p.endShape(p.CLOSE);
  
  p.pop();
}