// renderer.js - Rendering functions
import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  ARENA_CENTER_X, 
  ARENA_CENTER_Y, 
  ARENA_RADIUS,
  GAME_DURATION
} from './globals.js';

export function renderGame(p) {
  // Clear background
  p.background(20, 25, 35);

  if (gameState.gamePhase === "START") {
    renderStartScreen(p);
  } else if (gameState.gamePhase === "PLAYING") {
    renderPlayingScreen(p);
  } else if (gameState.gamePhase === "PAUSED") {
    renderPlayingScreen(p);
    renderPausedOverlay(p);
  } else if (gameState.gamePhase.startsWith("GAME_OVER")) {
    renderGameOverScreen(p);
  }
}

function renderStartScreen(p) {
  p.push();
  
  // Title
  p.fill(100, 255, 150);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text("WORM ZONE", CANVAS_WIDTH / 2, 80);

  // Description
  p.fill(200, 220, 255);
  p.textSize(14);
  p.text("Grow your worm by eating food pellets!", CANVAS_WIDTH / 2, 140);
  p.text("Eliminate opponents by making them hit your body", CANVAS_WIDTH / 2, 160);
  p.text("Collect power-ups for special abilities", CANVAS_WIDTH / 2, 180);

  // Instructions
  p.fill(255, 200, 100);
  p.textSize(16);
  p.text("CONTROLS", CANVAS_WIDTH / 2, 220);
  
  p.fill(220, 220, 220);
  p.textSize(12);
  p.text("Arrow Keys: Steer your worm", CANVAS_WIDTH / 2, 245);
  p.text("Space: Speed Boost (costs mass)", CANVAS_WIDTH / 2, 265);
  p.text("ESC: Pause/Unpause", CANVAS_WIDTH / 2, 285);

  // Power-ups
  p.fill(255, 200, 100);
  p.textSize(14);
  p.text("POWER-UPS", CANVAS_WIDTH / 2, 315);
  
  p.fill(255, 100, 200);
  p.textSize(11);
  p.text("M - Magnet: Attracts nearby food", CANVAS_WIDTH / 2, 335);
  
  p.fill(100, 200, 255);
  p.textSize(11);
  p.text("Shield: Temporary invincibility", CANVAS_WIDTH / 2, 355);

  // Start prompt
  p.fill(100, 255, 100);
  p.textSize(18);
  const flash = Math.sin(p.frameCount * 0.1) * 0.5 + 0.5;
  p.fill(100 + flash * 155, 255, 100 + flash * 155);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 390);
  
  p.pop();
}

function renderPlayingScreen(p) {
  p.push();
  
  // Draw arena
  p.noFill();
  p.stroke(60, 80, 100);
  p.strokeWeight(3);
  p.ellipse(ARENA_CENTER_X, ARENA_CENTER_Y, ARENA_RADIUS * 2, ARENA_RADIUS * 2);
  
  // Arena boundary glow
  p.stroke(80, 120, 150, 50);
  p.strokeWeight(10);
  p.ellipse(ARENA_CENTER_X, ARENA_CENTER_Y, ARENA_RADIUS * 2, ARENA_RADIUS * 2);

  // Draw food
  for (const food of gameState.foods) {
    food.render(p, p.frameCount);
  }

  // Draw powerups
  for (const powerup of gameState.powerups) {
    powerup.render(p, p.frameCount);
  }

  // Draw worms (AI first, then player on top)
  for (const aiData of gameState.aiWorms) {
    aiData.worm.render(p);
  }
  
  if (gameState.player) {
    gameState.player.render(p);
  }

  // Draw UI
  renderUI(p);

  p.pop();
}

function renderUI(p) {
  p.push();
  
  // Score and mass
  p.fill(255, 255, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text(`Mass: ${Math.floor(gameState.mass)}`, 10, 10);
  p.text(`Score: ${gameState.score}`, 10, 30);

  // Time remaining
  const timeRemaining = Math.max(0, GAME_DURATION - gameState.elapsedTime);
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = Math.floor(timeRemaining % 60);
  p.text(`Time: ${minutes}:${seconds.toString().padStart(2, '0')}`, 10, 50);

  // Active powerups
  let powerupY = 75;
  if (gameState.activePowerups.magnet > 0) {
    p.fill(255, 100, 200);
    p.text(`Magnet: ${Math.ceil(gameState.activePowerups.magnet / 60)}s`, 10, powerupY);
    powerupY += 20;
  }
  if (gameState.activePowerups.shield > 0) {
    p.fill(100, 200, 255);
    p.text(`Shield: ${Math.ceil(gameState.activePowerups.shield / 60)}s`, 10, powerupY);
  }

  // Leaderboard
  p.fill(255, 255, 255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(12);
  p.text("LEADERBOARD", CANVAS_WIDTH - 10, 10);
  
  for (let i = 0; i < Math.min(5, gameState.leaderboard.length); i++) {
    const entry = gameState.leaderboard[i];
    const color = entry.isPlayer ? [100, 255, 100] : [200, 200, 200];
    p.fill(...color);
    p.text(`${i + 1}. ${entry.name}: ${Math.floor(entry.mass)}`, CANVAS_WIDTH - 10, 30 + i * 18);
  }

  p.pop();
}

function renderPausedOverlay(p) {
  p.push();
  p.fill(255, 255, 255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text("PAUSED", CANVAS_WIDTH - 10, CANVAS_HEIGHT - 25);
  p.pop();
}

function renderGameOverScreen(p) {
  p.push();
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 180);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Game Over message
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  p.textAlign(p.CENTER, p.CENTER);
  
  if (isWin) {
    p.fill(100, 255, 100);
    p.textSize(48);
    p.text("VICTORY!", CANVAS_WIDTH / 2, 120);
  } else {
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 120);
  }

  // Final stats
  p.fill(255, 255, 255);
  p.textSize(20);
  p.text(`Final Mass: ${Math.floor(gameState.mass)}`, CANVAS_WIDTH / 2, 180);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 210);
  p.text(`Time Survived: ${Math.floor(gameState.elapsedTime)}s`, CANVAS_WIDTH / 2, 240);

  // Rank
  let rank = 1;
  for (const entry of gameState.leaderboard) {
    if (entry.isPlayer) break;
    rank++;
  }
  p.text(`Final Rank: #${rank}`, CANVAS_WIDTH / 2, 270);

  // Restart prompt
  p.fill(200, 200, 200);
  p.textSize(16);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);

  p.pop();
}