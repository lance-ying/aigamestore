// globals.js - Game constants and state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game constants
export const TOTAL_CAMERAS = 6;
export const ANOMALY_TYPES = [
  'FURNITURE_MOVED',
  'OBJECT_DISAPPEARED', 
  'OBJECT_APPEARED',
  'INTRUDER',
  'DOOR_OPEN',
  'LIGHT_CHANGE'
];

export const ROOM_NAMES = [
  'LIVING_ROOM',
  'KITCHEN',
  'BEDROOM',
  'BATHROOM',
  'HALLWAY',
  'BASEMENT'
];

// Time constants
export const SHIFT_START_HOUR = 0; // Midnight
export const SHIFT_END_HOUR = 6; // 6 AM
export const GAME_TIME_SCALE = 0.5; // Game minutes per real second

// Anomaly spawn settings
export const BASE_ANOMALY_CHANCE = 0.03; // 3% chance per check
export const ANOMALY_CHECK_INTERVAL = 120; // Frames between checks (2 seconds at 60fps)
export const MAX_ACTIVE_ANOMALIES = 3;
export const ANOMALY_DURATION = 600; // Frames anomaly stays active (10 seconds)

// Scoring
export const CORRECT_REPORT_POINTS = 100;
export const WRONG_REPORT_PENALTY = -50;
export const MISSED_ANOMALY_PENALTY = -75;
export const MAX_STRIKES = 3;

// Game state object
export const gameState = {
  // Core state
  gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
  controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2
  
  // Time tracking
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  gameTime: 0, // In game minutes since midnight
  
  // Player state
  currentCamera: 0,
  selectedReportRoom: 0,
  selectedReportType: 0,
  reportMenuOpen: false,
  
  // Game metrics
  score: 0,
  strikes: 0,
  anomaliesDetected: 0,
  anomaliesMissed: 0,
  totalAnomalies: 0,
  falseReports: 0,
  
  // Room states - stores snapshots of each room
  roomStates: [],
  
  // Active anomalies
  activeAnomalies: [],
  
  // Anomaly spawn control
  lastAnomalyCheck: 0,
  anomalySpawnTimer: 0,
  
  // Camera transition
  cameraTransitioning: false,
  cameraTransitionProgress: 0,
  previousCamera: 0,
  
  // UI state
  uiAlertMessage: '',
  uiAlertTimer: 0,
  
  // Memory tracking for automated testing
  roomMemory: [],
  
  // Entities (for rendering)
  entities: [],
  particles: []
};

// Initialize room states
export function initializeRoomStates() {
  gameState.roomStates = [];
  gameState.roomMemory = [];
  
  for (let i = 0; i < TOTAL_CAMERAS; i++) {
    // Generate initial room state
    const roomState = generateRoomState(i);
    gameState.roomStates.push(roomState);
    
    // Initialize memory for testing
    gameState.roomMemory.push(JSON.parse(JSON.stringify(roomState)));
  }
}

// Generate a room state with objects
function generateRoomState(roomIndex) {
  const roomName = ROOM_NAMES[roomIndex];
  
  const state = {
    roomName: roomName,
    roomIndex: roomIndex,
    objects: [],
    lighting: 1.0, // 0.0 to 1.0
    doorOpen: false,
    hasIntruder: false,
    intruderPosition: null
  };
  
  // Add room-specific objects based on room type
  switch (roomName) {
    case 'LIVING_ROOM':
      state.objects.push(
        { type: 'couch', x: 100, y: 200, width: 120, height: 60, color: [139, 69, 19] },
        { type: 'tv', x: 400, y: 150, width: 80, height: 60, color: [50, 50, 50] },
        { type: 'table', x: 250, y: 250, width: 60, height: 40, color: [101, 67, 33] },
        { type: 'lamp', x: 450, y: 100, width: 20, height: 40, color: [200, 200, 100] }
      );
      break;
      
    case 'KITCHEN':
      state.objects.push(
        { type: 'counter', x: 80, y: 180, width: 150, height: 50, color: [180, 180, 180] },
        { type: 'fridge', x: 400, y: 150, width: 60, height: 100, color: [220, 220, 220] },
        { type: 'table', x: 250, y: 250, width: 80, height: 60, color: [139, 90, 43] },
        { type: 'chair', x: 280, y: 280, width: 30, height: 30, color: [101, 67, 33] }
      );
      break;
      
    case 'BEDROOM':
      state.objects.push(
        { type: 'bed', x: 150, y: 200, width: 120, height: 80, color: [70, 70, 120] },
        { type: 'dresser', x: 400, y: 180, width: 80, height: 60, color: [101, 67, 33] },
        { type: 'nightstand', x: 100, y: 200, width: 40, height: 40, color: [101, 67, 33] },
        { type: 'lamp', x: 110, y: 180, width: 15, height: 30, color: [200, 200, 100] }
      );
      break;
      
    case 'BATHROOM':
      state.objects.push(
        { type: 'sink', x: 150, y: 180, width: 60, height: 40, color: [220, 220, 220] },
        { type: 'toilet', x: 350, y: 200, width: 50, height: 50, color: [240, 240, 240] },
        { type: 'mirror', x: 150, y: 130, width: 60, height: 80, color: [180, 200, 220] },
        { type: 'towel', x: 400, y: 150, width: 20, height: 40, color: [200, 100, 100] }
      );
      break;
      
    case 'HALLWAY':
      state.objects.push(
        { type: 'door', x: 100, y: 150, width: 60, height: 100, color: [101, 67, 33] },
        { type: 'door', x: 350, y: 150, width: 60, height: 100, color: [101, 67, 33] },
        { type: 'painting', x: 250, y: 130, width: 50, height: 70, color: [150, 100, 50] },
        { type: 'plant', x: 450, y: 220, width: 30, height: 50, color: [50, 150, 50] }
      );
      break;
      
    case 'BASEMENT':
      state.objects.push(
        { type: 'shelf', x: 100, y: 160, width: 100, height: 80, color: [80, 80, 80] },
        { type: 'box', x: 300, y: 220, width: 50, height: 50, color: [139, 90, 43] },
        { type: 'box', x: 360, y: 220, width: 50, height: 50, color: [139, 90, 43] },
        { type: 'light', x: 250, y: 100, width: 20, height: 20, color: [255, 255, 200] }
      );
      break;
  }
  
  return state;
}

// Get game state function
export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}