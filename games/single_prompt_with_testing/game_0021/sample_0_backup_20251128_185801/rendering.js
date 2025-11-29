// rendering.js
import { CANVAS_WIDTH, CANVAS_HEIGHT, GRID_OFFSET_X, GRID_OFFSET_Y, gameState } from './globals.js';
import { renderGrid } from './grid.js';

export function renderStartScreen(p) {
  p.background(20, 15, 15);
  
  // Title
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(255, 50, 80);
  p.textSize(48);
  p.text("HELLTAKER", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(200, 200, 200);
  p.textSize(16);
  p.text("Puzzle Your Way to a Demon Harem", CANVAS_WIDTH / 2, 130);
  
  // Description
  p.textSize(14);
  p.fill(180, 180, 180);
  const desc = [
    "You've descended into Hell with one goal:",
    "assemble a harem of demon girls!",
    "",
    "Navigate puzzle levels by pushing blocks",
    "and kicking skeletons to reach the goal.",
    "Plan carefully - moves are limited!"
  ];
  for (let i = 0; i < desc.length; i++) {
    p.text(desc[i], CANVAS_WIDTH / 2, 170 + i * 20);
  }
  
  // Controls
  p.textSize(12);
  p.fill(150, 150, 150);
  const controls = [
    "ARROW KEYS - Move",
    "SPACE - Push/Kick",
    "ESC - Pause",
    "R - Restart"
  ];
  for (let i = 0; i < controls.length; i++) {
    p.text(controls[i], CANVAS_WIDTH / 2, 300 + i * 18);
  }
  
  // Start prompt
  p.fill(255, 100, 100);
  p.textSize(18);
  const pulse = p.sin(p.frameCount * 0.1) * 30 + 225;
  p.fill(pulse, 50, 50);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
}

export function renderPlaying(p) {
  p.background(30, 25, 25);
  
  // Render grid and tiles
  renderGrid(p, gameState);
  
  // Render entities (except goal, render that first)
  const demonGirl = gameState.entities.find(e => e.type === 5);
  if (demonGirl) {
    demonGirl.render(p);
  }
  
  for (const entity of gameState.entities) {
    if (entity.type !== 5) {
      entity.render(p);
    }
  }
  
  // Render player
  if (gameState.player) {
    gameState.player.render(p);
  }
  
  // UI
  renderUI(p);
  
  // Pause indicator
  if (gameState.gamePhase === "PAUSED") {
    p.fill(255, 255, 255, 200);
    p.textSize(16);
    p.textAlign(p.RIGHT, p.TOP);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }
  
  // Level complete message
  if (gameState.levelComplete) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255, 100, 150);
    p.textSize(32);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("DEMON GIRL ACQUIRED!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    
    p.fill(255, 255, 255);
    p.textSize(16);
    p.text("Moving to next level...", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  }
}

export function renderUI(p) {
  // HUD background
  p.fill(20, 15, 15, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 50);
  p.rect(0, CANVAS_HEIGHT - 30, CANVAS_WIDTH, 30);
  
  // Score
  p.fill(255, 200, 100);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(16);
  p.text(`SCORE: ${gameState.score}`, 10, 25);
  
  // Level
  p.fill(200, 200, 255);
  p.text(`LEVEL: ${gameState.currentLevel + 1}/${5}`, 200, 25);
  
  // Moves
  const movesColor = gameState.movesRemaining < 5 ? [255, 100, 100] : [100, 255, 100];
  p.fill(...movesColor);
  p.text(`MOVES: ${gameState.movesRemaining}`, 380, 25);
  
  // Health
  p.fill(255, 100, 100);
  p.textAlign(p.LEFT, p.CENTER);
  p.text("HEALTH: ", 10, CANVAS_HEIGHT - 15);
  for (let i = 0; i < gameState.player.health; i++) {
    p.fill(255, 50, 50);
    p.rect(90 + i * 25, CANVAS_HEIGHT - 23, 20, 16, 2);
  }
  
  // Demons collected
  p.fill(255, 150, 200);
  p.textAlign(p.RIGHT, p.CENTER);
  p.text(`DEMONS: ${gameState.demonsCollected}/${5}`, CANVAS_WIDTH - 10, CANVAS_HEIGHT - 15);
}

export function renderGameOver(p) {
  p.background(20, 15, 15);
  
  const won = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Title
  p.textAlign(p.CENTER, p.CENTER);
  if (won) {
    p.fill(255, 100, 150);
    p.textSize(48);
    p.text("HAREM COMPLETE!", CANVAS_WIDTH / 2, 100);
    
    p.fill(200, 200, 200);
    p.textSize(20);
    p.text("You've won the hearts of all the demon girls!", CANVAS_WIDTH / 2, 160);
  } else {
    p.fill(255, 50, 50);
    p.textSize(48);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 100);
    
    p.fill(200, 200, 200);
    p.textSize(20);
    p.text("Hell claims another victim...", CANVAS_WIDTH / 2, 160);
  }
  
  // Stats
  p.fill(180, 180, 180);
  p.textSize(16);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  p.text(`Demons Collected: ${gameState.demonsCollected}/5`, CANVAS_WIDTH / 2, 250);
  p.text(`Levels Completed: ${gameState.currentLevel}/5`, CANVAS_WIDTH / 2, 280);
  
  // Restart prompt
  p.fill(255, 200, 100);
  p.textSize(18);
  const pulse = p.sin(p.frameCount * 0.1) * 30 + 225;
  p.fill(pulse, pulse * 0.8, 100);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 350);
}