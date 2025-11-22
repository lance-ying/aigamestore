// shop.js - Shop and upgrade system

import { gameState, UPGRADES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function purchaseUpgrade(p, upgradeType) {
  let level, upgrades;
  
  switch(upgradeType) {
    case 'line':
      level = gameState.lineUpgradeLevel;
      upgrades = UPGRADES.line;
      if (level < upgrades.length && gameState.cash >= upgrades[level].cost) {
        gameState.cash -= upgrades[level].cost;
        gameState.lineUpgradeLevel++;
        
        p.logs.game_info.push({
          data: `Purchased line upgrade ${gameState.lineUpgradeLevel}`,
          framecount: p.frameCount,
          timestamp: Date.now()
        });
        return true;
      }
      break;
      
    case 'speed':
      level = gameState.speedUpgradeLevel;
      upgrades = UPGRADES.speed;
      if (level < upgrades.length && gameState.cash >= upgrades[level].cost) {
        gameState.cash -= upgrades[level].cost;
        gameState.speedUpgradeLevel++;
        
        p.logs.game_info.push({
          data: `Purchased speed upgrade ${gameState.speedUpgradeLevel}`,
          framecount: p.frameCount,
          timestamp: Date.now()
        });
        return true;
      }
      break;
      
    case 'weapon':
      level = gameState.weaponUpgradeLevel;
      upgrades = UPGRADES.weapon;
      if (level < upgrades.length && gameState.cash >= upgrades[level].cost) {
        gameState.cash -= upgrades[level].cost;
        gameState.weaponUpgradeLevel++;
        
        p.logs.game_info.push({
          data: `Purchased weapon upgrade ${gameState.weaponUpgradeLevel}`,
          framecount: p.frameCount,
          timestamp: Date.now()
        });
        return true;
      }
      break;
  }
  
  return false;
}

export function drawShop(p) {
  // Semi-transparent background
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Title
  p.fill(255, 220, 100);
  p.textSize(24);
  p.textAlign(p.CENTER, p.TOP);
  p.text("SHOP", CANVAS_WIDTH / 2, 20);
  
  // Cash display
  p.textSize(16);
  p.fill(100, 255, 100);
  p.text(`Cash: $${gameState.cash}`, CANVAS_WIDTH / 2, 50);
  
  // Upgrade sections
  const startY = 90;
  const spacing = 90;
  
  // Line upgrade
  drawUpgradeSection(p, "Fishing Line", "line", UPGRADES.line, gameState.lineUpgradeLevel, 
                      100, startY, "+50m depth");
  
  // Speed upgrade
  drawUpgradeSection(p, "Lure Speed", "speed", UPGRADES.speed, gameState.speedUpgradeLevel,
                      100, startY + spacing, "+15% speed");
  
  // Weapon upgrade
  drawUpgradeSection(p, "Weapon Power", "weapon", UPGRADES.weapon, gameState.weaponUpgradeLevel,
                      100, startY + spacing * 2, "+1 projectile");
  
  // Instructions
  p.fill(200, 200, 200);
  p.textSize(14);
  p.text("Use number keys 1-3 to purchase upgrades", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  p.text("Press SHIFT to close shop", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20);
}

function drawUpgradeSection(p, name, type, upgrades, level, x, y, description) {
  p.push();
  
  // Background box
  const boxWidth = 400;
  const boxHeight = 70;
  p.fill(40, 40, 60);
  p.stroke(100, 100, 150);
  p.strokeWeight(2);
  p.rect(x, y, boxWidth, boxHeight, 5);
  
  // Name
  p.fill(255, 255, 255);
  p.noStroke();
  p.textSize(16);
  p.textAlign(p.LEFT, p.TOP);
  p.text(name, x + 10, y + 10);
  
  // Level
  p.textSize(14);
  p.fill(150, 200, 255);
  p.text(`Level: ${level}/${upgrades.length}`, x + 10, y + 35);
  
  // Cost and description
  if (level < upgrades.length) {
    const cost = upgrades[level].cost;
    const canAfford = gameState.cash >= cost;
    
    p.fill(...(canAfford ? [100, 255, 100] : [255, 100, 100]));
    p.textAlign(p.RIGHT, p.TOP);
    p.text(`$${cost}`, x + boxWidth - 10, y + 10);
    
    p.fill(200, 200, 200);
    p.textSize(12);
    p.text(description, x + boxWidth - 10, y + 35);
  } else {
    p.fill(255, 200, 100);
    p.textAlign(p.RIGHT, p.TOP);
    p.text("MAX", x + boxWidth - 10, y + 25);
  }
  
  p.pop();
}