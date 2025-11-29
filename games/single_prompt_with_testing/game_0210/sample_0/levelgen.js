// Level generation and management
import { gameState, LEVEL_WIDTH, LEVEL_HEIGHT, TILE_SIZE } from './globals.js';
import { Platform, Spike, Checkpoint, CrewMember, MovingPlatform, LevelExit } from './entities.js';

// Level templates with difficulty progression
const levelTemplates = [
  // EASY LEVELS (1-3)
  {
    difficulty: 'easy',
    platforms: [
      { x: 0, y: 380, width: 600, height: 20 }, // Floor
      { x: 0, y: 0, width: 600, height: 20 }, // Ceiling
      { x: 200, y: 280, width: 150, height: 20 },
      { x: 450, y: 200, width: 150, height: 20 }
    ],
    spikes: [
      { x: 350, y: 360, width: 50, height: 20, direction: 'up' }
    ],
    checkpoints: [{ x: 220, y: 240 }],
    crew: { x: 480, y: 160, name: 'Violet' },
    exit: { x: 550, y: 160 }
  },
  {
    difficulty: 'easy',
    platforms: [
      { x: 0, y: 380, width: 200, height: 20 },
      { x: 250, y: 320, width: 100, height: 20 },
      { x: 400, y: 260, width: 200, height: 20 },
      { x: 0, y: 0, width: 600, height: 20 }
    ],
    spikes: [
      { x: 200, y: 360, width: 50, height: 20, direction: 'up' }
    ],
    checkpoints: [{ x: 420, y: 220 }],
    crew: null,
    exit: { x: 550, y: 220 }
  },
  {
    difficulty: 'easy',
    platforms: [
      { x: 0, y: 380, width: 150, height: 20 },
      { x: 200, y: 280, width: 100, height: 20 },
      { x: 350, y: 200, width: 100, height: 20 },
      { x: 500, y: 280, width: 100, height: 20 },
      { x: 0, y: 0, width: 600, height: 20 }
    ],
    spikes: [
      { x: 150, y: 360, width: 50, height: 20, direction: 'up' },
      { x: 300, y: 260, width: 50, height: 20, direction: 'up' }
    ],
    checkpoints: [{ x: 370, y: 160 }],
    crew: { x: 520, y: 240, name: 'Vitellary' },
    exit: { x: 50, y: 340 }
  },
  
  // MEDIUM LEVELS (4-6)
  {
    difficulty: 'medium',
    platforms: [
      { x: 0, y: 380, width: 100, height: 20 },
      { x: 500, y: 380, width: 100, height: 20 },
      { x: 0, y: 0, width: 600, height: 20 }
    ],
    movingPlatforms: [
      { x: 150, y: 320, width: 80, height: 10, startX: 150, endX: 370, startY: 320, endY: 320, speed: 0.025 }
    ],
    spikes: [
      { x: 100, y: 360, width: 400, height: 20, direction: 'up' },
      { x: 150, y: 20, width: 300, height: 20, direction: 'down' }
    ],
    checkpoints: [{ x: 520, y: 340 }],
    crew: { x: 30, y: 340, name: 'Vermillion' },
    exit: { x: 550, y: 340 }
  },
  {
    difficulty: 'medium',
    platforms: [
      { x: 0, y: 380, width: 600, height: 20 },
      { x: 0, y: 0, width: 600, height: 20 },
      { x: 100, y: 280, width: 80, height: 20 },
      { x: 420, y: 280, width: 80, height: 20 }
    ],
    spikes: [
      { x: 180, y: 360, width: 60, height: 20, direction: 'up' },
      { x: 280, y: 20, width: 60, height: 20, direction: 'down' },
      { x: 360, y: 360, width: 60, height: 20, direction: 'up' }
    ],
    checkpoints: [{ x: 440, y: 240 }],
    crew: null,
    exit: { x: 550, y: 340 }
  },
  {
    difficulty: 'medium',
    platforms: [
      { x: 0, y: 380, width: 120, height: 20 },
      { x: 200, y: 300, width: 100, height: 20 },
      { x: 380, y: 220, width: 100, height: 20 },
      { x: 200, y: 140, width: 100, height: 20 },
      { x: 480, y: 380, width: 120, height: 20 }
    ],
    spikes: [
      { x: 120, y: 360, width: 80, height: 20, direction: 'up' },
      { x: 300, y: 280, width: 80, height: 20, direction: 'up' },
      { x: 200, y: 120, width: 100, height: 20, direction: 'up' }
    ],
    checkpoints: [{ x: 400, y: 180 }],
    crew: { x: 520, y: 340, name: 'Victoria' },
    exit: { x: 50, y: 340 }
  },
  
  // HARD LEVELS (7-9)
  {
    difficulty: 'hard',
    platforms: [
      { x: 0, y: 380, width: 80, height: 20 },
      { x: 140, y: 340, width: 60, height: 20 },
      { x: 260, y: 300, width: 60, height: 20 },
      { x: 380, y: 260, width: 60, height: 20 },
      { x: 500, y: 220, width: 100, height: 20 },
      { x: 0, y: 0, width: 600, height: 20 }
    ],
    spikes: [
      { x: 80, y: 360, width: 60, height: 20, direction: 'up' },
      { x: 200, y: 320, width: 60, height: 20, direction: 'up' },
      { x: 320, y: 280, width: 60, height: 20, direction: 'up' },
      { x: 440, y: 240, width: 60, height: 20, direction: 'up' },
      { x: 500, y: 20, width: 100, height: 20, direction: 'down' }
    ],
    checkpoints: [{ x: 520, y: 180 }],
    crew: { x: 30, y: 340, name: 'Verdigris' },
    exit: { x: 550, y: 180 }
  },
  {
    difficulty: 'hard',
    platforms: [
      { x: 0, y: 380, width: 100, height: 20 },
      { x: 500, y: 380, width: 100, height: 20 },
      { x: 0, y: 0, width: 600, height: 20 },
      { x: 250, y: 200, width: 100, height: 20 }
    ],
    movingPlatforms: [
      { x: 120, y: 340, width: 60, height: 10, startX: 120, endX: 420, startY: 340, endY: 340, speed: 0.035 },
      { x: 120, y: 100, width: 60, height: 10, startX: 120, endX: 420, startY: 100, endY: 100, speed: 0.04 }
    ],
    spikes: [
      { x: 100, y: 360, width: 400, height: 20, direction: 'up' },
      { x: 100, y: 20, width: 400, height: 20, direction: 'down' },
      { x: 250, y: 180, width: 100, height: 20, direction: 'up' }
    ],
    checkpoints: [{ x: 520, y: 340 }],
    crew: null,
    exit: { x: 550, y: 340 }
  },
  {
    difficulty: 'hard',
    platforms: [
      { x: 0, y: 380, width: 600, height: 20 },
      { x: 0, y: 0, width: 600, height: 20 }
    ],
    spikes: [
      { x: 100, y: 360, width: 40, height: 20, direction: 'up' },
      { x: 180, y: 20, width: 40, height: 20, direction: 'down' },
      { x: 260, y: 360, width: 40, height: 20, direction: 'up' },
      { x: 340, y: 20, width: 40, height: 20, direction: 'down' },
      { x: 420, y: 360, width: 40, height: 20, direction: 'up' },
      { x: 500, y: 20, width: 40, height: 20, direction: 'down' }
    ],
    checkpoints: [{ x: 550, y: 340 }],
    crew: { x: 30, y: 340, name: 'Violet' },
    exit: { x: 550, y: 340 }
  }
];

