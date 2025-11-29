// rendering.js - All rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, GAMEPLAY_OVERWORLD, GAMEPLAY_COMBAT, COMBAT_INTRO, COMBAT_PLAYER_TURN, COMBAT_ENEMY_TURN, COMBAT_ACTION_ANIMATION, COMBAT_BREAK_ATTACK, COMBAT_VICTORY, COMBAT_DEFEAT, ELEMENT_FIRE, ELEMENT_ICE, ELEMENT_LIGHTNING, ELEMENT_DARK } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 15, 30);
  
  // Title with dramatic effect
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(200, 50, 50);
  p.textSize(40);
  p.text("RPG ヴィラン転生", CANVAS_WIDTH / 2, 80);
  
  p.fill(180, 40, 40);
  p.textSize(20);
  p.text("Villain Reincarnation", CANVAS_WIDTH / 2, 115);
  
  // Description
  p.fill(220, 220, 220);
  p.textSize(14);
  p.text("Lead your party of villains to conquer the realm!", CANVAS_WIDTH / 2, 160);
  p.text("Battle enemies, exploit weaknesses, and unleash Break Attacks!", CANVAS_WIDTH / 2, 180);
  
  // Instructions
  p.fill(180, 180, 200);
  p.textSize(13);
  p.text("CONTROLS", CANVAS_WIDTH / 2, 220);
  p.textSize(11);
  p.fill(160, 160, 180);
  p.text("Arrow Keys: Navigate | Space: Confirm | Z: Cancel", CANVAS_WIDTH / 2, 245);
  p.text("Shift: Sprint | ESC: Pause | R: Restart", CANVAS_WIDTH / 2, 265);
  
  // Objectives
  p.fill(180, 180, 200);
  p.textSize(13);
  p.text("OBJECTIVES", CANVAS_WIDTH / 2, 295);
  p.textSize(11);
  p.fill(160, 160, 180);
  p.text("Explore the overworld and defeat " + gameState.targetVictories + " enemy parties", CANVAS_WIDTH / 2, 320);
  p.text("Use elemental skills to exploit weaknesses and fill Break gauge", CANVAS_WIDTH / 2, 340);
  
  // Flashing prompt
  const flash = Math.floor(p.frameCount / 30) % 2;
  if (flash === 0) {
    p.fill(255, 220, 100);
    p.textSize(16);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 375);
  }
  
  p.pop();
}

export function renderOverworld(p) {
  p.background(100, 150, 100);
  
  // Render map
  if (gameState.map) {
    gameState.map.render(p, gameState.camera.x, gameState.camera.y);
  }
  
  // Render player
  if (gameState.player) {
    const screenX = gameState.player.x - gameState.camera.x;
    const screenY = gameState.player.y - gameState.camera.y;
    renderPlayer(p, screenX, screenY, gameState.player.spriteDirection, gameState.player.animFrame);
  }
  
  // Render UI
  renderOverworldUI(p);
}

function renderPlayer(p, x, y, direction, animFrame) {
  p.push();
  p.translate(x, y);
  
  // Shadow
  p.fill(0, 0, 0, 80);
  p.noStroke();
  p.ellipse(0, 8, 24, 12);
  
  // Body (villain cloak)
  p.fill(40, 20, 60);
  p.rect(-10, -8, 20, 18);
  
  // Head
  p.fill(220, 180, 150);
  p.ellipse(0, -12, 14, 14);
  
  // Evil eyes
  p.fill(255, 50, 50);
  p.ellipse(-3, -12, 3, 4);
  p.ellipse(3, -12, 3, 4);
  
  // Crown/horns
  p.fill(80, 60, 100);
  p.triangle(-6, -18, -4, -22, -2, -18);
  p.triangle(2, -18, 4, -22, 6, -18);
  
  // Walking animation
  if (animFrame === 1 || animFrame === 3) {
    p.fill(40, 20, 60);
    p.rect(-12, 8, 6, 6);
    p.rect(6, 8, 6, 6);
  }
  
  p.pop();
}

