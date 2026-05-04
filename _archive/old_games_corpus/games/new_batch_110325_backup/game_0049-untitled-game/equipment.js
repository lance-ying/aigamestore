// equipment.js - Equipment menu
import { gameState, EQUIPMENT, SCREENS } from './globals.js';
import { unlockEquipment } from './utils.js';

export function handleEquipmentInput(keyCode, p) {
  const allItems = [...EQUIPMENT.weapons, ...EQUIPMENT.costumes].filter(item => item.unlocked);
  
  if (keyCode === 38) { // UP
    gameState.menuSelection = Math.max(0, gameState.menuSelection - 1);
  } else if (keyCode === 40) { // DOWN
    gameState.menuSelection = Math.min(allItems.length - 1, gameState.menuSelection + 1);
  } else if (keyCode === 32) { // SPACE - equip
    const item = allItems[gameState.menuSelection];
    if (item) {
      if (EQUIPMENT.weapons.includes(item)) {
        gameState.player.equippedWeapon = item.id;
      } else if (EQUIPMENT.costumes.includes(item)) {
        gameState.player.equippedCostume = item.id;
      }
    }
  } else if (keyCode === 90) { // Z - back
    gameState.screen = SCREENS.WORLD;
  }
}

export function renderEquipment(p) {
  // Background
  p.fill(40, 40, 40);
  p.rect(0, 0, 600, 400);
  
  // Title
  p.fill(255, 200, 0);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(24);
  p.text("Equipment", 300, 20);
  
  // Currency
  p.fill(255);
  p.textSize(16);
  p.text(`Currency: ${gameState.player.currency}`, 300, 55);
  
  // Check for new unlocks
  const newUnlocks = unlockEquipment(gameState.player.currency);
  
  // Equipment list
  const allItems = [...EQUIPMENT.weapons, ...EQUIPMENT.costumes].filter(item => item.unlocked);
  
  if (allItems.length === 0) {
    p.fill(200);
    p.textSize(16);
    p.text("No equipment unlocked yet. Win battles to earn currency!", 300, 150);
  } else {
    const startY = 100;
    const itemHeight = 40;
    
    allItems.forEach((item, index) => {
      const y = startY + index * itemHeight;
      const isSelected = index === gameState.menuSelection;
      const isEquipped = (item.id === gameState.player.equippedWeapon || 
                         item.id === gameState.player.equippedCostume);
      
      // Background
      if (isSelected) {
        p.fill(80, 80, 100);
        p.rect(50, y, 500, itemHeight - 5);
      }
      
      // Item info
      p.fill(isEquipped ? [255, 255, 0] : [255, 255, 255]);
      p.textAlign(p.LEFT, p.CENTER);
      p.textSize(14);
      p.text((isSelected ? "> " : "  ") + item.name, 60, y + itemHeight / 2);
      
      // Stats
      p.textAlign(p.RIGHT, p.CENTER);
      const statText = item.power ? `Power +${item.power}` : `Defence +${item.defence}`;
      p.text(statText, 540, y + itemHeight / 2);
      
      if (isEquipped) {
        p.textAlign(p.CENTER, p.CENTER);
        p.fill(100, 255, 100);
        p.text("[EQUIPPED]", 300, y + itemHeight / 2);
      }
    });
  }
  
  // Instructions
  p.fill(200);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(14);
  p.text("Arrow Keys: Navigate | SPACE: Equip | Z: Back to World", 300, 360);
}