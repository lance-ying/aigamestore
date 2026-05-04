export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const ITEM_TYPES = {
  SMALL_GOLD: { value: 50, weight: 1, size: 12, color: [255, 215, 0] },
  LARGE_GOLD: { value: 500, weight: 3, size: 20, color: [255, 195, 0] },
  DIAMOND: { value: 600, weight: 1, size: 15, color: [185, 242, 255] },
  ROCK: { value: 10, weight: 4, size: 16, color: [105, 105, 105] }
};

export const gameState = {
  player: null,
  entities: [],
  items: [],
  score: 0,
  gamePhase: "START", // "START", "PLAYING", "GAME_OVER_WIN", "GAME_OVER_LOSE", "PAUSED", "SHOP"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2"
  engine: null,
  world: null,
  level: 1,
  moneyTarget: 500,
  timeLimit: 60,
  timeRemaining: 60,
  claw: null,
  clawState: "SWINGING", // "SWINGING", "DEPLOYED", "RETRACTING", "GRABBED"
  clawSwingDirection: 1,
  clawSwingAngle: 0,
  grabbedItem: null,
  frameCounter: 0,
  lastPlayerLogFrame: 0,
  powerUps: {
    dynamite: 0,
    strength: 0
  },
  strengthActive: false,
  strengthFramesLeft: 0
};

export function getGameState() {
  return gameState;
}

// Expose globally
window.getGameState = getGameState;

// Control mode switching
export function setControlMode(mode) {
  gameState.controlMode = mode;
  updateControlButtons();
}

function updateControlButtons() {
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn'];
  buttons.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const activeBtn = document.getElementById(gameState.controlMode.toLowerCase() + 'ModeBtn');
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
}

window.setControlMode = setControlMode;