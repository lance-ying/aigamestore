// rendering.js - All rendering functions

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, PHASE_SKILL_SELECTION, PHASE_UPGRADE_MENU } from './globals.js';

export function renderGame(p) {
  p.background(40, 35, 30);
  
  if (gameState.gamePhase === PHASE_START) {
    renderStartScreen(p);
  } else if (gameState.gamePhase === PHASE_UPGRADE_MENU) {
    renderUpgradeMenu(p);
  } else if (gameState.gamePhase === PHASE_PLAYING) {
    renderGameplay(p);
    
    if (gameState.levelTransitionTimer > 0) {
      renderLevelTransition(p);
    }
  } else if (gameState.gamePhase === PHASE_PAUSED) {
    renderGameplay(p);
    renderPauseOverlay(p);
  } else if (gameState.gamePhase === PHASE_SKILL_SELECTION) {
    renderGameplay(p);
    renderSkillSelection(p);
  } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN) {
    renderGameplay(p);
    renderVictoryScreen(p);
  } else if (gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
    renderGameplay(p);
    renderGameOverScreen(p);
  }
}

function renderStartScreen(p) {
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title
  p.textSize(48);
  p.text("ARCHERO", CANVAS_WIDTH / 2, 80);
  
  // Description
  p.textSize(14);
  p.fill(200);
  const desc = "Clear rooms by defeating all enemies!\nStand still to auto-attack. Move to dodge.\nChoose skills after each room.";
  p.text(desc, CANVAS_WIDTH / 2, 150);
  
  // Instructions
  p.textSize(12);
  p.fill(180);
  const instructions = [
    "Arrow Keys / WASD: Move",
    "Space / Z / Shift: Select Skills",
    "ESC: Pause   R: Restart"
  ];
  let y = 220;
  for (const line of instructions) {
    p.text(line, CANVAS_WIDTH / 2, y);
    y += 20;
  }
  
  // Menu options
  p.textSize(16);
  const options = ["START GAME", "PERMANENT UPGRADES", "HIGH SCORE: " + gameState.highScore];
  y = 300;
  for (let i = 0; i < options.length; i++) {
    p.fill(...(i === gameState.startMenuSelection ? [255, 220, 100] : [200]));
    p.text(options[i], CANVAS_WIDTH / 2, y);
    y += 30;
  }
  
  // Prompt
  p.fill(255, 255, 100);
  p.textSize(14);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 380);
}

function renderUpgradeMenu(p) {
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title
  p.textSize(32);
  p.text("PERMANENT UPGRADES", CANVAS_WIDTH / 2, 40);
  
  // Gold display
  p.textSize(16);
  p.fill(255, 215, 0);
  p.text("GOLD: " + gameState.totalGold, CANVAS_WIDTH / 2, 80);
  
  // Upgrades
  const upgrades = [
    { name: "Max HP +20", cost: 50, key: "maxHPBonus", current: gameState.permanentUpgrades.maxHPBonus },
    { name: "Damage +2", cost: 75, key: "damageBonus", current: gameState.permanentUpgrades.damageBonus },
    { name: "Attack Speed +2", cost: 100, key: "attackSpeedBonus", current: gameState.permanentUpgrades.attackSpeedBonus },
    { name: "Gold Gain +20%", cost: 125, key: "goldBonus", current: gameState.permanentUpgrades.goldBonus },
    { name: "BACK", cost: 0, key: null, current: 0 }
  ];
  
  let y = 130;
  for (let i = 0; i < upgrades.length; i++) {
    const upgrade = upgrades[i];
    const selected = i === gameState.upgradeMenuSelection;
    
    p.fill(...(selected ? [255, 220, 100] : [200]));
    p.textSize(14);
    
    if (upgrade.key) {
      const text = `${upgrade.name} (${upgrade.cost}g) [Owned: ${upgrade.current}]`;
      p.text(text, CANVAS_WIDTH / 2, y);
    } else {
      p.text(upgrade.name, CANVAS_WIDTH / 2, y);
    }
    
    y += 30;
  }
  
  p.fill(180);
  p.textSize(12);
  p.text("Arrow Keys: Navigate   SPACE: Select", CANVAS_WIDTH / 2, 370);
}

function renderGameplay(p) {
  // Draw floor
  p.fill(60, 50, 40);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Draw walls
  p.fill(80, 70, 60);
  p.rect(0, 0, CANVAS_WIDTH, 30);
  p.rect(0, 0, 30, CANVAS_HEIGHT);
  p.rect(CANVAS_WIDTH - 30, 0, 30, CANVAS_HEIGHT);
  p.rect(0, CANVAS_HEIGHT - 30, CANVAS_WIDTH, 30);
  
  // Render entities
  for (const entity of gameState.entities) {
    if (entity && entity.render) {
      entity.render(p);
    }
  }
  
  // UI
  renderUI(p);
}

