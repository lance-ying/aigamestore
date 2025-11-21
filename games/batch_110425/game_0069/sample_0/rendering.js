import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';

export function renderGame(p) {
  // Clear with background
  p.background(30, 35, 40);
  
  // Apply camera shake
  if (gameState.cameraShake > 0) {
    gameState.cameraOffsetX = p.random(-gameState.cameraShake, gameState.cameraShake);
    gameState.cameraOffsetY = p.random(-gameState.cameraShake, gameState.cameraShake);
    gameState.cameraShake *= 0.9;
    if (gameState.cameraShake < 0.1) gameState.cameraShake = 0;
  }
  
  p.push();
  p.translate(gameState.cameraOffsetX, gameState.cameraOffsetY);
  
  // Draw ground pattern
  drawGroundPattern(p);
  
  // Draw entities
  drawExperienceOrbs(p);
  drawProjectiles(p);
  drawEnemies(p);
  drawParticles(p);
  
  if (gameState.player) {
    gameState.player.draw(p);
  }
  
  p.pop();
  
  // Draw UI
  drawUI(p);
  
  // Draw upgrade screen if pending
  if (gameState.pendingLevelUp) {
    drawUpgradeScreen(p);
  }
}

function drawGroundPattern(p) {
  p.stroke(40, 45, 50);
  p.strokeWeight(1);
  
  const gridSize = 40;
  for (let x = 0; x < CANVAS_WIDTH; x += gridSize) {
    p.line(x, 0, x, CANVAS_HEIGHT);
  }
  for (let y = 0; y < CANVAS_HEIGHT; y += gridSize) {
    p.line(0, y, CANVAS_WIDTH, y);
  }
}

function drawExperienceOrbs(p) {
  for (const orb of gameState.experienceOrbs) {
    const pulse = Math.sin(p.frameCount * 0.1) * 2;
    
    p.noStroke();
    p.fill(100, 255, 100, 150);
    p.circle(orb.x, orb.y, (orb.radius + pulse) * 2);
    
    p.fill(150, 255, 150);
    p.circle(orb.x, orb.y, orb.radius * 2);
  }
}

function drawProjectiles(p) {
  for (const proj of gameState.projectiles) {
    if (proj.owner === 'player') {
      p.fill(255, 200, 50);
      p.noStroke();
      p.circle(proj.x, proj.y, proj.radius * 2);
      
      // Trail
      p.fill(255, 200, 50, 100);
      p.circle(proj.x - proj.vx * 0.5, proj.y - proj.vy * 0.5, proj.radius * 1.5);
    } else {
      p.fill(...proj.color);
      p.noStroke();
      p.circle(proj.x, proj.y, proj.radius * 2);
    }
  }
}

function drawEnemies(p) {
  for (const enemy of gameState.enemies) {
    enemy.draw(p);
  }
}

function drawParticles(p) {
  for (const particle of gameState.particles) {
    const alpha = 255 * (particle.life / particle.maxLife);
    p.fill(...particle.color, alpha);
    p.noStroke();
    p.circle(particle.x, particle.y, particle.size);
  }
}

function drawUI(p) {
  // Top bar background
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 50);
  
  // Level and XP
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`Level ${gameState.player.level}`, 10, 10);
  
  // XP Bar
  const xpBarX = 10;
  const xpBarY = 32;
  const xpBarWidth = 150;
  const xpBarHeight = 10;
  
  p.fill(50);
  p.rect(xpBarX, xpBarY, xpBarWidth, xpBarHeight);
  
  const xpRatio = gameState.player.experience / gameState.player.experienceToNextLevel;
  p.fill(100, 200, 255);
  p.rect(xpBarX, xpBarY, xpBarWidth * xpRatio, xpBarHeight);
  
  // Score
  p.fill(255);
  p.textAlign(p.CENTER, p.TOP);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 10);
  
  // Time
  const seconds = Math.floor(gameState.elapsedTime / 60);
  const minutes = Math.floor(seconds / 60);
  const displaySeconds = seconds % 60;
  p.text(`Time: ${minutes}:${displaySeconds.toString().padStart(2, '0')}`, CANVAS_WIDTH / 2, 28);
  
  // Wave level
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`Wave ${gameState.waveLevel}`, CANVAS_WIDTH - 10, 10);
  
  // Boss warning
  if (gameState.currentBoss) {
    p.fill(255, 100, 100);
    p.textSize(20);
    p.textAlign(p.CENTER, p.CENTER);
    const bossText = "BOSS FIGHT!";
    const textX = CANVAS_WIDTH / 2;
    const textY = 70;
    
    // Pulsing effect
    const pulse = Math.sin(p.frameCount * 0.1) * 3;
    p.textSize(20 + pulse);
    p.text(bossText, textX, textY);
  }
  
  // Paused indicator
  if (gameState.gamePhase === PHASE_PAUSED) {
    p.fill(255);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    p.text("PAUSED", CANVAS_WIDTH - 10, 35);
  }
}

