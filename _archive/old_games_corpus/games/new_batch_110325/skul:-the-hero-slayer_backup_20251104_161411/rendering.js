// rendering.js
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y } from './globals.js';

export function drawGame(p) {
  // Clear background
  p.background(20, 15, 30);
  
  if (gameState.gamePhase === GAME_PHASES.START) {
    drawStartScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    drawPlayingScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    drawPlayingScreen(p);
    drawPauseOverlay(p);
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    drawGameOverScreen(p);
  }
}

function drawStartScreen(p) {
  // Background gradient
  for (let y = 0; y < CANVAS_HEIGHT; y += 2) {
    const alpha = p.map(y, 0, CANVAS_HEIGHT, 50, 150);
    p.stroke(30, 20, 50, alpha);
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Title
  p.fill(255, 200, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("SKUL", CANVAS_WIDTH / 2, 80);
  
  p.textSize(24);
  p.fill(200, 150, 255);
  p.text("The Hero Slayer", CANVAS_WIDTH / 2, 120);
  
  // Instructions
  p.fill(255);
  p.textSize(14);
  p.text("Fight through dangerous dungeons!", CANVAS_WIDTH / 2, 170);
  p.text("Collect skulls to change your abilities", CANVAS_WIDTH / 2, 190);
  p.text("Gather items to power up", CANVAS_WIDTH / 2, 210);
  p.text("Earn Dark Quartz for permanent upgrades", CANVAS_WIDTH / 2, 230);
  
  // Controls box
  p.fill(40, 30, 60);
  p.rect(150, 250, 300, 100);
  
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.CENTER);
  p.text("Arrow Keys: Move & Jump", 170, 270);
  p.text("Space: Attack", 170, 290);
  p.text("Z: Swap Skulls", 170, 310);
  p.text("Shift: Dash", 170, 330);
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  const pulse = p.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(255, 255, 100, pulse * 255);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
}

function drawPlayingScreen(p) {
  // Draw background
  drawBackground(p);
  
  // Draw ground
  p.fill(40, 35, 50);
  p.rect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
  
  // Draw entities
  for (let particle of gameState.particles) {
    particle.draw(p);
  }
  
  for (let item of gameState.items) {
    item.draw(p);
  }
  
  for (let skull of gameState.skulls) {
    skull.draw(p);
  }
  
  for (let projectile of gameState.projectiles) {
    projectile.draw(p);
  }
  
  for (let enemy of gameState.enemies) {
    enemy.draw(p);
  }
  
  if (gameState.player) {
    gameState.player.draw(p);
  }
  
  // Draw UI
  drawUI(p);
  
  // Room transition message
  if (gameState.roomComplete && gameState.transitionTimer > 60) {
    p.fill(255, 255, 100, p.map(gameState.transitionTimer, 120, 60, 255, 0));
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(32);
    p.text("ROOM CLEARED!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  }
}

function drawBackground(p) {
  // Dungeon background with parallax effect
  for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
    p.stroke(25, 20, 35);
    p.strokeWeight(2);
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  for (let x = 0; x < CANVAS_WIDTH; x += 60) {
    p.stroke(25, 20, 35);
    p.strokeWeight(2);
    p.line(x, 0, x, GROUND_Y);
  }
}

function drawUI(p) {
  if (!gameState.player) return;
  
  // Top bar background
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, 60);
  
  // Player health
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text("HP:", 10, 10);
  p.fill(100, 0, 0);
  p.rect(40, 10, 120, 15);
  p.fill(200, 0, 0);
  p.rect(40, 10, 120 * (gameState.player.health / gameState.player.maxHealth), 15);
  
  // Current skull
  p.fill(255);
  p.text("Skull:", 10, 30);
  p.fill(...gameState.player.currentSkull.color);
  p.ellipse(65, 38, 15, 15);
  p.fill(255);
  p.textSize(10);
  p.text(gameState.player.currentSkull.name, 80, 32);
  
  // Score and stats
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(12);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  p.text(`Room: ${gameState.currentRoom}/${5}`, CANVAS_WIDTH - 10, 25);
  p.text(`Dark Quartz: ${gameState.darkQuartz}`, CANVAS_WIDTH - 10, 40);
  
  // Skull collection indicator
  p.fill(255);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(10);
  p.text(`Skulls: ${gameState.player.collectedSkulls.length}`, CANVAS_WIDTH / 2, 10);
  
  // Draw collected skulls
  let skullX = CANVAS_WIDTH / 2 - (gameState.player.collectedSkulls.length * 15) / 2;
  for (let i = 0; i < gameState.player.collectedSkulls.length; i++) {
    const skull = gameState.player.collectedSkulls[i];
    if (i === gameState.player.currentSkullIndex) {
      p.fill(255, 255, 100);
      p.ellipse(skullX + i * 15, 35, 12, 12);
    }
    p.fill(...skull.color);
    p.ellipse(skullX + i * 15, 35, 10, 10);
  }
  
  // Stats
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(9);
  p.text(`ATK: ${Math.floor(gameState.player.attack)}`, 200, 10);
  p.text(`SPD: ${gameState.player.speed.toFixed(1)}`, 200, 22);
  p.text(`Items: ${gameState.player.collectedItems.length}`, 200, 34);
}

function drawPauseOverlay(p) {
  p.fill(255, 255, 255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 70);
}

function drawGameOverScreen(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 180);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Game Over text
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    p.fill(100, 255, 100);
    p.text("VICTORY!", CANVAS_WIDTH / 2, 120);
  } else {
    p.fill(255, 100, 100);
    p.text("DEFEATED", CANVAS_WIDTH / 2, 120);
  }
  
  // Stats
  p.fill(255);
  p.textSize(20);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
  p.text(`Rooms Cleared: ${gameState.roomsCleared}`, CANVAS_WIDTH / 2, 210);
  p.text(`Dark Quartz Earned: ${gameState.darkQuartz}`, CANVAS_WIDTH / 2, 240);
  p.text(`Total Dark Quartz: ${gameState.permanentDarkQuartz}`, CANVAS_WIDTH / 2, 270);
  
  // Restart prompt
  p.fill(255, 255, 100);
  p.textSize(18);
  const pulse = p.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(255, 255, 100, pulse * 255);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);
}