function renderUI(p) {
  p.textAlign(p.LEFT, p.TOP);
  p.fill(255);
  p.textSize(14);
  
  // Level and room
  p.text(`LEVEL: ${gameState.currentLevel} / ROOM: ${gameState.currentRoom}`, 10, 10);
  
  // Score
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  
  // Gold
  p.text(`GOLD: ${gameState.gold}`, CANVAS_WIDTH - 10, 30);
  
  // Player HP
  if (gameState.player) {
    p.textAlign(p.LEFT, p.BOTTOM);
    p.fill(255);
    p.text(`HP: ${Math.ceil(gameState.player.hp)}/${gameState.player.maxHP}`, 10, CANVAS_HEIGHT - 10);
    
    // HP bar
    const barWidth = 150;
    const barHeight = 15;
    const barX = 10;
    const barY = CANVAS_HEIGHT - 40;
    
    p.fill(100, 0, 0);
    p.noStroke();
    p.rect(barX, barY, barWidth, barHeight);
    
    p.fill(0, 255, 0);
    const hpRatio = gameState.player.hp / gameState.player.maxHP;
    p.rect(barX, barY, barWidth * hpRatio, barHeight);
    
    p.stroke(255);
    p.noFill();
    p.rect(barX, barY, barWidth, barHeight);
  }
}

function renderLevelTransition(p) {
  const levelNames = [
    "THE TRAINING GROUNDS",
    "THE SHIFTING SANDS",
    "THE DARK FOREST",
    "THE CRYSTAL CAVES",
    "THE ANCIENT FORTRESS"
  ];
  
  const alpha = Math.min(255, gameState.levelTransitionTimer * 2);
  
  p.fill(0, 0, 0, alpha * 0.7);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 255, 255, alpha);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text(`CHAPTER ${gameState.currentLevel}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  
  p.textSize(20);
  p.text(levelNames[gameState.currentLevel - 1], CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
}

function renderPauseOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("PAUSED", CANVAS_WIDTH / 2, 150);
  
  const options = ["RESUME", "MAIN MENU"];
  let y = 220;
  p.textSize(20);
  for (let i = 0; i < options.length; i++) {
    p.fill(...(i === gameState.pauseMenuSelection ? [255, 220, 100] : [200]));
    p.text(options[i], CANVAS_WIDTH / 2, y);
    y += 40;
  }
  
  p.fill(180);
  p.textSize(12);
  p.text("Arrow Keys: Navigate   SPACE: Select   ESC: Resume", CANVAS_WIDTH / 2, 330);
}

function renderSkillSelection(p) {
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(28);
  p.text("CHOOSE YOUR SKILL", CANVAS_WIDTH / 2, 60);
  
  // Render skill options
  const boxWidth = 160;
  const boxHeight = 120;
  const spacing = 20;
  const startX = (CANVAS_WIDTH - (boxWidth * 3 + spacing * 2)) / 2;
  
  for (let i = 0; i < gameState.skillOptions.length; i++) {
    const skill = gameState.skillOptions[i];
    const x = startX + i * (boxWidth + spacing);
    const y = 140;
    
    // Box
    if (i === gameState.selectedSkillIndex) {
      p.fill(100, 150, 255);
    } else {
      p.fill(80, 80, 100);
    }
    p.rect(x, y, boxWidth, boxHeight);
    
    // Border
    p.noFill();
    p.stroke(255);
    p.strokeWeight(2);
    p.rect(x, y, boxWidth, boxHeight);
    p.noStroke();
    
    // Text
    p.fill(255);
    p.textSize(14);
    p.text(skill.name, x + boxWidth / 2, y + 30);
    
    p.textSize(11);
    p.fill(200);
    const words = skill.description.split(' ');
    let line = '';
    let lineY = y + 60;
    for (const word of words) {
      const testLine = line + word + ' ';
      if (p.textWidth(testLine) > boxWidth - 10 && line.length > 0) {
        p.text(line, x + boxWidth / 2, lineY);
        line = word + ' ';
        lineY += 15;
      } else {
        line = testLine;
      }
    }
    p.text(line, x + boxWidth / 2, lineY);
    
    // Key hint
    p.fill(255, 255, 100);
    p.textSize(12);
    const keys = ['SPACE', 'Z', 'SHIFT'];
    p.text(`[${keys[i]}]`, x + boxWidth / 2, y + boxHeight - 15);
  }
}

function renderGameOverScreen(p) {
  p.fill(0, 0, 0, 220);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 50, 50);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("GAME OVER", CANVAS_WIDTH / 2, 120);
  
  p.fill(255);
  p.textSize(20);
  p.text(`FINAL SCORE: ${gameState.score}`, CANVAS_WIDTH / 2, 200);
  p.text(`GOLD EARNED: ${gameState.gold}`, CANVAS_WIDTH / 2, 230);
  
  if (gameState.score > gameState.highScore) {
    p.fill(255, 215, 0);
    p.textSize(16);
    p.text("NEW HIGH SCORE!", CANVAS_WIDTH / 2, 270);
  }
  
  p.fill(180);
  p.textSize(14);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 350);
}

function renderVictoryScreen(p) {
  p.fill(0, 0, 0, 220);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("VICTORY!", CANVAS_WIDTH / 2, 100);
  
  p.fill(255);
  p.textSize(24);
  p.text("YOU HAVE CONQUERED", CANVAS_WIDTH / 2, 160);
  p.text("THE ANCIENT FORTRESS!", CANVAS_WIDTH / 2, 190);
  
  p.textSize(20);
  p.text(`FINAL SCORE: ${gameState.score}`, CANVAS_WIDTH / 2, 240);
  p.text(`GOLD EARNED: ${gameState.gold}`, CANVAS_WIDTH / 2, 270);
  
  if (gameState.score > gameState.highScore) {
    p.fill(255, 215, 0);
    p.textSize(16);
    p.text("NEW HIGH SCORE!", CANVAS_WIDTH / 2, 310);
  }
  
  p.fill(180);
  p.textSize(14);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 360);
}