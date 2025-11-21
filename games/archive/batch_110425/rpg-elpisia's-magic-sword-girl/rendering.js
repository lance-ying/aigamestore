// rendering.js - All rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, PLAY_MODES } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 15, 35);
  
  // Title with glow effect
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  // Glow
  p.fill(150, 100, 200, 100);
  p.textSize(36);
  p.text("RPG Elpisia's", CANVAS_WIDTH / 2, 80);
  p.text("Magic Sword Girl", CANVAS_WIDTH / 2, 120);
  
  // Main title
  p.fill(255, 220, 255);
  p.textSize(32);
  p.text("RPG Elpisia's", CANVAS_WIDTH / 2, 78);
  p.text("Magic Sword Girl", CANVAS_WIDTH / 2, 118);
  
  // Subtitle
  p.fill(200, 180, 220);
  p.textSize(14);
  p.text("エルピシアの魔剣少女", CANVAS_WIDTH / 2, 150);
  
  // Description
  p.fill(180, 180, 200);
  p.textSize(13);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("Journey through Elpisia as Aldo, wielding the power of", CANVAS_WIDTH / 2, 190);
  p.text("Eris, who transforms into magical swords!", CANVAS_WIDTH / 2, 210);
  
  // Instructions
  p.fill(220, 200, 255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  const startX = 100;
  let startY = 240;
  const lineHeight = 18;
  
  p.text("COMBAT:", startX, startY);
  startY += lineHeight;
  p.text("• Arrow Keys - Navigate menus", startX + 10, startY);
  startY += lineHeight;
  p.text("• Space - Confirm action", startX + 10, startY);
  startY += lineHeight;
  p.text("• Z - Back in menus", startX + 10, startY);
  startY += lineHeight;
  p.text("• Manage HP, MP, and AP strategically!", startX + 10, startY);
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textSize(16);
  p.textAlign(p.CENTER, p.CENTER);
  const pulse = Math.sin(p.frameCount * 0.1) * 20 + 235;
  p.fill(pulse, pulse, 100);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
  
  p.pop();
}

export function renderExploration(p) {
  // Background - dungeon atmosphere
  p.background(30, 25, 40);
  
  // Floor tiles
  p.fill(45, 40, 55);
  for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
    for (let x = 0; x < CANVAS_WIDTH; x += 40) {
      p.rect(x, y, 38, 38);
    }
  }
  
  // Walls
  p.fill(60, 50, 70);
  p.rect(0, 0, CANVAS_WIDTH, 30);
  p.rect(0, CANVAS_HEIGHT - 30, CANVAS_WIDTH, 30);
  p.rect(0, 0, 30, CANVAS_HEIGHT);
  p.rect(CANVAS_WIDTH - 30, 0, 30, CANVAS_HEIGHT);
  
  // Player character (Aldo)
  renderPlayer(p, gameState.playerPosition.x, gameState.playerPosition.y);
  
  // UI
  renderExplorationUI(p);
  
  // Prompt to enter combat
  if (gameState.waveNumber <= gameState.totalWaves) {
    p.fill(255, 255, 150);
    p.textSize(14);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("Move around to explore. You'll encounter enemies soon...", CANVAS_WIDTH / 2, 50);
  }
}

function renderPlayer(p, x, y) {
  p.push();
  
  // Body
  p.fill(80, 100, 200);
  p.ellipse(x, y, 30, 40);
  
  // Head
  p.fill(255, 220, 180);
  p.ellipse(x, y - 20, 25, 25);
  
  // Eyes
  p.fill(50);
  p.ellipse(x - 5, y - 22, 4, 4);
  p.ellipse(x + 5, y - 22, 4, 4);
  
  // Sword (current weapon indicator)
  const weapon = gameState.player.weapons[gameState.player.currentWeapon];
  let swordColor;
  if (weapon.name.includes("Flame")) {
    swordColor = [255, 100, 50];
  } else if (weapon.name.includes("Ice")) {
    swordColor = [100, 180, 255];
  } else {
    swordColor = [255, 255, 100];
  }
  
  p.stroke(...swordColor);
  p.strokeWeight(3);
  p.line(x + 15, y - 10, x + 30, y - 20);
  p.noStroke();
  
  // Weapon glow
  p.fill(...swordColor, 100);
  p.ellipse(x + 22, y - 15, 12, 12);
  
  p.pop();
}

