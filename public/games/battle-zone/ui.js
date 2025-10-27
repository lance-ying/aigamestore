import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export function drawUI(p) {
  p.push();
  
  // Always draw in screen space (not affected by camera)
  
  // Health bar
  if (gameState.player) {
    const healthPercentage = gameState.player.health / gameState.player.maxHealth;
    p.noStroke();
    p.fill(50);
    p.rect(20, 20, 150, 15);
    p.fill(255, 0, 0);
    p.rect(20, 20, 150 * healthPercentage, 15);
    p.fill(255);
    p.textSize(12);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(`HEALTH: ${gameState.player.health}/${gameState.player.maxHealth}`, 95, 27);
    
    // Ammo counter
    p.fill(50);
    p.rect(20, 45, 150, 15);
    p.fill(255, 200, 0);
    const ammoPercentage = gameState.player.ammo / gameState.player.maxAmmo;
    p.rect(20, 45, 150 * ammoPercentage, 15);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(`AMMO: ${gameState.player.ammo}/${gameState.player.maxAmmo}`, 95, 52);
    
    // Reloading indicator
    if (gameState.player.reloading) {
      p.fill(255, 200, 0);
      p.textAlign(p.LEFT, p.CENTER);
      p.text("RELOADING...", 180, 52);
    }
  }
  
  // Score/Kill counter
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 20, 20);
  
  // Mission objective
  p.textAlign(p.CENTER, p.TOP);
  if (gameState.mission === "elimination") {
    p.text(`ELIMINATE ENEMIES: ${gameState.enemiesKilled}/${gameState.requiredKills}`, CANVAS_WIDTH / 2, 20);
  } else {
    p.text("REACH EXTRACTION POINT", CANVAS_WIDTH / 2, 20);
  }
  
  // Time elapsed
  const minutes = Math.floor(gameState.timeElapsed / 60);
  const seconds = Math.floor(gameState.timeElapsed % 60);
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`TIME: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`, CANVAS_WIDTH - 20, 40);
  
  // Status indicators
  if (gameState.player) {
    p.textAlign(p.LEFT, p.BOTTOM);
    p.textSize(12);
    if (gameState.player.isSprinting) {
      p.fill(0, 200, 255);
      p.text("SPRINTING", 20, CANVAS_HEIGHT - 20);
    } else if (gameState.player.isCrouching) {
      p.fill(0, 255, 200);
      p.text("TAKING COVER", 20, CANVAS_HEIGHT - 20);
    }
  }
  
  // Pause indicator
  if (gameState.gamePhase === "PAUSED") {
    p.fill(255);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.text("PAUSED", CANVAS_WIDTH - 20, 70);
  }
  
  p.pop();
}

export function drawStartScreen(p) {
  p.push();
  p.background(20);
  
  // Title
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text("BATTLE ZONE", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 4);
  
  // Game description
  p.textSize(16);
  p.textAlign(p.CENTER, p.CENTER);
  const description = [
    "You are an elite soldier on a critical mission.",
    "Eliminate enemies or reach the extraction point to complete your objective.",
    "Watch your health and ammunition levels.",
    "Use cover and tactical positioning to survive."
  ];
  
  for (let i = 0; i < description.length; i++) {
    p.text(description[i], CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30 + i * 25);
  }
  
  // Controls
  p.textSize(14);
  p.text("CONTROLS:", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
  p.text("Arrow Keys: Move | Z: Shoot | SPACE: Sprint | SHIFT: Take Cover", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
  p.text("ESC: Pause | R: Restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
  
  // Start prompt
  p.textSize(20);
  if (Math.floor(p.frameCount / 30) % 2 === 0) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT * 3 / 4 + 30);
  }
  
  p.pop();
}

export function drawGameOverScreen(p, won) {
  p.push();
  p.fill(0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  
  if (won) {
    p.fill(0, 255, 100);
    p.text("MISSION COMPLETE", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
  } else {
    p.fill(255, 50, 50);
    p.text("MISSION FAILED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
  }
  
  p.fill(255);
  p.textSize(20);
  p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  const minutes = Math.floor(gameState.timeElapsed / 60);
  const seconds = Math.floor(gameState.timeElapsed % 60);
  p.text(`TIME: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  
  p.text(`ENEMIES ELIMINATED: ${gameState.enemiesKilled}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
  
  // Restart prompt
  p.textSize(20);
  if (Math.floor(p.frameCount / 30) % 2 === 0) {
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT * 3 / 4);
  }
  
  p.pop();
}