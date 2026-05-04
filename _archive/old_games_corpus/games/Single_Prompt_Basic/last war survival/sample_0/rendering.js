// rendering.js - Rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, NUM_LANES, LANE_START_Y, LANE_HEIGHT, BASE_ZONE_WIDTH, PHASE_START, PHASE_PAUSED } from './globals.js';
import { HERO_CONFIG } from './config.js';
import { STRUCTURE_UPGRADE_COST, STRUCTURE_BENEFITS } from './config.js';

export function drawStartScreen(p) {
  p.background(20);
  
  p.push();
  p.fill(200, 50, 50);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("LAST WAR: SURVIVAL", CANVAS_WIDTH / 2, 80);
  
  p.fill(200);
  p.textSize(16);
  p.text("Defend your base against zombie waves!", CANVAS_WIDTH / 2, 140);
  p.text("Deploy heroes to stop zombies from reaching your base.", CANVAS_WIDTH / 2, 165);
  
  p.textSize(14);
  p.fill(150, 150, 200);
  p.text("CONTROLS:", CANVAS_WIDTH / 2, 210);
  p.fill(180);
  p.textSize(12);
  p.text("W/A/S: Select hero cards", CANVAS_WIDTH / 2, 230);
  p.text("Arrow Up/Down: Select lane", CANVAS_WIDTH / 2, 245);
  p.text("Space: Deploy hero / Collect resources", CANVAS_WIDTH / 2, 260);
  p.text("ESC/Shift: Pause", CANVAS_WIDTH / 2, 275);
  p.text("R: Restart", CANVAS_WIDTH / 2, 290);
  
  p.fill(100, 255, 100);
  p.textSize(24);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 350);
  
  p.pop();
}

export function drawCombatScene(p) {
  // Background
  p.background(40, 35, 30);
  
  // Draw lanes
  p.push();
  p.stroke(80);
  p.strokeWeight(1);
  for (let i = 0; i <= NUM_LANES; i++) {
    const y = LANE_START_Y + i * LANE_HEIGHT;
    p.line(0, y, CANVAS_WIDTH, y);
  }
  p.pop();
  
  // Draw base zone
  p.push();
  p.fill(60, 100, 60, 100);
  p.noStroke();
  p.rect(0, 0, BASE_ZONE_WIDTH, CANVAS_HEIGHT);
  
  // Draw base HP indicator
  p.fill(80, 150, 80);
  p.rect(5, 10, 50, 380);
  
  const hpPercent = gameState.baseHP / gameState.maxBaseHP;
  p.fill(...(hpPercent > 0.5 ? [100, 200, 100] : hpPercent > 0.25 ? [200, 200, 50] : [200, 50, 50]));
  p.rect(5, 10 + (1 - hpPercent) * 380, 50, hpPercent * 380);
  
  p.fill(255);
  p.textSize(10);
  p.textAlign(p.CENTER);
  p.text("BASE", 30, CANVAS_HEIGHT / 2);
  p.text(`${Math.ceil(gameState.baseHP)}`, 30, CANVAS_HEIGHT / 2 + 15);
  
  p.pop();
  
  // Draw entities
  for (const obstacle of gameState.obstacles) {
    obstacle.draw(p);
  }
  
  for (const effect of gameState.effects) {
    effect.draw(p);
  }
  
  for (const projectile of gameState.projectiles) {
    projectile.draw(p);
  }
  
  for (const zombie of gameState.zombies) {
    zombie.draw(p);
  }
  
  for (const hero of gameState.heroes) {
    hero.draw(p);
  }
  
  // Draw UI
  drawCombatUI(p);
  
  // Draw lane selector
  if (gameState.selectedHeroType) {
    const laneY = LANE_START_Y + gameState.selectedLane * LANE_HEIGHT;
    p.push();
    p.noFill();
    p.stroke(255, 255, 0, 150);
    p.strokeWeight(3);
    p.rect(BASE_ZONE_WIDTH, laneY, CANVAS_WIDTH - BASE_ZONE_WIDTH, LANE_HEIGHT);
    p.pop();
  }
}

export function drawCombatUI(p) {
  // Resources
  p.push();
  p.fill(255, 220, 100);
  p.textSize(14);
  p.textAlign(p.LEFT);
  p.text(`Gold: ${gameState.gold}`, 70, 20);
  p.fill(180, 180, 220);
  p.text(`Supplies: ${gameState.supplies}`, 70, 35);
  
  // Level
  p.fill(200);
  p.text(`LEVEL: ${gameState.currentLevel}`, 70, 50);
  
  // Score
  p.textAlign(p.RIGHT);
  p.fill(255);
  p.textSize(20);
  p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 10, 25);
  
  // Wave counter
  p.textAlign(p.CENTER);
  p.textSize(18);
  p.fill(255, 200, 200);
  p.text(`WAVE: ${gameState.currentWave}/${gameState.totalWaves}`, CANVAS_WIDTH / 2, 25);
  
  p.pop();
  
  // Hero cards
  drawHeroCards(p);
}