export function generateLevel() {
  // Clear existing level data
  gameState.platforms = [];
  gameState.spikes = [];
  gameState.checkpoints = [];
  gameState.crewMembers = [];
  gameState.levels.clear();
  gameState.levelExit = null;
  
  // Generate all 9 levels
  for (let i = 0; i < gameState.totalLevels; i++) {
    const levelNum = i + 1;
    createLevel(levelNum, levelTemplates[i]);
  }
  
  // Set initial level
  gameState.currentLevel = 1;
}

function createLevel(levelNum, template) {
  const level = {
    number: levelNum,
    difficulty: template.difficulty,
    platforms: [],
    spikes: [],
    checkpoints: [],
    crew: null,
    movingPlatforms: [],
    exit: null
  };
  
  // Create platforms
  for (const p of template.platforms) {
    const platform = new Platform(p.x, p.y, p.width, p.height);
    level.platforms.push(platform);
  }
  
  // Create moving platforms
  if (template.movingPlatforms) {
    for (const mp of template.movingPlatforms) {
      const movingPlatform = new MovingPlatform(
        mp.x, mp.y, mp.width, mp.height,
        mp.startX, mp.endX, mp.startY, mp.endY, mp.speed
      );
      level.movingPlatforms.push(movingPlatform);
    }
  }
  
  // Create spikes
  for (const s of template.spikes) {
    const spike = new Spike(s.x, s.y, s.width, s.height, s.direction);
    level.spikes.push(spike);
  }
  
  // Create checkpoints
  for (const c of template.checkpoints) {
    const checkpoint = new Checkpoint(c.x, c.y);
    level.checkpoints.push(checkpoint);
  }
  
  // Create crew member
  if (template.crew) {
    const crew = new CrewMember(template.crew.x, template.crew.y, template.crew.name);
    level.crew = crew;
  }
  
  // Create level exit
  if (template.exit) {
    const exit = new LevelExit(template.exit.x, template.exit.y);
    level.exit = exit;
  }
  
  gameState.levels.set(levelNum, level);
}

export function loadLevel(levelNum) {
  const level = gameState.levels.get(levelNum);
  
  if (!level) {
    console.error(`Level ${levelNum} not found`);
    return;
  }
  
  // Clear current entities
  gameState.platforms = [];
  gameState.spikes = [];
  gameState.checkpoints = [];
  gameState.crewMembers = [];
  gameState.levelExit = null;
  
  // Load level entities
  gameState.platforms = [...level.platforms];
  gameState.spikes = [...level.spikes];
  gameState.checkpoints = [...level.checkpoints];
  
  // Add moving platforms
  for (const mp of level.movingPlatforms) {
    gameState.platforms.push(mp);
  }
  
  // Load crew member
  if (level.crew && !level.crew.collected) {
    gameState.crewMembers.push(level.crew);
  }
  
  // Load exit
  if (level.exit) {
    gameState.levelExit = level.exit;
  }
  
  gameState.currentLevel = levelNum;
}

export function advanceToNextLevel() {
  if (gameState.currentLevel < gameState.totalLevels) {
    gameState.currentLevel++;
    loadLevel(gameState.currentLevel);
    
    // Reset player position
    if (gameState.player) {
      gameState.player.x = 50;
      gameState.player.y = 350;
      gameState.player.vx = 0;
      gameState.player.vy = 0;
      gameState.player.gravityDirection = 1;
      
      // Update last checkpoint
      gameState.lastCheckpoint = {
        x: 50,
        y: 350,
        level: gameState.currentLevel
      };
    }
    
    // Transition effect
    gameState.transitioning = true;
    gameState.transitionTimer = 30;
  } else {
    // All levels completed
    gameState.gamePhase = "GAME_OVER_WIN";
  }
}

export function getCurrentLevel() {
  return gameState.levels.get(gameState.currentLevel);
}