// globals.js - Game constants and state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Game sub-phases during PLAYING
export const SUBPHASE_DRAW = "DRAW";
export const SUBPHASE_AGENT_PLACEMENT = "AGENT_PLACEMENT";
export const SUBPHASE_REVEAL = "REVEAL";
export const SUBPHASE_COMBAT = "COMBAT";
export const SUBPHASE_CLEANUP = "CLEANUP";

// Resources
export const RESOURCE_SPICE = "SPICE";
export const RESOURCE_SOLARI = "SOLARI";

// Factions
export const FACTION_EMPEROR = "EMPEROR";
export const FACTION_BENE_GESSERIT = "BENE_GESSERIT";
export const FACTION_SPACING_GUILD = "SPACING_GUILD";
export const FACTION_FREMEN = "FREMEN";

export const FACTIONS = [FACTION_EMPEROR, FACTION_BENE_GESSERIT, FACTION_SPACING_GUILD, FACTION_FREMEN];

// Game state
export const gameState = {
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  subPhase: SUBPHASE_DRAW,
  round: 0,
  currentPlayer: 0, // 0 = player, 1 = AI opponent
  
  player: null, // Will be initialized with Player object
  opponent: null, // AI opponent
  
  locations: [], // Board locations
  marketCards: [], // Available cards to purchase
  
  selectedCardIndex: -1,
  selectedLocationIndex: -1,
  
  combatResults: null,
  
  entities: [], // For compatibility
  
  // UI state
  messageText: "",
  messageTimer: 0
};

// Initialize game state accessor
if (typeof window !== 'undefined') {
  window.getGameState = function() {
    return gameState;
  };
}

export function getGameState() {
  return gameState;
}