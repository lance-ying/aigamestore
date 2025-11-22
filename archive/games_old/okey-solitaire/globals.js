// Global game state and constants
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const TILE_WIDTH = 35;
export const TILE_HEIGHT = 50;
export const TILE_SPACING = 5;

export const COLORS = {
  RED: [220, 50, 50],
  BLUE: [50, 120, 220],
  BLACK: [40, 40, 40],
  YELLOW: [220, 180, 50]
};

export const COLOR_NAMES = ['RED', 'BLUE', 'BLACK', 'YELLOW'];

// Game state object
export const gameState = {
  player: null,
  entities: [],
  score: 0,
  highScore: 0,
  level: 1,
  gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
  controlMode: "HUMAN",
  
  // Game-specific state
  currentPlayer: 0, // 0 = human, 1-3 = AI
  drawPile: [],
  players: [null, null, null, null], // Player hands
  discardPiles: [[], [], [], []], // Discard piles for each player
  okeyTile: null, // The wild card tile for this round
  
  // Player interaction state
  selectedTileIndex: -1,
  pickedUpTileIndex: -1,
  focusMode: 'HAND', // 'HAND', 'DRAW_CENTER', 'DRAW_DISCARD'
  hasDrawn: false,
  
  // AI state
  aiThinkingTime: 0,
  
  // Level transition
  levelTransitionTimer: 0,
  roundScore: 0,
  
  // Animation state
  animatingTiles: [],
  winAnimationTimer: 0,
  
  // Internal game phase for sub-states
  internalPhase: "MENU", // MENU, DEALING, PLAYER_DRAW, PLAYER_DISCARD, AI_TURN, LEVEL_COMPLETE, etc.
  
  // State tracking for observability
  frameNumber: 0,
  lastStateChange: 0,
  turnsCompleted: 0,
  tilesDrawn: 0,
  tilesDiscarded: 0
};

// Function to get game state (required)
export function getGameState() {
  return {
    score: gameState.score,
    highScore: gameState.highScore,
    level: gameState.level,
    gamePhase: gameState.gamePhase,
    internalPhase: gameState.internalPhase,
    currentPlayer: gameState.currentPlayer,
    controlMode: gameState.controlMode,
    hasDrawn: gameState.hasDrawn,
    drawPileSize: gameState.drawPile ? gameState.drawPile.length : 0,
    playerHandSize: gameState.players[0] ? gameState.players[0].length : 0,
    player1HandSize: gameState.players[1] ? gameState.players[1].length : 0,
    player2HandSize: gameState.players[2] ? gameState.players[2].length : 0,
    player3HandSize: gameState.players[3] ? gameState.players[3].length : 0,
    discardPile0Size: gameState.discardPiles[0] ? gameState.discardPiles[0].length : 0,
    discardPile1Size: gameState.discardPiles[1] ? gameState.discardPiles[1].length : 0,
    discardPile2Size: gameState.discardPiles[2] ? gameState.discardPiles[2].length : 0,
    discardPile3Size: gameState.discardPiles[3] ? gameState.discardPiles[3].length : 0,
    frameNumber: gameState.frameNumber,
    lastStateChange: gameState.lastStateChange,
    turnsCompleted: gameState.turnsCompleted,
    tilesDrawn: gameState.tilesDrawn,
    tilesDiscarded: gameState.tilesDiscarded,
    selectedTileIndex: gameState.selectedTileIndex,
    pickedUpTileIndex: gameState.pickedUpTileIndex,
    focusMode: gameState.focusMode,
    aiThinkingTime: gameState.aiThinkingTime,
    roundScore: gameState.roundScore
  };
}

// Attach to window
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}