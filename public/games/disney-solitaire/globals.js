export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const CARD_WIDTH = 50;
export const CARD_HEIGHT = 70;

export const SUITS = ['♠', '♥', '♦', '♣'];
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: "START",
  controlMode: "HUMAN",
  currentLevel: 1,
  maxLevel: 3,
  tableauCards: [],
  discardPile: null,
  stockPile: [],
  deck: [],
  powerUpsRemaining: 1,
  highlightedIndex: 0,
  selectableElements: [],
  chain: 0,
  animatingCards: [],
  levelThemes: [
    { name: "Garden", colors: [[100, 200, 100], [80, 180, 80], [120, 220, 120]] },
    { name: "Savanna", colors: [[220, 180, 100], [200, 160, 80], [240, 200, 120]] },
    { name: "Ice Palace", colors: [[180, 220, 255], [160, 200, 235], [200, 240, 255]] }
  ],
  lastMoves: [],
  movesWithoutTableau: 0
};

// Expose gameState globally
if (typeof window !== 'undefined') {
  window.getGameState = function() {
    return gameState;
  };
}