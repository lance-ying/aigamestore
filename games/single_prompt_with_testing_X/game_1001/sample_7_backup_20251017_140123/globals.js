export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_CONFIG = {
  SAFE_ZONE_DISTANCE: 5000,
  INITIAL_FUEL: 100,
  INITIAL_ARMOR: 100,
  FUEL_CONSUMPTION_RATE: 0.02,
  BOOST_FUEL_RATE: 0.15,
  DAMAGE_FROM_COLLISION: 5,
  ZOMBIE_SPAWN_RATE: 0.03,
  OBSTACLE_SPAWN_RATE: 0.02,
  FUEL_PICKUP_SPAWN_RATE: 0.005,
  ARMOR_PICKUP_SPAWN_RATE: 0.003,
  MAX_ENTITIES_ON_SCREEN: 50,
  CAMERA_FOLLOW_SPEED: 0.1
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  distance: 0,
  fuel: GAME_CONFIG.INITIAL_FUEL,
  armor: GAME_CONFIG.INITIAL_ARMOR,
  gamePhase: "START",
  controlMode: "HUMAN",
  engine: null,
  world: null,
  cameraX: 0,
  lastPlayerLogX: 0,
  lastPlayerLogY: 0,
  bullets: [],
  backgroundObjects: [],
  damageFlash: 0
};

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;

export function setControlMode(mode) {
  gameState.controlMode = mode;
  updateControlButtonStyles();
}

function updateControlButtonStyles() {
  const buttons = {
    'HUMAN': document.getElementById('humanModeBtn'),
    'TEST_1': document.getElementById('test_1_ModeBtn'),
    'TEST_2': document.getElementById('test_2_ModeBtn')
  };
  
  Object.keys(buttons).forEach(mode => {
    if (buttons[mode]) {
      if (mode === gameState.controlMode) {
        buttons[mode].classList.add('active');
      } else {
        buttons[mode].classList.remove('active');
      }
    }
  });
}

window.setControlMode = setControlMode;