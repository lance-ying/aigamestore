// rendering.js - All rendering functions

import { gameState, GAME_PHASE, PLAYER_MODE, TURN_PHASE, ELEMENT_TYPE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function drawStartScreen(p) {
  p.background(20, 25, 35);
  
  // Title
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('HEROIC IMPACT ARENA', CANVAS_WIDTH / 2, 80);
  
  // Description
  p.fill(200);
  p.textSize(14);
  p.text('Command your Heroes in tactical turn-based combat!', CANVAS_WIDTH / 2, 140);
  p.text('Master the elemental system and defeat all villains.', CANVAS_WIDTH / 2, 160);
  
  // Instructions
  p.textSize(12);
  p.fill(180);
  p.text('CONTROLS:', CANVAS_WIDTH / 2, 200);
  p.textSize(11);
  p.text('Arrow Keys: Navigate selections', CANVAS_WIDTH / 2, 220);
  p.text('Space: Confirm action', CANVAS_WIDTH / 2, 240);
  p.text('Z: Cancel/Go back', CANVAS_WIDTH / 2, 260);
  p.text('Shift: End turn early', CANVAS_WIDTH / 2, 280);
  p.text('ESC: Pause game', CANVAS_WIDTH / 2, 300);
  
  // Start prompt
  p.fill(100, 255, 100);
  p.textSize(18);
  const pulse = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(100 * pulse, 255 * pulse, 100 * pulse);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 350);
}

export function drawGameplayScreen(p) {
  p.background(30, 35, 45);
  
  // Draw UI elements
  drawLevelAndScore(p);
  drawTurnIndicator(p);
  
  // Draw characters
  drawCharacters(p);
  
  // Draw mode-specific UI
  if (gameState.activeTurn === TURN_PHASE.PLAYER) {
    drawPlayerModeUI(p);
  }
  
  // Draw animations
  drawAnimations(p);
  
  // Draw input prompts
  drawInputPrompts(p);
}

export function drawPausedScreen(p) {
  drawGameplayScreen(p);
  
  // Overlay
  p.fill(0, 0, 0, 180);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  p.textSize(16);
  p.text('Press ESC to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  p.text('Press R to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
}

export function drawGameOverScreen(p, isWin) {
  p.background(20, 25, 35);
  
  p.textAlign(p.CENTER, p.CENTER);
  
  if (isWin) {
    p.fill(100, 255, 100);
    p.textSize(48);
    p.text('VICTORY!', CANVAS_WIDTH / 2, 120);
    
    p.fill(200);
    p.textSize(20);
    p.text('All levels completed!', CANVAS_WIDTH / 2, 180);
  } else {
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text('DEFEATED', CANVAS_WIDTH / 2, 120);
    
    p.fill(200);
    p.textSize(20);
    p.text('Your Heroes have fallen...', CANVAS_WIDTH / 2, 180);
  }
  
  p.fill(255, 220, 100);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 240);
  
  p.fill(150);
  p.textSize(16);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 320);
}

function drawLevelAndScore(p) {
  p.textAlign(p.LEFT, p.TOP);
  p.fill(200);
  p.textSize(16);
  p.text(`LEVEL: ${gameState.currentLevel}`, 10, 10);
  
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`SCORE: ${String(gameState.score).padStart(6, '0')}`, CANVAS_WIDTH - 10, 10);
}

function drawTurnIndicator(p) {
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(18);
  
  if (gameState.activeTurn === TURN_PHASE.PLAYER) {
    p.fill(100, 200, 255);
    p.text('PLAYER TURN', CANVAS_WIDTH / 2, 10);
  } else {
    p.fill(255, 100, 100);
    p.text('ENEMY TURN', CANVAS_WIDTH / 2, 10);
  }
}

function drawCharacters(p) {
  // Draw player characters
  gameState.playerCharacters.forEach((char, index) => {
    if (!char.isDefeated) {
      drawCharacter(p, char, index === gameState.currentSelectedCharacterIndex && 
        gameState.playerMode === PLAYER_MODE.CHARACTER_SELECT);
    }
  });
  
  // Draw enemies
  gameState.enemyCharacters.forEach((enemy, index) => {
    if (!enemy.isDefeated) {
      drawEnemy(p, enemy, index === gameState.currentSelectedTargetIndex && 
        gameState.playerMode === PLAYER_MODE.TARGET_SELECT);
    }
  });
}

