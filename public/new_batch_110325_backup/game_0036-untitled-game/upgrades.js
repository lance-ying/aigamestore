// upgrades.js
import { gameState } from './globals.js';

export const UPGRADE_COSTS = {
  engine: [100, 200, 400, 800, 1600],
  fuel: [80, 160, 320, 640, 1280],
  armor: [120, 240, 480, 960, 1920],
  weapon: [150, 300, 600, 1200, 2400],
  nitro: [100, 200, 400, 800, 1600]
};

export const UPGRADE_NAMES = {
  engine: "Engine",
  fuel: "Fuel Tank",
  armor: "Armor",
  weapon: "Weapon",
  nitro: "Nitro"
};

export const UPGRADE_DESCRIPTIONS = {
  engine: "Increases top speed and acceleration",
  fuel: "Increases fuel capacity",
  armor: "Reduces damage from collisions",
  weapon: "Adds spikes for extra zombie damage",
  nitro: "Increases nitro boost power"
};

export function canAffordUpgrade(upgradeType) {
  const level = gameState.upgrades[upgradeType];
  if (level >= 5) return false;
  const cost = UPGRADE_COSTS[upgradeType][level];
  return gameState.cash >= cost;
}

export function purchaseUpgrade(upgradeType) {
  if (!canAffordUpgrade(upgradeType)) return false;
  
  const level = gameState.upgrades[upgradeType];
  const cost = UPGRADE_COSTS[upgradeType][level];
  
  gameState.cash -= cost;
  gameState.upgrades[upgradeType]++;
  
  return true;
}

export function renderUpgradeShop(p) {
  const shopWidth = 500;
  const shopHeight = 350;
  const shopX = 50;
  const shopY = 25;
  
  // Background
  p.fill(20, 20, 30, 250);
  p.stroke(100, 100, 150);
  p.strokeWeight(3);
  p.rect(shopX, shopY, shopWidth, shopHeight, 10);
  
  // Title
  p.fill(255, 200, 50);
  p.noStroke();
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(24);
  p.text("UPGRADE SHOP", shopX + shopWidth / 2, shopY + 15);
  
  // Cash display
  p.fill(100, 255, 100);
  p.textSize(18);
  p.text(`Cash: $${Math.floor(gameState.cash)}`, shopX + shopWidth / 2, shopY + 45);
  
  // Upgrades
  const upgradeTypes = Object.keys(UPGRADE_COSTS);
  const startY = shopY + 80;
  const rowHeight = 50;
  
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  
  upgradeTypes.forEach((type, i) => {
    const y = startY + i * rowHeight;
    const level = gameState.upgrades[type];
    const maxLevel = 5;
    const cost = level < maxLevel ? UPGRADE_COSTS[type][level] : 0;
    const canAfford = canAffordUpgrade(type);
    
    // Upgrade name
    p.fill(200, 200, 255);
    p.text(UPGRADE_NAMES[type], shopX + 20, y);
    
    // Level bars
    for (let j = 0; j < maxLevel; j++) {
      const barX = shopX + 150 + j * 25;
      if (j < level) {
        p.fill(100, 255, 100);
      } else {
        p.fill(50, 50, 50);
      }
      p.noStroke();
      p.rect(barX, y + 2, 20, 15, 2);
    }
    
    // Cost and button
    if (level < maxLevel) {
      p.fill(canAfford ? 255 : 150, canAfford ? 255 : 150, canAfford ? 255 : 150);
      p.text(`$${cost}`, shopX + 300, y);
      
      // Button
      p.fill(canAfford ? 50 : 30, canAfford ? 150 : 50, canAfford ? 50 : 30);
      p.stroke(canAfford ? 100 : 50, canAfford ? 255 : 100, canAfford ? 100 : 50);
      p.strokeWeight(2);
      p.rect(shopX + 360, y, 80, 25, 5);
      
      p.fill(255);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.text("BUY", shopX + 400, y + 12);
      p.textAlign(p.LEFT, p.TOP);
    } else {
      p.fill(255, 200, 50);
      p.text("MAX", shopX + 360, y);
    }
  });
  
  // Instructions
  p.fill(200, 200, 200);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(16);
  p.text("Press ENTER to continue driving", shopX + shopWidth / 2, shopY + shopHeight - 35);
}

export function handleUpgradeClick(p, mouseX, mouseY) {
  const shopX = 50;
  const shopY = 25;
  const startY = shopY + 80;
  const rowHeight = 50;
  
  const upgradeTypes = Object.keys(UPGRADE_COSTS);
  
  upgradeTypes.forEach((type, i) => {
    const y = startY + i * rowHeight;
    const buttonX = shopX + 360;
    const buttonY = y;
    const buttonW = 80;
    const buttonH = 25;
    
    if (mouseX >= buttonX && mouseX <= buttonX + buttonW &&
        mouseY >= buttonY && mouseY <= buttonY + buttonH) {
      if (canAffordUpgrade(type)) {
        purchaseUpgrade(type);
      }
    }
  });
}