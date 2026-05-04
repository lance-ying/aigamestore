// Game state and constants
export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: "START", // "START", "PLAYING", "GAME_OVER_WIN", "GAME_OVER_LOSE", "PAUSED"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2", "TEST_3", etc.
  
  // Game-specific state
  dnaPoints: 0,
  infectionRate: 0,
  cureProgress: 0,
  currentView: "MAP", // "MAP" or "UPGRADES"
  selectedUpgradeCategory: 0,
  selectedUpgrade: 0,
  gameSpeed: 1,
  timePassed: 0,
  
  // Countries and infection data
  countries: [],
  totalInfected: 0,
  totalPopulation: 0,
  
  // Upgrade categories and their upgrades
  upgradeCategories: [
    {
      name: "Transmission",
      upgrades: [
        { name: "Air", cost: 10, level: 0, maxLevel: 3, effect: 0.05, description: "Airborne transmission" },
        { name: "Water", cost: 12, level: 0, maxLevel: 3, effect: 0.06, description: "Waterborne transmission" },
        { name: "Animal", cost: 15, level: 0, maxLevel: 3, effect: 0.07, description: "Animal vectors" },
        { name: "Insect", cost: 18, level: 0, maxLevel: 3, effect: 0.08, description: "Insect carriers" }
      ]
    },
    {
      name: "Symptoms",
      upgrades: [
        { name: "Coughing", cost: 8, level: 0, maxLevel: 3, effect: 0.04, description: "Causes coughing" },
        { name: "Fever", cost: 10, level: 0, maxLevel: 3, effect: 0.05, description: "Induces fever" },
        { name: "Rash", cost: 12, level: 0, maxLevel: 3, effect: 0.06, description: "Skin rash" },
        { name: "Vomiting", cost: 15, level: 0, maxLevel: 3, effect: 0.07, description: "Causes vomiting" }
      ]
    },
    {
      name: "Abilities",
      upgrades: [
        { name: "Cold Resistance", cost: 15, level: 0, maxLevel: 3, effect: 0.1, description: "Survive in cold climates" },
        { name: "Heat Resistance", cost: 15, level: 0, maxLevel: 3, effect: 0.1, description: "Survive in hot climates" },
        { name: "Drug Resistance", cost: 20, level: 0, maxLevel: 3, effect: 0.15, description: "Resist medications" },
        { name: "Mutation", cost: 25, level: 0, maxLevel: 3, effect: 0.2, description: "Harder to cure" }
      ]
    }
  ]
};

// Canvas dimensions
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game constants
export const DNA_GAIN_RATE = 0.2;
export const CURE_PROGRESS_RATE = 0.02;
export const BASE_INFECTION_RATE = 0.001;

// Key codes
export const KEY_CODES = {
  ENTER: 13,
  ESC: 27,
  SPACE: 32,
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  R: 82,
  Z: 90,
  SHIFT: 16
};

// Get the current game state
export function getGameState() {
  return gameState;
}

// Expose the getGameState function globally
window.getGameState = getGameState;