// rendering.js - All rendering functions

import {
  gameState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  MONSTER_SLOTS,
  MONSTER_TYPES
} from './globals.js';

export function renderGame(p) {
  p.background(30, 25, 35);
  
  switch (gameState.gamePhase) {
    case PHASE_START:
      renderStartScreen(p);
      break;
    case PHASE_PLAYING:
      renderPlayingScreen(p);
      if (gameState.showUpgradeScreen) {
        renderUpgradeScreen(p);
      }
      break;
    case PHASE_PAUSED:
      renderPlayingScreen(p);
      renderPauseOverlay(p);
      break;
    case PHASE_GAME_OVER_WIN:
    case PHASE_GAME_OVER_LOSE:
      renderGameOverScreen(p);
      break;
  }
}

function renderStartScreen(p) {
  // Title
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(255, 220, 100);
  p.textSize(48);
  p.text("ダンジョンスクワッド", CANVAS_WIDTH / 2, 80);
  
  p.fill(200, 180, 150);
  p.textSize(32);
  p.text("DUNGEON SQUAD", CANVAS_WIDTH / 2, 120);
  
  // Description
  p.fill(200, 200, 220);
  p.textSize(14);
  p.text("Command your monster squad to defend", CANVAS_WIDTH / 2, 170);
  p.text("against waves of invading heroes!", CANVAS_WIDTH / 2, 190);
  
  // Instructions
  p.fill(180, 180, 200);
  p.textSize(13);
  p.textAlign(p.LEFT);
  const startX = 100;
  p.text("CONTROLS:", startX, 230);
  p.textSize(12);
  p.text("• ARROW KEYS - Navigate menus", startX + 20, 250);
  p.text("• SPACE - Deploy monster / Use skill", startX + 20, 268);
  p.text("• Z - Cycle through monsters", startX + 20, 286);
  p.text("• SHIFT - Quick-select slot", startX + 20, 304);
  
  // Start prompt
  p.textAlign(p.CENTER);
  p.fill(255, 255, 100);
  p.textSize(18);
  const blink = Math.sin(p.frameCount * 0.1) > 0;
  if (blink) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 350);
  }
  p.pop();
}

function renderPlayingScreen(p) {
  // Background gradient
  for (let y = 0; y < CANVAS_HEIGHT; y += 10) {
    const alpha = p.map(y, 0, CANVAS_HEIGHT, 40, 60);
    p.stroke(alpha, alpha - 10, alpha + 5);
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Battle zone line
  p.push();
  p.stroke(100, 80, 80);
  p.strokeWeight(2);
  p.line(350, 0, 350, CANVAS_HEIGHT);
  p.pop();
  
  // Monster slots
  for (let i = 0; i < MONSTER_SLOTS.length; i++) {
    const isOccupied = gameState.monsters.some(m => m.slotIndex === i);
    const isSelected = i === gameState.selectedSlotIndex;
    
    p.push();
    p.noFill();
    p.strokeWeight(2);
    p.stroke(...(isSelected ? [255, 255, 100] : [80, 80, 100]));
    const slotX = 150 + (i % 2) * 100;
    const slotY = 100 + Math.floor(i / 2) * 100;
    p.rect(slotX - 25, slotY - 25, 50, 50, 5);
    
    if (!isOccupied) {
      p.fill(100, 100, 120, 100);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(10);
      p.text("EMPTY", slotX, slotY);
    }
    p.pop();
  }
  
  // Render particles (behind everything)
  for (const particle of gameState.particles) {
    p.push();
    p.noStroke();
    const alpha = p.map(particle.life, 0, 40, 0, 200);
    p.fill(...particle.color, alpha);
    p.ellipse(particle.x, particle.y, particle.size);
    p.pop();
  }
  
  // Render projectiles
  for (const proj of gameState.projectiles) {
    p.push();
    p.noStroke();
    p.fill(...proj.color);
    p.ellipse(proj.x, proj.y, proj.size);
    p.pop();
  }
  
  // Render monsters
  for (let i = 0; i < gameState.monsters.length; i++) {
    const isSelected = i === gameState.selectedMonsterIndex;
    gameState.monsters[i].draw(p, isSelected);
  }
  
  // Render heroes
  for (const hero of gameState.heroes) {
    hero.draw(p);
  }
  
  // UI Panel
  renderUI(p);
  
  // Message
  if (gameState.messageTimer > 0) {
    p.push();
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255, 255, 150, p.map(gameState.messageTimer, 0, 60, 0, 255));
    p.textSize(16);
    p.text(gameState.message, CANVAS_WIDTH / 2, 30);
    p.pop();
  }
}

