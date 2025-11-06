// rendering.js
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, WIN_TIME } from './globals.js';

export function renderGame(p) {
  p.background(20, 15, 25);
  
  switch (gameState.gamePhase) {
    case GAME_PHASES.START:
      renderStartScreen(p);
      break;
    case GAME_PHASES.PLAYING:
      renderPlaying(p);
      if (gameState.levelUpPending) {
        renderLevelUpScreen(p);
      }
      break;
    case GAME_PHASES.PAUSED:
      renderPlaying(p);
      renderPausedOverlay(p);
      break;
    case GAME_PHASES.GAME_OVER_WIN:
    case GAME_PHASES.GAME_OVER_LOSE:
      renderPlaying(p);
      renderGameOverScreen(p);
      break;
  }
}

function renderStartScreen(p) {
  p.push();
  
  // Title
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("HALLS OF TORMENT", CANVAS_WIDTH / 2, 60);
  
  // Subtitle
  p.fill(200, 180, 150);
  p.textSize(16);
  p.text("Roguelike Survival Arena", CANVAS_WIDTH / 2, 100);
  
  // Description box
  p.fill(40, 35, 45);
  p.rect(50, 130, CANVAS_WIDTH - 100, 100);
  
  p.fill(220, 220, 220);
  p.textSize(14);
  p.textAlign(p.CENTER, p.TOP);
  p.text("Survive waves of monsters for 5 minutes!", CANVAS_WIDTH / 2, 140);
  p.text("Collect experience to level up and choose abilities.", CANVAS_WIDTH / 2, 160);
  p.text("Defeat enemies for gold and rare items.", CANVAS_WIDTH / 2, 180);
  p.text("Face powerful bosses every 60 seconds!", CANVAS_WIDTH / 2, 200);
  
  // Controls
  p.fill(255, 200, 100);
  p.textSize(16);
  p.textAlign(p.CENTER, p.TOP);
  p.text("CONTROLS", CANVAS_WIDTH / 2, 250);
  
  p.fill(200, 200, 200);
  p.textSize(13);
  p.textAlign(p.LEFT, p.TOP);
  p.text("Arrow Keys: Move", 100, 280);
  p.text("Space: Special Ability (when unlocked)", 100, 300);
  p.text("ESC: Pause", 100, 320);
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textSize(20);
  p.textAlign(p.CENTER, p.CENTER);
  const flash = Math.sin(p.frameCount * 0.1) > 0;
  if (flash) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
  }
  
  p.pop();
}

