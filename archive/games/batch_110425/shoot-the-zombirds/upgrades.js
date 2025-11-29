// upgrades.js - Upgrade system
import { gameState, UPGRADES } from './globals.js';

export function canPurchaseUpgrade(upgradeType, level = 0) {
  if (upgradeType === 'fireRate') {
    if (level >= UPGRADES.fireRate.length) return false;
    return gameState.coins >= UPGRADES.fireRate[level].cost;
  } else if (upgradeType === 'damage') {
    if (level >= UPGRADES.damage.length) return false;
    return gameState.coins >= UPGRADES.damage[level].cost;
  } else if (upgradeType === 'multiShot') {
    if (gameState.upgrades.multiShotUnlocked) return false;
    return gameState.coins >= UPGRADES.multiShot.cost;
  } else if (upgradeType === 'shield') {
    if (gameState.upgrades.shieldUnlocked) return false;
    return gameState.coins >= UPGRADES.shield.cost;
  }
  return false;
}

export function purchaseUpgrade(upgradeType, level = 0) {
  if (!canPurchaseUpgrade(upgradeType, level)) return false;
  
  if (upgradeType === 'fireRate') {
    const upgrade = UPGRADES.fireRate[level];
    gameState.coins -= upgrade.cost;
    gameState.fireRate = upgrade.fireRate;
    gameState.upgrades.fireRateLevel++;
    return true;
  } else if (upgradeType === 'damage') {
    const upgrade = UPGRADES.damage[level];
    gameState.coins -= upgrade.cost;
    gameState.boltDamage = upgrade.damage;
    gameState.upgrades.damageLevel++;
    return true;
  } else if (upgradeType === 'multiShot') {
    gameState.coins -= UPGRADES.multiShot.cost;
    gameState.upgrades.multiShotUnlocked = true;
    return true;
  } else if (upgradeType === 'shield') {
    gameState.coins -= UPGRADES.shield.cost;
    gameState.upgrades.shieldUnlocked = true;
    return true;
  }
  
  return false;
}

export function drawUpgradeScreen(p) {
  // Semi-transparent background
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, 600, 400);
  
  // Title
  p.fill(255, 200, 50);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(28);
  p.text("WAVE COMPLETE!", 300, 40);
  
  p.textSize(18);
  p.fill(200, 200, 200);
  p.text(`Wave ${gameState.wave} - Coins: ${gameState.coins}`, 300, 70);
  
  // Upgrades
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  
  let yPos = 110;
  
  // Fire Rate
  if (gameState.upgrades.fireRateLevel < UPGRADES.fireRate.length) {
    const upgrade = UPGRADES.fireRate[gameState.upgrades.fireRateLevel];
    const canBuy = gameState.coins >= upgrade.cost;
    p.fill(...(canBuy ? [100, 255, 100] : [150, 150, 150]));
    p.text(`[1] Fire Rate Upgrade - Cost: ${upgrade.cost}`, 50, yPos);
    yPos += 25;
  }
  
  // Damage
  if (gameState.upgrades.damageLevel < UPGRADES.damage.length) {
    const upgrade = UPGRADES.damage[gameState.upgrades.damageLevel];
    const canBuy = gameState.coins >= upgrade.cost;
    p.fill(...(canBuy ? [100, 255, 100] : [150, 150, 150]));
    p.text(`[2] Damage Upgrade - Cost: ${upgrade.cost}`, 50, yPos);
    yPos += 25;
  }
  
  // Multi-shot
  if (!gameState.upgrades.multiShotUnlocked) {
    const canBuy = gameState.coins >= UPGRADES.multiShot.cost;
    p.fill(...(canBuy ? [100, 255, 100] : [150, 150, 150]));
    p.text(`[3] Unlock Multi-Shot (SHIFT) - Cost: ${UPGRADES.multiShot.cost}`, 50, yPos);
    yPos += 25;
  }
  
  // Shield
  if (!gameState.upgrades.shieldUnlocked) {
    const canBuy = gameState.coins >= UPGRADES.shield.cost;
    p.fill(...(canBuy ? [100, 255, 100] : [150, 150, 150]));
    p.text(`[4] Unlock Shield (Z) - Cost: ${UPGRADES.shield.cost}`, 50, yPos);
    yPos += 25;
  }
  
  // Continue prompt
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(16);
  p.text("Press SPACE to continue to next wave", 300, 350);
}

export function handleUpgradeInput(p, key) {
  if (key === '1') {
    purchaseUpgrade('fireRate', gameState.upgrades.fireRateLevel);
  } else if (key === '2') {
    purchaseUpgrade('damage', gameState.upgrades.damageLevel);
  } else if (key === '3') {
    purchaseUpgrade('multiShot');
  } else if (key === '4') {
    purchaseUpgrade('shield');
  }
}