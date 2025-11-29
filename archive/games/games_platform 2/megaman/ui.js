import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, ROBOT_MASTERS, WEAPON_DATA } from './globals.js';

export function renderUI(p) {
  if (gameState.gamePhase === GAME_PHASES.START) {
    renderStartScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    renderPlayingUI(p);
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    renderPlayingUI(p);
    renderPauseScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
             gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    renderGameOverScreen(p);
  }
}

function renderStartScreen(p) {
  p.background(20, 30, 50);
  
  // Title
  p.fill(100, 150, 255);
  p.textAlign(p.CENTER);
  p.textSize(32);
  p.text("ROBOT MASTERS", CANVAS_WIDTH / 2, 60);
  
  p.textSize(16);
  p.fill(200, 220, 255);
  p.text("RUN & GUN", CANVAS_WIDTH / 2, 85);
  
  // Instructions
  p.textSize(12);
  p.fill(255);
  p.textAlign(p.LEFT);
  const instructions = [
    "OBJECTIVE:",
    "• Defeat 6 Robot Masters in any order",
    "• Each boss grants a unique weapon",
    "• Exploit boss weaknesses for double damage",
    "• Survive Wily's fortress and boss gauntlet",
    "",
    "CONTROLS:",
    "• Arrow Keys: Move & Aim",
    "• SPACE: Jump",
    "• Z: Shoot",
    "• SHIFT: Cycle Weapons",
    "",
    "TIPS:",
    "• Watch for spike pits - instant death!",
    "• Collect health & weapon energy drops",
    "• Use Magnet Beam to create platforms",
    "• Study boss patterns before attacking"
  ];
  
  let y = 120;
  for (let line of instructions) {
    p.text(line, 80, y);
    y += 16;
  }
  
  // Stage select preview
  p.fill(150, 180, 255);
  p.textSize(10);
  p.textAlign(p.CENTER);
  for (let i = 0; i < 6; i++) {
    const x = 100 + (i % 3) * 140;
    const y = 320 + Math.floor(i / 3) * 30;
    const boss = ROBOT_MASTERS[i];
    p.fill<game_description>
Battle through challenging stages and defeat six Robot Masters in any order! Each boss you conquer grants a unique weapon with limited energy. Use these weapons strategically to exploit enemy weaknesses and overcome obstacles. Master tight platforming over deadly pits and spikes, learn boss attack patterns, and manage your weapon energy wisely. After defeating all six bosses, face the ultimate challenge in Wily's fortress with disappearing platforms and a grueling boss gauntlet!
</game_description>

<game_controls>
Arrow Left/Right: Move left and right
Arrow Up: Aim weapon upward
Arrow Down: Aim weapon downward (when airborne)
Z: Jump
Space: Shoot (hold direction + Space to aim)
Shift: Cycle through unlocked weapons
ENTER: Start game
ESC: Pause/Unpause
R: Restart (return to title screen)
</game_controls>

<code filename="globals.js">
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const CONTROL_MODES = {
  HUMAN: "HUMAN",
  TEST_1: "TEST_1",
  TEST_2: "TEST_2"
};

export const gameState = {
  player: null,
  entities: [],
  gamePhase: GAME_PHASES.START,
  controlMode: CONTROL_MODES.HUMAN,
  camera: { x: 0, y: 0 },
  currentStage: null,
  stageSelectMode: false,
  robotMastersDefeated: {},
  unlockedWeapons: [],
  currentWeapon: 0,
  weaponEnergy: {},
  bossGauntletIndex: 0,
  wilyStagePhase: 0,
  score: 0,
  lives: 3,
  maxLives: 3,
  playerHealth: 28,
  maxPlayerHealth: 28,
  bossHealth: 0,
  maxBossHealth: 28,
  particles: [],
  projectiles: [],
  platformBlocks: [],
  hazards: [],
  enemySpawners: [],
  drops: [],
  showBossHealthBar: false,
  stageComplete: false,
  transitionTimer: 0,
  invincibilityFrames: 0,
  yokublockTimer: 0,
  yokublockPattern: [],
  healingAvailable: false
};

export const ROBOT_MASTERS = [
  { name: "CUT", color: [200, 50, 50], weakness: "BOMB", weapon: "METAL_BLADE" },
  { name: "ELEC", color: [255, 255, 100], weakness: "METAL_BLADE", weapon: "THUNDER_BEAM" },
  { name: "ICE", color: [100, 200, 255], weakness: "THUNDER_BEAM", weapon: "ICE_SLASHER" },
  { name: "BOMB", color: [150, 150, 150], weakness: "ICE_SLASHER", weapon: "HYPER_BOMB" },
  { name: "FIRE", color: [255, 100, 50], weakness: "ICE_SLASHER", weapon: "FIRE_STORM" },
  { name: "TIME", color: [150, 100, 255], weakness: "FIRE_STORM", weapon: "TIME_STOPPER" }
];

export const WEAPONS = {
  BUSTER: { name: "MEGA BUSTER", energy: Infinity, damage: 1, color: [100, 200, 255] },
  METAL_BLADE: { name: "METAL BLADE", energy: 28, damage: 2, color: [200, 200, 200] },
  THUNDER_BEAM: { name: "THUNDER BEAM", energy: 28, damage: 4, color: [255, 255, 100] },
  ICE_SLASHER: { name: "ICE SLASHER", energy: 28, damage: 3, color: [100, 200, 255] },
  HYPER_BOMB: { name: "HYPER BOMB", energy: 28, damage: 5, color: [80, 80, 80] },
  FIRE_STORM: { name: "FIRE STORM", energy: 28, damage: 3, color: [255, 100, 50] },
  TIME_STOPPER: { name: "TIME STOPPER", energy: 28, damage: 1, color: [200, 150, 255] },
  MAGNET_BEAM: { name: "MAGNET BEAM", energy: 28, damage: 0, color: [255, 50, 150] }
};

export function getGameState() {
  return gameState;
}

// Attach to window
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}