// upgrade.js - Upgrade system

import { gameState } from './globals.js';
import { recalculateStats } from './combat.js';
import { addCombatLog } from './combat.js';

export function purchaseUpgrade(upgrade) {
  if (gameState.player.gold < upgrade.cost) {
    return false;
  }
  
  gameState.player.gold -= upgrade.cost;
  
  // Apply upgrade
  if (upgrade.stat === "attack") {
    gameState.player.baseAttack += upgrade.value;
  } else if (upgrade.stat === "defense") {
    gameState.player.baseDefense += upgrade.value;
  } else if (upgrade.stat === "maxHp") {
    gameState.player.baseMaxHp += upgrade.value;
  }
  
  recalculateStats();
  
  addCombatLog(`Purchased: ${upgrade.name}`);
  
  return true;
}

export function navigateUpgradeMenu(direction) {
  const menu = gameState.upgradeMenu;
  
  if (direction === "up") {
    menu.selectedIndex = Math.max(0, menu.selectedIndex - 1);
  } else if (direction === "down") {
    menu.selectedIndex = Math.min(menu.upgrades.length - 1, menu.selectedIndex + 1);
  }
  
  // Auto-scroll to keep selection visible
  const visibleItems = 6;
  if (menu.selectedIndex < menu.scrollOffset) {
    menu.scrollOffset = menu.selectedIndex;
  } else if (menu.selectedIndex >= menu.scrollOffset + visibleItems) {
    menu.scrollOffset = menu.selectedIndex - visibleItems + 1;
  }
}