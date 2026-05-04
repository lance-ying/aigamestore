// globals.js - Global game state and constants
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
  
  // Location and navigation
  currentLocation: "headquarters",
  unlockedLocations: ["headquarters"],
  availableLocations: ["headquarters", "park", "library", "warehouse", "pier"],
  
  // Inventory and clues
  inventory: [],
  cluesCollected: [],
  
  // Puzzle state
  currentPuzzle: null,
  solvedPuzzles: [],
  
  // Dialogue state
  currentDialogue: null,
  dialogueIndex: 0,
  npcStates: {},
  
  // UI state
  selectedHotspot: 0,
  inventoryOpen: false,
  selectedInventoryItem: null,
  
  // Game progress
  storyProgress: 0,
  mysteryCluesFound: 0,
  requiredCluesForWin: 8,
  
  // Input tracking
  lastActionTime: 0
};

// Story and puzzle data
export const STORY_DATA = {
  prologue: "Strange incidents involving 'troll' graffiti have appeared across Rocky Beach. The Three Investigators must uncover who's behind these mysterious events.",
  
  locations: {
    headquarters: {
      name: "Headquarters",
      description: "Your secret hideout in the junkyard",
      hotspots: ["desk", "map", "phone"],
      npcs: []
    },
    park: {
      name: "Rocky Beach Park",
      description: "A public park with recent vandalism",
      hotspots: ["graffiti", "bench", "trash_can"],
      npcs: ["witness1"]
    },
    library: {
      name: "Public Library",
      description: "A quiet place with valuable information",
      hotspots: ["computer", "books", "newspaper"],
      npcs: ["librarian"]
    },
    warehouse: {
      name: "Old Warehouse",
      description: "An abandoned building near the docks",
      hotspots: ["crate", "paint_cans", "footprints"],
      npcs: []
    },
    pier: {
      name: "Harbor Pier",
      description: "The waterfront where suspicious activity was reported",
      hotspots: ["boat", "rope", "note"],
      npcs: ["witness2"]
    }
  }
};

export const CLUE_DATA = {
  graffiti_photo: { name: "Graffiti Photo", description: "Photo of troll graffiti", combinable: true },
  paint_sample: { name: "Paint Sample", description: "Sample of spray paint", combinable: true },
  witness_testimony: { name: "Witness Statement", description: "Written testimony", combinable: false },
  coded_message: { name: "Coded Message", description: "Mysterious encoded note", combinable: true },
  key: { name: "Old Key", description: "Rusty warehouse key", combinable: false },
  rope_piece: { name: "Rope Fragment", description: "Piece of nautical rope", combinable: true },
  receipt: { name: "Store Receipt", description: "Receipt from art supply store", combinable: true },
  schedule: { name: "Schedule", description: "Someone's daily schedule", combinable: false }
};

export const PUZZLES = {
  decode_message: {
    id: "decode_message",
    name: "Decode the Message",
    requiredItems: ["coded_message"],
    solution: "WAREHOUSE",
    description: "Decipher the coded message using the Caesar cipher",
    unlocks: "warehouse"
  },
  match_paint: {
    id: "match_paint",
    name: "Match Paint Samples",
    requiredItems: ["paint_sample", "receipt"],
    solution: "combined",
    description: "Match the paint to the purchase receipt",
    unlocks: "pier"
  },
  identify_culprit: {
    id: "identify_culprit",
    name: "Identify the Culprit",
    requiredItems: ["graffiti_photo", "witness_testimony", "schedule"],
    solution: "combined",
    description: "Connect all evidence to identify the perpetrator",
    unlocks: "win"
  }
};