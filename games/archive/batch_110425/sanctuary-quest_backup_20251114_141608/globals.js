// Global constants and game state
export const CANVAS_WIDTH = 900;
export const CANVAS_HEIGHT = 600;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const SCREEN_MODES = {
  BASE: "BASE",
  HEROES: "HEROES",
  DUNGEON: "DUNGEON",
  COMBAT: "COMBAT"
};

export const HERO_CLASSES = [
  { name: "Warrior", health: 100, attack: 15, defense: 10, ability: "Shield Bash", abilityCooldown: 180 },
  { name: "Mage", health: 60, attack: 25, defense: 3, ability: "Fireball", abilityCooldown: 150 },
  { name: "Ranger", health: 70, attack: 20, defense: 5, ability: "Multi-Shot", abilityCooldown: 120 },
  { name: "Cleric", health: 80, attack: 10, defense: 8, ability: "Heal", abilityCooldown: 200 }
];

export const MONSTER_TYPES = [
  { name: "Goblin", health: 30, attack: 8, defense: 2, exp: 10, gold: 5 },
  { name: "Skeleton", health: 40, attack: 12, defense: 4, exp: 15, gold: 8 },
  { name: "Orc", health: 60, attack: 15, defense: 6, exp: 25, gold: 15 },
  { name: "Dark Mage", health: 50, attack: 20, defense: 3, exp: 30, gold: 20 },
  { name: "Troll", health: 100, attack: 18, defense: 10, exp: 40, gold: 25 },
  { name: "Dragon", health: 150, attack: 25, defense: 15, exp: 100, gold: 50 }
];

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  screenMode: SCREEN_MODES.BASE,
  
  // Base management
  population: 10,
  workers: { food: 0, materials: 0 },
  resources: { food: 50, materials: 20 },
  resourceTimer: 0,
  
  // Heroes
  heroes: [],
  selectedHeroIndex: 0,
  party: [], // up to 4 heroes
  
  // Dungeon
  currentZone: 1,
  dungeonMap: [],
  playerX: 0,
  playerY: 0,
  exploredCells: [],
  dungeonProgress: 0,
  
  // Combat
  inCombat: false,
  enemies: [],
  combatLog: [],
  selectedPartyMember: 0,
  turnTimer: 0,
  
  // Progression
  score: 0,
  experience: 0,
  gold: 0,
  arenaUnlocked: false,
  
  // UI state
  menuSelection: 0,
  menuOptions: [],
  menuScrollOffset: 0,
  actionFeedback: { message: "", timer: 0, type: "info" }, // type: "success", "error", "info"
  
  // Visual effects
  floatingTexts: [], // { x, y, text, timer, color, vx, vy }
  particles: [], // { x, y, vx, vy, size, color, timer }
  flashEffects: [], // { target: "hero_0" | "enemy_1", timer, color }
  resourceAnimations: { food: 0, materials: 0 }, // pulse timers
  
  // Testing
  testingState: {
    actionQueue: [],
    waitFrames: 0,
    phase: "INIT"
  }
};

// Function to expose game state
export function getGameState() {
  return gameState;
}

// Visual effect helpers
export function addFloatingText(x, y, text, color = [255, 255, 255]) {
  gameState.floatingTexts.push({
    x: x,
    y: y,
    text: text,
    timer: 60,
    color: color,
    vx: (Math.random() - 0.5) * 2,
    vy: -2
  });
}

export function addParticles(x, y, count, color) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    gameState.particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 4 + 2,
      color: color,
      timer: 30 + Math.random() * 30
    });
  }
}

export function addFlashEffect(target, color = [255, 255, 255]) {
  gameState.flashEffects.push({
    target: target,
    timer: 15,
    color: color
  });
}

export function triggerResourceAnimation(type) {
  gameState.resourceAnimations[type] = 30;
}

// Attach to window
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
  window.addFloatingText = addFloatingText;
  window.addParticles = addParticles;
  window.addFlashEffect = addFlashEffect;
  window.triggerResourceAnimation = triggerResourceAnimation;
}