function renderExplorationUI(p) {
  // Status bar at top
  p.fill(20, 20, 30, 200);
  p.rect(10, 10, CANVAS_WIDTH - 20, 60);
  
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  
  const player = gameState.player;
  p.text(`Lv ${player.level}  HP: ${player.hp}/${player.maxHP}  MP: ${player.mp}/${player.maxMP}  AP: ${player.ap}/${player.maxAP}`, 20, 20);
  p.text(`Wave: ${gameState.waveNumber}/${gameState.totalWaves}  Score: ${gameState.score}`, 20, 40);
  p.text(`EXP: ${gameState.exp}/${gameState.expToNext}`, 20, 55);
}

export function renderCombat(p) {
  // Combat background
  p.background(25, 20, 35);
  
  // Combat arena
  p.fill(40, 35, 50);
  p.rect(50, 50, CANVAS_WIDTH - 100, CANVAS_HEIGHT - 150);
  
  const enemy = gameState.currentEnemy;
  
  if (enemy) {
    // Enemy
    renderEnemy(p, enemy, 400, 150);
    
    // Enemy info
    p.fill(255);
    p.textSize(14);
    p.textAlign(p.CENTER, p.TOP);
    p.text(enemy.name, 400, 240);
    
    // Enemy HP bar
    renderHPBar(p, 350, 260, 100, 12, enemy.hp, enemy.maxHP, [255, 80, 80]);
  }
  
  // Player
  renderPlayer(p, 150, 180);
  
  // Player info
  const player = gameState.player;
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Aldo Lv${player.level}`, 100, 240);
  
  // Player bars
  renderHPBar(p, 100, 260, 120, 10, player.hp, player.maxHP, [100, 255, 100]);
  renderHPBar(p, 100, 275, 120, 10, player.mp, player.maxMP, [100, 150, 255]);
  
  // AP indicators
  p.fill(255);
  p.textSize(10);
  p.text("AP:", 100, 290);
  for (let i = 0; i < player.maxAP; i++) {
    p.fill(i < player.ap ? [255, 255, 100] : [80, 80, 80]);
    p.rect(130 + i * 20, 290, 15, 15);
  }
  
  // Combat menu
  renderCombatMenu(p);
  
  // Combat log
  renderCombatLog(p);
  
  // Turn indicator
  if (gameState.combatTurn === "PLAYER") {
    p.fill(100, 255, 100);
    p.textSize(14);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("YOUR TURN", CANVAS_WIDTH / 2, 30);
  } else {
    p.fill(255, 100, 100);
    p.textSize(14);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("ENEMY TURN", CANVAS_WIDTH / 2, 30);
  }
  
  // Victory overlay
  if (gameState.combatVictory) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(255, 255, 100);
    p.textSize(24);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("VICTORY!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  }
}

function renderEnemy(p, enemy, x, y) {
  p.push();
  
  // Animation offset
  const offset = Math.sin(p.frameCount * 0.05) * 5;
  
  // Body
  p.fill(...enemy.color);
  p.ellipse(x, y + offset, enemy.size, enemy.size * 1.2);
  
  // Eyes (glowing)
  p.fill(255, 50, 50);
  const eyeOffset = enemy.size * 0.15;
  p.ellipse(x - eyeOffset, y - eyeOffset + offset, 8, 8);
  p.ellipse(x + eyeOffset, y - eyeOffset + offset, 8, 8);
  
  // Boss crown
  if (enemy.type === "boss") {
    p.fill(255, 215, 0);
    p.triangle(
      x, y - enemy.size * 0.7 + offset,
      x - 15, y - enemy.size * 0.5 + offset,
      x + 15, y - enemy.size * 0.5 + offset
    );
  }
  
  p.pop();
}

function renderHPBar(p, x, y, width, height, current, max, color) {
  // Background
  p.fill(40, 40, 40);
  p.rect(x, y, width, height);
  
  // HP
  const hpPercent = current / max;
  p.fill(...color);
  p.rect(x, y, width * hpPercent, height);
  
  // Border
  p.noFill();
  p.stroke(200);
  p.strokeWeight(1);
  p.rect(x, y, width, height);
  p.noStroke();
  
  // Text
  p.fill(255);
  p.textSize(9);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(`${current}/${max}`, x + width / 2, y + height / 2);
}

function renderCombatMenu(p) {
  p.fill(20, 20, 30, 230);
  p.rect(50, CANVAS_HEIGHT - 90, CANVAS_WIDTH - 100, 80);
  
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  
  if (gameState.menuState === "MAIN") {
    const actions = ["Attack", "Skills", "Charge", "Defend"];
    for (let i = 0; i < actions.length; i++) {
      const isSelected = i === gameState.selectedAction;
      p.fill(isSelected ? [255, 255, 100] : [200, 200, 200]);
      p.text((isSelected ? "> " : "  ") + actions[i], 70, CANVAS_HEIGHT - 75 + i * 18);
    }
  } else if (gameState.menuState === "WEAPON_SELECT") {
    p.fill(255, 255, 100);
    p.text("Select Weapon (Z to go back):", 70, CANVAS_HEIGHT - 75);
    
    const weapons = gameState.player.weapons;
    for (let i = 0; i < weapons.length; i++) {
      const isSelected = i === gameState.selectedWeapon;
      p.fill(isSelected ? [255, 255, 100] : [200, 200, 200]);
      p.text((isSelected ? "> " : "  ") + weapons[i].name, 90, CANVAS_HEIGHT - 55 + i * 18);
    }
  } else if (gameState.menuState === "SKILL_SELECT") {
    const weapon = gameState.player.weapons[gameState.selectedWeapon];
    p.fill(255, 255, 100);
    p.text(`${weapon.name} Skills (Z to go back):`, 70, CANVAS_HEIGHT - 75);
    
    for (let i = 0; i < weapon.skills.length; i++) {
      const skill = weapon.skills[i];
      const isSelected = i === gameState.selectedSkill;
      const canUse = gameState.player.ap >= skill.apCost;
      
      p.fill(isSelected ? [255, 255, 100] : (canUse ? [200, 200, 200] : [100, 100, 100]));
      p.text((isSelected ? "> " : "  ") + `${skill.name} (AP: ${skill.apCost})`, 90, CANVAS_HEIGHT - 55 + i * 18);
    }
  }
}

function renderCombatLog(p) {
  p.fill(255);
  p.textSize(11);
  p.textAlign(p.LEFT, p.TOP);
  
  const startY = 65;
  for (let i = 0; i < gameState.combatLog.length; i++) {
    p.text(gameState.combatLog[i], 60, startY + i * 16);
  }
}

export function renderPaused(p) {
  // Dim overlay
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Paused text
  p.fill(255, 255, 100);
  p.textSize(12);
  p.textAlign(p.RIGHT, p.TOP);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

export function renderGameOver(p, isWin) {
  p.background(isWin ? [20, 40, 20] : [40, 20, 20]);
  
  // Game over message
  p.fill(255);
  p.textSize(32);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(isWin ? "VICTORY!" : "DEFEAT", CANVAS_WIDTH / 2, 120);
  
  // Stats
  p.textSize(16);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
  p.text(`Level Reached: ${gameState.level}`, CANVAS_WIDTH / 2, 210);
  p.text(`Enemies Defeated: ${gameState.enemiesDefeated}`, CANVAS_WIDTH / 2, 240);
  
  if (isWin) {
    p.fill(255, 255, 100);
    p.textSize(14);
    p.text("You have saved Elpisia!", CANVAS_WIDTH / 2, 280);
  } else {
    p.fill(255, 150, 150);
    p.textSize(14);
    p.text("The darkness grows stronger...", CANVAS_WIDTH / 2, 280);
  }
  
  // Restart prompt
  p.fill(200, 200, 255);
  p.textSize(14);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);
}