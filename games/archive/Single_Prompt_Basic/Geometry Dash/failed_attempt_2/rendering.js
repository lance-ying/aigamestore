import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  GROUND_HEIGHT,
  COLORS
} from './globals.js';
import { isOnScreen } from './physics.js';

// Draw the game background
export function drawBackground(p, gameState) {
  // Clear background
  p.background(...COLORS.BACKGROUND);
  
  // Draw grid lines
  drawGrid(p, gameState);
  
  // Draw ground
  p.fill(...COLORS.GROUND);
  p.noStroke();
  p.rect(CANVAS_WIDTH / 2, CANVAS_HEIGHT - GROUND_HEIGHT / 2, CANVAS_WIDTH, GROUND_HEIGHT);
}

// Draw grid lines that move with scrolling
function drawGrid(p, gameState) {
  const gridSize = 50;
  const offset = gameState.distance % gridSize;
  
  p.stroke(...COLORS.GRID);
  p.strokeWeight(1);
  
  // Vertical lines
  for (let x = -offset; x < CANVAS_WIDTH; x += gridSize) {
    p.line(x, 0, x, CANVAS_HEIGHT - GROUND_HEIGHT);
  }
  
  // Horizontal lines
  for (let y = 0; y < CANVAS_HEIGHT - GROUND_HEIGHT; y += gridSize) {
    p.line(0, y, CANVAS_WIDTH, y);
  }
}

// Draw game entities
export function drawEntities(p, gameState) {
  // Draw only visible entities
  for (const entity of gameState.entities) {
    if (isOnScreen(entity)) {
      entity.draw(p);
    }
  }
}

// Draw UI elements
export function drawUI(p, gameState) {
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.fill(...COLORS.TEXT_PRIMARY);
  p.noStroke();
  
  // Display distance and score
  p.text(`Distance: ${Math.floor(gameState.distance)}`, 10, 10);
  p.text(`Jumps: ${gameState.jumpCount}`, 10, 30);
  p.text(`Deaths: ${gameState.deathCount}`, 10, 50);
  
  // Display current checkpoint
  if (gameState.currentCheckpoint > 0) {
    p.text(`Checkpoint: ${gameState.currentCheckpoint}/${gameState.checkpoints.length}`, 10, 70);
  }
  
  // Show speed indicator
  p.text(`Speed: ${gameState.scrollSpeed.toFixed(1)}`, CANVAS_WIDTH - 120, 10);
  
  // Draw pause indicator
  if (gameState.gamePhase === "PAUSED") {
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(20);
    p.fill(...COLORS.TEXT_PRIMARY);
    p.text("PAUSED", CANVAS_WIDTH - 20, 20);
  }
}

// Draw start screen
export function drawStartScreen(p) {
  p.background(...COLORS.BACKGROUND);
  
  // Draw title
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.fill(...COLORS.TEXT_PRIMARY);
  p.text("GEOMETRY DASH", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
  
  // Draw instructions
  p.textSize(20);
  p.fill(...COLORS.TEXT_SECONDARY);
  p.text("Navigate your cube through obstacles", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  p.text("Time your jumps to avoid spikes and reach the end", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  
  // Draw controls
  p.textSize(18);
  p.text("SPACE: Jump", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
  p.text("ESC: Pause", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 110);
  p.text("R: Restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 140);
  
  // Draw start prompt
  p.textSize(24);
  p.fill(...COLORS.TEXT_PRIMARY);
  const blinkRate = Math.sin(p.frameCount * 0.1) * 0.5 + 0.5;
  p.fill(...COLORS.TEXT_PRIMARY, 255 * blinkRate);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.8);
}

// Draw game over screen (win)
export function drawWinScreen(p, gameState) {
  p.background(...COLORS.BACKGROUND);
  
  // Draw title
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.fill(100, 255, 100);
  p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
  
  // Draw stats
  p.textSize(24);
  p.fill(...COLORS.TEXT_PRIMARY);
  p.text(`Total Distance: ${Math.floor(gameState.distance)}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  p.text(`Total Jumps: ${gameState.jumpCount}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  p.text(`Deaths: ${gameState.deathCount}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
  
  // Draw restart prompt
  p.textSize(24);
  const blinkRate = Math.sin(p.frameCount * 0.1) * 0.5 + 0.5;
  p.fill(...COLORS.TEXT_PRIMARY, 255 * blinkRate);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.8);
}

// Draw game over screen (lose)
export function drawLoseScreen(p, gameState) {
  p.background(...COLORS.BACKGROUND);
  
  // Draw title
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.fill(255, 100, 100);
  p.text("GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
  
  // Draw stats
  p.textSize(24);
  p.fill(...COLORS.TEXT_PRIMARY);
  p.text(`Distance: ${Math.floor(gameState.distance)}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  p.text(`Total Deaths: ${gameState.deathCount}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  
  // Draw restart prompt
  p.textSize(24);
  const blinkRate = Math.sin(p.frameCount * 0.1) * 0.5 + 0.5;
  p.fill(...COLORS.TEXT_PRIMARY, 255 * blinkRate);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.8);
}