import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, LEVELS, BALL_COLORS, COLOR_NAMES } from './globals.js';

export function drawStartScreen(p) {
  p.background(20, 25, 40);
  
  // Title
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("CHAIN POP!", CANVAS_WIDTH / 2, 80);
  
  // Decorative balls
  for (let i = 0; i < 5; i++) {
    const x = CANVAS_WIDTH / 2 - 100 + i * 50;
    const y = 140;
    const color = BALL_COLORS[COLOR_NAMES[i]];
    p.fill(color[0], color[1], color[2]);
    p.stroke(0);
    p.strokeWeight(2);
    p.ellipse(x, y, 30);
  }
  
  // Instructions
  p.fill(200, 200, 220);
  p.textSize(16);
  p.textAlign(p.CENTER, p.TOP);
  
  const instructions = [
    "Connect adjacent balls of the same color!",
    "Complete objectives to advance through 5 levels.",
    "",
    "ARROW KEYS: Move cursor",
    "SPACE: Select ball / Complete chain",
    "Z: Use bomb booster (3x3 clear)",
    "ESC: Pause game",
    "R: Restart to title"
  ];
  
  let yPos = 190;
  for (const line of instructions) {
    p.text(line, CANVAS_WIDTH / 2, yPos);
    yPos += 24;
  }
  
  // High score
  if (gameState.highScore > 0) {
    p.fill(255, 220, 100);
    p.textSize(20);
    p.text(`HIGH SCORE: ${gameState.highScore}`, CANVAS_WIDTH / 2, yPos + 10);
  }
  
  // Start prompt
  p.fill(100, 255, 100);
  p.textSize(24);
  const flash = Math.sin(p.frameCount * 0.1) > 0;
  if (flash) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  }
}

export function drawPlayingScreen(p) {
  p.background(20, 25, 40);
  
  // UI Header
  drawUI(p);
  
  // Grid background
  p.fill(30, 35, 50);
  p.noStroke();
  p.rect(
    gameState.gridOffsetX - 5,
    gameState.gridOffsetY - 5,
    gameState.gridCols * gameState.cellSize + 10,
    gameState.gridRows * gameState.cellSize + 10,
    5
  );
  
  // Grid lines
  p.stroke(50, 55, 70);
  p.strokeWeight(1);
  for (let i = 0; i <= gameState.gridRows; i++) {
    const y = gameState.gridOffsetY + i * gameState.cellSize;
    p.line(
      gameState.gridOffsetX,
      y,
      gameState.gridOffsetX + gameState.gridCols * gameState.cellSize,
      y
    );
  }
  for (let i = 0; i <= gameState.gridCols; i++) {
    const x = gameState.gridOffsetX + i * gameState.cellSize;
    p.line(
      x,
      gameState.gridOffsetY,
      x,
      gameState.gridOffsetY + gameState.gridRows * gameState.cellSize
    );
  }
  
  // Cursor
  const cursorX = gameState.gridOffsetX + gameState.cursorX * gameState.cellSize;
  const cursorY = gameState.gridOffsetY + gameState.cursorY * gameState.cellSize;
  p.noFill();
  p.stroke(255, 255, 100);
  p.strokeWeight(3);
  p.rect(cursorX, cursorY, gameState.cellSize, gameState.cellSize);
  
  // Draw chain connections
  if (gameState.currentChain.length > 1) {
    p.stroke(255, 255, 255, 150);
    p.strokeWeight(4);
    for (let i = 0; i < gameState.currentChain.length - 1; i++) {
      const ball1 = gameState.currentChain[i];
      const ball2 = gameState.currentChain[i + 1];
      p.line(ball1.x, ball1.y, ball2.x, ball2.y);
    }
  }
  
  // Draw balls
  for (let row = 0; row < gameState.gridRows; row++) {
    for (let col = 0; col < gameState.gridCols; col++) {
      const ball = gameState.grid[row][col];
      if (ball) {
        ball.draw();
      }
    }
  }
  
  // Draw particles
  for (const particle of gameState.particles) {
    particle.draw();
  }
  
  // Level transition overlay
  if (gameState.showLevelTransition) {
    drawLevelTransition(p);
  }
}

function drawUI(p) {
  p.fill(255, 255, 255);
  p.textSize(16);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`LEVEL: ${gameState.currentLevel}`, 10, 10);
  
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  
  p.textAlign(p.CENTER, p.TOP);
  p.text(`MOVES: ${gameState.movesLeft}`, CANVAS_WIDTH / 2, 10);
  
  // Objectives
  p.textSize(14);
  let objText = "GOALS: ";
  const objectives = gameState.objectives;
  const objParts = [];
  
  if (objectives.targetScore) {
    const progress = Math.min(gameState.score, objectives.targetScore);
    objParts.push(`Score ${progress}/${objectives.targetScore}`);
  }
  
  if (objectives.totalBalls) {
    const progress = Math.min(gameState.clearedBalls.totalBalls, objectives.totalBalls);
    objParts.push(`Clear ${progress}/${objectives.totalBalls}`);
  }
  
  for (const color of COLOR_NAMES) {
    if (objectives[color]) {
      const progress = Math.min(gameState.clearedBalls[color], objectives[color]);
      objParts.push(`${color} ${progress}/${objectives[color]}`);
    }
  }
  
  objText += objParts.join(" | ");
  p.text(objText, CANVAS_WIDTH / 2, 32);
  
  // Booster
  p.textAlign(p.LEFT, p.TOP);
  p.fill(gameState.boostersAvailable > 0 ? [100, 255, 100] : [100, 100, 100]);
  p.text(`BOMBS: ${gameState.boostersAvailable}`, 10, 32);
}

function drawLevelTransition(p) {
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text(`LEVEL ${gameState.currentLevel} COMPLETE!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  
  p.fill(255, 255, 255);
  p.textSize(24);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
  
  if (gameState.currentLevel < LEVELS.length) {
    p.textSize(20);
    p.text(`Starting Level ${gameState.currentLevel + 1}...`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
  }
}

export function drawPausedScreen(p) {
  drawPlayingScreen(p);
  
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 255, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  
  p.textSize(20);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  p.text("Press R to restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
  
  // Small paused indicator in top right
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.fill(255, 255, 100);
  p.text("PAUSED", CANVAS_WIDTH - 10, 50);
}

export function drawGameOverScreen(p) {
  p.background(20, 25, 40);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "CONGRATULATIONS!" : "GAME OVER", CANVAS_WIDTH / 2, 100);
  
  p.fill(255, 255, 255);
  p.textSize(24);
  p.text(isWin ? "You completed all levels!" : "Better luck next time!", CANVAS_WIDTH / 2, 160);
  
  p.textSize(32);
  p.fill(255, 220, 100);
  p.text(`TOTAL SCORE: ${gameState.totalScore}`, CANVAS_WIDTH / 2, 220);
  
  if (gameState.totalScore >= gameState.highScore) {
    p.fill(255, 220, 100);
    p.textSize(20);
    p.text("NEW HIGH SCORE!", CANVAS_WIDTH / 2, 260);
  } else if (gameState.highScore > 0) {
    p.fill(200, 200, 200);
    p.textSize(18);
    p.text(`High Score: ${gameState.highScore}`, CANVAS_WIDTH / 2, 260);
  }
  
  p.fill(255, 255, 255);
  p.textSize(20);
  p.text("Press R to restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 60);
}