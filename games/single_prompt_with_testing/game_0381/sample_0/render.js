import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE, GRID_COLS, GRID_ROWS } from './globals.js';

export function drawGame(p) {
  p.background(30, 30, 40);

  if (gameState.gamePhase === "START") {
    drawStartScreen(p);
  } else if (gameState.gamePhase === "PLAYING") {
    drawPlayingScreen(p);
  } else if (gameState.gamePhase === "PAUSED") {
    drawPlayingScreen(p);
    drawPauseOverlay(p);
  } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
    drawGameOverScreen(p);
  }
}

function drawStartScreen(p) {
  p.push();
  
  // Title
  p.fill(100, 180, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("FACTORYBLOCKS", CANVAS_WIDTH / 2, 80);

  // Description
  p.fill(200, 200, 220);
  p.textSize(16);
  p.text("Build automated factories for alien overlords!", CANVAS_WIDTH / 2, 140);

  // Instructions
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.fill(180, 180, 200);
  const instructions = [
    "OBJECTIVE:",
    "• Place conveyors to transport materials",
    "• Use processors to transform materials",
    "• Deliver required products to goals",
    "",
    "CONTROLS:",
    "• SHIFT: Toggle build mode",
    "• ARROW KEYS: Move cursor (in build mode)",
    "• Z: Cycle components",
    "• SPACE: Place/Remove component",
    "• ESC: Pause game"
  ];

  let yPos = 180;
  for (const line of instructions) {
    p.text(line, 80, yPos);
    yPos += 20;
  }

  // Start prompt
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  const flash = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(255 * flash, 220 * flash, 100 * flash);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);

  p.pop();
}

function drawPlayingScreen(p) {
  // Draw grid
  p.stroke(50, 50, 60);
  p.strokeWeight(1);
  for (let x = 0; x <= GRID_COLS; x++) {
    p.line(x * GRID_SIZE, 0, x * GRID_SIZE, CANVAS_HEIGHT);
  }
  for (let y = 0; y <= GRID_ROWS; y++) {
    p.line(0, y * GRID_SIZE, CANVAS_WIDTH, y * GRID_SIZE);
  }

  // Draw spawners
  for (const spawner of gameState.spawners) {
    spawner.draw(p);
  }

  // Draw goals
  for (const goal of gameState.goals) {
    goal.draw(p);
  }

  // Draw components
  for (const component of gameState.components) {
    component.draw(p);
  }

  // Draw materials
  for (const material of gameState.materials) {
    material.draw(p);
  }

  // Draw cursor in build mode
  if (gameState.buildMode) {
    p.push();
    p.noFill();
    p.stroke(255, 255, 100);
    p.strokeWeight(3);
    p.rect(
      gameState.cursorX * GRID_SIZE,
      gameState.cursorY * GRID_SIZE,
      GRID_SIZE,
      GRID_SIZE
    );
    p.pop();

    // Show selected component preview
    p.push();
    p.fill(255, 255, 255, 100);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    const x = gameState.cursorX * GRID_SIZE + GRID_SIZE / 2;
    const y = gameState.cursorY * GRID_SIZE + GRID_SIZE / 2;
    p.text(gameState.selectedComponent[0], x, y);
    p.pop();
  }

  // Draw UI
  drawUI(p);
}

function drawUI(p) {
  p.push();
  
  // Background panel
  p.fill(20, 20, 30, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 30);

  // Level and score
  p.fill(255, 255, 255);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(14);
  p.text(`Level ${gameState.level}`, 10, 15);
  p.text(`Score: ${gameState.score}`, 120, 15);
  
  // Progress
  p.text(`Products: ${gameState.deliveredProducts}/${gameState.requiredProducts}`, 250, 15);

  // Build mode indicator
  if (gameState.buildMode) {
    p.fill(100, 255, 100);
    p.text(`BUILD: ${gameState.selectedComponent}`, 450, 15);
  } else {
    p.fill(150, 150, 150);
    p.text("SHIFT: BUILD MODE", 450, 15);
  }

  p.pop();
}

function drawPauseOverlay(p) {
  p.push();
  p.fill(255, 255, 255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  p.pop();
}

function drawGameOverScreen(p) {
  p.push();
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Title
  p.fill(...(isWin ? [100, 255, 100] : [255, 100, 100]));
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "FACTORY COMPLETE!" : "FACTORY FAILED", CANVAS_WIDTH / 2, 120);

  // Score
  p.fill(255, 255, 255);
  p.textSize(32);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 200);

  // Message
  p.textSize(16);
  p.fill(200, 200, 220);
  if (isWin) {
    p.text("You've mastered factory automation!", CANVAS_WIDTH / 2, 250);
    p.text("The alien overlords are pleased.", CANVAS_WIDTH / 2, 275);
  } else {
    p.text("The factory production failed.", CANVAS_WIDTH / 2, 250);
  }

  // Restart prompt
  p.fill(255, 220, 100);
  p.textSize(20);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);

  p.pop();
}