function drawCharacter(p, char, isSelected) {
  const size = 50;
  
  // Selection highlight
  if (isSelected) {
    p.fill(255, 255, 0, 100);
    p.noStroke();
    p.ellipse(char.x, char.y, size + 20, size + 20);
  }
  
  // Body
  const color = getElementColor(char.type);
  p.fill(...color);
  p.stroke(0);
  p.strokeWeight(2);
  p.rect(char.x - size/2, char.y - size/2, size, size, 5);
  
  // Face
  p.fill(255);
  p.noStroke();
  p.ellipse(char.x - 10, char.y - 8, 8, 8); // Left eye
  p.ellipse(char.x + 10, char.y - 8, 8, 8); // Right eye
  
  p.fill(0);
  p.ellipse(char.x - 10, char.y - 8, 4, 4);
  p.ellipse(char.x + 10, char.y - 8, 4, 4);
  
  p.noFill();
  p.stroke(0);
  p.strokeWeight(2);
  p.arc(char.x, char.y + 5, 20, 15, 0, p.PI); // Smile
  
  // HP Bar
  drawHPBar(p, char, char.x, char.y - 40);
  
  // Name
  p.fill(255);
  p.noStroke();
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(10);
  p.text(char.name, char.x, char.y + 30);
  
  // Status effects
  drawStatusEffects(p, char, char.x, char.y - 55);
}

function drawEnemy(p, enemy, isSelected) {
  const size = 45;
  
  // Selection highlight
  if (isSelected) {
    p.fill(255, 100, 100, 150);
    p.noStroke();
    p.ellipse(enemy.x, enemy.y, size + 20, size + 20);
    
    // Crosshair
    p.stroke(255, 0, 0);
    p.strokeWeight(2);
    p.line(enemy.x - 35, enemy.y, enemy.x + 35, enemy.y);
    p.line(enemy.x, enemy.y - 35, enemy.x, enemy.y + 35);
  }
  
  // Body (different shape based on type)
  const color = getElementColor(enemy.type);
  p.fill(...color.map(c => c * 0.7));
  p.stroke(100, 0, 0);
  p.strokeWeight(2);
  
  if (enemy.name.includes('Boss')) {
    // Larger triangle for bosses
    p.triangle(
      enemy.x, enemy.y - size/1.5,
      enemy.x - size/1.5, enemy.y + size/1.5,
      enemy.x + size/1.5, enemy.y + size/1.5
    );
  } else if (enemy.name === 'Support') {
    // Diamond for support
    p.quad(
      enemy.x, enemy.y - size/2,
      enemy.x + size/2, enemy.y,
      enemy.x, enemy.y + size/2,
      enemy.x - size/2, enemy.y
    );
  } else {
    // Circle for others
    p.ellipse(enemy.x, enemy.y, size, size);
  }
  
  // Angry eyes
  p.fill(255, 0, 0);
  p.noStroke();
  p.ellipse(enemy.x - 10, enemy.y - 5, 8, 8);
  p.ellipse(enemy.x + 10, enemy.y - 5, 8, 8);
  
  // HP Bar
  drawHPBar(p, enemy, enemy.x, enemy.y - 40);
  
  // Name
  p.fill(255);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(9);
  p.text(enemy.name, enemy.x, enemy.y + 30);
  
  // Status effects
  drawStatusEffects(p, enemy, enemy.x, enemy.y - 55);
}

function drawHPBar(p, char, x, y) {
  const barWidth = 60;
  const barHeight = 6;
  const hpPercent = char.currentHP / char.maxHP;
  
  // Background
  p.fill(50);
  p.noStroke();
  p.rect(x - barWidth/2, y, barWidth, barHeight, 2);
  
  // HP
  if (hpPercent > 0.6) {
    p.fill(50, 200, 50);
  } else if (hpPercent > 0.3) {
    p.fill(200, 200, 50);
  } else {
    p.fill(200, 50, 50);
  }
  p.rect(x - barWidth/2, y, barWidth * hpPercent, barHeight, 2);
  
  // HP text
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(8);
  p.text(`${char.currentHP}/${char.maxHP}`, x, y + barHeight / 2);
}

