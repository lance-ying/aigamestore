// input_handler.js - Handle keyboard inputs

import { GAME_PHASES, gameState, CANVAS_HEIGHT } from './globals.js';
import { Cannon, EnemyBase } from './entities.js';
import { generateLevel } from './level_generator.js';
import { fireUnit } from './game_logic.js';

let p5Instance = null;

export function setP5Instance(p) {
  p5Instance = p;
}

export function handleKeyPressed(p) {
  const key = p.key;
  const keyCode = p.keyCode;
  
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase-specific controls
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame(p);
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 82) { // R
    resetToStart(p);
    return;
  }
  
  // Gameplay controls (only during PLAYING)
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  if (keyCode === 90) { // Z - Champion ability
    const { useChampionAbility } = require('./game_logic.js');
    useChampionAbility();
  }
  
  if (keyCode === 16) { // SHIFT - Slow motion
    gameState.slowMotionActive = true;
  }
}

export function handleKeyReleased(p) {
  const key = p.key;
  const keyCode = p.keyCode;
  
  // Log input
  p.logs.inputs.push({
    input_type: "keyReleased",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  if (keyCode === 16) { // SHIFT
    gameState.slowMotionActive = false;
  }
}

export function processGameplayInputs(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  // Handle automated testing
  if (gameState.controlMode !== "HUMAN" && window.get_automated_testing_action) {
    const action = window.get_automated_testing_action(gameState);
    processAction(action, p);
    return;
  }
  
  // Human controls
  if (p.keyIsDown(37)) { // Left arrow
    gameState.cannon.rotate(0.02);
    gameState.cannonAngle = gameState.cannon.angle;
  }
  
  if (p.keyIsDown(39)) { // Right arrow
    gameState.cannon.rotate(-0.02);
    gameState.cannonAngle = gameState.cannon.angle;
  }
  
  if (p.keyIsDown(32)) { // Space - fire
    if (p.frameCount % 3 === 0) { // Fire rate limiting
      fireUnit(gameState.cannon);
      gameState.firingUnits = true;
    }
  } else {
    gameState.firingUnits = false;
  }
}

function processAction(action, p) {
  if (!action) return;
  
  if (action.rotateLeft) {
    gameState.cannon.rotate(0.03);
    gameState.cannonAngle = gameState.cannon.angle;
  }
  
  if (action.rotateRight) {
    gameState.cannon.rotate(-0.03);
    gameState.cannonAngle = gameState.cannon.angle;
  }
  
  if (action.fire) {
    if (p.frameCount % 2 === 0) {
      fireUnit(gameState.cannon);
    }
  }
  
  if (action.useAbility) {
    const { useChampionAbility } = require('./game_logic.js');
    useChampionAbility();
  }
}

function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  gameState.currentLevel = 1;
  
  // Initialize cannon at bottom-left of screen
  gameState.cannon = new Cannon(50, CANVAS_HEIGHT - 50);
  gameState.cannon.angle = -Math.PI / 2; // Point straight up initially
  gameState.cannonAngle = gameState.cannon.angle;
  
  // Generate level
  const level = generateLevel(gameState.currentLevel);
  gameState.gates = level.gates;
  gameState.obstacles = level.obstacles;
  gameState.speedPads = level.speedPads;
  
  // Create enemy base
  gameState.enemyBase = new EnemyBase(550, 150);
  
  // Reset game state
  gameState.units = [];
  gameState.totalUnitsSpawned = 0;
  gameState.unitsReachedBase = 0;
  gameState.unitsLost = 0;
  gameState.score = 0;
  gameState.blueGatesPassed = 0;
  gameState.redGatesPassed = 0;
  gameState.perfectBlueChain = true;
  gameState.obstaclesDestroyed = 0;
  gameState.championAbilityReady = true;
  gameState.championAbilityCooldown = 0;
  gameState.championUsedCount = 0;
  gameState.startTime = Date.now();
  gameState.levelComplete = false;
  
  p.logs.game_info.push({
    data: { gamePhase: gameState.gamePhase, level: gameState.currentLevel },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resetToStart(p) {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.units = [];
  gameState.gates = [];
  gameState.obstacles = [];
  gameState.speedPads = [];
  gameState.enemyBase = null;
  gameState.cannon = null;
  
  p.logs.game_info.push({
    data: { gamePhase: gameState.gamePhase },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}