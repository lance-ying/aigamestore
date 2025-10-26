// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GRID_SIZE = 20;
export const GRID_COLS = Math.floor(CANVAS_WIDTH / GRID_SIZE);
export const GRID_ROWS = Math.floor(CANVAS_HEIGHT / GRID_SIZE);

export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER = "GAME_OVER";
export const PHASE_LEVEL_COMPLETE = "LEVEL_COMPLETE";
export const PHASE_WIN_GAME = "WIN_GAME";

export const ROOM_CLEAN = "CLEAN";
export const ROOM_DIRTY = "DIRTY";
export const ROOM_OCCUPIED = "OCCUPIED";

export const GUEST_WAITING = "WAITING";
export const GUEST_CHECKED_IN = "CHECKED_IN";
export const GUEST_CHECKING_OUT = "CHECKING_OUT";
export const GUEST_PAID = "PAID";
export const GUEST_LEFT_UNHAPPY = "LEFT_UNHAPPY";

export const STAFF_CLEANER = "CLEANER";
export const STAFF_RECEPTIONIST = "RECEPTIONIST";

export const gameState = {
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  player: null,
  entities: [],
  rooms: [],
  guests: [],
  staff: [],
  currentLevel: 1,
  score: 0,
  highScore: 0,
  currentMoney: 0,
  totalRevenueEarned: 0,
  levelTimer: 0,
  levelStartTime: 0,
  unhappyGuestCount: 0,
  guestIdCounter: 0,
  staffIdCounter: 0,
  upgrades: {
    playerSpeed: 1,
    playerCleanSpeed: 1,
    playerCheckinSpeed: 1,
    roomCapacity: 0,
    staffCleanSpeed: 1,
    staffCheckinSpeed: 1
  },
  levelComplete: false,
  gameWon: false,
  lastGuestSpawnTime: 0,
  floatingTexts: [],
  testActions: []
};

// Level configurations
export const LEVEL_CONFIGS = [
  {
    level: 1,
    name: "The Cozy Corner Inn",
    timeLimit: 180,
    revenueTarget: 2000,
    guestSpawnInterval: 17500,
    guestImpatience: 0.15,
    rooms: [
      { x: 8, y: 2, w: 4, h: 3 },
      { x: 8, y: 7, w: 4, h: 3 },
      { x: 8, y: 12, w: 4, h: 3 }
    ],
    reception: { x: 1, y: 8, w: 3, h: 2 },
    cashRegister: { x: 1, y: 12, w: 2, h: 2 },
    upgrades: [
      { id: "speed1", name: "Speed +1", cost: 500, type: "playerSpeed" },
      { id: "room1", name: "Room +1", cost: 1000, type: "roomCapacity" }
    ]
  },
  {
    level: 2,
    name: "The Busy Boutique",
    timeLimit: 240,
    revenueTarget: 4000,
    guestSpawnInterval: 12500,
    guestImpatience: 0.2,
    rooms: [
      { x: 8, y: 1, w: 4, h: 3 },
      { x: 8, y: 5, w: 4, h: 3 },
      { x: 8, y: 9, w: 4, h: 3 },
      { x: 8, y: 13, w: 4, h: 3 },
      { x: 15, y: 5, w: 4, h: 3 }
    ],
    reception: { x: 1, y: 8, w: 3, h: 2 },
    cashRegister: { x: 1, y: 13, w: 2, h: 2 },
    staffRoom: { x: 22, y: 1, w: 3, h: 3 },
    upgrades: [
      { id: "speed2", name: "Speed +1", cost: 800, type: "playerSpeed" },
      { id: "clean1", name: "Clean +20%", cost: 1200, type: "cleanSpeed" },
      { id: "staff1", name: "Hire Cleaner", cost: 1500, type: "staffCleaner" }
    ]
  },
  {
    level: 3,
    name: "The Grand Getaway",
    timeLimit: 300,
    revenueTarget: 7500,
    guestSpawnInterval: 10000,
    guestImpatience: 0.25,
    rooms: [
      { x: 8, y: 1, w: 4, h: 3 },
      { x: 8, y: 5, w: 4, h: 3 },
      { x: 8, y: 9, w: 4, h: 3 },
      { x: 8, y: 13, w: 4, h: 3 },
      { x: 15, y: 1, w: 4, h: 3 },
      { x: 15, y: 5, w: 4, h: 3 },
      { x: 15, y: 9, w: 4, h: 3 },
      { x: 15, y: 13, w: 4, h: 3 }
    ],
    reception: { x: 1, y: 6, w: 3, h: 2 },
    cashRegister: { x: 1, y: 13, w: 2, h: 2 },
    staffRoom: { x: 22, y: 1, w: 3, h: 3 },
    upgrades: [
      { id: "speed3", name: "Speed +1", cost: 1500, type: "playerSpeed" },
      { id: "clean2", name: "Clean +20%", cost: 2000, type: "cleanSpeed" },
      { id: "checkin1", name: "Checkin +20%", cost: 2000, type: "checkinSpeed" },
      { id: "staff2", name: "Hire Receptionist", cost: 2500, type: "staffReceptionist" }
    ]
  },
  {
    level: 4,
    name: "The Five-Star Palace",
    timeLimit: 360,
    revenueTarget: 12000,
    guestSpawnInterval: 7500,
    guestImpatience: 0.3,
    rooms: [
      { x: 6, y: 1, w: 4, h: 3 },
      { x: 6, y: 5, w: 4, h: 3 },
      { x: 6, y: 9, w: 4, h: 3 },
      { x: 6, y: 13, w: 4, h: 3 },
      { x: 13, y: 1, w: 4, h: 3 },
      { x: 13, y: 5, w: 4, h: 3 },
      { x: 13, y: 9, w: 4, h: 3 },
      { x: 13, y: 13, w: 4, h: 3 },
      { x: 20, y: 1, w: 4, h: 3 },
      { x: 20, y: 5, w: 4, h: 3 },
      { x: 20, y: 9, w: 4, h: 3 },
      { x: 20, y: 13, w: 4, h: 3 }
    ],
    reception: { x: 1, y: 6, w: 3, h: 2 },
    cashRegister: { x: 1, y: 13, w: 2, h: 2 },
    staffRoom: { x: 26, y: 1, w: 3, h: 3 },
    upgrades: [
      { id: "speed4", name: "Speed +1", cost: 3000, type: "playerSpeed" },
      { id: "allstaff", name: "All Staff +30%", cost: 4000, type: "allStaffSpeed" },
      { id: "room2", name: "Rooms +2", cost: 3500, type: "roomCapacity" },
      { id: "staff3", name: "Hire Cleaner 2", cost: 3500, type: "staffCleaner" }
    ]
  }
];

export function getCurrentLevelConfig() {
  return LEVEL_CONFIGS[gameState.currentLevel - 1];
}