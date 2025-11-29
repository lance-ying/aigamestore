// items.js - Item definitions

export const items = {
  torch: {
    name: "Torch",
    description: "A wooden torch that provides light",
    visual: { type: "torch", color: [180, 100, 20] }
  },
  brass_key: {
    name: "Brass Key",
    description: "An ornate brass key",
    visual: { type: "key", color: [180, 150, 50] }
  },
  small_key: {
    name: "Small Key",
    description: "A small iron key",
    visual: { type: "key", color: [120, 120, 130] }
  },
  iron_key: {
    name: "Iron Key",
    description: "A heavy iron key",
    visual: { type: "key", color: [100, 100, 110] }
  },
  silver_key: {
    name: "Silver Key",
    description: "A shining silver key",
    visual: { type: "key", color: [200, 200, 210] }
  },
  golden_key: {
    name: "Golden Key",
    description: "A magnificent golden key",
    visual: { type: "key", color: [220, 180, 50] }
  },
  scroll: {
    name: "Ancient Scroll",
    description: "A scroll with cryptic symbols",
    visual: { type: "scroll", color: [230, 220, 180] }
  },
  shield: {
    name: "Shield",
    description: "A ceremonial shield with emblems",
    visual: { type: "shield", color: [150, 150, 160] }
  },
  gear1: {
    name: "Bronze Gear",
    description: "A mechanical gear piece",
    visual: { type: "gear", color: [160, 120, 70] }
  },
  gear2: {
    name: "Steel Gear",
    description: "A mechanical gear piece",
    visual: { type: "gear", color: [140, 140, 150] }
  }
};

export function getItemData(itemId) {
  return items[itemId];
}

export function canCombineItems(item1, item2) {
  const combinations = [
    { items: ["gear1", "gear2"], result: "combined_gears" }
  ];
  
  for (let combo of combinations) {
    if (combo.items.includes(item1) && combo.items.includes(item2)) {
      return combo.result;
    }
  }
  return null;
}