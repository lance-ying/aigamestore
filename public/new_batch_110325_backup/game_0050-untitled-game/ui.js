// ui.js - UI rendering and menu system

import { gameState, UNIT_DEFINITIONS, UPGRADE_DAMAGE_COST, UPGRADE_RANGE_COST, UNIT_BANDIT, UNIT_MEXICAN, UNIT_INDIAN } from './globals.js';
import { Unit } from './entities.js';

export function renderUI(p) {
  if (gameState.menuOpen) {
    renderMenu(p);
  }
  
  // Instructions
  if (gameState.selectedUnit) {
    p.push();
    p.fill(255, 255, 200);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(12);
    p.text("Arrow Keys: Move | Shift: Cancel | Z: Menu", 300, 380);
    p.pop();
  } else {
    p.push();
    p.fill(255, 255, 200);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(12);
    p.text("Space: Select Unit | Z: Open Menu", 300, 380);
    p.pop();
  }
}

export function renderMenu(p) {
  p.push();
  
  // Menu background
  p.fill(30, 30, 40, 230);
  p.rect(150, 80, 300, 280);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(18);
  p.text("RECRUIT & UPGRADE", 300, 95);
  
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  
  const menuItems = getMenuItems();
  let yPos = 130;
  
  for (let i = 0; i < menuItems.length; i++) {
    const item = menuItems[i];
    const isSelected = i === gameState.menuSelection;
    
    // Highlight selection
    if (isSelected) {
      p.fill(100, 100, 150, 100);
      p.rect(160, yPos - 5, 280, 30);
    }
    
    // Determine if affordable
    const canAfford = gameState.gold >= item.cost;
    p.fill(canAfford ? 255 : 150);
    
    p.text(item.label, 170, yPos);
    p.text(`${item.cost}G`, 390, yPos);
    
    yPos += 35;
  }
  
  p.fill(200, 200, 150);
  p.textAlign(p.CENTER, p.TOP);
  p.text("Arrow Keys: Navigate | Space: Select | Shift: Close", 300, 340);
  
  p.pop();
}

function getMenuItems() {
  const items = [];
  
  // Recruit units
  items.push({
    label: `Recruit ${UNIT_DEFINITIONS[UNIT_BANDIT].name}`,
    cost: UNIT_DEFINITIONS[UNIT_BANDIT].cost,
    action: () => recruitUnit(UNIT_BANDIT)
  });
  
  items.push({
    label: `Recruit ${UNIT_DEFINITIONS[UNIT_MEXICAN].name}`,
    cost: UNIT_DEFINITIONS[UNIT_MEXICAN].cost,
    action: () => recruitUnit(UNIT_MEXICAN)
  });
  
  items.push({
    label: `Recruit ${UNIT_DEFINITIONS[UNIT_INDIAN].name}`,
    cost: UNIT_DEFINITIONS[UNIT_INDIAN].cost,
    action: () => recruitUnit(UNIT_INDIAN)
  });
  
  // Upgrades for selected unit
  if (gameState.selectedUnit) {
    items.push({
      label: "Upgrade Damage (+15%)",
      cost: UPGRADE_DAMAGE_COST,
      action: () => upgradeDamage()
    });
    
    items.push({
      label: "Upgrade Range (+10px)",
      cost: UPGRADE_RANGE_COST,
      action: () => upgradeRange()
    });
  }
  
  return items;
}

function recruitUnit(unitType) {
  const cost = UNIT_DEFINITIONS[unitType].cost;
  
  if (gameState.gold >= cost) {
    const x = 100 + Math.random() * 200;
    const y = 100 + Math.random() * 200;
    const unit = new Unit(unitType, x, y);
    
    gameState.units.push(unit);
    gameState.entities.push(unit);
    gameState.gold -= cost;
    
    return true;
  }
  return false;
}

function upgradeDamage() {
  if (gameState.selectedUnit && gameState.gold >= UPGRADE_DAMAGE_COST) {
    gameState.selectedUnit.damageUpgrades++;
    gameState.gold -= UPGRADE_DAMAGE_COST;
    return true;
  }
  return false;
}

function upgradeRange() {
  if (gameState.selectedUnit && gameState.gold >= UPGRADE_RANGE_COST) {
    gameState.selectedUnit.rangeUpgrades++;
    gameState.gold -= UPGRADE_RANGE_COST;
    return true;
  }
  return false;
}

export function handleMenuInput(keyCode) {
  const menuItems = getMenuItems();
  
  if (keyCode === 38) { // UP
    gameState.menuSelection = (gameState.menuSelection - 1 + menuItems.length) % menuItems.length;
    return true;
  } else if (keyCode === 40) { // DOWN
    gameState.menuSelection = (gameState.menuSelection + 1) % menuItems.length;
    return true;
  } else if (keyCode === 32) { // SPACE
    const item = menuItems[gameState.menuSelection];
    if (item && gameState.gold >= item.cost) {
      item.action();
    }
    return true;
  } else if (keyCode === 16) { // SHIFT
    gameState.menuOpen = false;
    gameState.menuSelection = 0;
    return true;
  }
  
  return false;
}