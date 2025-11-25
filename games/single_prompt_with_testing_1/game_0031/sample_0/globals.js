// globals.js - Global constants and game state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const FPS = 60;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Control modes
export const CONTROL_HUMAN = "HUMAN";
export const CONTROL_TEST_1 = "TEST_1";
export const CONTROL_TEST_2 = "TEST_2";
export const CONTROL_TEST_3 = "TEST_3";

// Key codes
export const KEY_ENTER = 13;
export const KEY_ESC = 27;
export const KEY_SPACE = 32;
export const KEY_SHIFT = 16;
export const KEY_LEFT = 37;
export const KEY_UP = 38;
export const KEY_RIGHT = 39;
export const KEY_DOWN = 40;
export const KEY_R = 82;
export const KEY_Z = 90;

// Game settings
export const BUS_WIDTH = 40;
export const BUS_HEIGHT = 20;
export const BUS_MAX_SPEED = 3;
export const BUS_ACCELERATION = 0.15;
export const BUS_TURN_SPEED = 0.05;
export const BUS_FRICTION = 0.96;

export const STOP_RADIUS = 25;
export const PASSENGER_PICKUP_TIME = 60; // frames
export const ROUTE_TIME_LIMIT = 1800; // 30 seconds at 60fps

// Game state object
export const gameState = {
  player: null,
  entities: [],
  score: 0,
  credits: 0,
  gamePhase: PHASE_START,
  controlMode: CONTROL_HUMAN,
  currentRoute: null,
  routeProgress: 0,
  passengers: 0,
  maxPassengers: 20,
  timeRemaining: ROUTE_TIME_LIMIT,
  accidents: 0,
  completedRoutes: 0,
  unlockedBuses: 1,
  currentBusType: 0,
  stopTimer: 0,
  atStop: false,
  currentStopIndex: -1,
  world: {
    offsetX: 0,
    offsetY: 0
  }
};

// Bus types data
export const BUS_TYPES = [
  { name: "City Cruiser", color: [255, 100, 100], cost: 0, speed: 1.0 },
  { name: "Metro Express", color: [100, 255, 100], cost: 500, speed: 1.1 },
  { name: "Urban Liner", color: [100, 100, 255], cost: 1000, speed: 1.2 },
  { name: "Transit Master", color: [255, 255, 100], cost: 2000, speed: 1.3 }
];

// Route definition
export const ROUTE_STOPS = [
  { x: 100, y: 150, name: "Central Station" },
  { x: 300, y: 150, name: "Market Square" },
  { x: 500, y: 150, name: "Tech District" },
  { x: 500, y: 300, name: "Harbor View" },
  { x: 300, y: 300, name: "Old Town" },
  { x: 100, y: 300, name: "University" },
  { x: 100, y: 150, name: "Central Station" }
];

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;