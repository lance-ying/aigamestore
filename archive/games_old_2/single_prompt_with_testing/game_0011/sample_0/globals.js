// globals.js
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  
  // Game-specific state
  discoveredElements: [],
  selectedSlots: [null, null], // Two slots for combination
  currentSelection: 0, // Which slot is being filled (0 or 1)
  panelScroll: 0,
  elementCursor: 0,
  message: "",
  messageTimer: 0,
  combinationAttempts: 0,
  successfulCombinations: 0,
  lastCombinationSuccess: false,
  totalElements: 0,
  animatingElement: null,
  animationTimer: 0
};

// Element recipes - combinations that create new elements
export const ELEMENT_RECIPES = {
  // Tier 1: Basic combinations
  "Fire+Earth": "Lava",
  "Fire+Wind": "Energy",
  "Fire+Water": "Steam",
  "Earth+Wind": "Dust",
  "Earth+Water": "Mud",
  "Wind+Water": "Storm",
  
  // Tier 2: Using tier 1 elements
  "Lava+Water": "Stone",
  "Energy+Earth": "Life",
  "Steam+Earth": "Geyser",
  "Dust+Fire": "Ash",
  "Mud+Fire": "Brick",
  "Storm+Earth": "Lightning",
  
  // Tier 3: Life and consciousness
  "Life+Earth": "Human",
  "Life+Fire": "Phoenix",
  "Life+Water": "Fish",
  "Life+Wind": "Bird",
  "Life+Stone": "Golem",
  
  // Tier 4: Sin and evil
  "Human+Energy": "Mage",
  "Human+Fire": "Demon",
  "Human+Dust": "Death",
  "Human+Storm": "Chaos",
  "Human+Lava": "Sacrifice",
  
  // Tier 5: Dark elements
  "Demon+Fire": "Hellfire",
  "Demon+Death": "Necromancer",
  "Demon+Chaos": "Destroyer",
  "Death+Life": "Zombie",
  "Death+Human": "Ghost",
  "Chaos+Earth": "Earthquake",
  
  // Tier 6: Sins
  "Human+Demon": "Sin",
  "Sin+Energy": "Greed",
  "Sin+Fire": "Wrath",
  "Sin+Water": "Envy",
  "Sin+Earth": "Sloth",
  "Sin+Wind": "Pride",
  
  // Tier 7: Dark creatures
  "Demon+Life": "Imp",
  "Demon+Stone": "Gargoyle",
  "Demon+Water": "Kraken",
  "Death+Stone": "Undead",
  "Zombie+Human": "Plague",
  "Ghost+Energy": "Poltergeist",
  
  // Tier 8: Advanced evil
  "Necromancer+Death": "Lich",
  "Hellfire+Earth": "Inferno",
  "Wrath+Chaos": "Apocalypse",
  "Greed+Human": "Corruption",
  "Pride+Demon": "Lucifer",
  "Envy+Life": "Vampire",
  
  // Tier 9: Ultimate evil
  "Lucifer+Hellfire": "DarkLord",
  "Apocalypse+Death": "Armageddon",
  "Lich+Chaos": "Doomsday",
  "Vampire+Necromancer": "DarkPrince",
  "Inferno+Destroyer": "Annihilation",
  "Corruption+Sin": "Damnation",
  
  // Additional combinations
  "Mage+Demon": "Warlock",
  "Phoenix+Death": "DarkPhoenix",
  "Golem+Chaos": "Abomination",
  "Bird+Death": "Raven",
  "Fish+Demon": "Leviathan",
  "Lightning+Demon": "StormDemon"
};

// Basic starting elements
export const BASIC_ELEMENTS = ["Fire", "Earth", "Wind", "Water"];

// Element categories for visual organization
export const ELEMENT_CATEGORIES = {
  "Fire": "basic",
  "Earth": "basic",
  "Wind": "basic",
  "Water": "basic",
  "Lava": "natural",
  "Energy": "natural",
  "Steam": "natural",
  "Dust": "natural",
  "Mud": "natural",
  "Storm": "natural",
  "Stone": "natural",
  "Geyser": "natural",
  "Ash": "natural",
  "Brick": "natural",
  "Lightning": "natural",
  "Life": "life",
  "Human": "life",
  "Phoenix": "life",
  "Fish": "life",
  "Bird": "life",
  "Golem": "life",
  "Mage": "magic",
  "Demon": "evil",
  "Death": "evil",
  "Chaos": "evil",
  "Sacrifice": "evil",
  "Hellfire": "evil",
  "Necromancer": "evil",
  "Destroyer": "evil",
  "Zombie": "evil",
  "Ghost": "evil",
  "Earthquake": "evil",
  "Sin": "sin",
  "Greed": "sin",
  "Wrath": "sin",
  "Envy": "sin",
  "Sloth": "sin",
  "Pride": "sin",
  "Imp": "creature",
  "Gargoyle": "creature",
  "Kraken": "creature",
  "Undead": "creature",
  "Plague": "creature",
  "Poltergeist": "creature",
  "Lich": "ultimate",
  "Inferno": "ultimate",
  "Apocalypse": "ultimate",
  "Corruption": "ultimate",
  "Lucifer": "ultimate",
  "Vampire": "ultimate",
  "DarkLord": "ultimate",
  "Armageddon": "ultimate",
  "Doomsday": "ultimate",
  "DarkPrince": "ultimate",
  "Annihilation": "ultimate",
  "Damnation": "ultimate",
  "Warlock": "magic",
  "DarkPhoenix": "ultimate",
  "Abomination": "creature",
  "Raven": "creature",
  "Leviathan": "creature",
  "StormDemon": "ultimate"
};

export function getCategoryColor(category) {
  const colors = {
    basic: [100, 150, 255],
    natural: [150, 200, 100],
    life: [255, 200, 100],
    magic: [200, 100, 255],
    evil: [255, 80, 80],
    sin: [180, 50, 50],
    creature: [150, 100, 150],
    ultimate: [255, 215, 0]
  };
  return colors[category] || [200, 200, 200];
}

export function initializeGame() {
  gameState.discoveredElements = [...BASIC_ELEMENTS];
  gameState.selectedSlots = [null, null];
  gameState.currentSelection = 0;
  gameState.panelScroll = 0;
  gameState.elementCursor = 0;
  gameState.message = "";
  gameState.messageTimer = 0;
  gameState.combinationAttempts = 0;
  gameState.successfulCombinations = 0;
  gameState.score = 4; // Start with 4 basic elements
  gameState.lastCombinationSuccess = false;
  gameState.totalElements = Object.keys(ELEMENT_RECIPES).length + BASIC_ELEMENTS.length;
  gameState.animatingElement = null;
  gameState.animationTimer = 0;
}

export function normalizeRecipeKey(elem1, elem2) {
  // Sort alphabetically to handle both orders
  const sorted = [elem1, elem2].sort();
  return `${sorted[0]}+${sorted[1]}`;
}

export function tryCombination(elem1, elem2) {
  if (!elem1 || !elem2) return null;
  
  const key1 = normalizeRecipeKey(elem1, elem2);
  const key2 = `${elem1}+${elem2}`;
  const key3 = `${elem2}+${elem1}`;
  
  return ELEMENT_RECIPES[key1] || ELEMENT_RECIPES[key2] || ELEMENT_RECIPES[key3] || null;
}

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;