export function drawHeroCards(p) {
  const cardWidth = 80;
  const cardHeight = 100;
  const cardSpacing = 10;
  const startX = (CANVAS_WIDTH - (cardWidth * 3 + cardSpacing * 2)) / 2;
  const startY = CANVAS_HEIGHT - cardHeight - 10;
  
  let cardIndex = 0;
  for (const heroType of gameState.unlockedHeroes) {
    const x = startX + cardIndex * (cardWidth + cardSpacing);
    const y = startY;
    
    const isSelected = gameState.selectedHeroType === heroType;
    const onCooldown = gameState.heroCooldowns[heroType] > 0;
    const canAfford = gameState.gold >= HERO_CONFIG[heroType].cost;
    
    p.push();
    
    // Card background
    p.fill(...(isSelected ? [100, 100, 150] : [60, 60, 80]));
    p.stroke(...(isSelected ? [200, 200, 255] : [100, 100, 120]));
    p.strokeWeight(2);
    p.rect(x, y, cardWidth, cardHeight);
    
    // Hero icon
    const config = HERO_CONFIG[heroType];
    p.fill(...config.color);
    p.noStroke();
    p.circle(x + cardWidth / 2, y + 30, 30);
    
    // Hero name
    p.fill(255);
    p.textSize(10);
    p.textAlign(p.CENTER);
    p.text(config.name, x + cardWidth / 2, y + 55);
    
    // Cost
    p.fill(...(canAfford ? [255, 220, 100] : [150, 100, 100]));
    p.text(`${config.cost}G`, x + cardWidth / 2, y + 70);
    
    // Cooldown overlay
    if (onCooldown) {
      const cooldownPercent = gameState.heroCooldowns[heroType] / config.cooldown;
      p.fill(0, 0, 0, 150);
      p.noStroke();
      p.rect(x, y, cardWidth, cardHeight * cooldownPercent);
      
      p.fill(255);
      p.textSize(12);
      p.text(Math.ceil(gameState.heroCooldowns[heroType] / 60), x + cardWidth / 2, y + 85);
    }
    
    // Keybind hint
    p.fill(200);
    p.textSize(9);
    const keys = ['W', 'A', 'S'];
    p.text(keys[cardIndex], x + cardWidth / 2, y + cardHeight - 5);
    
    p.pop();
    
    cardIndex++;
  }
}

export function drawBaseBuilding(p) {
  p.background(60, 50, 40);
  
  // Title
  p.push();
  p.fill(200, 180, 150);
  p.textAlign(p.CENTER);
  p.textSize(28);
  p.text("BASE MANAGEMENT", CANVAS_WIDTH / 2, 30);
  
  // Resources
  p.textSize(16);
  p.fill(255, 220, 100);
  p.textAlign(p.LEFT);
  p.text(`Gold: ${gameState.gold}`, 20, 60);
  p.fill(180, 180, 220);
  p.text(`Supplies: ${gameState.supplies}`, 20, 80);
  
  // Score and Level
  p.fill(200);
  p.text(`LEVEL: ${gameState.currentLevel}`, 20, 100);
  p.textAlign(p.RIGHT);
  p.textSize(18);
  p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 20, 60);
  
  p.pop();
  
  // Accumulated resources indicator
  if (gameState.accumulatedGold > 0 || gameState.accumulatedSupplies > 0) {
    p.push();
    p.fill(100, 255, 100);
    p.textAlign(p.CENTER);
    p.textSize(14);
    p.text(`+${Math.floor(gameState.accumulatedGold)}G, +${Math.floor(gameState.accumulatedSupplies)}S ready!`, CANVAS_WIDTH / 2, 120);
    p.pop();
  }
  
  // Structures
  drawStructures(p);
  
  // Heroes roster
  drawHeroRoster(p);
  
  // Action buttons
  drawBaseButtons(p);
}

export function drawStructures(p) {
  const structures = [
    { name: 'resourceGenerator', label: 'Resource Gen', x: 50, y: 150 },
    { name: 'trainingFacility', label: 'Training', x: 220, y: 150 },
    { name: 'commandCenter', label: 'Command', x: 390, y: 150 }
  ];
  
  for (const struct of structures) {
    const data = gameState.structures[struct.name];
    const isMaxLevel = data.level >= data.maxLevel;
    const upgradeCost = isMaxLevel ? 0 : STRUCTURE_UPGRADE_COST[struct.name][data.level];
    const canAfford = gameState.gold >= upgradeCost;
    
    p.push();
    
    // Structure box
    p.fill(80, 70, 60);
    p.stroke(120, 110, 100);
    p.strokeWeight(2);
    p.rect(struct.x, struct.y, 120, 100);
    
    // Name and level
    p.fill(220, 200, 180);
    p.noStroke();
    p.textSize(12);
    p.textAlign(p.CENTER);
    p.text(struct.label, struct.x + 60, struct.y + 15);
    p.fill(180);
    p.textSize(10);
    p.text(`Level ${data.level}/${data.maxLevel}`, struct.x + 60, struct.y + 30);
    
    // Benefits
    p.textSize(9);
    if (struct.name === 'resourceGenerator') {
      const gold = STRUCTURE_BENEFITS.resourceGenerator.goldPerSecond[data.level];
      const supplies = STRUCTURE_BENEFITS.resourceGenerator.suppliesPerSecond[data.level];
      p.text(`${gold}G/s, ${supplies}S/s`, struct.x + 60, struct.y + 45);
    } else if (struct.name === 'commandCenter') {
      const hp = STRUCTURE_BENEFITS.commandCenter.baseHP[data.level];
      p.text(`Base HP: ${hp}`, struct.x + 60, struct.y + 45);
    } else if (struct.name === 'trainingFacility') {
      const desc = STRUCTURE_BENEFITS.trainingFacility.description[data.level];
      p.text(desc, struct.x + 60, struct.y + 45);
    }
    
    // Upgrade button
    if (!isMaxLevel) {
      p.fill(...(canAfford ? [100, 150, 100] : [100, 80, 80]));
      p.rect(struct.x + 10, struct.y + 60, 100, 30);
      p.fill(255);
      p.textSize(10);
      p.text(`Upgrade`, struct.x + 60, struct.y + 72);
      p.text(`${upgradeCost}G`, struct.x + 60, struct.y + 85);
    } else {
      p.fill(60, 60, 60);
      p.rect(struct.x + 10, struct.y + 60, 100, 30);
      p.fill(120);
      p.textSize(10);
      p.text("MAX", struct.x + 60, struct.y + 78);
    }
    
    p.pop();
  }
}