function drawUpgradeScreen(p) {
  // Darken background
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Title
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(28);
  p.text("LEVEL UP!", CANVAS_WIDTH / 2, 60);
  
  p.fill(200);
  p.textSize(14);
  p.text("Choose an upgrade (Press 1, 2, or 3)", CANVAS_WIDTH / 2, 90);
  
  // Upgrade choices
  const boxWidth = 160;
  const boxHeight = 120;
  const spacing = 20;
  const startX = (CANVAS_WIDTH - (boxWidth * 3 + spacing * 2)) / 2;
  const startY = 130;
  
  for (let i = 0; i < gameState.upgradeChoices.length; i++) {
    const upgrade = gameState.upgradeChoices[i];
    const x = startX + i * (boxWidth + spacing);
    
    // Box
    p.fill(60, 70, 80);
    p.stroke(100, 110, 120);
    p.strokeWeight(2);
    p.rect(x, startY, boxWidth, boxHeight, 5);
    
    // Number indicator
    p.fill(255, 220, 100);
    p.noStroke();
    p.textSize(24);
    p.text(i + 1, x + boxWidth / 2, startY + 25);
    
    // Name
    p.fill(255);
    p.textSize(14);
    p.text(upgrade.name, x + boxWidth / 2, startY + 55);
    
    // Description
    p.fill(200);
    p.textSize(11);
    const words = upgrade.description.split(' ');
    let line = '';
    let yOffset = 80;
    
    for (const word of words) {
      const testLine = line + word + ' ';
      if (p.textWidth(testLine) > boxWidth - 10) {
        p.text(line, x + boxWidth / 2, startY + yOffset);
        line = word + ' ';
        yOffset += 15;
      } else {
        line = testLine;
      }
    }
    p.text(line, x + boxWidth / 2, startY + yOffset);
  }
}

export function renderStartScreen(p) {
  p.background(20, 25, 30);
  
  // Animated background
  for (let i = 0; i < 50; i++) {
    const x = (p.frameCount * 0.5 + i * 50) % (CANVAS_WIDTH + 100) - 50;
    const y = (i * 37) % CANVAS_HEIGHT;
    p.fill(50, 55, 60, 100);
    p.noStroke();
    p.circle(x, y, 3);
  }
  
  // Title
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("BOUNTY OF ONE", CANVAS_WIDTH / 2, 80);
  
  p.textSize(20);
  p.fill(200, 180, 100);
  p.text("Premium Edition", CANVAS_WIDTH / 2, 115);
  
  // Description
  p.fill(200);
  p.textSize(14);
  p.textAlign(p.CENTER, p.CENTER);
  const desc = "Survive waves of bounty hunters!\nDefeat enemies, collect experience, and upgrade your hero.\nBosses appear every 5 minutes - defeat them to win!";
  const lines = desc.split('\n');
  for (let i = 0; i < lines.length; i++) {
    p.text(lines[i], CANVAS_WIDTH / 2, 160 + i * 20);
  }
  
  // Controls
  p.fill(255, 220, 100);
  p.textSize(16);
  p.text("CONTROLS", CANVAS_WIDTH / 2, 240);
  
  p.fill(200);
  p.textSize(13);
  p.textAlign(p.LEFT, p.CENTER);
  const controls = [
    "Arrow Keys: Move",
    "Space: Dash",
    "Z: Special Ability (when unlocked)",
    "ESC: Pause",
    "R: Restart"
  ];
  for (let i = 0; i < controls.length; i++) {
    p.text(controls[i], CANVAS_WIDTH / 2 - 100, 265 + i * 18);
  }
  
  // Start prompt (blinking)
  if (Math.floor(p.frameCount / 30) % 2 === 0) {
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(18);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
  }
}

export function renderGameOverScreen(p) {
  p.background(20, 25, 30);
  
  const isWin = gameState.gamePhase === PHASE_GAME_OVER_WIN;
  
  // Title
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "VICTORY!" : "GAME OVER", CANVAS_WIDTH / 2, 100);
  
  // Stats
  p.fill(255);
  p.textSize(20);
  
  const seconds = Math.floor(gameState.elapsedTime / 60);
  const minutes = Math.floor(seconds / 60);
  const displaySeconds = seconds % 60;
  
  p.text(`Time Survived: ${minutes}:${displaySeconds.toString().padStart(2, '0')}`, CANVAS_WIDTH / 2, 180);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 210);
  p.text(`Level Reached: ${gameState.player.level}`, CANVAS_WIDTH / 2, 240);
  p.text(`Wave: ${gameState.waveLevel}`, CANVAS_WIDTH / 2, 270);
  
  // Message
  p.fill(200);
  p.textSize(16);
  if (isWin) {
    p.text("You defeated the boss and proved your worth!", CANVAS_WIDTH / 2, 310);
  } else {
    p.text("The bounty hunters got the better of you...", CANVAS_WIDTH / 2, 310);
  }
  
  // Restart prompt
  p.fill(255);
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 360);
}