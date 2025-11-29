// ui.js - UI rendering for all game screens

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';

export function renderStartScreen(p) {
  p.background(...COLORS.background);
  
  // Title with horror effect
  p.fill(...COLORS.blood);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(64);
  p.textStyle(p.BOLD);
  
  // Dripping effect
  const drip = Math.sin(gameState.frameCount * 0.05) * 5;
  p.text('CARRION', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 100 + drip);
  
  // Subtitle
  p.fill(...COLORS.text);
  p.textSize(16);
  p.textStyle(p.NORMAL);
  p.text('REVERSE HORROR', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
  
  // Description
  p.textSize(12);
  p.fill(...COLORS.ui);
  const desc = 'You are an amorphous creature. Consume all humans to escape.';
  p.text(desc, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  // Controls
  p.textSize(11);
  p.textAlign(p.LEFT, p.TOP);
  const controls = [
    'Arrow Keys: Move',
    'Space: Lunge Attack',
    'Shift: Tentacle Attack (Large size)',
    'Z: Blood Trail (Medium+ size)',
    '',
    'ESC: Pause  |  R: Restart'
  ];
  
  let yPos = CANVAS_HEIGHT / 2 + 40;
  for (let line of controls) {
    p.text(line, 50, yPos);
    yPos += 15;
  }
  
  // Start prompt
  p.fill(...COLORS.blood);
  p.textSize(18);
  p.textAlign(p.CENTER, p.CENTER);
  const pulse = Math.sin(gameState.frameCount * 0.1) * 20 + 235;
  p.fill(pulse, 0, 0);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}

export function renderUI(p) {
  // Score and stats
  p.fill(...COLORS.text);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`Consumed: ${gameState.humansConsumed}/${gameState.totalHumans}`, 10, 10);
  
  // Evolution stage
  p.textSize(14);
  const stageColor = gameState.evolutionStage === "LARGE" ? COLORS.blood :
                     gameState.evolutionStage === "MEDIUM" ? [200, 100, 0] : COLORS.ui;
  p.fill(...stageColor);
  p.text(`Evolution: ${gameState.evolutionStage}`, 10, 35);
  
  // Biomass bar
  const barWidth = 150;
  const barHeight = 15;
  const barX = 10;
  const barY = 60;
  
  p.fill(50, 50, 50);
  p.noStroke();
  p.rect(barX, barY, barWidth, barHeight);
  
  const biomassPercent = Math.min(1, (gameState.biomass - 1) / 2); // 1-3 range
  p.fill(...COLORS.blood);
  p.rect(barX, barY, barWidth * biomassPercent, barHeight);
  
  p.stroke(...COLORS.text);
  p.strokeWeight(2);
  p.noFill();
  p.rect(barX, barY, barWidth, barHeight);
  
  // Abilities UI
  let abilityY = 85;
  p.textSize(11);
  p.noStroke();
  
  // Blood Trail ability
  if (gameState.canUseBloodTrail) {
    const cooldownPercent = 1 - (gameState.bloodTrailCooldown / 300);
    const abilityColor = cooldownPercent >= 1 ? [0, 255, 100] : [100, 100, 100];
    p.fill(...abilityColor);
    p.text(`[Z] Blood Trail ${gameState.bloodTrailActive ? '(ACTIVE)' : ''}`, 10, abilityY);
    
    if (cooldownPercent < 1) {
      const cdBarWidth = 100;
      p.fill(50, 50, 50);
      p.rect(120, abilityY, cdBarWidth, 8);
      p.fill(...abilityColor);
      p.rect(120, abilityY, cdBarWidth * cooldownPercent, 8);
    }
    abilityY += 15;
  }
  
  // Tentacle ability
  if (gameState.canUseTentacles) {
    p.fill(0, 255, 100);
    p.text('[Shift] Tentacle Attack', 10, abilityY);
    abilityY += 15;
  }
  
  // Minimap (simple)
  renderMinimap(p);
}

function renderMinimap(p) {
  const minimapSize = 100;
  const minimapX = CANVAS_WIDTH - minimapSize - 10;
  const minimapY = 10;
  const scale = minimapSize / Math.max(gameState.levelWidth, gameState.levelHeight);
  
  // Background
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(minimapX, minimapY, minimapSize, minimapSize);
  
  // Walls (simplified)
  p.fill(80, 80, 80);
  for (let wall of gameState.walls) {
    const wx = minimapX + wall.x * scale;
    const wy = minimapY + wall.y * scale;
    const ww = wall.width * scale;
    const wh = wall.height * scale;
    if (ww > 1 && wh > 1) {
      p.rect(wx, wy, ww, wh);
    }
  }
  
  // Humans
  p.fill(200, 200, 200);
  for (let human of gameState.humans) {
    const hx = minimapX + human.x * scale;
    const hy = minimapY + human.y * scale;
    p.circle(hx, hy, 3);
  }
  
  // Player
  if (gameState.player) {
    p.fill(...COLORS.blood);
    const px = minimapX + gameState.player.x * scale;
    const py = minimapY + gameState.player.y * scale;
    p.circle(px, py, 5);
  }
  
  // Border
  p.stroke(255);
  p.strokeWeight(2);
  p.noFill();
  p.rect(minimapX, minimapY, minimapSize, minimapSize);
}

export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(...COLORS.text);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  p.textSize(18);
  p.text('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

export function renderGameOver(p) {
  p.fill(0, 0, 0, 220);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Title
  if (isWin) {
    p.fill(...COLORS.blood);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(56);
    p.text('FREEDOM', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
    
    p.fill(...COLORS.text);
    p.textSize(18);
    p.text('You have consumed all your captors', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
    p.text('and escaped the facility.', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 5);
  } else {
    p.fill(255, 0, 0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(56);
    p.text('CONTAINED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
  }
  
  // Stats
  p.fill(...COLORS.ui);
  p.textSize(20);
  p.text(`Humans Consumed: ${gameState.humansConsumed}/${gameState.totalHumans}`, 
         CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  p.text(`Final Evolution: ${gameState.evolutionStage}`, 
         CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
  
  // Restart prompt
  p.fill(...COLORS.blood);
  p.textSize(18);
  const pulse = Math.sin(gameState.frameCount * 0.1) * 20 + 235;
  p.fill(pulse, pulse, pulse);
  p.text('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}

export function renderBackground(p) {
  // Draw floor tiles with blood stains
  const tileSize = 40;
  for (let x = 0; x < gameState.levelWidth; x += tileSize) {
    for (let y = 0; y < gameState.levelHeight; y += tileSize) {
      const screenX = x - gameState.cameraX;
      const screenY = y - gameState.cameraY;
      
      // Only draw if on screen
      if (screenX > -tileSize && screenX < CANVAS_WIDTH + tileSize &&
          screenY > -tileSize && screenY < CANVAS_HEIGHT + tileSize) {
        
        // Alternating tile colors
        const isDark = ((x / tileSize) + (y / tileSize)) % 2 === 0;
        p.fill(isDark ? 15 : 18, isDark ? 10 : 13, isDark ? 20 : 23);
        p.noStroke();
        p.rect(screenX, screenY, tileSize, tileSize);
        
        // Random blood stains
        if (Math.random() < 0.05) {
          p.fill(...COLORS.blood, 30);
          p.circle(screenX + Math.random() * tileSize, 
                   screenY + Math.random() * tileSize, 
                   Math.random() * 10 + 5);
        }
      }
    }
  }
}