export function drawHeroRoster(p) {
  p.push();
  p.fill(200);
  p.textSize(14);
  p.textAlign(p.LEFT);
  p.text("HEROES:", 20, 280);
  
  let x = 20;
  const y = 295;
  
  for (const heroType of gameState.unlockedHeroes) {
    const config = HERO_CONFIG[heroType];
    const level = gameState.heroLevels[heroType];
    const upgradeCost = 50 + level * 30;
    const canAfford = gameState.supplies >= upgradeCost;
    
    p.fill(70, 70, 90);
    p.stroke(100);
    p.strokeWeight(2);
    p.rect(x, y, 85, 70);
    
    // Hero icon
    p.fill(...config.color);
    p.noStroke();
    p.circle(x + 20, y + 20, 25);
    
    // Info
    p.fill(220);
    p.textSize(9);
    p.textAlign(p.LEFT);
    p.text(config.name, x + 40, y + 15);
    p.text(`Lv ${level}`, x + 40, y + 28);
    
    // Upgrade button
    p.fill(...(canAfford ? [120, 120, 180] : [80, 70, 70]));
    p.rect(x + 5, y + 40, 75, 22);
    p.fill(255);
    p.textSize(8);
    p.textAlign(p.CENTER);
    p.text(`Up: ${upgradeCost}S`, x + 42, y + 53);
    
    x += 95;
  }
  
  p.pop();
}

export function drawBaseButtons(p) {
  p.push();
  
  // Collect resources button
  const hasResources = gameState.accumulatedGold > 0 || gameState.accumulatedSupplies > 0;
  p.fill(...(hasResources ? [100, 200, 100] : [80, 100, 80]));
  p.rect(CANVAS_WIDTH / 2 - 100, 140, 200, 35);
  p.fill(255);
  p.textAlign(p.CENTER);
  p.textSize(14);
  p.text("Collect Resources (SPACE)", CANVAS_WIDTH / 2, 162);
  
  // Start combat button
  p.fill(200, 100, 100);
  p.rect(CANVAS_WIDTH - 160, CANVAS_HEIGHT - 50, 150, 40);
  p.fill(255);
  p.textSize(16);
  p.text("Start Combat", CANVAS_WIDTH - 85, CANVAS_HEIGHT - 25);
  
  p.pop();
}

export function drawLevelTransition(p) {
  p.background(30, 30, 40);
  
  p.push();
  p.fill(200, 200, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text(`LEVEL ${gameState.currentLevel - 1} COMPLETE!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  
  p.fill(180, 180, 200);
  p.textSize(20);
  p.text(`Preparing Level ${gameState.currentLevel}...`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  
  p.pop();
}

export function drawGameOver(p) {
  p.background(20, 10, 10);
  
  const isWin = gameState.gameSubState === 'GAME_OVER_WIN';
  
  p.push();
  p.fill(...(isWin ? [100, 255, 100] : [255, 100, 100]));
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "YOU SURVIVED!" : "GAME OVER", CANVAS_WIDTH / 2, 120);
  
  p.fill(200);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 200);
  p.textSize(18);
  p.text(`High Score: ${gameState.highScore}`, CANVAS_WIDTH / 2, 230);
  
  if (isWin) {
    p.fill(180, 255, 180);
    p.textSize(16);
    p.text("You defended against all zombie waves!", CANVAS_WIDTH / 2, 270);
  } else {
    p.fill(255, 180, 180);
    p.textSize(16);
    p.text("Your base was overrun...", CANVAS_WIDTH / 2, 270);
  }
  
  p.fill(150, 150, 255);
  p.textSize(20);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);
  
  p.pop();
}

export function drawPauseOverlay(p) {
  if (gameState.gamePhase !== PHASE_PAUSED) return;
  
  p.push();
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  
  p.pop();
}