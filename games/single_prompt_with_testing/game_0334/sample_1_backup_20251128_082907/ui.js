// ui.js - UI rendering

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';

export function renderStartScreen(p) {
  p.background(...COLORS.background);
  
  // Animated background
  for (let i = 0; i < 50; i++) {
    const x = (i * 30 + gameState.frameCount * 0.5) % CANVAS_WIDTH;
    const y = (Math.sin(i + gameState.frameCount * 0.02) * 100) + CANVAS_HEIGHT / 2;
    p.fill(...COLORS.player, 30);
    p.noStroke();
    p.circle(x, y, 5);
  }
  
  // Title
  p.fill(...COLORS.crystal);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('HYPER LIGHT', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 100);
  p.text('DRIFTER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
  
  // Glow effect
  p.fill(...COLORS.crystal, 50);
  p.textSize(50);
  p.text('HYPER LIGHT', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 100);
  p.text('DRIFTER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
  
  // Instructions
  p.fill(...COLORS.ui);
  p.textSize(16);
  p.text('Seek the healing crystals in the ruined world', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  p.text('Avoid dangers and defeat enemies', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 45);
  
  // Controls
  p.textSize(14);
  p.text('Arrow Keys: Move', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
  p.text('Space: Dash | Z: Attack | Shift: Map', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
  
  // Start prompt
  const pulseAlpha = 150 + Math.sin(gameState.frameCount * 0.1) * 100;
  p.fill(...COLORS.crystal, pulseAlpha);
  p.textSize(24);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 140);
}

export function renderHUD(p) {
  if (!gameState.player) return;
  
  const padding = 10;
  const barWidth = 150;
  const barHeight = 20;
  
  // Health bar
  p.fill(...COLORS.uiDark);
  p.noStroke();
  p.rect(padding, padding, barWidth, barHeight);
  
  const healthRatio = gameState.player.health / gameState.player.maxHealth;
  p.fill(...COLORS.health);
  p.rect(padding, padding, barWidth * healthRatio, barHeight);
  
  p.stroke(...COLORS.ui);
  p.strokeWeight(2);
  p.noFill();
  p.rect(padding, padding, barWidth, barHeight);
  
  p.fill(...COLORS.ui);
  p.noStroke();
  p.textSize(12);
  p.textAlign(p.LEFT, p.CENTER);
  p.text('HEALTH', padding + 5, padding + barHeight / 2);
  
  // Energy bar
  p.fill(...COLORS.uiDark);
  p.rect(padding, padding + barHeight + 5, barWidth, barHeight);
  
  const energyRatio = gameState.player.energy / gameState.player.maxEnergy;
  p.fill(...COLORS.energy);
  p.rect(padding, padding + barHeight + 5, barWidth * energyRatio, barHeight);
  
  p.stroke(...COLORS.ui);
  p.strokeWeight(2);
  p.noFill();
  p.rect(padding, padding + barHeight + 5, barWidth, barHeight);
  
  p.fill(...COLORS.ui);
  p.noStroke();
  p.text('ENERGY', padding + 5, padding + barHeight + 5 + barHeight / 2);
  
  // Score
  p.fill(...COLORS.ui);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - padding, padding);
  
  // Crystals collected
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  const crystalText = `Crystals: ${gameState.crystalsCollected}/${gameState.totalCrystals}`;
  p.text(crystalText, CANVAS_WIDTH - padding, padding + 25);
  
  // Crystal indicator with glow
  if (gameState.crystalsCollected > 0) {
    for (let i = 0; i < gameState.crystalsCollected; i++) {
      const x = CANVAS_WIDTH - padding - 20 - (i * 25);
      const y = padding + 50;
      
      p.fill(...COLORS.crystal, 100);
      p.noStroke();
      p.circle(x, y, 20);
      
      p.fill(...COLORS.crystal);
      p.stroke(255);
      p.strokeWeight(1);
      p.beginShape();
      p.vertex(x, y - 8);
      p.vertex(x + 4, y);
      p.vertex(x, y + 8);
      p.vertex(x - 4, y);
      p.endShape(p.CLOSE);
    }
  }
  
  // Artifacts collected
  p.fill(...COLORS.ui);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text(`Artifacts: ${gameState.artifactsCollected}`, CANVAS_WIDTH - padding, padding + 75);
}

export function renderPausedOverlay(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Paused text
  p.fill(...COLORS.crystal);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  
  p.fill(...COLORS.ui);
  p.textSize(20);
  p.text('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  p.textSize(16);
  p.text('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
}

export function renderGameOver(p) {
  // Background overlay
  p.fill(0, 0, 0, 220);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Game over text
  p.fill(...(isWin ? COLORS.crystal : COLORS.enemy));
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? 'VICTORY' : 'DEFEATED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
  
  // Glow effect
  p.fill(...(isWin ? COLORS.crystal : COLORS.enemy), 100);
  p.textSize(50);
  p.text(isWin ? 'VICTORY' : 'DEFEATED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
  
  // Message
  p.fill(...COLORS.ui);
  p.textSize(20);
  if (isWin) {
    p.text('You have found all the healing crystals', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
    p.text('The illness begins to fade...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  } else {
    p.text('The darkness claims another Drifter', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
    p.text('Your journey ends here...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  }
  
  // Stats
  p.textSize(16);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  p.text(`Crystals: ${gameState.crystalsCollected}/${gameState.totalCrystals}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
  p.text(`Artifacts: ${gameState.artifactsCollected}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
  p.text(`Enemies Defeated: ${gameState.enemiesDefeated}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
  
  // Restart instruction
  const pulseAlpha = 150 + Math.sin(gameState.frameCount * 0.1) * 100;
  p.fill(...COLORS.crystal, pulseAlpha);
  p.textSize(24);
  p.text('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 140);
}

export function renderMiniMap(p) {
  if (!gameState.showMap) return;
  
  const mapSize = 150;
  const mapX = CANVAS_WIDTH - mapSize - 10;
  const mapY = 10;
  const mapScale = mapSize / Math.max(gameState.worldWidth, gameState.worldHeight);
  
  // Background
  p.fill(0, 0, 0, 200);
  p.stroke(...COLORS.ui);
  p.strokeWeight(2);
  p.rect(mapX, mapY, mapSize, mapSize);
  
  // World tiles
  if (gameState.worldTiles && gameState.worldTiles.length > 0) {
    p.noStroke();
    for (let y = 0; y < gameState.worldTiles.length; y++) {
      for (let x = 0; x < gameState.worldTiles[0].length; x++) {
        const tile = gameState.worldTiles[y][x];
        if (tile.type === 'ground') {
          const mx = mapX + tile.x * mapScale;
          const my = mapY + tile.y * mapScale;
          p.fill(60, 60, 80);
          p.rect(mx, my, 30 * mapScale, 30 * mapScale);
        }
      }
    }
  }
  
  // Crystals
  for (const collectible of gameState.collectibles) {
    if (collectible.type === 'crystal') {
      const mx = mapX + collectible.x * mapScale;
      const my = mapY + collectible.y * mapScale;
      p.fill(...COLORS.crystal);
      p.circle(mx, my, 5);
    }
  }
  
  // Enemies
  for (const enemy of gameState.enemies) {
    const mx = mapX + enemy.x * mapScale;
    const my = mapY + enemy.y * mapScale;
    p.fill(...COLORS.enemy);
    p.circle(mx, my, 3);
  }
  
  // Player
  if (gameState.player) {
    const px = mapX + gameState.player.x * mapScale;
    const py = mapY + gameState.player.y * mapScale;
    p.fill(...COLORS.player);
    p.stroke(255);
    p.strokeWeight(1);
    p.circle(px, py, 6);
  }
  
  // Label
  p.fill(...COLORS.ui);
  p.noStroke();
  p.textSize(10);
  p.textAlign(p.LEFT, p.TOP);
  p.text('MAP', mapX + 5, mapY + 5);
}