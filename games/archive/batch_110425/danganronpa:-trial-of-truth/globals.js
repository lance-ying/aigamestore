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

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  
  // Game-specific state
  influencePoints: 5,
  maxInfluencePoints: 5,
  truthBullets: [],
  selectedBulletIndex: 0,
  statements: [],
  contradictionsExposed: 0,
  requiredContradictions: 5,
  statementSpeed: 1,
  trialPhase: 1,
  lastShotTime: 0,
  shotCooldown: 500,
  
  // Player position for bullet firing
  playerX: CANVAS_WIDTH / 2,
  playerY: CANVAS_HEIGHT - 80,
  
  // Bullet projectiles
  firedBullets: [],
  
  // Visual effects
  effects: [],
  
  // Time tracking
  frameCount: 0,
  gameStartTime: 0
};

// Initialize global access
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
  window.setControlMode = (mode) => {
    gameState.controlMode = mode;
    // Update button states
    const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn', 'test_4_ModeBtn'];
    buttons.forEach(btnId => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.classList.toggle('active', btnId === (mode === 'HUMAN' ? 'humanModeBtn' : `${mode.toLowerCase()}_ModeBtn`));
      }
    });
  };
}