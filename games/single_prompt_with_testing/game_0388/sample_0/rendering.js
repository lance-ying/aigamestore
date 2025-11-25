// rendering.js - Rendering functions

import { 
  gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, WEAPONS
} from './globals.js';

export function renderGame(p) {
  // Clear background
  p.background(25, 20, 30);
  
  // Draw game background grid
  drawBackground(p);
  
  if (gameState.gamePhase === GAME_PHASES.START) {
    renderStartScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    renderPlaying(p);
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    renderPlaying(p);
    renderPauseOverlay(p);
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
             gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    renderGameOver(p);
  }
}

function drawBackground(p) {
  p.stroke(40, 35, 45);
  p.strokeWeight(1);
  
  // Vertical lines
  for (let x = 0; x < CANVAS_WIDTH; x += 40) {
    p.line(x, 0, x, CANVAS_HEIGHT);
  }
  
  // Horizontal lines
  for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
    p.line(0, y, CANVAS_WIDTH, y);
  }
}

function renderStartScreen(p) {
  // Title
  p.fill(180, 20, 20);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("RED HOT VENGEANCE", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(200, 200, 200);
  p.textSize(16);
  p.text("A Night of Carnage", CANVAS_WIDTH / 2, 130);
  
  // Story
  p.textSize(13);
  p.fill(180, 180, 190);
  const story = [
    "Betrayed by your employer.",
    "Your code: NO KILLING INNOCENTS.",
    "",
    "Eliminate all hostile targets.",
    "Survive. Get revenge."
  ];
  
  for (let i = 0; i < story.length; i++) {
    p.text(story[i], CANVAS_WIDTH / 2, 170 + i * 22);
  }
  
  // Controls
  p.fill(220, 220, 220);
  p.textSize(12);
  p.textAlign(p.LEFT);
  p.text("ARROW KEYS - Move", 180, 290);
  p.text("SPACE - Shoot", 180, 310);
  p.text("SHIFT - Sprint", 180, 330);
  p.text("Z - Switch Weapon", 180, 350);
  
  // Start prompt
  p.fill(255, 200, 0);
  p.textAlign(p.CENTER);
  p.textSize(18);
  const pulseAlpha = 150 + Math.sin(p.frameCount * 0.1) * 105;
  p.fill(255, 200, 0, pulseAlpha);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 380);
}

function renderPlaying(p) {
  // Render particles first (behind everything)
  for (let particle of gameState.particles) {
    particle.render(p);
  }
  
  // Render bullets
  for (let bullet of gameState.bullets) {
    bullet.render(p);
  }
  
  // Render innocents
  for (let innocent of gameState.innocents) {
    innocent.render(p);
  }
  
  // Render enemies
  for (let enemy of gameState.enemies) {
    enemy.render(p);
  }
  
  // Render player
  if (gameState.player) {
    gameState.player.render(p);
  }
  
  // Render UI
  renderUI(p);
}

function renderUI(p) {
  // Health bar
  p.fill(50, 50, 60);
  p.noStroke();
  p.rect(10, 10, 150, 20, 3);
  
  const healthPercent = gameState.player.health / 100;
  const healthColor = healthPercent > 0.5 ? [100, 200, 100] : 
                      healthPercent > 0.25 ? [220, 180, 50] : [220, 50, 50];
  p.fill(...healthColor);
  p.rect(10, 10, 150 * healthPercent, 20, 3);
  
  p.fill(255);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(12);
  p.text(`HP: ${Math.ceil(gameState.player.health)}`, 15, 20);
  
  // Stamina bar
  p.fill(50, 50, 60);
  p.rect(10, 35, 150, 12, 2);
  
  const staminaPercent = gameState.player.stamina / 100;
  p.fill(100, 150, 220);
  p.rect(10, 35, 150 * staminaPercent, 12, 2);
  
  // Score
  p.fill(255, 220, 100);
  p.textAlign(p.RIGHT);
  p.textSize(16);
  p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 10, 20);
  
  // Level
  p.textSize(14);
  p.text(`LEVEL ${gameState.level}`, CANVAS_WIDTH - 10, 40);
  
  // Enemy count
  p.fill(220, 100, 100);
  p.textSize(12);
  p.text(`TARGETS: ${gameState.enemiesKilled}/${gameState.totalEnemies}`, CANVAS_WIDTH - 10, 60);
  
  // Current weapon
  const weapon = WEAPONS[gameState.currentWeapon];
  p.fill(200, 200, 200);
  p.textSize(14);
  p.text(`WEAPON: ${weapon.name}`, CANVAS_WIDTH - 10, 85);
  
  if (weapon.ammo !== Infinity) {
    p.textSize(12);
    p.text(`AMMO: ${weapon.ammo}`, CANVAS_WIDTH - 10, 100);
  }
  
  // Instructions
  p.fill(150, 150, 160);
  p.textSize(10);
  p.textAlign(p.CENTER);
  p.text("ESC: Pause  |  R: Restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 10);
}

function renderPauseOverlay(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Pause text
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  p.fill(200);
  p.textSize(14);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
}

function renderGameOver(p) {
  // Dark background with vignette
  p.background(15, 10, 20);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Title
  if (isWin) {
    p.fill(255, 200, 50);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("VENGEANCE COMPLETE", CANVAS_WIDTH / 2, 100);
    
    p.fill(200, 200, 200);
    p.textSize(18);
    p.text("Justice has been served.", CANVAS_WIDTH / 2, 150);
  } else {
    p.fill(220, 50, 50);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("MISSION FAILED", CANVAS_WIDTH / 2, 100);
    
    p.fill(200, 200, 200);
    p.textSize(18);
    
    if (gameState.player && gameState.player.health <= 0) {
      p.text("You were killed in action.", CANVAS_WIDTH / 2, 150);
    } else {
      p.fill(255, 100, 100);
      p.textSize(20);
      p.text("YOU KILLED AN INNOCENT", CANVAS_WIDTH / 2, 150);
      p.fill(200, 200, 200);
      p.textSize(14);
      p.text("The code was broken.", CANVAS_WIDTH / 2, 180);
    }
  }
  
  // Final score
  p.fill(255, 220, 100);
  p.textSize(24);
  p.text(`FINAL SCORE: ${gameState.score}`, CANVAS_WIDTH / 2, 230);
  
  // Stats
  p.fill(180, 180, 190);
  p.textSize(16);
  p.text(`Level Reached: ${gameState.level}`, CANVAS_WIDTH / 2, 270);
  p.text(`Enemies Eliminated: ${gameState.enemiesKilled}`, CANVAS_WIDTH / 2, 295);
  
  // Restart prompt
  p.fill(255, 200, 0);
  p.textSize(18);
  const pulseAlpha = 150 + Math.sin(p.frameCount * 0.1) * 105;
  p.fill(255, 200, 0, pulseAlpha);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 360);
}