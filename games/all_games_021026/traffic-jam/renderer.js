import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE, CELL_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y } from './globals.js';
import { LEVELS } from './levels.js';
import { Particle } from './particle.js';

export function drawGame(p) {
  p.background(40, 45, 50);

  if (gameState.gamePhase === GAME_PHASES.START) {
    drawStartScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    drawPlayingScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    drawPlayingScreen(p);
    // Pause overlay removed as per feedback
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    drawGameOverScreen(p, true);
  }
}

function drawStartScreen(p) {
  // Main title replaced with "press enter to begin"
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("press enter to begin", CANVAS_WIDTH / 2, 80); // Replaced game title

  // Original subtitle "A Sliding Block Puzzle" removed as per feedback

  // Description box (preserved)
  p.fill(60, 65, 70);
  p.stroke(100, 105, 110);
  p.strokeWeight(2);
  p.rect(50, 150, CANVAS_WIDTH - 100, 140, 10);

  // Instructions (preserved)
  p.fill(255, 255, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  const instructions = [
    "OBJECTIVE: Navigate the RED BUS to the exit",
    "on the right side of the parking lot.",
    "",
    "HOW TO PLAY:",
    "• Arrow Keys: Move cursor on the grid",
    "• Space: Grab vehicle under cursor",
    "• Arrow Keys (while grabbed): Slide vehicle",
    "• Vehicles can only move along their orientation"
  ];
  
  let yPos = 160;
  instructions.forEach(line => {
    p.text(line, 70, yPos);
    yPos += 16;
  });

  // Original "PRESS ENTER TO START" prompt removed as it's redundant with the new main title.

  // Controls reminder (preserved)
  p.fill(150, 150, 150);
  p.textSize(12);
  p.text("R: Restart", CANVAS_WIDTH / 2, 370); // Removed ESC: Pause reference
}

function drawPlayingScreen(p) {
  // Draw grid background
  drawGrid(p);

  // Draw cursor (before vehicles so it's under them)
  if (!gameState.isGrabbing) {
    drawCursor(p);
  }

  // Draw exit indicator
  drawExit(p);

  // Draw vehicles
  gameState.entities.forEach(vehicle => {
    vehicle.draw(p);
  });

  // Draw particles
  gameState.particles = gameState.particles.filter(particle => {
    particle.update();
    particle.draw(p);
    return !particle.isDead();
  });

  // Create particles when level complete
  if (gameState.levelComplete && gameState.particles.length < 50) {
    const targetVehicle = gameState.entities.find(v => v.isTarget);
    if (targetVehicle) {
      const x = GRID_OFFSET_X + (targetVehicle.gridX + targetVehicle.length) * CELL_SIZE;
      const y = GRID_OFFSET_Y + targetVehicle.gridY * CELL_SIZE + CELL_SIZE / 2;
      for (let i = 0; i < 3; i++) {
        gameState.particles.push(new Particle(x, y, [255, 220, 100]));
      }
    }
  }

  // UI Panel
  drawUIPanel(p);

  // Instructions
  drawInstructions(p);

  // Level complete message
  if (gameState.levelComplete) {
    p.fill(100, 255, 100, 200);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(32);
    p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  }
}

function drawCursor(p) {
  const x = GRID_OFFSET_X + gameState.cursorX * CELL_SIZE;
  const y = GRID_OFFSET_Y + gameState.cursorY * CELL_SIZE;
  
  // Pulsing glow effect
  const pulseAlpha = 150 + Math.sin(p.frameCount * 0.15) * 50;
  
  // Outer glow
  p.fill(100, 200, 255, pulseAlpha * 0.3);
  p.noStroke();
  p.rect(x - 2, y - 2, CELL_SIZE + 4, CELL_SIZE + 4, 3);
  
  // Main cursor highlight
  p.fill(100, 200, 255, pulseAlpha * 0.5);
  p.stroke(100, 200, 255, pulseAlpha);
  p.strokeWeight(3);
  p.rect(x, y, CELL_SIZE, CELL_SIZE, 3);
  
  // Corner markers
  const cornerSize = 8;
  p.strokeWeight(3);
  p.stroke(100, 200, 255, pulseAlpha);
  p.noFill();
  
  // Top-left
  p.line(x, y + cornerSize, x, y);
  p.line(x, y, x + cornerSize, y);
  
  // Top-right
  p.line(x + CELL_SIZE - cornerSize, y, x + CELL_SIZE, y);
  p.line(x + CELL_SIZE, y, x + CELL_SIZE, y + cornerSize);
  
  // Bottom-left
  p.line(x, y + CELL_SIZE - cornerSize, x, y + CELL_SIZE);
  p.line(x, y + CELL_SIZE, x + cornerSize, y + CELL_SIZE);
  
  // Bottom-right
  p.line(x + CELL_SIZE - cornerSize, y + CELL_SIZE, x + CELL_SIZE, y + CELL_SIZE);
  p.line(x + CELL_SIZE, y + CELL_SIZE, x + CELL_SIZE, y + CELL_SIZE - cornerSize);
}

function drawGrid(p) {
  // Grid background
  p.fill(70, 75, 80);
  p.stroke(90, 95, 100);
  p.strokeWeight(2);
  p.rect(GRID_OFFSET_X - 5, GRID_OFFSET_Y - 5, GRID_SIZE * CELL_SIZE + 10, GRID_SIZE * CELL_SIZE + 10, 8);

  // Grid cells
  p.stroke(80, 85, 90);
  p.strokeWeight(1);
  for (let i = 0; i <= GRID_SIZE; i++) {
    // Vertical lines
    p.line(
      GRID_OFFSET_X + i * CELL_SIZE,
      GRID_OFFSET_Y,
      GRID_OFFSET_X + i * CELL_SIZE,
      GRID_OFFSET_Y + GRID_SIZE * CELL_SIZE
    );
    // Horizontal lines
    p.line(
      GRID_OFFSET_X,
      GRID_OFFSET_Y + i * CELL_SIZE,
      GRID_OFFSET_X + GRID_SIZE * CELL_SIZE,
      GRID_OFFSET_Y + i * CELL_SIZE
    );
  }
}

function drawExit(p) {
  const exitY = GRID_OFFSET_Y + 2 * CELL_SIZE;
  const exitX = GRID_OFFSET_X + GRID_SIZE * CELL_SIZE;

  // Exit arrow
  p.fill(100, 255, 100, 150);
  p.noStroke();
  p.triangle(
    exitX + 10, exitY + 10,
    exitX + 10, exitY + CELL_SIZE - 10,
    exitX + 35, exitY + CELL_SIZE / 2
  );

  // Exit label
  p.fill(100, 255, 100);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(12);
  p.text("EXIT", exitX + 40, exitY + CELL_SIZE / 2);
}

function drawUIPanel(p) {
  // Panel background
  p.fill(50, 55, 60);
  p.stroke(80, 85, 90);
  p.strokeWeight(2);
  p.rect(10, 10, 120, 110, 5);

  // Level info
  p.fill(255, 220, 100);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text("LEVEL " + (gameState.currentLevel + 1), 20, 20);
  
  p.fill(200, 200, 200);
  p.textSize(12);
  p.text(LEVELS[gameState.currentLevel].name, 20, 40);

  // Score
  p.fill(255, 255, 255);
  p.textSize(14);
  p.text("Score: " + gameState.score, 20, 65);

  // Moves
  p.text("Moves: " + gameState.moveCount, 20, 85);
}

function drawInstructions(p) {
  p.fill(60, 65, 70, 230);
  p.noStroke();
  p.rect(10, CANVAS_HEIGHT - 70, 200, 60, 5);

  p.fill(255, 255, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(11);
  
  if (gameState.isGrabbing) {
    p.fill(100, 255, 100);
    p.text("GRABBED!", 20, CANVAS_HEIGHT - 60);
    p.fill(255, 255, 255);
    p.text("Arrow Keys: Move", 20, CANVAS_HEIGHT - 45);
    p.text("Space: Release", 20, CANVAS_HEIGHT - 30);
  } else {
    p.text("Arrow Keys: Move cursor", 20, CANVAS_HEIGHT - 60);
    p.text("Space: Grab vehicle", 20, CANVAS_HEIGHT - 45);
  }
}

function drawGameOverScreen(p, isWin) {
  p.background(40, 45, 50);

  // Confetti effect for win
  if (isWin) {
    for (let i = 0; i < 30; i++) {
      const x = (p.frameCount * 2 + i * 20) % CANVAS_WIDTH;
      const y = ((p.frameCount * 3 + i * 30) % CANVAS_HEIGHT);
      const hue = (i * 360 / 30) % 360;
      p.fill((hue + 60) % 360, 200, 200);
      p.noStroke();
      p.circle(x, y, 5);
    }
  }

  // Title
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(56);
  p.text(isWin ? "VICTORY!" : "GAME OVER", CANVAS_WIDTH / 2, 100);

  // Stats box
  p.fill(60, 65, 70);
  p.stroke(100, 105, 110);
  p.strokeWeight(2);
  p.rect(150, 170, 300, 120, 10);

  p.fill(255, 255, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.text("FINAL SCORE", CANVAS_WIDTH / 2, 195);

  p.fill(255, 220, 100);
  p.textSize(48);
  p.text(gameState.score, CANVAS_WIDTH / 2, 240);

  // Restart prompt
  p.fill(200, 200, 200);
  p.textSize(20);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);
}