function drawStatusEffects(p, char, x, y) {
  let offsetX = -15;
  char.activeStatusEffects.forEach(effect => {
    p.fill(100, 200, 255, 200);
    p.noStroke();
    p.rect(x + offsetX, y, 12, 12, 2);
    
    p.fill(0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(8);
    
    if (effect.type === 'STUN') {
      p.text('Z', x + offsetX + 6, y + 6);
    } else if (effect.type === 'HEAL_OVER_TIME') {
      p.text('+', x + offsetX + 6, y + 6);
    } else if (effect.type === 'DEFENSE_UP') {
      p.text('D', x + offsetX + 6, y + 6);
    }
    
    offsetX += 18;
  });
}

function drawPlayerModeUI(p) {
  if (gameState.playerMode === PLAYER_MODE.ABILITY_SELECT) {
    drawAbilityPanel(p);
  }
}

function drawAbilityPanel(p) {
  const char = gameState.playerCharacters[gameState.currentActingHeroIndex];
  if (!char || char.isDefeated) return;
  
  const panelX = char.x - 80;
  const panelY = char.y - 150;
  const panelWidth = 160;
  const abilityHeight = 35;
  
  // Panel background
  p.fill(20, 25, 35, 230);
  p.stroke(100, 150, 200);
  p.strokeWeight(2);
  p.rect(panelX, panelY, panelWidth, char.abilities.length * abilityHeight + 10, 5);
  
  // Abilities
  char.abilities.forEach((ability, index) => {
    const abilityY = panelY + 5 + index * abilityHeight;
    const isSelected = index === gameState.currentSelectedAbilityIndex;
    const isAvailable = ability.isAvailable();
    
    // Ability background
    if (isSelected) {
      p.fill(100, 150, 200, 200);
    } else {
      p.fill(40, 45, 55, 200);
    }
    
    if (!isAvailable) {
      p.fill(80, 80, 80, 150);
    }
    
    p.noStroke();
    p.rect(panelX + 5, abilityY, panelWidth - 10, abilityHeight - 5, 3);
    
    // Ability name
    p.fill(isAvailable ? 255 : 120);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(12);
    p.text(ability.name, panelX + 10, abilityY + 5);
    
    // Ability info
    p.textSize(9);
    p.fill(isAvailable ? 200 : 100);
    if (ability.abilityType === 'ATTACK') {
      p.text(`DMG: ${ability.damage}`, panelX + 10, abilityY + 20);
    } else if (ability.abilityType === 'HEAL') {
      p.text(`HEAL: ${ability.healValue}`, panelX + 10, abilityY + 20);
    } else {
      p.text('BUFF', panelX + 10, abilityY + 20);
    }
    
    // Cooldown
    if (!isAvailable) {
      p.fill(255, 100, 100);
      p.textAlign(p.RIGHT, p.TOP);
      p.text(`CD: ${ability.currentCooldown}`, panelX + panelWidth - 10, abilityY + 20);
    }
  });
}

function drawInputPrompts(p) {
  p.fill(180);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.textSize(11);
  
  let prompt = '';
  
  if (gameState.activeTurn === TURN_PHASE.PLAYER) {
    if (gameState.playerMode === PLAYER_MODE.CHARACTER_SELECT) {
      prompt = 'Arrow Keys: Select Hero | Space: Confirm | Shift: End Turn';
    } else if (gameState.playerMode === PLAYER_MODE.ABILITY_SELECT) {
      prompt = 'Up/Down: Select Ability | Space: Confirm | Z: Back';
    } else if (gameState.playerMode === PLAYER_MODE.TARGET_SELECT) {
      prompt = 'Left/Right: Select Target | Space: Confirm | Z: Back';
    }
  } else {
    prompt = 'Enemy Turn in Progress...';
  }
  
  p.text(prompt, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 10);
}

function drawAnimations(p) {
  gameState.animationQueue.forEach(anim => {
    if (anim.type === 'ATTACK') {
      drawAttackAnimation(p, anim);
    } else if (anim.type === 'HEAL') {
      drawHealAnimation(p, anim);
    } else if (anim.type === 'DAMAGE_NUMBER') {
      drawDamageNumber(p, anim);
    }
  });
}

function drawAttackAnimation(p, anim) {
  const progress = anim.getProgress();
  const data = anim.data;
  
  // Projectile
  const x = p.lerp(data.startX, data.targetX, progress);
  const y = p.lerp(data.startY, data.targetY, progress);
  
  p.fill(255, 200, 50);
  p.noStroke();
  p.ellipse(x, y, 12, 12);
  
  // Flash on target
  if (progress > 0.8) {
    const flashAlpha = (1 - progress) * 5 * 150;
    p.fill(255, 100, 100, flashAlpha);
    p.ellipse(data.targetX, data.targetY, 60, 60);
  }
}

function drawHealAnimation(p, anim) {
  const progress = anim.getProgress();
  const data = anim.data;
  
  // Green particles rising
  for (let i = 0; i < 5; i++) {
    const offsetX = Math.sin(progress * p.PI * 2 + i) * 20;
    const y = data.target.y + 30 - progress * 40;
    const alpha = (1 - progress) * 200;
    
    p.fill(50, 255, 50, alpha);
    p.noStroke();
    p.ellipse(data.target.x + offsetX, y, 8, 8);
  }
}

function drawDamageNumber(p, anim) {
  const progress = anim.getProgress();
  const data = anim.data;
  
  const y = data.startY - progress * 30;
  const alpha = (1 - progress) * 255;
  
  if (data.isHeal) {
    p.fill(50, 255, 50, alpha);
  } else {
    p.fill(255, 50, 50, alpha);
  }
  
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(16);
  p.text((data.isHeal ? '+' : '-') + data.damage, data.x, y);
}

function getElementColor(type) {
  switch(type) {
    case ELEMENT_TYPE.FIRE:
      return [255, 100, 50];
    case ELEMENT_TYPE.WATER:
      return [50, 150, 255];
    case ELEMENT_TYPE.NATURE:
      return [50, 200, 50];
    default:
      return [150, 150, 150];
  }
}

export function drawPausedIndicator(p) {
  p.fill(255, 255, 100);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text('PAUSED', CANVAS_WIDTH - 10, 35);
}