// upgrades.js - Upgrade system
import { gameState } from './globals.js';

export const UPGRADE_TYPES = {
  DAMAGE: 'damage',
  FIRE_RATE: 'fire_rate',
  HEALTH: 'health',
  MAX_HEALTH: 'max_health',
  SPEED: 'speed',
  MULTI_SHOT: 'multi_shot',
  PIERCING: 'piercing'
};

export class Upgrade {
  constructor(type, name, description, effect) {
    this.type = type;
    this.name = name;
    this.description = description;
    this.effect = effect;
  }

  apply(player) {
    this.effect(player);
  }
}

export function createUpgradePool() {
  return [
    new Upgrade(UPGRADE_TYPES.DAMAGE, "Sharp Rounds", "+5 Damage", (player) => {
      player.bonusDamage += 5;
    }),
    new Upgrade(UPGRADE_TYPES.DAMAGE, "Heavy Caliber", "+10 Damage", (player) => {
      player.bonusDamage += 10;
    }),
    new Upgrade(UPGRADE_TYPES.FIRE_RATE, "Quick Trigger", "+5 Fire Rate", (player) => {
      player.bonusFireRate += 5;
    }),
    new Upgrade(UPGRADE_TYPES.FIRE_RATE, "Rapid Fire", "+10 Fire Rate", (player) => {
      player.bonusFireRate += 10;
    }),
    new Upgrade(UPGRADE_TYPES.HEALTH, "First Aid", "Restore 30 HP", (player) => {
      player.heal(30);
    }),
    new Upgrade(UPGRADE_TYPES.HEALTH, "Med Kit", "Restore 50 HP", (player) => {
      player.heal(50);
    }),
    new Upgrade(UPGRADE_TYPES.MAX_HEALTH, "Vitality", "+20 Max HP", (player) => {
      player.bonusMaxHealth += 20;
      player.health += 20;
    }),
    new Upgrade(UPGRADE_TYPES.MAX_HEALTH, "Fortitude", "+40 Max HP", (player) => {
      player.bonusMaxHealth += 40;
      player.health += 40;
    }),
    new Upgrade(UPGRADE_TYPES.SPEED, "Swift Feet", "+0.5 Speed", (player) => {
      player.bonusSpeed += 0.5;
    }),
    new Upgrade(UPGRADE_TYPES.SPEED, "Sprint", "+1.0 Speed", (player) => {
      player.bonusSpeed += 1.0;
    }),
    new Upgrade(UPGRADE_TYPES.MULTI_SHOT, "Double Shot", "Fire 2 projectiles", (player) => {
      if (player.projectileCount === 1) {
        player.projectileCount = 2;
        player.projectileSpread = 0.2;
      }
    }),
    new Upgrade(UPGRADE_TYPES.MULTI_SHOT, "Triple Shot", "Fire 3 projectiles", (player) => {
      if (player.projectileCount < 3) {
        player.projectileCount = 3;
        player.projectileSpread = 0.3;
      }
    })
  ];
}

export function getRandomUpgrades(pool, count, p) {
  const available = [...pool];
  const selected = [];
  
  for (let i = 0; i < count && available.length > 0; i++) {
    const index = Math.floor(p.random(available.length));
    selected.push(available[index]);
    available.splice(index, 1);
  }
  
  return selected;
}

export function renderUpgradeScreen(p, upgrades, gameState) {
  // Dark overlay
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, 600, 400);
  
  // Title
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.text("CHOOSE AN UPGRADE", 300, 60);
  
  // Level indicator
  p.textSize(16);
  p.fill(200, 200, 200);
  p.text(`Level ${gameState.level}`, 300, 90);
  
  // Draw upgrade options
  const boxWidth = 160;
  const boxHeight = 200;
  const spacing = 20;
  const startX = (600 - (upgrades.length * boxWidth + (upgrades.length - 1) * spacing)) / 2;
  
  for (let i = 0; i < upgrades.length; i++) {
    const x = startX + i * (boxWidth + spacing);
    const y = 140;
    
    // Box
    p.stroke(100, 200, 255);
    p.strokeWeight(2);
    p.fill(40, 40, 60);
    p.rect(x, y, boxWidth, boxHeight, 5);
    
    // Number indicator
    p.fill(255, 255, 100);
    p.noStroke();
    p.textSize(20);
    p.text(`[${i + 1}]`, x + boxWidth / 2, y + 20);
    
    // Upgrade name
    p.fill(255);
    p.textSize(14);
    p.text(upgrades[i].name, x + boxWidth / 2, y + 60);
    
    // Description
    p.fill(200, 200, 200);
    p.textSize(12);
    p.text(upgrades[i].description, x + boxWidth / 2, y + 90);
    
    // Icon based on type
    p.push();
    p.translate(x + boxWidth / 2, y + 140);
    drawUpgradeIcon(p, upgrades[i].type);
    p.pop();
  }
  
  // Instructions
  p.fill(150, 150, 150);
  p.textSize(14);
  p.text("Press 1, 2, or 3 to select", 300, 370);
}

function drawUpgradeIcon(p, type) {
  p.noStroke();
  switch(type) {
    case UPGRADE_TYPES.DAMAGE:
      p.fill(255, 100, 100);
      p.triangle(-15, 15, 15, 15, 0, -15);
      break;
    case UPGRADE_TYPES.FIRE_RATE:
      p.fill(255, 200, 100);
      for (let i = 0; i < 3; i++) {
        p.circle(-10 + i * 10, 0, 8);
      }
      break;
    case UPGRADE_TYPES.HEALTH:
    case UPGRADE_TYPES.MAX_HEALTH:
      p.fill(100, 255, 100);
      p.circle(-8, 0, 12);
      p.circle(8, 0, 12);
      p.circle(0, -8, 12);
      p.circle(0, 8, 12);
      p.circle(0, 0, 12);
      break;
    case UPGRADE_TYPES.SPEED:
      p.fill(100, 200, 255);
      p.triangle(-15, -10, -15, 10, 0, 0);
      p.triangle(0, -10, 0, 10, 15, 0);
      break;
    case UPGRADE_TYPES.MULTI_SHOT:
      p.fill(255, 255, 100);
      p.circle(0, -10, 8);
      p.circle(-10, 5, 8);
      p.circle(10, 5, 8);
      break;
    default:
      p.fill(200);
      p.circle(0, 0, 20);
  }
}