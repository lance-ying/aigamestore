// ui.js - UI rendering functions
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderUI(p) {
  const player = gameState.player;
  if (!player) return;
  
  p.push();
  p.textFont('Arial');
  p.textAlign(p.LEFT, p.TOP);
  
  // Player stats panel (top left)
  const panelX = 10;
  const panelY = 10;
  const panelW = 180;
  const panelH = 100;
  
  // Panel background
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(panelX, panelY, panelW, panelH, 5);
  
  // Level and score
  p.fill(255, 255, 255);
  p.textSize(14);
  p.text(`Level: ${player.level}`, panelX + 10, panelY + 10);
  p.text(`Score: ${gameState.score}`, panelX + 10, panelY + 28);
  
  // Health bar
  p.fill(255, 255, 255);
  p.textSize(10);
  p.text('HP', panelX + 10, panelY + 48);
  
  const hpBarX = panelX + 35;
  const hpBarY = panelY + 48;
  const hpBarW = panelW - 45;
  const hpBarH = 12;
  
  p.fill(50, 50, 50);
  p.rect(hpBarX, hpBarY, hpBarW, hpBarH);
  
  const hpPercent = player.health / player.maxHealth;
  p.fill(100, 255, 100);
  p.rect(hpBarX, hpBarY, hpBarW * hpPercent, hpBarH);
  
  p.noFill();
  p.stroke(255);
  p.strokeWeight(1);
  p.rect(hpBarX, hpBarY, hpBarW, hpBarH);
  
  p.noStroke();
  p.fill(255);
  p.textSize(9);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(`${Math.ceil(player.health)}/${player.maxHealth}`, hpBarX + hpBarW / 2, hpBarY + hpBarH / 2);
  
  // Mana bar
  p.textAlign(p.LEFT, p.TOP);
  p.fill(255, 255, 255);
  p.textSize(10);
  p.text('MP', panelX + 10, panelY + 68);
  
  const mpBarX = panelX + 35;
  const mpBarY = panelY + 68;
  const mpBarW = panelW - 45;
  const mpBarH = 12;
  
  p.fill(50, 50, 50);
  p.rect(mpBarX, mpBarY, mpBarW, mpBarH);
  
  const mpPercent = player.mana / player.maxMana;
  p.fill(100, 150, 255);
  p.rect(mpBarX, mpBarY, mpBarW * mpPercent, mpBarH);
  
  p.noFill();
  p.stroke(255);
  p.strokeWeight(1);
  p.rect(mpBarX, mpBarY, mpBarW, mpBarH);
  
  p.noStroke();
  p.fill(255);
  p.textSize(9);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(`${Math.ceil(player.mana)}/${player.maxMana}`, mpBarX + mpBarW / 2, mpBarY + mpBarH / 2);
  
  // Skills panel (bottom right)
  const skillPanelX = CANVAS_WIDTH - 210;
  const skillPanelY = CANVAS_HEIGHT - 90;
  const skillPanelW = 200;
  const skillPanelH = 80;
  
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(skillPanelX, skillPanelY, skillPanelW, skillPanelH, 5);
  
  p.textAlign(p.LEFT, p.TOP);
  p.fill(255, 255, 100);
  p.textSize(12);
  p.text('Skills', skillPanelX + 10, skillPanelY + 8);
  
  // Render each skill
  player.skills.forEach((skill, index) => {
    const skillX = skillPanelX + 10 + index * 90;
    const skillY = skillPanelY + 30;
    const skillSize = 40;
    
    const now = Date.now();
    const cooldownRemaining = Math.max(0, skill.cooldown - (now - skill.lastUsed));
    const cooldownPercent = cooldownRemaining / skill.cooldown;
    const canUse = player.mana >= skill.manaCost && cooldownRemaining === 0;
    
    // Skill icon background
    p.fill(...(canUse ? [80, 120, 180] : [60, 60, 60]));
    p.stroke(255);
    p.strokeWeight(1);
    p.rect(skillX, skillY, skillSize, skillSize, 3);
    
    // Cooldown overlay
    if (cooldownPercent > 0) {
      p.fill(0, 0, 0, 150);
      p.noStroke();
      const cdHeight = skillSize * cooldownPercent;
      p.rect(skillX, skillY + skillSize - cdHeight, skillSize, cdHeight);
    }
    
    // Skill icon
    p.fill(255);
    p.noStroke();
    p.textSize(20);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(index === 0 ? '⚔' : '🌀', skillX + skillSize / 2, skillY + skillSize / 2);
    
    // Skill key
    p.fill(255, 255, 255);
    p.textSize(10);
    p.textAlign(p.CENTER, p.TOP);
    const keyText = index === 0 ? 'SPACE' : 'SHIFT';
    p.text(keyText, skillX + skillSize / 2, skillY + skillSize + 4);
  });
  
  // Wave info (top right)
  p.textAlign(p.RIGHT, p.TOP);
  p.fill(255, 255, 255);
  p.textSize(14);
  p.text(`Wave: ${gameState.wave}/${gameState.maxWaves}`, CANVAS_WIDTH - 10, 10);
  p.textSize(12);
  p.text(`Enemies: ${gameState.enemiesDefeated}/${gameState.enemiesInWave}`, CANVAS_WIDTH - 10, 30);
  
  // Wave complete message
  if (gameState.waveComplete && gameState.wave < gameState.maxWaves) {
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255, 255, 100);
    p.textSize(24);
    p.text('WAVE COMPLETE!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
    p.textSize(16);
    p.text('Next wave incoming...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
  }
  
  p.pop();
}

export function renderStartScreen(p) {
  p.push();
  p.background(20, 20, 40);
  
  // Title
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(255, 200, 50);
  p.textSize(40);
  p.text('SHADOW ARENA', CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(200, 200, 200);
  p.textSize(16);
  p.text('Action RPG Combat', CANVAS_WIDTH / 2, 120);
  
  // Description
  p.fill(220, 220, 220);
  p.textSize(13);
  p.textAlign(p.CENTER, p.TOP);
  const desc = [
    'Battle through waves of enemies!',
    'Level up and unlock powerful abilities.',
    'Defeat the final boss to claim victory!'
  ];
  desc.forEach((line, i) => {
    p.text(line, CANVAS_WIDTH / 2, 160 + i * 20);
  });
  
  // Controls
  p.fill(150, 200, 255);
  p.textSize(14);
  p.text('CONTROLS', CANVAS_WIDTH / 2, 240);
  
  p.fill(200, 200, 200);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  const controls = [
    'Arrow Keys: Move & Jump',
    'Z: Basic Attack (builds mana)',
    'Space: Power Strike (15 mana)',
    'Shift: Whirlwind (25 mana)'
  ];
  controls.forEach((line, i) => {
    p.text(line, CANVAS_WIDTH / 2 - 120, 265 + i * 18);
  });
  
  // Start prompt
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(255, 255, 100);
  p.textSize(18);
  const flash = p.sin(p.frameCount * 0.1) * 0.5 + 0.5;
  p.fill(255, 255, 100, 150 + flash * 105);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  
  p.pop();
}

export function renderGameOver(p, won) {
  p.push();
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.textAlign(p.CENTER, p.CENTER);
  
  if (won) {
    p.fill(100, 255, 100);
    p.textSize(48);
    p.text('VICTORY!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
    
    p.fill(255, 255, 255);
    p.textSize(20);
    p.text('You defeated all enemies!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
  } else {
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text('DEFEATED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
    
    p.fill(255, 255, 255);
    p.textSize(20);
    p.text('Your hero has fallen...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
  }
  
  // Final stats
  p.fill(200, 200, 200);
  p.textSize(16);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  p.text(`Waves Completed: ${gameState.wave - (won ? 0 : 1)}/${gameState.maxWaves}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 55);
  if (gameState.player) {
    p.text(`Final Level: ${gameState.player.level}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
  }
  
  // Restart prompt
  p.fill(255, 255, 100);
  p.textSize(18);
  const flash = p.sin(p.frameCount * 0.1) * 0.5 + 0.5;
  p.fill(255, 255, 100, 150 + flash * 105);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  
  p.pop();
}

export function renderPauseIndicator(p) {
  p.push();
  p.textAlign(p.RIGHT, p.TOP);
  p.fill(255, 255, 100);
  p.textSize(16);
  p.text('PAUSED', CANVAS_WIDTH - 10, 10);
  p.pop();
}