import { gameState, GAME_PHASES, LEVEL_CONFIGS } from './globals.js';
import { fireCannon, deployChampion } from './game_logic.js';
import { EnemyBase, Gate } from './entities.js';

export function handleTestingMode(p) {
  if (gameState.controlMode === "HUMAN") return;

  if (gameState.controlMode === "TEST_1") {
    runBasicTest(p);
  } else if (gameState.controlMode === "TEST_2") {
    runWinTest(p);
  }
}

function runBasicTest(p) {
  // Auto-start
  if (gameState.gamePhase === GAME_PHASES.START && p.frameCount > 60) {
    gameState.gamePhase = GAME_PHASES.PLAYING;
    gameState.currentLevel = 1;
    initializeLevelForTest(p);
  }

  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    // Fire periodically
    if (p.frameCount % 120 === 0) {
      fireCannon(p);
    }

    // Rotate cannon
    if (p.frameCount % 60 < 30) {
      gameState.cannonAngle -= 0.01;
    } else {
      gameState.cannonAngle += 0.01;
    }

    // Deploy champions
    if (p.frameCount % 300 === 0 && gameState.championCooldowns.tank <= 0) {
      deployChampion(p, 'tank');
    }
  }
}

function runWinTest(p) {
  // Auto-start
  if (gameState.gamePhase === GAME_PHASES.START && p.frameCount > 60) {
    gameState.gamePhase = GAME_PHASES.PLAYING;
    gameState.currentLevel = 1;
    initializeLevelForTest(p);
  }

  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    // Aggressive firing
    if (p.frameCount % 30 === 0) {
      fireCannon(p);
    }

    // Smart aiming - target gates
    if (gameState.gates && gameState.gates.length > 0) {
      const targetGate = gameState.gates[p.frameCount % gameState.gates.length];
      const targetAngle = Math.atan2(
        targetGate.y - 370,
        targetGate.x + targetGate.width / 2 - 300
      );
      gameState.cannonAngle = targetAngle;
    }

    // Deploy champions aggressively
    if (p.frameCount % 200 === 0) {
      if (gameState.championCooldowns.tank <= 0) {
        deployChampion(p, 'tank');
      }
      if (gameState.championCooldowns.speed <= 0) {
        deployChampion(p, 'speed');
      }
    }
  }
}

function initializeLevelForTest(p) {
  gameState.levelConfig = LEVEL_CONFIGS[gameState.currentLevel - 1];
  gameState.levelTimer = gameState.levelConfig.timeLimit;
  gameState.levelStartTime = Date.now();
  gameState.projectiles = [];
  gameState.mobUnits = [];
  gameState.champions = [];
  gameState.championCooldowns = { tank: 0, speed: 0 };
  
  gameState.enemyBase = new EnemyBase(p);
  
  gameState.gates = gameState.levelConfig.gates.map(g => 
    new Gate(p, g.x, g.y, g.width, g.height, g.multiplier)
  );
  
  gameState.obstacles = gameState.levelConfig.obstacles.map(o => ({...o}));
  gameState.speedBoostZones = gameState.levelConfig.speedBoostZones.map(z => ({...z}));
}