// UI rendering
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';

export function renderStartScreen(p) {
  p.background(...COLORS.background);
  
  // Draw grid background
  drawGrid(p);
  
  // Title with animation
  const titleY = CANVAS_HEIGHT / 2 - 80;
  const titlePulse = Math.sin(p.frameCount * 0.05) * 5;
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('VVVVVV', CANVAS_WIDTH / 2, titleY + titlePulse);
  
  // Subtitle
  p.textSize(16);
  p.fill(100, 200, 255);
  p.text('GRAVITY FLIP ADVENTURE', CANVAS_WIDTH / 2, titleY + 50);
  
  // Instructions
  p.fill(255);
  p.textSize(14);
  p.text('Find and rescue all 6 crew members!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
  
  // Controls
  p.textSize(12);
  p.fill(200);
  p.text('Arrow Keys: Move', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  p.text('Space: Flip Gravity', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
  p.text('ESC: Pause  |  R: Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
  
  // Start prompt
  const promptAlpha = (Math.sin(p.frameCount * 0.1) + 1) / 2 * 255;
  p.fill(255, 255, 0, promptAlpha);
  p.textSize(20);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 110);
}

export function renderUI(p) {
  // Score
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text(`Score: ${gameState.score}`, 10, 10);
  
  // Crew counter
  p.textAlign(p.RIGHT, p.TOP);
  const crewColor = gameState.collectedCrew === gameState.totalCrew ? [0, 255, 0] : [255, 255, 255];
  p.fill(...crewColor);
  p.text(`Crew: ${gameState.collectedCrew}/${gameState.totalCrew}`, CANVAS_WIDTH - 10, 10);
  
  // Death counter
  p.fill(200);
  p.textSize(12);
  p.text(`Deaths: ${gameState.deathCount}`, CANVAS_WIDTH - 10, 30);
  
  // Room coordinates (for debugging)
  p.fill(100);
  p.textSize(10);
  p.text(`Room: ${gameState.currentRoom.x},${gameState.currentRoom.y}`, CANVAS_WIDTH - 10, 50);
}

export function renderPausedOverlay(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Paused text
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  p.textSize(16);
  p.text('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
}

export function renderGameOver(p) {
  // Background overlay
  p.fill(0, 0, 0, 220);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Game over text
  p.fill(isWin ? 0 : 255, isWin ? 255 : 100, isWin ? 100 : 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? 'MISSION COMPLETE!' : 'GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
  
  // Stats
  p.fill(255);
  p.textSize(20);
  p.text(`Crew Rescued: ${gameState.collectedCrew}/${gameState.totalCrew}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
  p.text(`Deaths: ${gameState.deathCount}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  
  // Restart instruction
  p.textSize(16);
  const promptAlpha = (Math.sin(p.frameCount * 0.1) + 1) / 2 * 255;
  p.fill(255, 255, 0, promptAlpha);
  p.text('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
}

function drawGrid(p) {
  p.stroke(...COLORS.gridLine);
  p.strokeWeight(1);
  
  // Vertical lines
  for (let x = 0; x < CANVAS_WIDTH; x += CANVAS_WIDTH / 20) {
    p.line(x, 0, x, CANVAS_HEIGHT);
  }
  
  // Horizontal lines
  for (let y = 0; y < CANVAS_HEIGHT; y += CANVAS_HEIGHT / 20) {
    p.line(0, y, CANVAS_WIDTH, y);
  }
}

export function renderGame(p) {
  // Apply screen shake
  if (gameState.screenShake > 0) {
    p.translate(
      (Math.random() - 0.5) * gameState.screenShake,
      (Math.random() - 0.5) * gameState.screenShake
    );
  }
  
  // Draw grid background
  drawGrid(p);
  
  // Draw platforms
  for (const platform of gameState.platforms) {
    platform.render(p);
  }
  
  // Draw spikes
  for (const spike of gameState.spikes) {
    spike.render(p);
  }
  
  // Draw checkpoints
  for (const checkpoint of gameState.checkpoints) {
    checkpoint.render(p);
  }
  
  // Draw crew members
  for (const crew of gameState.crewMembers) {
    crew.render(p);
  }
  
  // Draw player
  if (gameState.player) {
    gameState.player.render(p);
  }
  
  // Draw particles
  for (const particle of gameState.particles) {
    particle.render(p);
  }
  
  // Draw transition effect
  if (gameState.transitioning) {
    const alpha = (gameState.transitionTimer / 15) * 255;
    p.fill(0, 0, 0, alpha);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }
}