function renderPlaying(p) {
  // Background grid
  p.stroke(40, 35, 45);
  p.strokeWeight(1);
  for (let x = 0; x < CANVAS_WIDTH; x += 40) {
    p.line(x, 0, x, CANVAS_HEIGHT);
  }
  for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Render particles (behind everything)
  for (let particle of gameState.particles) {
    const alpha = particle.getAlpha() * 255;
    p.fill(...particle.color, alpha);
    p.noStroke();
    p.circle(particle.x, particle.y, particle.radius * 2);
  }
  
  // Render XP orbs
  for (let orb of gameState.xpOrbs) {
    p.fill(100, 255, 150);
    p.noStroke();
    p.circle(orb.x, orb.y, orb.radius * 2);
    p.fill(150, 255, 200, 150);
    p.circle(orb.x, orb.y, orb.radius);
  }
  
  // Render items
  for (let item of gameState.items) {
    const y = item.displayY || item.y;
    p.fill(...item.itemData.color);
    p.stroke(255, 255, 255);
    p.strokeWeight(2);
    p.circle(item.x, y, item.radius * 2);
    
    // Glow
    p.noStroke();
    p.fill(...item.itemData.color, 100);
    p.circle(item.x, y, item.radius * 3);
  }
  
  // Render projectiles
  for (let proj of gameState.projectiles) {
    p.fill(255, 200, 50);
    p.noStroke();
    p.circle(proj.x, proj.y, proj.radius * 2);
    p.fill(255, 255, 150);
    p.circle(proj.x, proj.y, proj.radius);
  }
  
  // Render enemies
  for (let enemy of gameState.enemies) {
    if (enemy.isDead) continue;
    
    const color = enemy.isBoss ? [200, 50, 255] : [255, 80, 80];
    p.fill(...color);
    p.stroke(0);
    p.strokeWeight(2);
    p.circle(enemy.x, enemy.y, enemy.radius * 2);
    
    // Health bar
    const barWidth = enemy.radius * 2;
    const healthPercent = enemy.health / enemy.maxHealth;
    p.fill(50, 50, 50);
    p.noStroke();
    p.rect(enemy.x - barWidth / 2, enemy.y - enemy.radius - 8, barWidth, 4);
    p.fill(255, 100, 100);
    p.rect(enemy.x - barWidth / 2, enemy.y - enemy.radius - 8, barWidth * healthPercent, 4);
    
    if (enemy.isBoss) {
      // Boss crown
      p.fill(255, 215, 0);
      p.noStroke();
      p.triangle(
        enemy.x - 8, enemy.y - enemy.radius - 12,
        enemy.x, enemy.y - enemy.radius - 20,
        enemy.x + 8, enemy.y - enemy.radius - 12
      );
    }
  }
  
  // Render player
  if (gameState.player) {
    const player = gameState.player;
    const isInvuln = player.invulnerable > 0 && p.frameCount % 6 < 3;
    
    if (!isInvuln) {
      // Player body
      p.fill(100, 200, 255);
      p.stroke(255);
      p.strokeWeight(2);
      p.circle(player.x, player.y, player.radius * 2);
      
      // Attack range indicator (subtle)
      p.noFill();
      p.stroke(100, 200, 255, 50);
      p.strokeWeight(1);
      p.circle(player.x, player.y, player.attackRange * 2);
    }
    
    // Health bar
    p.fill(50, 50, 50);
    p.noStroke();
    p.rect(player.x - 20, player.y - player.radius - 8, 40, 5);
    const healthPercent = player.health / player.maxHealth;
    p.fill(100, 255, 100);
    p.rect(player.x - 20, player.y - player.radius - 8, 40 * healthPercent, 5);
  }
  
  // UI
  renderUI(p);
}