function renderUI(p) {
  // Top UI bar
  p.push();
  p.fill(20, 20, 30, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 50);
  
  p.fill(255, 220, 100);
  p.textSize(16);
  p.textAlign(p.LEFT, p.CENTER);
  p.text(`Wave: ${gameState.wave}/${gameState.maxWaves}`, 10, 25);
  
  p.fill(150, 200, 255);
  p.text(`Shards: ${gameState.soulShards}`, 200, 25);
  
  p.fill(200, 200, 220);
  p.text(`Monsters: ${gameState.monsters.length}/5`, 380, 25);
  p.pop();
  
  // Monster roster panel
  if (!gameState.showUpgradeScreen) {
    p.push();
    p.fill(20, 20, 30, 200);
    p.noStroke();
    p.rect(400, 60, 190, 330);
    
    p.fill(255, 220, 100);
    p.textSize(14);
    p.textAlign(p.CENTER);
    p.text("MONSTER ROSTER", 495, 75);
    
    p.textAlign(p.LEFT);
    p.textSize(11);
    let yPos = 95;
    
    for (let i = 0; i < gameState.availableMonsterTypes.length; i++) {
      const typeIndex = gameState.availableMonsterTypes[i];
      const type = MONSTER_TYPES[typeIndex];
      
      p.fill(...type.color);
      p.ellipse(415, yPos, 20, 20);
      
      p.fill(200, 200, 220);
      p.text(type.name, 435, yPos - 8);
      p.fill(150, 150, 170);
      p.textSize(9);
      p.text(`HP:${Math.floor(type.health * gameState.modifiers.healthMultiplier)}`, 435, yPos + 5);
      p.text(`DMG:${Math.floor(type.damage * gameState.modifiers.damageMultiplier)}`, 500, yPos + 5);
      
      yPos += 35;
    }
    
    // Selected monster info
    if (gameState.selectedMonsterIndex >= 0) {
      const monster = gameState.monsters[gameState.selectedMonsterIndex];
      yPos += 10;
      
      p.fill(255, 220, 100);
      p.textSize(12);
      p.text("SELECTED:", 410, yPos);
      yPos += 18;
      
      p.fill(200, 200, 220);
      p.textSize(11);
      p.text(monster.name, 410, yPos);
      yPos += 15;
      
      p.fill(150, 150, 170);
      p.textSize(10);
      p.text(`HP: ${Math.floor(monster.health)}/${Math.floor(monster.maxHealth)}`, 410, yPos);
      yPos += 15;
      
      p.text(`Skill: ${monster.skillName}`, 410, yPos);
      yPos += 12;
      
      if (monster.skillTimer > 0) {
        const cooldownSec = Math.ceil(monster.skillTimer / 60);
        p.fill(255, 150, 150);
        p.text(`Cooldown: ${cooldownSec}s`, 410, yPos);
      } else {
        p.fill(100, 255, 100);
        p.text(`Ready!`, 410, yPos);
      }
    }
    p.pop();
  }
}

function renderUpgradeScreen(p) {
  // Semi-transparent overlay
  p.push();
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Title
  p.fill(255, 220, 100);
  p.textSize(28);
  p.textAlign(p.CENTER);
  p.text("WAVE COMPLETE!", CANVAS_WIDTH / 2, 80);
  
  p.fill(200, 200, 220);
  p.textSize(16);
  p.text("Choose an Upgrade:", CANVAS_WIDTH / 2, 110);
  
  // Upgrade options
  const startY = 150;
  const spacing = 80;
  
  for (let i = 0; i < gameState.upgradeOptions.length; i++) {
    const upgrade = gameState.upgradeOptions[i];
    const y = startY + i * spacing;
    const isSelected = i === gameState.selectedUpgrade;
    
    // Box
    p.stroke(...(isSelected ? [255, 255, 100] : [100, 100, 150]));
    p.strokeWeight(3);
    p.fill(40, 40, 60, 200);
    p.rect(100, y - 25, 400, 60, 5);
    
    // Text
    p.noStroke();
    p.fill(...(isSelected ? [255, 255, 150] : [200, 200, 220]));
    p.textSize(16);
    p.textAlign(p.CENTER);
    p.text(upgrade.name, CANVAS_WIDTH / 2, y - 5);
    
    p.fill(...(isSelected ? [220, 220, 200] : [150, 150, 170]));
    p.textSize(12);
    p.text(upgrade.description, CANVAS_WIDTH / 2, y + 15);
  }
  
  // Instructions
  p.fill(180, 180, 200);
  p.textSize(13);
  p.text("Use ARROW KEYS to select, SPACE to confirm", CANVAS_WIDTH / 2, 370);
  p.pop();
}

function renderPauseOverlay(p) {
  p.push();
  p.fill(255, 255, 100);
  p.textSize(14);
  p.textAlign(p.RIGHT, p.TOP);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  p.pop();
}

function renderGameOverScreen(p) {
  p.background(20, 15, 25);
  
  const isWin = gameState.gamePhase === PHASE_GAME_OVER_WIN;
  
  // Title
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(...(isWin ? [100, 255, 100] : [255, 100, 100]));
  p.textSize(42);
  p.text(isWin ? "VICTORY!" : "DEFEATED", CANVAS_WIDTH / 2, 100);
  
  // Stats
  p.fill(200, 200, 220);
  p.textSize(18);
  p.text(`Waves Cleared: ${gameState.wave}`, CANVAS_WIDTH / 2, 180);
  p.text(`Soul Shards Earned: ${gameState.totalShardsEarned}`, CANVAS_WIDTH / 2, 210);
  
  if (isWin) {
    p.fill(255, 220, 100);
    p.textSize(16);
    p.text("You have conquered the dungeon!", CANVAS_WIDTH / 2, 250);
  } else {
    p.fill(200, 180, 150);
    p.textSize(16);
    p.text("The heroes have breached your defenses...", CANVAS_WIDTH / 2, 250);
  }
  
  // Restart prompt
  p.fill(255, 255, 150);
  p.textSize(18);
  const blink = Math.sin(p.frameCount * 0.1) > 0;
  if (blink) {
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
  }
  p.pop();
}