function renderOverworldUI(p) {
  p.push();
  
  // Top bar
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 60);
  
  // Stats
  p.fill(255, 255, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text("Infamy: " + gameState.infamy, 10, 10);
  p.text("Level: " + gameState.level, 10, 28);
  p.text("Battles Won: " + gameState.battlesWon + "/" + gameState.targetVictories, 10, 46);
  
  // Party status
  const startX = 200;
  for (let i = 0; i < gameState.party.length; i++) {
    const member = gameState.party[i];
    const x = startX + i * 120;
    
    p.textSize(11);
    p.fill(200, 200, 220);
    p.text(member.name, x, 8);
    
    // HP bar
    p.fill(100, 20, 20);
    p.rect(x, 22, 100, 8);
    const hpRatio = member.hp / member.maxHP;
    p.fill(220, 50, 50);
    p.rect(x, 22, 100 * hpRatio, 8);
    p.fill(255, 255, 255);
    p.textSize(9);
    p.text(member.hp + "/" + member.maxHP, x + 2, 22);
    
    // SP bar
    p.fill(20, 20, 100);
    p.rect(x, 34, 100, 8);
    const spRatio = member.sp / member.maxSP;
    p.fill(50, 120, 220);
    p.rect(x, 34, 100 * spRatio, 8);
    p.fill(255, 255, 255);
    p.text(member.sp + "/" + member.maxSP, x + 2, 34);
  }
  
  // Inventory
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(11);
  p.fill(200, 200, 220);
  p.text("Potions: " + gameState.inventory.healthPotion + " HP / " + gameState.inventory.manaPotion + " MP", CANVAS_WIDTH - 10, 10);
  
  p.pop();
}

export function renderCombat(p) {
  p.background(30, 25, 40);
  
  // Combat background
  renderCombatBackground(p);
  
  // Render enemies
  renderEnemies(p);
  
  // Render party
  renderPartyInCombat(p);
  
  // Render combat UI based on state
  if (gameState.combatState === COMBAT_INTRO) {
    renderCombatIntro(p);
  } else if (gameState.combatState === COMBAT_PLAYER_TURN) {
    renderCombatMenu(p);
  } else if (gameState.combatState === COMBAT_ACTION_ANIMATION) {
    renderActionAnimation(p);
  } else if (gameState.combatState === COMBAT_BREAK_ATTACK) {
    renderBreakAttack(p);
  } else if (gameState.combatState === COMBAT_ENEMY_TURN) {
    renderEnemyTurn(p);
  } else if (gameState.combatState === COMBAT_VICTORY) {
    renderVictory(p);
  } else if (gameState.combatState === COMBAT_DEFEAT) {
    renderDefeat(p);
  }
  
  // Render turn indicator
  renderTurnIndicator(p);
}

