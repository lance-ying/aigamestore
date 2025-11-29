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

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  currentScene: "entrance",
  selectedHotspot: null,
  selectedInventoryItem: null,
  inventory: [],
  journal: [],
  unlockedScenes: ["entrance"],
  puzzlesSolved: [],
  artifacts: 0,
  showInventory: false,
  showJournal: false,
  hotspotSelectionIndex: 0,
  inventorySelectionIndex: 0,
  framesSinceLastInput: 0
};

// Scene definitions with hotspots and connections
export const SCENES = {
  entrance: {
    name: "City Entrance",
    description: "Ancient stone gates loom before you, covered in mysterious runes.",
    background: { type: "entrance" },
    hotspots: [
      { id: "gate_runes", x: 300, y: 150, w: 80, h: 60, label: "Gate Runes", examine: "Ancient symbols glow faintly. They seem to tell a story.", clue: "The sun rises, the moon watches, the stars guide." },
      { id: "stone_key", x: 450, y: 320, w: 30, h: 30, label: "Stone Key", item: "stone_key", description: "An ornate stone key" }
    ],
    exits: [
      { direction: "forward", to: "plaza", x: 300, y: 200, label: "Enter City", requires: null }
    ]
  },
  plaza: {
    name: "Central Plaza",
    description: "A vast plaza with a dried fountain at its center.",
    background: { type: "plaza" },
    hotspots: [
      { id: "fountain", x: 300, y: 200, w: 100, h: 80, label: "Fountain", examine: "The fountain is dry. There's a keyhole in its base.", useItem: "stone_key", result: "unlock_temple", clue: "Water once flowed here, blessed by the temple." },
      { id: "statue", x: 150, y: 180, w: 60, h: 100, label: "Statue", examine: "A weathered statue of a sun deity. One hand is missing.", useItem: "sun_medallion", result: "statue_blessing" }
    ],
    exits: [
      { direction: "back", to: "entrance", x: 100, y: 350, label: "Exit" },
      { direction: "left", to: "market", x: 50, y: 200, label: "Market District" },
      { direction: "right", to: "temple", x: 550, y: 200, label: "Temple", requires: "unlock_temple" }
    ]
  },
  market: {
    name: "Market District",
    description: "Abandoned merchant stalls line the narrow street.",
    background: { type: "market" },
    hotspots: [
      { id: "merchant_table", x: 200, y: 250, w: 80, h: 50, label: "Table", examine: "Old merchant wares scattered about. Something glints underneath.", clue: "The merchants traded under moonlight." },
      { id: "moon_stone", x: 220, y: 280, w: 25, h: 25, label: "Moon Stone", item: "moon_stone", description: "A luminous moon-shaped stone", requires: "read_runes" },
      { id: "locked_chest", x: 400, y: 300, w: 60, h: 50, label: "Chest", examine: "A locked chest. It needs a special key.", useItem: "silver_key", result: "unlock_chest" }
    ],
    exits: [
      { direction: "right", to: "plaza", x: 550, y: 300, label: "Plaza" },
      { direction: "forward", to: "tower", x: 300, y: 100, label: "Tower", requires: "unlock_tower" }
    ]
  },
  temple: {
    name: "Ancient Temple",
    description: "Sacred halls filled with ethereal light.",
    background: { type: "temple" },
    hotspots: [
      { id: "altar", x: 300, y: 180, w: 120, h: 80, label: "Altar", examine: "A sacred altar with three indentations. Ancient power resonates here.", useItem: "power_crystal", result: "win_game" },
      { id: "sun_medallion", x: 450, y: 250, w: 30, h: 30, label: "Sun Medallion", item: "sun_medallion", description: "A golden sun medallion", requires: "fountain_unlocked" },
      { id: "mural", x: 150, y: 150, w: 80, h: 100, label: "Mural", examine: "A mural depicting the three celestial artifacts restoring balance.", clue: "Three become one. Sun, Moon, and Stars unite at the altar." }
    ],
    exits: [
      { direction: "left", to: "plaza", x: 50, y: 300, label: "Plaza" }
    ]
  },
  tower: {
    name: "Celestial Tower",
    description: "A tall tower reaching toward the stars.",
    background: { type: "tower" },
    hotspots: [
      { id: "telescope", x: 350, y: 150, w: 70, h: 60, label: "Telescope", examine: "An ancient telescope pointing at the night sky.", clue: "The stars reveal hidden truths." },
      { id: "star_gem", x: 250, y: 280, w: 25, h: 25, label: "Star Gem", item: "star_gem", description: "A radiant star-shaped gem", requires: "chest_unlocked" },
      { id: "crystal_pedestal", x: 300, y: 250, w: 50, h: 60, label: "Pedestal", examine: "A pedestal with three slots arranged in a triangle.", useItem: "combine_artifacts", result: "create_crystal" }
    ],
    exits: [
      { direction: "back", to: "market", x: 300, y: 350, label: "Market" }
    ]
  }
};

export const ITEMS = {
  stone_key: { name: "Stone Key", description: "Opens ancient mechanisms" },
  moon_stone: { name: "Moon Stone", description: "Glows with lunar energy" },
  sun_medallion: { name: "Sun Medallion", description: "Radiates solar power" },
  star_gem: { name: "Star Gem", description: "Sparkles with stellar light" },
  silver_key: { name: "Silver Key", description: "A delicate silver key" },
  power_crystal: { name: "Power Crystal", description: "Pulsing with ancient magic" }
};