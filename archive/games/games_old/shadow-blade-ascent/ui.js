// ui.js
import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, GAME_PHASE } from './globals.js';

export function drawUI(p, player) {
  p.push();
  
  // HUD Panel background
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(10, 10, 250, 110, 5);
  
  // Health bar
  p.fill(0);
  p.rect(20, 20, 200, 20, 3);
  p.fill(255, 50, 50);
  const healthPercent = player.health / player.maxHealth;
  p.rect(20, 20, 200 * healthPercent, 20, 3);
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.CENTER);
  p.text(`HP: ${Math.ceil(player.health)}/${player.maxHealth}`, 25, 30);
  
  // Mana bar
  p.fill(0);
  p.rect(20, 45, 200, 15, 3);
  p.fill(50, 100, 255);
  const manaPercent = player.mana / player.maxMana;
  p.rect(20, 45, 200 * manaPercent, 15, 3);
  p.fill(255);
  p.textSize(10);
  p.text(`MP: ${Math.ceil(player.mana)}/${player.maxMana}`, 25, 52);
  
  // XP bar
  p.fill(0);
  p.rect(20, 65, 200, 12, 3);
  p.fill(0, 200, 0);
  const xpPercent = player.xp / player.xpThreshold;
  p.rect(20, 65, 200 * xpPercent, 12, 3);
  p.fill(255);
  p.textSize(10);
  p.text(`LV ${player.level} XP: ${Math.floor(player.xp)}/${player.xpThreshold}`, 25, 71);
  
  // Player level
  p.fill(255);
  p.textSize(14);
  p.text(`Level: ${player.level}`, 25, 95);
  
  // Score
  p.fill(255);
  p.textSize(16);
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`SCORE: ${String(gameState.score).padStart(6, '0')}`, CANVAS_WIDTH - 20, 20);
  
  // Current level
  p.textAlign(p.LEFT, p.TOP);
  p.text(`STAGE: ${gameState.currentLevel}`, 20, CANVAS_HEIGHT - 30);
  
  // Skill cooldowns
  drawSkillIcons(p, player);
  
  // Combo display
  if (gameState.comboCount > 2) {
    p.fill(255, 200, 0);
    p.textSize(20);
    p.textAlign(p.CENTER, p.TOP);
    p.text(`${gameState.comboCount} HIT COMBO!`, CANVAS_WIDTH / 2, 50);
  }
  
  p.pop();
}

function drawSkillIcons(p, player) {
  const iconSize = 40;
  const startX = CANVAS_WIDTH - 60;
  const startY = CANVAS_HEIGHT - 100;
  
  // Skill 1
  p.push();
  p.fill(0, 0, 0, 150);
  p.rect(startX, startY, iconSize, iconSize, 5);
  
  if (player.skill1Cooldown > 0) {
    // Cooldown overlay
    const cooldownPercent = player.skill1Cooldown / player.skill1MaxCooldown;
    p.fill(0, 0, 0, 180);
    p.rect(startX, startY + iconSize * (1 - cooldownPercent), 
           iconSize, iconSize * cooldownPercent, 5);
    
    // Cooldown text
    p.fill(255);
    p.textSize(12);
    p.textAlign(p.CENTER, p.CENTER);
    const seconds = Math.ceil(player.skill1Cooldown / 60);
    p.text(seconds, startX + iconSize/2, startY + iconSize/2);
  } else {
    // Skill icon
    p.fill(100, 150, 255);
    p.rect(startX + 5, startY + 5, iconSize - 10, iconSize - 10, 3);
    p.fill(255);
    p.textSize(10);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('SPACE', startX + iconSize/2, startY + iconSize/2);
  }
  p.pop();
  
  // Skill 2
  if (player.skill2Unlocked) {
    p.push();
    p.fill(0, 0, 0, 150);
    p.rect(startX, startY - iconSize - 10, iconSize, iconSize, 5);
    
    if (player.skill2Cooldown > 0) {
      const cooldownPercent = player.skill2Cooldown / player.skill2MaxCooldown;
      p.fill(0, 0, 0, 180);
      p.rect(startX, startY - iconSize - 10 + iconSize * (1 - cooldownPercent), 
             iconSize, iconSize * cooldownPercent, 5);
      
      p.fill(255);
      p.textSize(12);
      p.textAlign(p.CENTER, p.CENTER);
      const seconds = Math.ceil(player.skill2Cooldown / 60);
      p.text(seconds, startX + iconSize/2, startY - iconSize - 10 + iconSize/2);
    } else {
      p.fill(255, 100, 255);
      p.rect(startX + 5, startY - iconSize - 5, iconSize - 10, iconSize - 10, 3);
      p.fill(255);
      p.textSize(10);
      p.textAlign(p.CENTER, p.CENTER);
      p.text('W', startX + iconSize/2, startY - iconSize - 10 + iconSize/2);
    }
    p.pop();
  }
}

