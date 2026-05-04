// items.js
export const ITEM_COMBINATIONS = {
  "rope-stick": {
    components: ["rope", "stick"],
    result: "rope-stick",
    name: "Rope and Stick",
    description: "A rope tied to a sturdy stick"
  },
  "mushroom-flower": {
    components: ["mushroom", "flower"],
    result: "potion",
    name: "Healing Potion",
    description: "A mystical potion"
  }
};

export function canCombineItems(item1, item2) {
  const sorted = [item1, item2].sort().join("-");
  return ITEM_COMBINATIONS[sorted] !== undefined;
}

export function combineItems(item1, item2) {
  const sorted = [item1, item2].sort().join("-");
  return ITEM_COMBINATIONS[sorted];
}

export function getItemInfo(itemId) {
  // Check if it's a combined item
  for (const combo of Object.values(ITEM_COMBINATIONS)) {
    if (combo.result === itemId) {
      return combo;
    }
  }
  
  // Search in scenes for base items
  const scenes = require('./scenes.js').SCENES;
  for (const scene of Object.values(scenes)) {
    const obj = scene.objects.find(o => o.id === itemId);
    if (obj) {
      return { name: obj.name, description: obj.name };
    }
  }
  
  return { name: itemId, description: itemId };
}