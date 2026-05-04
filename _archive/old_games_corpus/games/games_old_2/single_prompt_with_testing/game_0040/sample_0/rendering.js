// rendering.js - Rendering functions

import { 
  gameState, 
  PHASE_START, 
  PHASE_PLAYING, 
  PHASE_PAUSED,
  PHASE_GAME_OVER_LOSE,
  CANVAS_WIDTH,
  CANVAS_HEIGHT
} from './globals.js';

export function drawStartScreen(p) {
  p.background(20, 30, 50);

  // Title
  p.fill(255, 200, 50);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("STICK WARS", CANVAS_WIDTH / 2, 80);

  // Description
  p.fill(200, 200, 255);
  p.textSize(14);
  p.text("Defend your castle against endless waves of stick invaders!", CANVAS_WIDTH / 2, 140);

  // Instructions box
  p.fill(40, 50, 70);
  p.rect(100, 170, 400, 160);
  
  p.fill(255, 255, 255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  p.text("CONTROLS:", 120, 180);
  p.text("Arrow Keys - Move targeting cursor", 120, 200);
  p.text("Z - Fire projectile at cursor", 120, 220);
  p.text("SPACE - Launch arrow volley", 120, 240);
  p.text("SHIFT - Deploy bomber (press again to detonate)", 120, 260);
  p.text("ESC - Pause/Unpause", 120, 280);
  p.text("R - Restart", 120, 300);

  // Start prompt
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  const flash = Math.sin(p.frameCount * 0.1) * 0.5 + 0.5;
  p.fill(255, 220, 100, 150 + flash * 105);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
}

export function drawGameScreen(p) {
  // Background
  p.background(40, 60, 80);
  
  // Ground
  p.fill(60, 100, 60);
  p.noStroke();
  p.rect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 50);

  // Draw castle
  drawCastle(p);

  // Draw entities
  for (const enemy of gameState.enemies) {
    enemy.draw();
  }

  for (const projectile of gameState.projectiles) {
    projectile.draw();
  }

  for (const effect of gameState.effects) {
    effect.draw();
  }

  // Draw bomber
  if (gameState.bomberActive) {
    drawBomber(p);
  }

  // Draw cursor
  drawCursor(p);

  // Draw UI
  drawUI(p);

  // Pause indicator
  if (gameState.gamePhase === PHASE_PAUSED) {
    p.fill(255, 255, 255);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }
}

function drawCastle(p) {
  const x = gameState.castleX;
  const y = gameState.castleY;

  p.push();
  p.translate(x, y);

  // Base
  p.fill(100, 100, 120);
  p.stroke(50, 50, 60);
  p.strokeWeight(2);
  p.rect(-30, -40, 60, 80);

  // Battlements
  for (let i = -30; i < 30; i += 15) {
    p.rect(i, -40, 10, -10);
  }

  // Tower
  p.fill(120, 120, 140);
  p.rect(-15, -60, 30, 20);
  p.triangle(-15, -60, 15, -60, 0, -75);

  // Door
  p.fill(60, 40, 20);
  p.rect(-10, 10, 20, 30);

  // Windows
  p.fill(255, 200, 100);
  p.rect(-8, -20, 6, 8);
  p.rect(2, -20, 6, 8);

  p.pop();

  // Castle health bar
  p.fill(200, 50, 50);
  p.noStroke();
  p.rect(10, 10, 150, 15);
  p.fill(50, 200, 50);
  const healthPercent = gameState.upgrades.castleHealth / gameState.upgrades.maxCastleHealth;
  p.rect(10, 10, 150 * healthPercent, 15);
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(10);
  p.text(`Castle: ${Math.max(0, Math.floor(gameState.upgrades.castleHealth))}/${gameState.upgrades.maxCastleHealth}`, 12, 12);
}

