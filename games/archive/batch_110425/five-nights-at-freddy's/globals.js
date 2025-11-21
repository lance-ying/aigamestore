// Global game state and constants
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const CAMERA_LOCATIONS = [
  { id: 0, name: "Show Stage", x: 300, y: 200 },
  { id: 1, name: "Dining Area", x: 200, y: 200 },
  { id: 2, name: "West Hall", x: 150, y: 150 },
  { id: 3, name: "East Hall", x: 450, y: 150 },
  { id: 4, name: "Supply Closet", x: 100, y: 250 },
  { id: 5, name: "Backstage", x: 400, y: 250 }
];

export const ANIMATRONICS = [
  { name: "Freddy", startLocation: 0, color: [139, 69, 19], aggression: 1 },
  { name: "Bonnie", startLocation: 0, color: [75, 0, 130], aggression: 1.2 },
  { name: "Chica", startLocation: 0, color: [255, 215, 0], aggression: 1.1 }
];

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  
  // Time tracking
  currentNight: 1,
  currentHour: 0, // 0 = 12AM, 1 = 1AM, ..., 5 = 5AM, 6 = 6AM (win)
  timeProgress: 0, // 0 to 1 for current hour
  
  // Power management
  power: 100,
  powerDrainRate: 0.05, // base drain per frame
  
  // Office state
  cameraOpen: false,
  currentCamera: 0,
  leftDoorClosed: false,
  rightDoorClosed: false,
  leftLightOn: false,
  rightLightOn: false,
  
  // Animatronics
  animatronics: [],
  
  // Game events
  jumpscareActive: false,
  jumpscareFrame: 0,
  jumpscareAnimatronic: null,
  
  // UI
  cameraButtonHighlight: false,
  
  // Testing
  positionHistory: [],
  stuckCounter: 0,
  testActionDelay: 0
};

// Initialize game state
export function initializeGameState() {
  gameState.currentNight = 1;
  gameState.currentHour = 0;
  gameState.timeProgress = 0;
  gameState.power = 100;
  gameState.powerDrainRate = 0.05;
  gameState.cameraOpen = false;
  gameState.currentCamera = 0;
  gameState.leftDoorClosed = false;
  gameState.rightDoorClosed = false;
  gameState.leftLightOn = false;
  gameState.rightLightOn = false;
  gameState.jumpscareActive = false;
  gameState.jumpscareFrame = 0;
  gameState.jumpscareAnimatronic = null;
  gameState.positionHistory = [];
  gameState.stuckCounter = 0;
  gameState.testActionDelay = 0;
  
  // Initialize animatronics
  gameState.animatronics = ANIMATRONICS.map(anim => ({
    name: anim.name,
    location: anim.startLocation,
    targetLocation: anim.startLocation,
    moveTimer: 0,
    moveDelay: 180 / (anim.aggression * gameState.currentNight), // Scales with night
    atLeftDoor: false,
    atRightDoor: false,
    color: anim.color,
    baseAggression: anim.aggression
  }));
}

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}