function renderCombatBackground(p) {
  // Dark gradient background
  for (let y = 0; y < CANVAS_HEIGHT; y++) {
    const inter = y / CANVAS_HEIGHT;
    p.stroke(30 + inter * 20, 25 + inter * 20, 40 + inter * 30);
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Ground line
  p.stroke(100, 80, 60);
  p.strokeWeight(2);
  p.line(0, 280, CANVAS_WIDTH, 280);
  p.noStroke();
}

function renderEnemies(p) {
  const enemyCount = gameState.enemies.length;
  const spacing = 120;
  const startX = (CANVAS_WIDTH - (enemyCount - 1) * spacing) / 2;
  
  for (let i = 0; i < gameState.enemies.length; i++) {
    const enemy = gameState.enemies[i];
    const x = startX + i * spacing;
    const y = 140;
    
    if (!enemy.isAlive()) continue;
    
    p.push();
    p.translate(x, y);
    
    // Enemy sprite based on element
    renderEnemySprite(p, enemy);
    
    // HP bar
    p.fill(100, 20, 20);
    p.rect(-30, 40, 60, 6);
    const hpRatio = enemy.hp / enemy.maxHP;
    p.fill(220, 50, 50);
    p.rect(-30, 40, 60 * hpRatio, 6);
    
    // Break gauge
    p.fill(50, 50, 50);
    p.rect(-30, 48, 60, 6);
    const breakRatio = enemy.breakDamage / 100;
    const breakColor = enemy.isStunned ? [255, 200, 50] : [100, 200, 255];
    p.fill(...breakColor);
    p.rect(-30, 48, 60 * breakRatio, 6);
    
    // Stunned indicator
    if (enemy.isStunned) {
      p.fill(255, 220, 50);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(14);
      p.text("BREAK!", 0, -40);
    }
    
    // Name
    p.fill(255, 255, 255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text(enemy.name, 0, 60);
    
    p.pop();
  }
}

function renderEnemySprite(p, enemy) {
  p.push();
  
  // Shadow
  p.fill(0, 0, 0, 100);
  p.ellipse(0, 20, 40, 15);
  
  // Different shapes based on element
  if (enemy.element === ELEMENT_FIRE) {
    // Fire imp
    p.fill(200, 60, 30);
    p.ellipse(0, 0, 35, 40);
    p.fill(250, 100, 50);
    p.ellipse(-5, -5, 10, 12);
    p.ellipse(5, -5, 10, 12);
    // Flames
    p.fill(255, 150, 50, 150);
    p.triangle(-8, 15, 0, 25, 8, 15);
  } else if (enemy.element === ELEMENT_ICE) {
    // Ice wolf
    p.fill(180, 200, 230);
    p.ellipse(0, 0, 40, 30);
    p.triangle(-15, -8, -20, -15, -10, -12);
    p.triangle(15, -8, 20, -15, 10, -12);
    p.fill(150, 170, 200);
    p.ellipse(-8, -2, 8, 8);
    p.ellipse(8, -2, 8, 8);
  } else if (enemy.element === ELEMENT_LIGHTNING) {
    // Thunder bat
    p.fill(120, 100, 180);
    p.ellipse(0, 0, 30, 25);
    // Wings
    p.fill(100, 80, 160);
    p.arc(-15, 0, 20, 30, p.PI, 0);
    p.arc(15, 0, 20, 30, p.PI, 0);
    // Lightning
    p.stroke(255, 255, 100);
    p.strokeWeight(2);
    p.line(0, 10, -3, 20);
    p.line(-3, 20, 3, 25);
    p.noStroke();
  } else if (enemy.element === ELEMENT_DARK) {
    // Shadow beast
    p.fill(40, 30, 60);
    p.ellipse(0, 0, 45, 35);
    p.fill(80, 60, 100);
    p.ellipse(-10, -5, 15, 20);
    p.ellipse(10, -5, 15, 20);
    p.fill(150, 50, 150);
    p.ellipse(-8, -5, 6, 8);
    p.ellipse(8, -5, 6, 8);
  } else {
    // Generic enemy
    p.fill(100, 120, 80);
    p.ellipse(0, 0, 35, 40);
    p.fill(80, 100, 60);
    p.ellipse(-8, -5, 8, 10);
    p.ellipse(8, -5, 8, 10);
  }
  
  p.pop();
}

function renderPartyInCombat(p) {
  const partyCount = gameState.party.length;
  const spacing = 100;
  const startX = CANVAS_WIDTH - 150;
  const startY = 200;
  
  for (let i = 0; i < gameState.party.length; i++) {
    const member = gameState.party[i];
    const x = startX;
    const y = startY + i * spacing;
    
    p.push();
    p.translate(x, y);
    
    // Highlight current turn
    if (gameState.combatState === COMBAT_PLAYER_TURN && i === gameState.selectedPartyMember) {
      p.fill(255, 255, 100, 100);
      p.rect(-50, -25, 100, 60);
    }
    
    // Character sprite
    if (member.isAlive()) {
      renderPartyMemberSprite(p, member);
    } else {
      // Dead indicator
      p.fill(100, 100, 100);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(12);
      p.text("Defeated", 0, 0);
    }
    
    // HP/SP bars
    p.fill(100, 20, 20);
    p.rect(-40, 20, 80, 6);
    const hpRatio = member.hp / member.maxHP;
    p.fill(220, 50, 50);
    p.rect(-40, 20, 80 * hpRatio, 6);
    
    p.fill(20, 20, 100);
    p.rect(-40, 28, 80, 5);
    const spRatio = member.sp / member.maxSP;
    p.fill(50, 120, 220);
    p.rect(-40, 28, 80 * spRatio, 5);
    
    // Name
    p.fill(255, 255, 255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text(member.name, 0, -20);
    
    p.pop();
  }
}

function renderPartyMemberSprite(p, member) {
  p.push();
  
  // Different colors based on element
  let bodyColor, accentColor;
  if (member.element === ELEMENT_FIRE) {
    bodyColor = [180, 60, 40];
    accentColor = [220, 100, 60];
  } else if (member.element === ELEMENT_ICE) {
    bodyColor = [60, 120, 180];
    accentColor = [100, 160, 220];
  } else if (member.element === ELEMENT_LIGHTNING) {
    bodyColor = [140, 100, 200];
    accentColor = [180, 140, 240];
  } else {
    bodyColor = [80, 60, 120];
    accentColor = [120, 100, 160];
  }
  
  // Body
  p.fill(...bodyColor);
  p.rect(-8, -5, 16, 15);
  
  // Head
  p.fill(220, 180, 150);
  p.ellipse(0, -10, 12, 12);
  
  // Evil features
  p.fill(255, 50, 50);
  p.ellipse(-3, -10, 3, 3);
  p.ellipse(3, -10, 3, 3);
  
  // Accent (weapon/staff)
  p.fill(...accentColor);
  p.rect(-2, 10, 4, 8);
  p.ellipse(0, 8, 6, 6);
  
  p.pop();
}

function renderCombatIntro(p) {
  p.push();
  p.fill(0, 0, 0, 180);
  p.rect(0, 150, CANVAS_WIDTH, 100);
  
  p.fill(255, 200, 200);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  const alpha = Math.min(255, gameState.animationTimer * 8);
  p.fill(255, 200, 200, alpha);
  p.text("BATTLE START!", CANVAS_WIDTH / 2, 200);
  p.pop();
}

function renderCombatMenu(p) {
  const menuX = 50;
  const menuY = CANVAS_HEIGHT - 120;
  const menuW = 200;
  const menuH = 110;
  
  p.push();
  
  // Menu background
  p.fill(20, 20, 40, 230);
  p.stroke(100, 100, 150);
  p.strokeWeight(2);
  p.rect(menuX, menuY, menuW, menuH);
  
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  
  if (gameState.combatMenu === "MAIN") {
    const options = ["Attack", "Skill", "Item"];
    for (let i = 0; i < options.length; i++) {
      const selected = i === gameState.selectedMenuOption;
      p.fill(selected ? 255 : 200, selected ? 220 : 200, selected ? 100 : 200);
      if (selected) {
        p.text("> " + options[i], menuX + 15, menuY + 15 + i * 25);
      } else {
        p.text(options[i], menuX + 20, menuY + 15 + i * 25);
      }
    }
  } else if (gameState.combatMenu === "SKILL") {
    const character = gameState.party[gameState.selectedPartyMember];
    p.fill(200, 200, 255);
    p.text("Skills (SP: " + character.sp + ")", menuX + 10, menuY + 5);
    
    for (let i = 0; i < Math.min(3, character.skills.length); i++) {
      const skill = character.skills[i];
      const selected = i === gameState.selectedMenuOption;
      const canUse = character.sp >= skill.cost;
      p.fill(selected ? 255 : 200, selected && canUse ? 220 : 200, selected ? 100 : canUse ? 200 : 100);
      const text = skill.name + " (" + skill.cost + ")";
      if (selected) {
        p.text("> " + text, menuX + 15, menuY + 25 + i * 20);
      } else {
        p.text(text, menuX + 20, menuY + 25 + i * 20);
      }
    }
    
    p.fill(150, 150, 150);
    p.textSize(10);
    p.text("Z: Back", menuX + 10, menuY + 95);
  } else if (gameState.combatMenu === "ITEM") {
    p.fill(200, 200, 255);
    p.text("Items", menuX + 10, menuY + 5);
    
    const items = [
      { name: "Health Potion", count: gameState.inventory.healthPotion },
      { name: "Mana Potion", count: gameState.inventory.manaPotion }
    ];
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const selected = i === gameState.selectedMenuOption;
      const hasItem = item.count > 0;
      p.fill(selected ? 255 : 200, selected && hasItem ? 220 : 200, selected ? 100 : hasItem ? 200 : 100);
      const text = item.name + " x" + item.count;
      if (selected) {
        p.text("> " + text, menuX + 15, menuY + 25 + i * 20);
      } else {
        p.text(text, menuX + 20, menuY + 25 + i * 20);
      }
    }
    
    p.fill(150, 150, 150);
    p.textSize(10);
    p.text("Z: Back", menuX + 10, menuY + 95);
  }
  
  p.pop();
}

function renderActionAnimation(p) {
  if (!gameState.combatAnimation) return;
  
  p.push();
  p.fill(255, 255, 255, 200 - gameState.animationTimer * 4);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(16);
  
  const y = 250 - gameState.animationTimer;
  
  if (gameState.combatAnimation.type === "ATTACK") {
    p.text("ATTACK! " + gameState.combatAnimation.result.damage + " damage", CANVAS_WIDTH / 2, y);
  } else if (gameState.combatAnimation.type === "SKILL" && gameState.combatAnimation.result.success) {
    const result = gameState.combatAnimation.result;
    if (result.heal) {
      p.fill(100, 255, 100, 200 - gameState.animationTimer * 4);
      p.text("HEAL! +" + result.heal + " HP", CANVAS_WIDTH / 2, y);
    } else {
      const weak = result.breakGain >= 25;
      if (weak) p.fill(255, 220, 100, 200 - gameState.animationTimer * 4);
      p.text((weak ? "WEAK! " : "") + result.damage + " damage", CANVAS_WIDTH / 2, y);
    }
  } else if (gameState.combatAnimation.type === "ITEM") {
    p.fill(100, 255, 100, 200 - gameState.animationTimer * 4);
    if (gameState.combatAnimation.result.heal) {
      p.text("Used Potion! +" + gameState.combatAnimation.result.heal + " HP", CANVAS_WIDTH / 2, y);
    } else if (gameState.combatAnimation.result.restore) {
      p.text("Used Potion! +" + gameState.combatAnimation.result.restore + " SP", CANVAS_WIDTH / 2, y);
    }
  }
  
  p.pop();
}

function renderBreakAttack(p) {
  p.push();
  p.fill(255, 200, 50, 200);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(28);
  const scale = 1 + Math.sin(gameState.animationTimer * 0.2) * 0.1;
  p.translate(CANVAS_WIDTH / 2, 200);
  p.scale(scale);
  p.text("BREAK ATTACK!", 0, 0);
  p.pop();
}

function renderEnemyTurn(p) {
  p.push();
  p.fill(255, 100, 100, 150);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(14);
  p.text("Enemy Turn...", CANVAS_WIDTH / 2, 250);
  p.pop();
}

function renderVictory(p) {
  p.push();
  p.fill(0, 0, 0, 200);
  p.rect(100, 120, CANVAS_WIDTH - 200, 160);
  
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.text("VICTORY!", CANVAS_WIDTH / 2, 160);
  
  p.fill(200, 200, 200);
  p.textSize(14);
  p.text("Infamy Gained: " + gameState.enemies.reduce((sum, e) => sum + e.infamyReward, 0), CANVAS_WIDTH / 2, 200);
  p.text("Battles Won: " + gameState.battlesWon + "/" + gameState.targetVictories, CANVAS_WIDTH / 2, 225);
  
  p.fill(150, 150, 150);
  p.textSize(12);
  p.text("Returning to overworld...", CANVAS_WIDTH / 2, 255);
  
  p.pop();
}

function renderDefeat(p) {
  p.push();
  p.fill(0, 0, 0, 200);
  p.rect(100, 120, CANVAS_WIDTH - 200, 160);
  
  p.fill(200, 50, 50);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.text("DEFEATED", CANVAS_WIDTH / 2, 200);
  
  p.pop();
}

function renderTurnIndicator(p) {
  if (gameState.combatState !== COMBAT_PLAYER_TURN && 
      gameState.combatState !== COMBAT_ENEMY_TURN) return;
  
  p.push();
  p.fill(0, 0, 0, 150);
  p.rect(CANVAS_WIDTH - 150, 10, 140, 30);
  
  p.fill(255, 255, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  if (gameState.combatState === COMBAT_PLAYER_TURN) {
    const member = gameState.party[gameState.selectedPartyMember];
    p.text("Turn: " + (member ? member.name : ""), CANVAS_WIDTH - 145, 18);
  } else {
    p.text("Enemy Turn", CANVAS_WIDTH - 145, 18);
  }
  p.pop();
}

export function renderPauseOverlay(p) {
  p.push();
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 255, 255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  p.pop();
}

export function renderGameOver(p, isWin) {
  p.background(20, 15, 30);
  
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  if (isWin) {
    p.fill(255, 220, 100);
    p.textSize(36);
    p.text("VICTORY!", CANVAS_WIDTH / 2, 120);
    
    p.fill(200, 200, 220);
    p.textSize(18);
    p.text("You have conquered the realm!", CANVAS_WIDTH / 2, 170);
    p.text("Your villainous party prevails!", CANVAS_WIDTH / 2, 195);
  } else {
    p.fill(200, 50, 50);
    p.textSize(36);
    p.text("DEFEATED", CANVAS_WIDTH / 2, 120);
    
    p.fill(200, 200, 220);
    p.textSize(18);
    p.text("Your evil plans have been thwarted...", CANVAS_WIDTH / 2, 170);
  }
  
  p.fill(180, 180, 200);
  p.textSize(16);
  p.text("Final Score: " + gameState.score, CANVAS_WIDTH / 2, 230);
  p.text("Battles Won: " + gameState.battlesWon, CANVAS_WIDTH / 2, 255);
  p.text("Level Reached: " + gameState.level, CANVAS_WIDTH / 2, 280);
  
  p.fill(150, 150, 170);
  p.textSize(14);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);
  
  p.pop();
}