function drawCursor(p) {
  const x = gameState.cursor.x;
  const y = gameState.cursor.y;

  p.push();
  p.stroke(255, 0, 0);
  p.strokeWeight(2);
  p.noFill();
  
  // Crosshair
  p.line(x - 15, y, x - 5, y);
  p.line(x + 5, y, x + 15, y);
  p.line(x, y - 15, x, y - 5);
  p.line(x, y + 5, x, y + 15);
  p.ellipse(x, y, 20, 20);

  p.pop();
}

function drawBomber(p) {
  const x = gameState.bomberX;
  const y = gameState.bomberY;

  p.push();
  p.translate(x, y);

  // Plane body
  p.fill(80, 80, 80);
  p.stroke(40, 40, 40);
  p.strokeWeight(2);
  p.ellipse(0, 0, 40, 15);

  // Wings
  p.fill(100, 100, 100);
  p.rect(-15, -2, 30, 4);

  // Propeller
  const propAngle = p.frameCount * 0.5;
  p.push();
  p.translate(-20, 0);
  p.rotate(propAngle);
  p.fill(150, 150, 150);
  p.rect(-10, -1, 20, 2);
  p.pop();

  // Bomb indicator
  if (gameState.bomberReadyToDetonate) {
    p.fill(255, 0, 0);
    p.noStroke();
    p.ellipse(0, 10, 8, 12);
    
    // Pulsing glow
    const pulse = Math.sin(p.frameCount * 0.3) * 0.5 + 0.5;
    p.fill(255, 100, 0, pulse * 150);
    p.ellipse(0, 10, 15, 20);
  }

  p.pop();
}

function drawUI(p) {
  // Resources and score
  p.fill(255, 220, 100);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text(`Resources: ${gameState.resources}`, CANVAS_WIDTH - 10, 30);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 50);
  p.text(`Wave: ${gameState.wave}`, CANVAS_WIDTH - 10, 70);

  // Ability cooldowns
  drawCooldown(p, "Volley", gameState.lastVolleyTime, gameState.volleyCooldown, CANVAS_WIDTH - 160, CANVAS_HEIGHT - 60);
  drawCooldown(p, "Bomber", gameState.lastBomberTime, gameState.bomberCooldown, CANVAS_WIDTH - 160, CANVAS_HEIGHT - 35);

  // Upgrade hints
  if (gameState.resources >= 30) {
    p.fill(255, 255, 255, 150);
    p.textAlign(p.LEFT, p.BOTTOM);
    p.textSize(10);
    p.text("Upgrades available! Check browser console", 10, CANVAS_HEIGHT - 10);
  }
}

function drawCooldown(p, label, lastTime, cooldownDuration, x, y) {
  const currentTime = Date.now();
  const elapsed = currentTime - lastTime;
  const ready = elapsed >= cooldownDuration;

  p.fill(ready ? [0, 255, 0] : [100, 100, 100]);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(10);
  p.text(label, x, y);

  p.noFill();
  p.stroke(ready ? [0, 255, 0] : [100, 100, 100]);
  p.strokeWeight(2);
  p.rect(x + 45, y, 100, 12);

  if (!ready) {
    p.fill(0, 255, 0);
    const progress = elapsed / cooldownDuration;
    p.rect(x + 45, y, 100 * progress, 12);
  } else {
    p.fill(0, 255, 0);
    p.rect(x + 45, y, 100, 12);
  }
}

export function drawGameOverScreen(p) {
  p.background(20, 20, 30);

  // Game Over text
  p.fill(255, 50, 50);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(56);
  p.text("GAME OVER", CANVAS_WIDTH / 2, 120);

  // Stats
  p.fill(255, 255, 255);
  p.textSize(20);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 200);
  p.text(`Waves Survived: ${gameState.wave}`, CANVAS_WIDTH / 2, 230);
  p.text(`Enemies Defeated: ${Math.floor(gameState.score / 10)}`, CANVAS_WIDTH / 2, 260);

  // Restart prompt
  p.fill(200, 200, 255);
  p.textSize(18);
  const flash = Math.sin(p.frameCount * 0.1) * 0.5 + 0.5;
  p.fill(200, 200, 255, 150 + flash * 105);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);
}