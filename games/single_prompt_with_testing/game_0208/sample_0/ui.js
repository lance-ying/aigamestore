// ui.js - UI rendering for all game screens

import {
  gameState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  COLORS,
  ITEM_TYPES
} from './globals.js';

export function renderStartScreen(p) {
  // Background gradient
  for (let i = 0; i < CANVAS_HEIGHT; i++) {
    const inter = i / CANVAS_HEIGHT;
    const c = p.lerpColor(
      p.color(...COLORS.background),
      p.color(30, 30, 50),
      inter
    );
    p.stroke(c);
    p.line(0, i, CANVAS_WIDTH, i);
  }
  
  // Title with glow effect
  p.fill(100, 255, 200, 100);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(56);
  p.text('RISK OF RAIN', CANVAS_WIDTH / 2 + 2, 80 + 2);
  
  p.fill(100, 255, 200);
  p.textSize(54);
  p.text('RISK OF RAIN', CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(150, 150, 180);
  p.textSize(16);
  p.text('Action Platformer Roguelike', CANVAS_WIDTH / 2, 120);
  
  // Description box
  p.fill(20, 20, 30, 200);
  p.rect(50, 150, CANVAS_WIDTH - 100, 100, 8);
  
  p.fill(200, 200, 220);
  p.textSize(13);
  p.textAlign(p.CENTER, p.TOP);
  const description = 'Survive waves of enemies on a hostile planet.\nCollect items to grow stronger.\nActivate the teleporter and defeat the boss to win.\nTime increases difficulty - move fast!';
  p.text(description, CANVAS_WIDTH / 2, 160);
  
  // Controls
  p.fill(20, 20, 30, 200);
  p.rect(50, 270, CANVAS_WIDTH - 100, 60, 8);
  
  p.fill(200, 200, 220);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  p.text('← → : Move     ↑ : Jump     SPACE : Shoot     Z : Dash', 70, 280);
  p.text('ENTER : Start     ESC : Pause     R : Restart', 70, 300);
  
  // Start prompt (blinking)
  if (Math.floor(gameState.frameCount / 30) % 2 === 0) {
    p.fill(100, 255, 200);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(20);
    p.text('▶ PRESS ENTER TO START ◀', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  }
}

export function renderPlayingUI(p) {
  // Semi-transparent HUD background
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 60);
  
  // Score
  p.fill(...COLORS.ui);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`Score: ${gameState.score}`, 10, 10);
  
  // Time
  const seconds = Math.floor(gameState.gameTime / 60);
  const minutes = Math.floor(seconds / 60);
  const displaySeconds = seconds % 60;
  p.text(`Time: ${minutes}:${displaySeconds.toString().padStart(2, '0')}`, 10, 30);
  
  // Difficulty indicator
  const difficultyPercent = Math.floor((gameState.difficulty - 1) * 100);
  p.fill(255, 100 + difficultyPercent, 100);
  p.text(`Difficulty: ${gameState.difficulty.toFixed(1)}x`, 150, 10);
  
  // Health bar
  if (gameState.player) {
    const barWidth = 200;
    const barHeight = 24;
    const barX = CANVAS_WIDTH - barWidth - 10;
    const barY = 10;
    const healthRatio = gameState.player.health / gameState.player.maxHealth;
    
    // Background
    p.fill(...COLORS.healthBg);
    p.rect(barX, barY, barWidth, barHeight, 4);
    
    // Health fill with gradient
    const healthColor = healthRatio > 0.5 ? 
      p.lerpColor(p.color(...COLORS.health), p.color(255, 255, 100), (healthRatio - 0.5) * 2) :
      p.lerpColor(p.color(255, 50, 50), p.color(...COLORS.health), healthRatio * 2);
    
    p.fill(healthColor);
    p.rect(barX, barY, barWidth * healthRatio, barHeight, 4);
    
    // Border
    p.noFill();
    p.stroke(255);
    p.strokeWeight(2);
    p.rect(barX, barY, barWidth, barHeight, 4);
    
    // Health text
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.text(`${Math.ceil(gameState.player.health)}/${gameState.player.maxHealth}`, 
           barX + barWidth / 2, barY + barHeight / 2);
    
    // Dash cooldown indicator
    if (gameState.player.dashTimer > 0) {
      const dashBarWidth = 60;
      const dashRatio = 1 - (gameState.player.dashTimer / gameState.player.dashCooldown);
      
      p.fill(50, 50, 70);
      p.noStroke();
      p.rect(barX, barY + barHeight + 5, dashBarWidth, 6, 2);
      
      p.fill(150, 255, 255);
      p.rect(barX, barY + barHeight + 5, dashBarWidth * dashRatio, 6, 2);
      
      p.fill(200, 200, 220);
      p.textAlign(p.LEFT, p.CENTER);
      p.textSize(10);
      p.text('DASH', barX + dashBarWidth + 5, barY + barHeight + 8);
    } else {
      p.fill(150, 255, 255);
      p.textAlign(p.LEFT, p.CENTER);
      p.textSize(10);
      p.text('DASH READY [Z]', barX, barY + barHeight + 8);
    }
  }
  
  // Item inventory display
  renderItemInventory(p);
  
  // Teleporter status
  if (gameState.teleporter && !gameState.teleporterActivated) {
    p.fill(50, 200, 255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.text('Find the Teleporter!', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20);
  } else if (gameState.teleporterActivated && gameState.boss) {
    p.fill(255, 50, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    p.text('DEFEAT THE BOSS!', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20);
    
    // Boss health bar
    renderBossHealthBar(p);
  }
}

function renderItemInventory(p) {
  let itemCount = 0;
  let xOffset = 10;
  const yStart = 70;
  
  for (const itemType in gameState.itemCounts) {
    const count = gameState.itemCounts[itemType];
    if (count > 0) {
      const itemData = ITEM_TYPES[itemType];
      
      // Item icon background
      p.fill(...itemData.color, 150);
      p.noStroke();
      p.rect(xOffset, yStart, 30, 30, 4);
      
      // Item count
      p.fill(255);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(14);
      p.text(`x${count}`, xOffset + 15, yStart + 15);
      
      // Item name on hover (simplified - always show)
      p.fill(...COLORS.ui);
      p.textSize(8);
      p.text(itemData.name.substring(0, 8), xOffset + 15, yStart + 35);
      
      xOffset += 35;
      itemCount++;
      
      if (itemCount >= 10) break; // Limit display
    }
  }
}

function renderBossHealthBar(p) {
  if (!gameState.boss || !gameState.boss.active) return;
  
  const barWidth = 300;
  const barHeight = 20;
  const barX = CANVAS_WIDTH / 2 - barWidth / 2;
  const barY = CANVAS_HEIGHT - 60;
  const healthRatio = gameState.boss.health / gameState.boss.maxHealth;
  
  // Background
  p.fill(0, 0, 0, 200);
  p.rect(barX - 5, barY - 25, barWidth + 10, 50, 8);
  
  // Boss name
  p.fill(255, 200, 200);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.text('◆ BOSS ◆', CANVAS_WIDTH / 2, barY - 10);
  
  // Health bar background
  p.fill(80, 30, 30);
  p.rect(barX, barY, barWidth, barHeight, 4);
  
  // Health fill
  p.fill(...COLORS.boss);
  p.rect(barX, barY, barWidth * healthRatio, barHeight, 4);
  
  // Border
  p.noFill();
  p.stroke(255, 100, 150);
  p.strokeWeight(2);
  p.rect(barX, barY, barWidth, barHeight, 4);
  
  // Health text
  p.fill(255);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(12);
  p.text(`${Math.ceil(gameState.boss.health)} / ${gameState.boss.maxHealth}`, 
         CANVAS_WIDTH / 2, barY + barHeight / 2);
}

export function renderPausedOverlay(p) {
  // Dark overlay
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Pause box
  p.fill(20, 20, 30, 250);
  p.rect(CANVAS_WIDTH / 2 - 150, CANVAS_HEIGHT / 2 - 80, 300, 160, 8);
  
  // Paused text
  p.fill(100, 255, 200);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  
  // Instructions
  p.fill(200, 200, 220);
  p.textSize(16);
  p.text('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  p.text('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 45);
}

export function renderGameOverScreen(p) {
  // Dark overlay
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  const isWin = gameState.gamePhase === PHASE_GAME_OVER_WIN;
  
  // Result box
  p.fill(20, 20, 30, 250);
  p.rect(CANVAS_WIDTH / 2 - 200, CANVAS_HEIGHT / 2 - 120, 400, 240, 8);
  
  // Title
  const titleColor = isWin ? [100, 255, 150] : [255, 100, 100];
  p.fill(...titleColor);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? 'VICTORY!' : 'DEFEATED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 70);
  
  // Message
  p.fill(200, 200, 220);
  p.textSize(16);
  if (isWin) {
    p.text('You escaped the planet!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  } else {
    p.text('You were overwhelmed...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  }
  
  // Stats
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(14);
  const statsX = CANVAS_WIDTH / 2 - 150;
  p.text(`Final Score: ${gameState.score}`, statsX, CANVAS_HEIGHT / 2 + 10);
  
  const seconds = Math.floor(gameState.gameTime / 60);
  const minutes = Math.floor(seconds / 60);
  const displaySeconds = seconds % 60;
  p.text(`Survival Time: ${minutes}:${displaySeconds.toString().padStart(2, '0')}`, 
         statsX, CANVAS_HEIGHT / 2 + 35);
  
  const totalItems = Object.values(gameState.itemCounts).reduce((a, b) => a + b, 0);
  p.text(`Items Collected: ${totalItems}`, statsX, CANVAS_HEIGHT / 2 + 60);
  
  // Restart prompt
  if (Math.floor(gameState.frameCount / 30) % 2 === 0) {
    p.fill(...titleColor);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(18);
    p.text('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 95);
  }
}

export function renderBackground(p) {
  // Parallax background layers
  const offset1 = (gameState.frameCount * 0.2) % CANVAS_WIDTH;
  const offset2 = (gameState.frameCount * 0.5) % CANVAS_WIDTH;
  
  // Far mountains
  p.fill(30, 30, 50);
  p.noStroke();
  for (let i = -1; i <= 1; i++) {
    const baseX = i * CANVAS_WIDTH + offset1;
    p.triangle(baseX, CANVAS_HEIGHT, baseX + 100, CANVAS_HEIGHT - 80, baseX + 200, CANVAS_HEIGHT);
    p.triangle(baseX + 150, CANVAS_HEIGHT, baseX + 250, CANVAS_HEIGHT - 100, baseX + 350, CANVAS_HEIGHT);
  }
  
  // Near mountains
  p.fill(40, 40, 60);
  for (let i = -1; i <= 1; i++) {
    const baseX = i * CANVAS_WIDTH + offset2;
    p.triangle(baseX - 50, CANVAS_HEIGHT, baseX + 50, CANVAS_HEIGHT - 60, baseX + 150, CANVAS_HEIGHT);
  }
  
  // Stars
  p.fill(255, 255, 200, 150);
  for (let i = 0; i < 30; i++) {
    const x = (i * 37) % CANVAS_WIDTH;
    const y = (i * 23) % (CANVAS_HEIGHT - 100);
    const twinkle = Math.sin(gameState.frameCount * 0.05 + i) * 0.5 + 0.5;
    p.circle(x, y, 1 + twinkle);
  }
}