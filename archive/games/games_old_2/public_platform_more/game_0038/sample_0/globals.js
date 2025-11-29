// globals.js
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
  player: null,
  entities: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  
  // Game-specific state
  currentDay: 1,
  timeOfDay: "morning", // morning, afternoon, evening, night
  selectedObjectIndex: 0,
  discoveredWords: [], // {alienWord, context, day}
  playerDictionary: {}, // {alienWord: playerTranslation}
  dictionaryOpen: false,
  currentInputWord: "",
  currentInputTranslation: "",
  inputMode: "word", // "word" or "translation"
  
  characterMood: "neutral", // neutral, happy, confused, sad, angry
  storyProgress: 0,
  narrativeFlags: {}, // Track story decisions
  dialogueHistory: [],
  
  interactionCount: 0,
  lastInteractionDay: 0
};

// Unknown language word database
export const ALIEN_WORDS = {
  // Core vocabulary
  "door": { alien: "zelt", category: "object" },
  "window": { alien: "kira", category: "object" },
  "bed": { alien: "noma", category: "object" },
  "table": { alien: "vesh", category: "object" },
  "food": { alien: "pala", category: "object" },
  "water": { alien: "suri", category: "object" },
  "book": { alien: "tarn", category: "object" },
  
  // Actions/Verbs
  "go": { alien: "mek", category: "action" },
  "want": { alien: "liru", category: "action" },
  "give": { alien: "fon", category: "action" },
  "help": { alien: "kesh", category: "action" },
  "know": { alien: "vira", category: "action" },
  
  // Emotions/States
  "happy": { alien: "sola", category: "emotion" },
  "sad": { alien: "neth", category: "emotion" },
  "afraid": { alien: "zarn", category: "emotion" },
  "friend": { alien: "amil", category: "emotion" },
  "danger": { alien: "koth", category: "emotion" },
  
  // Time
  "today": { alien: "vel", category: "time" },
  "tomorrow": { alien: "dren", category: "time" },
  "night": { alien: "osh", category: "time" },
  
  // Critical story words
  "escape": { alien: "grath", category: "critical" },
  "stay": { alien: "nul", category: "critical" },
  "trust": { alien: "mira", category: "critical" },
  "lie": { alien: "xen", category: "critical" }
};

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;