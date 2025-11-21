// render.js - Rendering functions

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export function renderStartScreen(p) {
  p.background(15, 15, 20);
  
  // Atmospheric dark background
  p.noStroke();
  for (let i = 0; i < 30; i++) {
    p.fill(20, 20, 25, 30);
    p.ellipse(p.random(CANVAS_WIDTH), p.random(CANVAS_HEIGHT), p.random(100, 200), p.random(100, 200));
  }
  
  // Title
  p.fill(200, 200, 210);
  p.textAlign(p.CENTER);
  p.textSize(48);
  p.text("LIMBO", CANVAS_WIDTH / 2, 80);
  
  // Description
  p.fill(150, 150, 160);
  p.textSize(14);
  p.textAlign(p.CENTER);
  const descLines = [
    "A dark journey through a mysterious world.",
    "Navigate deadly traps and solve puzzles to survive.",
    "",
    "Reach checkpoints to save your progress."
  ];
  for (let i = 0; i < descLines.length; i++) {
    p.text(descLines[i], CANVAS_WIDTH / 2, 140 + i * 20);
  }
  
  // Instructions
  p.fill(180, 180, 190);
  p.textSize(13);
  p.textAlign(p.LEFT);
  const instructions = [
    "CONTROLS:",
    "  Arrow Keys - Move left/right",
    "  SPACE - Jump",
    "  Z - Grab/interact (hold to maintain grip)",
    "",
    "GAME CONTROLS:",
    "  ESC - Pause",
    "  R - Restart to title"
  ];
  for (let i = 0; i < instructions.length; i++) {
    p.text(instructions[i], 150, 240 + i * 18);
  }
  
  // Start prompt
  p.fill(200, 200, 100);
  p.textAlign(p.CENTER);
  p.textSize(18);
  const alpha = 150 + Math.sin(p.frameCount * 0.1) * 100;
  p.fill(200, 200, 100, alpha);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
}

export function renderGame(p) {
  // Dark atmospheric background
  p.background(15, 15, 20);
  
  // Update camera to follow player
  if (gameState.player) {
    const targetCameraX = gameState.player.x - CANVAS_WIDTH / 3;
    gameState.cameraOffsetX += (targetCameraX - gameState.cameraOffsetX) * 0.1;
    gameState.cameraOffsetX = Math.max(0, Math.min(gameState.cameraOffsetX, gameState.levelWidth - CANVAS_WIDTH));
  }
  
  // Render fog/atmosphere
  p.noStroke();
  for (let i = 0; i < 20; i++) {
    p.fill(25, 25, 30, 20);
    const fogX = (i * 100 + p.frameCount * 0.3) % (CANVAS_WIDTH + 200) - 100;
    p.ellipse(fogX, p.random(0, CANVAS_HEIGHT), p.random(100, 200), p.random(50, 100));
  }
  
  // Render all entities
  for (let entity of gameState.entities) {
    if (entity.render) {
      entity.render(p, gameState.cameraOffsetX);
    }
  }
  
  // Render player
  if (gameState.player) {
    gameState.player.render(p, gameState.cameraOffsetX);
  }
  
  // UI
  renderUI(p);
  
  // Paused indicator
  if (gameState.gamePhase === "PAUSED") {
    p.fill(200, 200, 210);
    p.textAlign(p.RIGHT);
    p.textSize(14);
    p.text("PAUSED", CANVAS_WIDTH - 10, 20);
  }
}

export function renderUI(p) {
  // Death counter
  p.fill(200, 200, 210);
  p.textAlign(p.LEFT);
  p.textSize(14);
  p.text(`Deaths: ${gameState.deathCount}`, 10, 20);
  
  // Checkpoint indicator
  p.text(`Checkpoint: ${gameState.currentCheckpoint + 1}/${gameState.checkpoints.length}`, 10, 40);
}

export function renderGameOver(p, won) {
  p.background(15, 15, 20);
  
  p.fill(won ? 150 : 200, won ? 200 : 100, 100);
  p.textAlign(p.CENTER);
  p.textSize(42);
  p.text(won ? "ESCAPED" : "GAME OVER", CANVAS_WIDTH / 2, 150);
  
  p.fill(180, 180, 190);
  p.textSize(16);
  p.text(`Deaths: ${gameState.deathCount}`, CANVAS_WIDTH / 2, 200);
  p.text(`Checkpoints Reached: ${gameState.currentCheckpoint + 1}/${gameState.checkpoints.length}`, CANVAS_WIDTH / 2, 230);
  
  if (won) {
    p.fill(150, 200, 150);
    p.textSize(14);
    p.text("You have survived the dark journey.", CANVAS_WIDTH / 2, 270);
  }
  
  // Restart prompt
  p.fill(200, 200, 100);
  p.textSize(18);
  const alpha = 150 + Math.sin(p.frameCount * 0.1) * 100;
  p.fill(200, 200, 100, alpha);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);
}