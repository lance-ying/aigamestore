// crafting.js - Crafting system
import { ITEM_TYPES } from './globals.js';

export const RECIPES = {
  [ITEM_TYPES.STONE_PICKAXE]: {
    requires: { [ITEM_TYPES.STONE]: 15 },
    miningPower: 2
  },
  [ITEM_TYPES.IRON_PICKAXE]: {
    requires: { [ITEM_TYPES.IRON]: 20 },
    miningPower: 3
  },
  [ITEM_TYPES.GOLD_PICKAXE]: {
    requires: { [ITEM_TYPES.GOLD]: 25 },
    miningPower: 4
  },
  [ITEM_TYPES.DIAMOND_PICKAXE]: {
    requires: { [ITEM_TYPES.DIAMOND]: 30 },
    miningPower: 5
  },
  [ITEM_TYPES.MYTHRIL_PICKAXE]: {
    requires: { [ITEM_TYPES.MYTHRIL]: 35 },
    miningPower: 6
  },
  [ITEM_TYPES.STONE_SWORD]: {
    requires: { [ITEM_TYPES.STONE]: 10 },
    damage: 10
  },
  [ITEM_TYPES.IRON_SWORD]: {
    requires: { [ITEM_TYPES.IRON]: 15 },
    damage: 20
  },
  [ITEM_TYPES.GOLD_SWORD]: {
    requires: { [ITEM_TYPES.GOLD]: 20 },
    damage: 30
  },
  [ITEM_TYPES.DIAMOND_SWORD]: {
    requires: { [ITEM_TYPES.DIAMOND]: 25 },
    damage: 50
  },
  [ITEM_TYPES.MYTHRIL_SWORD]: {
    requires: { [ITEM_TYPES.MYTHRIL]: 30 },
    damage: 80
  }
};

export function canCraft(player, recipe) {
  for (const item in recipe.requires) {
    if (!player.hasItem(item, recipe.requires[item])) {
      return false;
    }
  }
  return true;
}

export function craftItem(player, itemType) {
  const recipe = RECIPES[itemType];
  if (!recipe || !canCraft(player, recipe)) {
    return false;
  }

  // Remove required items
  for (const item in recipe.requires) {
    player.removeItem(item, recipe.requires[item]);
  }

  // Add crafted item
  player.addItem(itemType, 1);
  return true;
}

export function renderCraftingMenu(p, player) {
  const menuX = 50;
  const menuY = 50;
  const menuWidth = 500;
  const menuHeight = 300;

  // Background
  p.fill(50, 50, 50, 220);
  p.rect(menuX, menuY, menuWidth, menuHeight);
  
  p.fill(255);
  p.textSize(16);
  p.textAlign(p.LEFT);
  p.text("CRAFTING MENU (Press Shift to close)", menuX + 10, menuY + 20);

  // Draw recipes
  let yOffset = 50;
  let col = 0;
  const colWidth = 240;

  const itemOrder = [
    ITEM_TYPES.STONE_PICKAXE,
    ITEM_TYPES.IRON_PICKAXE,
    ITEM_TYPES.GOLD_PICKAXE,
    ITEM_TYPES.DIAMOND_PICKAXE,
    ITEM_TYPES.MYTHRIL_PICKAXE,
    ITEM_TYPES.STONE_SWORD,
    ITEM_TYPES.IRON_SWORD,
    ITEM_TYPES.GOLD_SWORD,
    ITEM_TYPES.DIAMOND_SWORD,
    ITEM_TYPES.MYTHRIL_SWORD
  ];

  for (const itemType of itemOrder) {
    const recipe = RECIPES[itemType];
    const canMake = canCraft(player, recipe);
    
    const x = menuX + 10 + col * colWidth;
    const y = menuY + yOffset;

    p.fill(...(canMake ? [100, 255, 100] : [200, 100, 100]));
    p.textSize(12);
    p.text(itemType.replace(/_/g, ' ').toUpperCase(), x, y);

    p.fill(200);
    p.textSize(10);
    let reqText = "Requires: ";
    for (const item in recipe.requires) {
      reqText += `${item}(${recipe.requires[item]}) `;
    }
    p.text(reqText, x, y + 15);

    yOffset += 35;
    if (yOffset > 250) {
      yOffset = 50;
      col++;
    }
  }

  // Instructions
  p.fill(255, 255, 0);
  p.textSize(10);
  p.text("Press number keys to craft (1-0 for items in order)", menuX + 10, menuY + menuHeight - 10);
}