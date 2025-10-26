// gameplay.js - Gameplay logic

import { GAME_PHASES, gameState } from './globals.js';
import { LEVEL_DATA, ITEMS } from './levels.js';
import { PUZZLES, checkPuzzleSolution } from './puzzles.js';

export function handlePlayingInput(p, key, keyCode) {
  const level = LEVEL_DATA[gameState.currentLevel];
  if (!<game_description>
Escape the haunted Bell Village shrine by solving puzzles across three increasingly challenging levels. Navigate between viewpoints, examine objects, collect items, and use your wits to unlock doors, decipher codes, and complete ancient rituals. Time is limited - solve all puzzles before the clock runs out to escape successfully. Each level grows darker and more complex as you descend into the Crypt of Echoes.
</game_description>

<game_controls>
Arrow Left/Right: Navigate between scene viewpoints
Arrow Up/Down: Cycle through interactive objects in current scene
Space: Interact with selected object / Use item / Confirm action
Z: Toggle inventory (open/close)
A/D: Navigate inventory items when open
Shift (hold): Request hint (score penalty)
ESC: Pause/Unpause game
Enter: Start game from menu
R: Restart game (return to menu)
</game_controls>

<code filename="globals.js">
// globals.js - Global game state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const gameState = {
  player: null, // Not used in this game type but included for structure
  entities: [], // Stores all game objects
  score: 0,
  gamePhase: "START", // "START", "PLAYING", "GAME_OVER_WIN", "GAME_OVER_LOSE", "PAUSED"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2"
  
  // Game-specific state
  currentLevel: 1,
  currentSceneId: null,
  inventory: [],
  hotspotStates: {},
  activePuzzleId: null,
  activeInventoryItemId: null,
  levelTimeRemaining: 0,
  hintsUsedThisLevel: 0,
  selectedHotspotIndex: 0,
  selectedInventoryIndex: 0,
  inventoryOpen: false,
  puzzleData: {},
  hintRequested: false,
  hintDisplayTime: 0,
  currentHint: "",
  levelScore: 0,
  bonuses: {
    timeBonus: 0,
    noHintBonus: 0,
    speedRunBonus: 0
  },
  levelCompleteDisplayTime: 0,
  showLevelComplete: false,
  puzzleAttempts: {},
  scenes: [],
  allLevelsData: null
};

// Global function to expose game state
export function getGameState() {
  return gameState;
}

// Attach to window
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}