import { gameState, GAME_PHASES, CANNON_CONFIG } from './globals.js';
import { deployChampion, fireCannon } from './game_logic.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // Handle control mode inputs
  if (gameState.controlMode === "HUMAN") {
    handleHumanInput(p, key, keyCode, true);
  }
}

export function handleKeyReleased(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyReleased",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function handleHumanInput(p, key, keyCode, isPressed) {
  if (!isPressed) return;

  // Game phase controls
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame(p);
    }
  } else if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      pauseGame(p);
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      resumeGame(p);
    }
  } else if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      restartGame(p);
    }
  }

  // Gameplay controls
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    if (keyCode === 32) { // SPACE
      fireCannon(p);
    } else if (keyCode === 16) { // SHIFT
      deployChampion(p, 'tank');
    } else if (keyCode === 90) { // Z
      deployChampion(p, 'speed');
    }
  }
}

export function handleContinuousInput(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  if (gameState.controlMode !== "HUMAN") return;

  // Cannon rotation
  if (p.keyIsDown(37)) { // Arrow Left
    gameState.cannonAngle -= CANNON_CONFIG.rotationSpeed;
    if (gameState.cannonAngle < CANNON_CONFIG.minAngle) {
      gameState.cannonAngle = CANNON_CONFIG.minAngle;
    }
  }
  if (p.keyIsDown(39)) { // Arrow Right
    gameState.cannonAngle += CANNON_CONFIG.rotationSpeed;
    if (gameState.cannonAngle > CANNON_CONFIG.maxAngle) {
      gameState.cannonAngle = CANNON_CONFIG.maxAngle;
    }
  }
}

function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  gameState.currentLevel = 1;
  initializeLevel(p);
  
  p.logs.game_info.push({
    data: { phase: gameState.gamePhase, level: gameState.currentLevel },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function pauseGame(p) {
  gameState.gamePhase = GAME_PHASES.PAUSED;
  
  p.logs.game_info.push({
    data: { phase: gameState.gamePhase },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resumeGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  
  p.logs.game_info.push({
    data: { phase: gameState.gamePhase },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function restartGame(p) {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.score = 0;
  gameState.currentLevel = 1;
  
  p.logs.game_info.push({
    data: { phase: gameState.gamePhase },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function initializeLevel(p) {
  const { LEVEL_CONFIGS } = require('./globals.js');
  gameState.levelConfig = LEVEL_CONFIGS[gameState.currentLevel - 1];
  gameState.levelTimer = gameState.levelConfig.timeLimit;
  gameState.levelStartTime = Date.now();
  gameState.projectiles = [];
  gameState.mobUnits = [];
  gameState.champions = [];
  gameState.championCooldowns = { tank: 0, speed: 0 };
  
  // Initialize level entities
  const { EnemyBase, Gate } = require('./entities.js');
  gameState.enemyBase = new EnemyBase(p);
  
  gameState.gates = gameState.levelConfig.gates.map(g => 
    new Gate(p, g.x, g.y, g.width, g.height, g.multiplier)
  );
  
  gameState.obstacles = gameState.levelConfig.obstacles.map(o => ({...o}));
  gameState.speedBoostZones = gameState.levelConfig.speedBoostZones.map(z => ({...z}));
}

// Required to handle circular dependencies
let requireCache = null;
function require(module) {
  if (!requireCache) {
    requireCache = {
      './globals.js': { LEVEL_CONFIGS: null },
      './entities.js': { EnemyBase: null, Gate: null }
    };
    
    import('./globals.js').then(m => {
      requireCache['./globals.js'].LEVEL_CONFIGS = m.LEVEL_CONFIGS;
    });
    import('./entities.js').then(m => {
      requireCache['./entities.js'].EnemyBase = m.EnemyBase;
      requireCache['./entities.js'].Gate = m.Gate;
    });
  }
  return requireCache[module];
}