export function drawStartScreen(p) {
  p.push();
  p.background(20, 20, 30);
  
  // Title
  p.fill(150, 100, 255);
  p.textSize(48);
  p.textAlign(p.CENTER, p.CENTER);
  p.text('SHADOW BLADE', CANVAS_WIDTH / 2, 80);
  p.textSize(32);
  p.text('ASCENT', CANVAS_WIDTH / 2, 120);
  
  // Description
  p.fill(200, 200, 220);
  p.textSize(14);
  p.textAlign(p.CENTER, p.TOP);
  const desc = 'Battle through 5 levels of shadow enemies\nDefeat powerful bosses and level up your skills';
  p.text(desc, CANVAS_WIDTH / 2, 170);
  
  // Controls
  p.fill(180, 180, 200);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  const controls = [
    'CONTROLS:',
    'Arrow Keys: Move & Jump',
    'Z: Basic Attack',
    'Shift: Dodge',
    'Space: Special Skill 1 (AoE)',
    'W: Special Skill 2 (Projectile, unlock at Lv2)',
    '',
    'ESC: Pause',
    'R: Restart'
  ];
  
  let yPos = 230;
  for (let line of controls) {
    p.text(line, 50, yPos);
    yPos += 16;
  }
  
  // Objectives
  p.textAlign(p.RIGHT, p.TOP);
  const objectives = [
    'OBJECTIVES:',
    '• Defeat all 5 bosses',
    '• Collect gold for points',
    '• Level up to gain power',
    '• Chain attacks for combos',
    '• Use potions wisely'
  ];
  
  yPos = 230;
  for (let line of objectives) {
    p.text(line, CANVAS_WIDTH - 50, yPos);
    yPos += 16;
  }
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textSize(20);
  p.textAlign(p.CENTER, p.CENTER);
  const flash = Math.sin(p.frameCount * 0.1) > 0;
  if (flash) {
    p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  }
  
  p.pop();
}

export function drawPausedOverlay(p) {
  p.push();
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textSize(32);
  p.textAlign(p.CENTER, p.CENTER);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  p.textSize(16);
  p.text('Press ESC to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  p.text('Press R to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 65);
  
  p.pop();
}

export function drawGameOver(p, win) {
  p.push();
  p.background(20, 20, 30);
  
  if (win) {
    p.fill(100, 255, 100);
    p.textSize(40);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('VICTORY!', CANVAS_WIDTH / 2, 100);
    
    p.fill(200, 200, 220);
    p.textSize(20);
    p.text('You have conquered the Shadow Realm!', CANVAS_WIDTH / 2, 150);
  } else {
    p.fill(255, 100, 100);
    p.textSize(40);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('GAME OVER', CANVAS_WIDTH / 2, 100);
    
    p.fill(200, 200, 220);
    p.textSize(20);
    p.text('The darkness has consumed you...', CANVAS_WIDTH / 2, 150);
  }
  
  // Final score
  p.fill(255, 255, 100);
  p.textSize(24);
  p.text(`FINAL SCORE: ${String(gameState.score).padStart(6, '0')}`, CANVAS_WIDTH / 2, 220);
  
  // Stats
  p.fill(180, 180, 200);
  p.textSize(16);
  p.text(`Reached Level: ${gameState.currentLevel}`, CANVAS_WIDTH / 2, 270);
  p.text(`Player Level: ${gameState.player ? gameState.player.level : 1}`, CANVAS_WIDTH / 2, 295);
  
  // Restart prompt
  p.fill(255);
  p.textSize(18);
  const flash = Math.sin(p.frameCount * 0.1) > 0;
  if (flash) {
    p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
  }
  
  p.pop();
}