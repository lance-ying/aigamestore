// items.js - Item management and effects

import { gameState, ITEM_MAGNIFYING_GLASS, ITEM_CIGARETTES, ITEM_HANDSAW, ITEM_BEER } from './globals.js';
import { getCurrentShell, advanceShell } from './shotgun.js';

export const ITEM_NAMES = {
  [ITEM_MAGNIFYING_GLASS]: "Magnifying Glass",
  [ITEM_CIGARETTES]: "Cigarettes",
  [ITEM_HANDSAW]: "Handsaw",
  [ITEM_BEER]: "Beer"
};

export function generateItems(p, count) {
  const items = [];
  const itemTypes = [ITEM_MAGNIFYING_GLASS, ITEM_CIGARETTES, ITEM_HANDSAW, ITEM_BEER];
  
  for (let i = 0; i < count; i++) {
    const itemType = itemTypes[Math.floor(p.random(itemTypes.length))];
    items.push(itemType);
  }
  
  return items;
}

export function useItem(itemType, user, target) {
  let message = "";
  
  switch(itemType) {
    case ITEM_MAGNIFYING_GLASS:
      const shell = getCurrentShell();
      gameState.knownNextShell = shell;
      message = `${user.name} checked the shell: ${shell}`;
      break;
      
    case ITEM_CIGARETTES:
      user.heal(1);
      message = `${user.name} healed 1 health`;
      break;
      
    case ITEM_HANDSAW:
      gameState.sawedOff = true;
      message = `${user.name} sawed off the barrel - double damage!`;
      break;
      
    case ITEM_BEER:
      const ejectedShell = getCurrentShell();
      advanceShell();
      message = `${user.name} ejected a ${ejectedShell} shell`;
      break;
  }
  
  return message;
}

export function removeItem(items, index) {
  items.splice(index, 1);
}