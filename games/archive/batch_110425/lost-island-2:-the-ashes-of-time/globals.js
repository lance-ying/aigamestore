// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const MAX_INVENTORY_SIZE = 8;

// Game state object
export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  
  // Player/cursor state
  currentLocation: "beach",
  selectedHotspotIndex: 0,
  selectedInventoryIndex: -1,
  
  // Inventory
  inventory: [],
  
  // Game progress
  discoveredLocations: ["beach"],
  puzzlesSolved: [],
  collectedItems: [],
  
  // Puzzle state
  codes: {
    lighthouse: "",
    templeBox: ""
  },
  
  // Object states
  objectStates: {
    beachDriftwood: false,
    beachShell: false,
    forestKey: false,
    lighthouseMap: false,
    templeDoor: false,
    templeGem: false,
    caveCrystal: false,
    altarActivated: false
  },
  
  // Score and completion
  score: 0,
  itemsCollected: 0,
  puzzlesCompleted: 0,
  
  // Win condition
  hasWon: false,
  
  // Frame counter for tracking
  frameCount: 0
};

// Locations data structure
export const LOCATIONS = {
  beach: {
    name: "Beach",
    description: "A sandy beach with debris from the shipwreck",
    hotspots: [
      { id: "driftwood", x: 150, y: 250, radius: 30, type: "item", item: "Driftwood", collected: false },
      { id: "shell", x: 400, y: 300, radius: 25, type: "item", item: "Conch Shell", collected: false },
      { id: "toForest", x: 500, y: 150, radius: 40, type: "exit", target: "forest", unlocked: true }
    ],
    clues: ["Symbols on the driftwood match those on the lighthouse door"]
  },
  
  forest: {
    name: "Dense Forest",
    description: "Thick vegetation blocks most paths",
    hotspots: [
      { id: "vines", x: 200, y: 200, radius: 35, type: "puzzle", requires: ["Driftwood"], unlocks: "forestKey" },
      { id: "key", x: 250, y: 280, radius: 20, type: "item", item: "Rusty Key", collected: false, hidden: true },
      { id: "toBeach", x: 100, y: 350, radius: 40, type: "exit", target: "beach", unlocked: true },
      { id: "toLighthouse", x: 500, y: 100, radius: 40, type: "exit", target: "lighthouse", unlocked: false }
    ],
    clues: ["The vines can be cleared with something sturdy"]
  },
  
  lighthouse: {
    name: "Old Lighthouse",
    description: "A weathered lighthouse with strange symbols",
    hotspots: [
      { id: "door", x: 300, y: 250, radius: 50, type: "puzzle", requires: ["Rusty Key"], unlocks: "lighthouse" },
      { id: "map", x: 350, y: 200, radius: 30, type: "item", item: "Ancient Map", collected: false, hidden: true },
      { id: "code", x: 250, y: 150, radius: 30, type: "codePuzzle", code: "1842", unlocks: "templeAccess" },
      { id: "toForest", x: 100, y: 350, radius: 40, type: "exit", target: "forest", unlocked: true },
      { id: "toTemple", x: 500, y: 200, radius: 40, type: "exit", target: "temple", unlocked: false }
    ],
    clues: ["The code is hidden in the map's corner: 1842"]
  },
  
  temple: {
    name: "Ancient Temple",
    description: "Stone ruins covered in mysterious carvings",
    hotspots: [
      { id: "door", x: 300, y: 200, radius: 60, type: "puzzle", requires: ["Ancient Map", "Conch Shell"], unlocks: "templeDoor" },
      { id: "gem", x: 350, y: 280, radius: 25, type: "item", item: "Red Gem", collected: false, hidden: true },
      { id: "toLighthouse", x: 100, y: 350, radius: 40, type: "exit", target: "lighthouse", unlocked: true },
      { id: "toCave", x: 500, y: 150, radius: 40, type: "exit", target: "cave", unlocked: false }
    ],
    clues: ["The temple door needs both map and shell"]
  },
  
  cave: {
    name: "Crystal Cave",
    description: "Glowing crystals illuminate the darkness",
    hotspots: [
      { id: "crystal", x: 200, y: 180, radius: 35, type: "item", item: "Blue Crystal", collected: false },
      { id: "altar", x: 400, y: 220, radius: 50, type: "puzzle", requires: ["Red Gem", "Blue Crystal"], unlocks: "altarActivated" },
      { id: "toTemple", x: 100, y: 350, radius: 40, type: "exit", target: "temple", unlocked: true }
    ],
    clues: ["Place both gems on the altar to complete the ritual"]
  }
};

// Item definitions
export const ITEMS = {
  "Driftwood": { combinable: false, description: "Sturdy piece of wood from the wreck" },
  "Conch Shell": { combinable: false, description: "A beautiful spiral shell" },
  "Rusty Key": { combinable: false, description: "An old key, still functional" },
  "Ancient Map": { combinable: false, description: "Shows the island's layout and code: 1842" },
  "Red Gem": { combinable: true, description: "A glowing red gemstone" },
  "Blue Crystal": { combinable: true, description: "A shimmering blue crystal" }
};

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;