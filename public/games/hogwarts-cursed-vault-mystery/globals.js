export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const PLAY_SUBSTATES = {
  EXPLORATION: "EXPLORATION",
  DIALOGUE: "DIALOGUE",
  DUEL: "DUEL",
  LEVEL_TRANSITION: "LEVEL_TRANSITION"
};

export const gameState = {
  gamePhase: GAME_PHASES.START,
  playSubstate: PLAY_SUBSTATES.EXPLORATION,
  controlMode: "HUMAN",
  
  player: null,
  entities: [],
  
  currentYear: 1,
  currentEnergy: 25,
  maxEnergy: 50,
  energyRegenRate: 1,
  energyRegenInterval: 4000,
  lastEnergyRegen: 0,
  
  courage: 1,
  empathy: 1,
  knowledge: 1,
  
  housePoints: 0,
  
  currentScene: 0,
  tasksCompletedThisYear: 0,
  tasksRequiredPerYear: [10, 15, 20, 25, 30],
  duelsWonThisYear: 0,
  duelsRequiredPerYear: [0, 1, 2, 3, 2],
  
  interactiveObjects: [],
  currentDialogue: null,
  currentDuel: null,
  
  showAttributePanel: true,
  transitionTimer: 0,
  transitionDuration: 180,
  
  gameOverReason: "",
  
  selectedMenuOption: 0,
  selectedDialogueOption: 0,
  selectedDuelStance: 0
};

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;