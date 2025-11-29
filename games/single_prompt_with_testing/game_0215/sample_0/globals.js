// globals.js - Global constants and game state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Control modes
export const MODE_HUMAN = "HUMAN";
export const MODE_TEST_1 = "TEST_1";
export const MODE_TEST_2 = "TEST_2";

// Room types
export const ROOM_BED = "BED";
export const ROOM_BATHROOM = "BATHROOM";
export const ROOM_DINING = "DINING";
export const ROOM_RECREATION = "RECREATION";
export const ROOM_THERAPY = "THERAPY";
export const ROOM_DREAM = "DREAM";

// Task types
export const TASK_WAKE = "WAKE";
export const TASK_SHOWER = "SHOWER";
export const TASK_BRUSH = "BRUSH";
export const TASK_BREAKFAST = "BREAKFAST";
export const TASK_EXERCISE = "EXERCISE";
export const TASK_PUZZLE = "PUZZLE";
export const TASK_THERAPY = "THERAPY";
export const TASK_SLEEP = "SLEEP";

// Day schedule - tasks per day
export const DAILY_TASKS = [
  TASK_WAKE,
  TASK_SHOWER,
  TASK_BRUSH,
  TASK_BREAKFAST,
  TASK_EXERCISE,
  TASK_THERAPY,
  TASK_SLEEP
];

// Color restoration values per task
export const COLOR_PER_TASK = 100 / (DAILY_TASKS.length * 7); // 7 days to complete

// Game state object
export const gameState = {
  // Core state
  gamePhase: PHASE_START,
  controlMode: MODE_HUMAN,
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  
  // Player state
  player: null,
  
  // Room management
  currentRoom: ROOM_BED,
  rooms: {},
  
  // Task management
  currentDay: 1,
  currentTaskIndex: 0,
  tasksCompletedToday: 0,
  totalTasksCompleted: 0,
  taskInProgress: false,
  taskProgress: 0,
  
  // Memory and color restoration
  colorPercentage: 0,
  memoryFragments: [],
  dreamSequencesCompleted: 0,
  
  // Split screen state
  splitScreenActive: false,
  dreamWorld: null,
  realityWorld: null,
  
  // Interactive objects
  interactables: [],
  highlightedObject: null,
  
  // Puzzle state
  currentPuzzle: null,
  puzzleAttempts: 0,
  
  // UI state
  showTaskPrompt: false,
  taskPromptText: "",
  showDayTransition: false,
  dayTransitionTimer: 0,
  
  // Win/lose conditions
  totalDaysRequired: 7,
  allMemoriesRestored: false,
  doorUnlocked: false,
  
  // Entities
  entities: [],
  particles: [],
  
  // Score tracking
  score: 0,
  
  // Performance
  lastLoggedPosition: { x: 0, y: 0 }
};

// Expose getGameState globally
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;

// Helper function to get current task
export function getCurrentTask() {
  if (gameState.currentTaskIndex >= DAILY_TASKS.length) {
    return null;
  }
  return DAILY_TASKS[gameState.currentTaskIndex];
}

// Helper function to advance to next task
export function advanceTask() {
  gameState.currentTaskIndex++;
  gameState.tasksCompletedToday++;
  gameState.totalTasksCompleted++;
  gameState.taskInProgress = false;
  gameState.taskProgress = 0;
  
  // Add color restoration
  gameState.colorPercentage = Math.min(100, gameState.colorPercentage + COLOR_PER_TASK);
  gameState.score += 100;
  
  // Check if day is complete
  if (gameState.currentTaskIndex >= DAILY_TASKS.length) {
    completeDay();
  }
}

// Helper function to complete a day
export function completeDay() {
  gameState.currentDay++;
  gameState.currentTaskIndex = 0;
  gameState.tasksCompletedToday = 0;
  
  // Show day transition
  gameState.showDayTransition = true;
  gameState.dayTransitionTimer = 60; // 1 second
  
  // Check win condition
  if (gameState.currentDay > gameState.totalDaysRequired) {
    gameState.allMemoriesRestored = true;
    gameState.doorUnlocked = true;
    gameState.gamePhase = PHASE_GAME_OVER_WIN;
  }
}

// Helper function to get room based on current task
export function getRoomForTask(task) {
  switch (task) {
    case TASK_WAKE:
    case TASK_SLEEP:
      return ROOM_BED;
    case TASK_SHOWER:
    case TASK_BRUSH:
      return ROOM_BATHROOM;
    case TASK_BREAKFAST:
      return ROOM_DINING;
    case TASK_EXERCISE:
    case TASK_PUZZLE:
      return ROOM_RECREATION;
    case TASK_THERAPY:
      return ROOM_THERAPY;
    default:
      return ROOM_BED;
  }
}

// Helper function to get color with saturation based on progress
export function getColorWithSaturation(p, r, g, b, baseSaturation = 0) {
  const saturation = Math.min(100, baseSaturation + gameState.colorPercentage);
  const desatAmount = (100 - saturation) / 100;
  
  const gray = 0.299 * r + 0.587 * g + 0.114 * b;
  const desatR = gray + (r - gray) * (1 - desatAmount);
  const desatG = gray + (g - gray) * (1 - desatAmount);
  const desatB = gray + (b - gray) * (1 - desatAmount);
  
  return p.color(desatR, desatG, desatB);
}

// Helper function to reset game state
export function resetGameState() {
  gameState.gamePhase = PHASE_START;
  gameState.currentDay = 1;
  gameState.currentTaskIndex = 0;
  gameState.tasksCompletedToday = 0;
  gameState.totalTasksCompleted = 0;
  gameState.taskInProgress = false;
  gameState.taskProgress = 0;
  gameState.colorPercentage = 0;
  gameState.memoryFragments = [];
  gameState.dreamSequencesCompleted = 0;
  gameState.splitScreenActive = false;
  gameState.currentPuzzle = null;
  gameState.puzzleAttempts = 0;
  gameState.score = 0;
  gameState.allMemoriesRestored = false;
  gameState.doorUnlocked = false;
  gameState.showDayTransition = false;
  gameState.entities = [];
  gameState.particles = [];
  gameState.interactables = [];
  gameState.currentRoom = ROOM_BED;
}