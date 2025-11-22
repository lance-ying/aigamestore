// globals.js - Game state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const gameState = {
  player: null,
  entities: [],
  gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
  controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2
  
  // Game-specific state
  currentLocation: "office",
  inventory: [],
  selectedInventoryIndex: -1,
  cluesFound: [],
  puzzlesSolved: [],
  dialogueHistory: {},
  
  // Story progression flags
  hasDecodedMessage: false,
  hasInterviewedAll: false,
  hasCombinedEvidence: false,
  culpritIdentified: false,
  
  // UI state
  hoveredHotspot: null,
  showInventory: false,
  currentDialogue: null,
  dialogueChoiceIndex: 0,
  messageQueue: [],
  
  // Score
  score: 0,
  
  // Position tracking for testing
  positionHistory: [],
  stuckCounter: 0
};

export const LOCATIONS = {
  office: {
    name: "Detective Office",
    description: "Your headquarters in Rocky Beach",
    unlocked: true,
    hotspots: [
      { id: "desk", x: 200, y: 200, radius: 40, type: "examine", label: "Desk" },
      { id: "phone", x: 450, y: 150, radius: 30, type: "examine", label: "Phone" },
      { id: "exit_park", x: 550, y: 350, radius: 35, type: "travel", label: "To Park", target: "park" }
    ]
  },
  park: {
    name: "Rocky Beach Park",
    description: "A peaceful park near the beach",
    unlocked: true,
    hotspots: [
      { id: "bench", x: 250, y: 250, radius: 40, type: "examine", label: "Bench" },
      { id: "trashcan", x: 400, y: 280, radius: 30, type: "examine", label: "Trash Can" },
      { id: "witness1", x: 150, y: 200, radius: 35, type: "talk", label: "Old Man" },
      { id: "exit_office", x: 50, y: 350, radius: 35, type: "travel", label: "To Office", target: "office" },
      { id: "exit_dock", x: 550, y: 250, radius: 35, type: "travel", label: "To Dock", target: "dock" }
    ]
  },
  dock: {
    name: "Harbor Dock",
    description: "The old dock area",
    unlocked: false,
    hotspots: [
      { id: "boat", x: 300, y: 220, radius: 50, type: "examine", label: "Boat" },
      { id: "crate", x: 450, y: 300, radius: 35, type: "examine", label: "Crate" },
      { id: "witness2", x: 150, y: 180, radius: 35, type: "talk", label: "Fisherman" },
      { id: "exit_park", x: 50, y: 100, radius: 35, type: "travel", label: "To Park", target: "park" },
      { id: "exit_warehouse", x: 550, y: 200, radius: 35, type: "travel", label: "To Warehouse", target: "warehouse" }
    ]
  },
  warehouse: {
    name: "Abandoned Warehouse",
    description: "A suspicious old warehouse",
    unlocked: false,
    hotspots: [
      { id: "door", x: 300, y: 180, radius: 40, type: "examine", label: "Locked Door" },
      { id: "window", x: 450, y: 150, radius: 30, type: "examine", label: "Window" },
      { id: "footprints", x: 200, y: 300, radius: 30, type: "examine", label: "Footprints" },
      { id: "suspect", x: 350, y: 250, radius: 40, type: "talk", label: "Suspicious Person" },
      { id: "exit_dock", x: 50, y: 200, radius: 35, type: "travel", label: "To Dock", target: "dock" }
    ]
  }
};

export const ITEMS = {
  coded_note: { name: "Coded Note", description: "A mysterious note with strange symbols", combinable: true },
  decoder_key: { name: "Decoder Key", description: "Found in the phone book - looks like a cipher key", combinable: true },
  photo: { name: "Photo", description: "A blurry photo of someone near the warehouse", combinable: true },
  footprint_cast: { name: "Footprint Cast", description: "A plaster cast of unusual footprints", combinable: true },
  witness_statement: { name: "Witness Statement", description: "Written testimony from the old man", combinable: true },
  boat_schedule: { name: "Boat Schedule", description: "Shows recent unusual activity", combinable: true }
};

export const PUZZLES = {
  decode_message: {
    id: "decode_message",
    name: "Decode the Troll Message",
    description: "Combine the coded note with the decoder key",
    requires: ["coded_note", "decoder_key"],
    solved: false,
    solution: "decoded_message"
  },
  identify_suspect: {
    id: "identify_suspect",
    name: "Identify the Culprit",
    description: "Combine evidence to identify who is behind the troll threats",
    requires: ["photo", "footprint_cast", "witness_statement"],
    solved: false,
    solution: "suspect_identity"
  }
};

window.getGameState = () => gameState;