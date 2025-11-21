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
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  player: null,
  entities: [],
  score: 0,
  currentScene: 0,
  inventory: [],
  selectedItemIndex: -1,
  puzzleStates: {},
  hintCooldown: 0,
  lastHintTime: 0,
  framesSinceLastAction: 0,
  visitedScenes: [],
  interactedHotspots: []
};

// Scene navigation data
export const SCENE_DATA = [
  {
    id: 0,
    name: "Entrance Hall",
    description: "A dimly lit entrance with ice on the walls",
    exits: { right: 1 },
    hotspots: [
      { id: "key_card", x: 450, y: 200, w: 40, h: 60, type: "item", item: "keycard", visible: true }
    ],
    bgColor: [30, 40, 55]
  },
  {
    id: 1,
    name: "Control Room",
    description: "A room filled with monitors and control panels",
    exits: { left: 0, up: 2 },
    hotspots: [
      { id: "panel", x: 300, y: 150, w: 100, h: 80, type: "puzzle", puzzle: "code_lock", visible: true },
      { id: "battery", x: 150, y: 280, w: 30, h: 40, type: "item", item: "battery", visible: true }
    ],
    bgColor: [25, 35, 50]
  },
  {
    id: 2,
    name: "Laboratory",
    description: "A sterile lab with scientific equipment",
    exits: { down: 1, right: 3 },
    hotspots: [
      { id: "microscope", x: 200, y: 180, w: 60, h: 80, type: "puzzle", puzzle: "sample_analysis", visible: true },
      { id: "chemical", x: 400, y: 200, w: 35, h: 50, type: "item", item: "chemical", visible: true }
    ],
    bgColor: [35, 45, 60]
  },
  {
    id: 3,
    name: "Storage Room",
    description: "Shelves filled with supplies and equipment",
    exits: { left: 2, up: 4 },
    hotspots: [
      { id: "toolbox", x: 350, y: 220, w: 70, h: 50, type: "item", item: "wrench", visible: true },
      { id: "door_lock", x: 300, y: 100, w: 50, h: 80, type: "puzzle", puzzle: "locked_door", visible: true }
    ],
    bgColor: [40, 45, 55]
  },
  {
    id: 4,
    name: "Communications Hub",
    description: "Radio equipment and transmission devices",
    exits: { down: 3, right: 5 },
    hotspots: [
      { id: "radio", x: 250, y: 160, w: 90, h: 70, type: "puzzle", puzzle: "radio_frequency", visible: true }
    ],
    bgColor: [30, 38, 52]
  },
  {
    id: 5,
    name: "Core Chamber",
    description: "The heart of Meridian 157 - a mysterious central chamber",
    exits: { left: 4 },
    hotspots: [
      { id: "core", x: 300, y: 180, w: 120, h: 140, type: "puzzle", puzzle: "final_sequence", visible: true }
    ],
    bgColor: [20, 30, 45]
  }
];

// Puzzle definitions
export const PUZZLES = {
  code_lock: {
    solved: false,
    code: "2157",
    currentInput: "",
    requiredItem: "keycard"
  },
  sample_analysis: {
    solved: false,
    requiredItem: "chemical"
  },
  locked_door: {
    solved: false,
    requiredItem: "wrench"
  },
  radio_frequency: {
    solved: false,
    requiredItem: "battery",
    frequency: 157
  },
  final_sequence: {
    solved: false,
    requiresPuzzles: ["code_lock", "sample_analysis", "locked_door", "radio_frequency"]
  }
};

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;