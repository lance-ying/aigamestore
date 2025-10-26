// renderer.js - All rendering functions

import { gameState, CANVAS<game_description>
Sort colorful items into their matching containers before time runs out! Each level presents a cluttered workspace with various colored shapes that need to be organized. Navigate through the chaos, pick up items, and place them in the correct containers. Match colors and shapes perfectly to score points. Complete all levels by sorting every item correctly within the time limit. Wrong placements cost you points, so think carefully before dropping!
</game_description>

<game_controls>
Arrow Keys: Move the selector to navigate between items and containers
Space: Pick up an item when hovering over it, or drop the held item into a container
Enter: Start the game from the title screen or proceed to the next level
Esc: Pause/unpause the game
R: Restart and return to the title screen
</game_controls>

<code filename="globals.js">
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

export const ITEM_TYPES = {
  RED_CIRCLE: "RED_CIRCLE",
  BLUE_SQUARE: "BLUE_SQUARE",
  GREEN_TRIANGLE: "GREEN_TRIANGLE",
  YELLOW_DIAMOND: "YELLOW_DIAMOND",
  PURPLE_HEXAGON: "PURPLE_HEXAGON"
};

export const ITEM_COLORS = {
  RED_CIRCLE: [220, 50, 50],
  BLUE_SQUARE: [50, 120, 220],
  GREEN_TRIANGLE: [50, 200, 80],
  YELLOW_DIAMOND: [240, 200, 50],
  PURPLE_HEXAGON: [180, 80, 200]
};

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  currentLevel: 1,
  score: 0,
  timeRemaining: 0,
  timeLimit: 60,
  selectorX: 0,
  selectorY: 0,
  isHoldingItem: false,
  heldItemId: null,
  items: [],
  containers: [],
  player: null, // Reference to selector for testing
  entities: [], // All game entities
  levelConfig: null,
  highScore: 0
};

// Expose gameState globally
window.getGameState = function() {
  return gameState;
};

export const SELECTOR_SIZE = 50;
export const CONTAINER_SIZE = 80;
export const ITEM_SIZE = 35;
export const GRID_COLS = 8;
export const GRID_ROWS = 5;
export const CELL_WIDTH = CANVAS_WIDTH / GRID_COLS;
export const CELL_HEIGHT = CANVAS_HEIGHT / GRID_ROWS;