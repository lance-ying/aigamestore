// globals.js - Game constants and global state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Key codes
export const KEY_LEFT = 37;
export const KEY_UP = 38;
export const KEY_RIGHT = 39;
export const KEY_DOWN = 40;
export const KEY_SPACE = 32;
export const KEY_SHIFT = 16;
export const KEY_Z = 90;
export const KEY_ENTER = 13;
export const KEY_ESC = 27;
export const KEY_R = 82;

// Game state object
export const gameState = {
  // Core game state
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  
  // Player resources
  dnaPoints: 0,
  
  // World state
  countries: [],
  totalPopulation: 0,
  infectedPopulation: 0,
  deadPopulation: 0,
  
  // Disease properties
  infectivity: 1,
  severity: 0,
  lethality: 0,
  
  // Disease evolutions
  transmissions: {
    air1: false,
    air2: false,
    water1: false,
    water2: false,
    blood1: false,
    blood2: false
  },
  symptoms: {
    coughing: false,
    sneezing: false,
    fever: false,
    vomiting: false,
    pneumonia: false,
    organFailure: false,
    totalOrganFailure: false
  },
  abilities: {
    coldResist1: false,
    coldResist2: false,
    heatResist1: false,
    heatResist2: false,
    drugResist1: false,
    drugResist2: false
  },
  
  // Cure progress
  cureProgress: 0,
  cureResearchRate: 0.001, // Base rate per frame
  
  // UI state
  selectedCountryIndex: 0,
  showInfoPanel: false,
  evolutionMenuOpen: false,
  evolutionCategory: 'transmission', // transmission, symptoms, abilities
  evolutionMenuIndex: 0,
  
  // DNA bubbles
  dnaBubbles: [],
  
  // Particles
  particles: [],
  
  // Time
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  gameTime: 0,
  timeMultiplier: 1,
  
  // Entities (for compatibility)
  entities: [],
  player: null
};

// Evolution costs and effects
export const EVOLUTIONS = {
  transmission: [
    { id: 'air1', name: 'Air 1', cost: 5, infectivity: 3, severity: 0, lethality: 0 },
    { id: 'air2', name: 'Air 2', cost: 10, infectivity: 5, severity: 1, lethality: 0, requires: 'air1' },
    { id: 'water1', name: 'Water 1', cost: 7, infectivity: 4, severity: 0, lethality: 0 },
    { id: 'water2', name: 'Water 2', cost: 12, infectivity: 6, severity: 1, lethality: 0, requires: 'water1' },
    { id: 'blood1', name: 'Blood 1', cost: 8, infectivity: 3, severity: 2, lethality: 0 },
    { id: 'blood2', name: 'Blood 2', cost: 15, infectivity: 5, severity: 3, lethality: 1, requires: 'blood1' }
  ],
  symptoms: [
    { id: 'coughing', name: 'Coughing', cost: 3, infectivity: 2, severity: 1, lethality: 0 },
    { id: 'sneezing', name: 'Sneezing', cost: 4, infectivity: 3, severity: 1, lethality: 0 },
    { id: 'fever', name: 'Fever', cost: 6, infectivity: 1, severity: 3, lethality: 1 },
    { id: 'vomiting', name: 'Vomiting', cost: 8, infectivity: 2, severity: 4, lethality: 2, requires: 'fever' },
    { id: 'pneumonia', name: 'Pneumonia', cost: 12, infectivity: 0, severity: 5, lethality: 4, requires: 'coughing' },
    { id: 'organFailure', name: 'Organ Failure', cost: 20, infectivity: 0, severity: 7, lethality: 8, requires: 'pneumonia' },
    { id: 'totalOrganFailure', name: 'Total Organ Failure', cost: 30, infectivity: 0, severity: 10, lethality: 15, requires: 'organFailure' }
  ],
  abilities: [
    { id: 'coldResist1', name: 'Cold Resist 1', cost: 8, infectivity: 0, severity: 0, lethality: 0 },
    { id: 'coldResist2', name: 'Cold Resist 2', cost: 15, infectivity: 0, severity: 0, lethality: 0, requires: 'coldResist1' },
    { id: 'heatResist1', name: 'Heat Resist 1', cost: 8, infectivity: 0, severity: 0, lethality: 0 },
    { id: 'heatResist2', name: 'Heat Resist 2', cost: 15, infectivity: 0, severity: 0, lethality: 0, requires: 'heatResist1' },
    { id: 'drugResist1', name: 'Drug Resist 1', cost: 12, infectivity: 0, severity: 0, lethality: 0 },
    { id: 'drugResist2', name: 'Drug Resist 2', cost: 20, infectivity: 0, severity: 0, lethality: 0, requires: 'drugResist1' }
  ]
};

// Expose getGameState globally
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;