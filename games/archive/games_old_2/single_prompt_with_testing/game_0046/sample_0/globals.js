// Global constants and state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const ACTION_TYPES = {
  LOOK: "LOOK",
  TALK: "TALK",
  USE: "USE",
  TAKE: "TAKE"
};

export const gameState = {
  player: null,
  entities: [],
  currentScene: 0,
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  inventory: [],
  selectedItem: null,
  showInventory: false,
  currentAction: ACTION_TYPES.LOOK,
  highlightedHotspot: null,
  dialogueActive: false,
  dialogueOptions: [],
  selectedDialogueIndex: 0,
  storyFlags: {},
  puzzlesSolved: 0,
  totalPuzzles: 5,
  actionMenuVisible: false,
  actionMenuX: 0,
  actionMenuY: 0,
  actionMenuOptions: []
};

// Story progression flags
export const STORY_FLAGS = {
  TALKED_TO_MECHANIC: "talked_to_mechanic",
  GOT_WRENCH: "got_wrench",
  FIXED_BIKE: "fixed_bike",
  GOT_KEY: "got_key",
  OPENED_DOOR: "opened_door",
  FOUND_CLUE: "found_clue",
  TALKED_TO_BOSS: "talked_to_boss",
  GOT_EVIDENCE: "got_evidence",
  COMBINED_EVIDENCE: "combined_evidence",
  FINAL_CONFRONTATION: "final_confrontation"
};

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;