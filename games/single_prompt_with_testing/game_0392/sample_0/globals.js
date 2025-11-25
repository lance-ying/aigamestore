// Global constants and game state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GAME_AREA_WIDTH = 400;
export const GAME_AREA_X = 20;
export const FPS = 60;

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
  bullets: [],
  enemyBullets: [],
  items: [],
  particles: [],
  enemies: [],
  ufos: [],
  score: 0,
  lives: 3,
  spellCards: 2,
  power: 1.0,
  maxPower: 4.0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  venturer: { red: 0, blue: 0, green: 0 },
  venturerMax: 3,
  wave: 0,
  waveTimer: 0,
  maxWave: 5,
  pointItemValue: 1000,
  maxPointItemValue: 10000,
  lifeFragments: 0,
  spellFragments: 0,
  invincibilityTimer: 0,
  ufoActive: false,
  frameCount: 0
};

// Control mode switching
export function setControlMode(mode) {
  gameState.controlMode = mode;
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn', 'test_4_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  const activeBtn = document.getElementById(`${mode === 'HUMAN' ? 'humanMode' : mode.toLowerCase()}Btn`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
}

window.setControlMode = setControlMode;

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;