function renderUI(p) {
  p.push();
  p.fill(40, 35, 45, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 35);
  
  // Time
  const timeLeft = Math.max(0, WIN_TIME - gameState.playTime);
  const minutes = Math.floor(timeLeft / 60);
  const seconds = Math.floor(timeLeft % 60);
  p.fill(255, 220, 100);
  p.textSize(16);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Time: ${minutes}:${seconds.toString().padStart(2, '0')}`, 10, 8);
  
  // Level
  p.fill(150, 255, 150);
  p.text(`Level ${gameState.level}`, 120, 8);
  
  // XP bar
  const xpPercent = gameState.xp / (gameState.level * 100);
  p.fill(60, 60, 60);
  p.rect(210, 12, 100, 10);
  p.fill(100, 255, 150);
  p.rect(210, 12, 100 * xpPercent, 10);
  
  // Score
  p.fill(255, 215, 0);
  p.text(`Score: ${gameState.score}`, 320, 8);
  
  // Gold
  p.fill(255, 215, 0);
  p.text(`Gold: ${gameState.gold}`, 440, 8);
  
  // Wave
  p.fill(200, 150, 255);
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`Wave ${gameState.waveNumber}`, CANVAS_WIDTH - 10, 8);
  
  // Health bar (bottom)
  if (gameState.player) {
    const barWidth = 200;
    const barHeight = 20;
    const x = CANVAS_WIDTH / 2 - barWidth / 2;
    const y = CANVAS_HEIGHT - barHeight - 10;
    
    p.fill(40, 35, 45, 200);
    p.rect(x - 5, y - 5, barWidth + 10, barHeight + 10);
    
    p.fill(100, 30, 30);
    p.rect(x, y, barWidth, barHeight);
    
    const healthPercent = gameState.player.health / gameState.player.maxHealth;
    p.fill(255, 100, 100);
    p.rect(x, y, barWidth * healthPercent, barHeight);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text(`${Math.ceil(gameState.player.health)} / ${gameState.player.maxHealth}`, CANVAS_WIDTH / 2, y + barHeight / 2);
  }
  
  // Special cooldown
  if (gameState.player && gameState.player.abilities.length > 0) {
    const cooldownPercent = 1 - (gameState.player.specialCooldown / gameState.player.maxSpecialCooldown);
    const size = 30;
    const x = CANVAS_WIDTH - size - 15;
    const y = CANVAS_HEIGHT - size - 15;
    
    p.fill(40, 35, 45, 200);
    p.rect(x - 5, y - 5, size + 10, size + 10);
    
    p.fill(60, 60, 80);
    p.rect(x, y, size, size);
    
    if (cooldownPercent >= 1) {
      p.fill(100, 200, 255);
    } else {
      p.fill(80, 80, 100);
    }
    p.rect(x, y + size * (1 - cooldownPercent), size, size * cooldownPercent);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.text("SPC", x + size / 2, y + size / 2);
  }
  
  p.pop();
}

function renderLevelUpScreen(p) {
  p.push();
  
  // Overlay
  p.fill(0, 0, 0, 180);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Title
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("LEVEL UP!", CANVAS_WIDTH / 2, 80);
  
  p.fill(200, 200, 200);
  p.textSize(16);
  p.text("Choose an ability:", CANVAS_WIDTH / 2, 120);
  
  // Ability choices
  const boxWidth = 160;
  const boxHeight = 100;
  const spacing = 20;
  const startX = (CANVAS_WIDTH - (boxWidth * 3 + spacing * 2)) / 2;
  const startY = 150;
  
  for (let i = 0; i < gameState.abilityChoices.length; i++) {
    const ability = gameState.abilityChoices[i];
    const x = startX + i * (boxWidth + spacing);
    const y = startY;
    
    // Box
    p.fill(60, 55, 70);
    p.stroke(255, 220, 100);
    p.strokeWeight(2);
    p.rect(x, y, boxWidth, boxHeight);
    
    // Key indicator
    p.fill(255, 220, 100);
    p.noStroke();
    p.textSize(20);
    p.textAlign(p.CENTER, p.TOP);
    p.text(`[${i + 1}]`, x + boxWidth / 2, y + 10);
    
    // Ability name
    p.fill(200, 255, 200);
    p.textSize(14);
    p.textAlign(p.CENTER, p.TOP);
    p.text(ability.name, x + boxWidth / 2, y + 40);
    
    // Description
    p.fill(200, 200, 200);
    p.textSize(11);
    p.text(ability.description, x + boxWidth / 2, y + 65);
  }
  
  p.fill(255, 255, 100);
  p.textSize(14);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("Press 1, 2, or 3 to select", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  
  p.pop();
}

function renderPausedOverlay(p) {
  p.push();
  p.fill(255, 255, 255);
  p.textSize(16);
  p.textAlign(p.RIGHT, p.TOP);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  p.pop();
}

function renderGameOverScreen(p) {
  p.push();
  
  // Overlay
  p.fill(0, 0, 0, 180);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Title
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "VICTORY!" : "DEFEATED", CANVAS_WIDTH / 2, 100);
  
  // Stats
  p.fill(200, 200, 200);
  p.textSize(18);
  p.textAlign(p.CENTER, p.TOP);
  
  const minutes = Math.floor(gameState.playTime / 60);
  const seconds = Math.floor(gameState.playTime % 60);
  
  p.text(`Survived: ${minutes}:${seconds.toString().padStart(2, '0')}`, CANVAS_WIDTH / 2, 160);
  p.text(`Level: ${gameState.level}`, CANVAS_WIDTH / 2, 190);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  p.text(`Enemies Killed: ${gameState.enemiesKilled}`, CANVAS_WIDTH / 2, 250);
  p.text(`Bosses Defeated: ${gameState.bossesDefeated}`, CANVAS_WIDTH / 2, 280);
  p.text(`Gold Collected: ${gameState.gold}`, CANVAS_WIDTH / 2, 310);
  
  // Restart prompt
  p.fill(255, 255, 100);
  p.textSize(20);
  p.textAlign(p.CENTER, p.CENTER);
  const flash = Math.sin(p.frameCount * 0.1) > 0;
  if (flash) {
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 360);
  }
  
  p.pop();
}