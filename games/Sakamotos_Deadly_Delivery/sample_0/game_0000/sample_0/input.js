// input.js - Input handling
import { gameState } from './globals.js';
import { levels } from './levels.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase-specific controls
  if (gameState.gamePhase === 'START') {
    if (keyCode === 13) { // ENTER
      startGame(p);
    }
  } else if (gameState.gamePhase === 'PLAYING') {
    if (keyCode === 27) { // ESC
      pauseGame(p);
    } else if (gameState.designPhase) {
      handleDesignPhaseInput(p, key, keyCode);
    } else if (gameState.simulationRunning) {
      if (keyCode === 32) { // SPACE - stop simulation
        stopSimulation(p);
      }
    }
  } else if (gameState.gamePhase === 'PAUSED') {
    if (keyCode === 27) { // ESC
      unpauseGame(p);
    }
  } else if (gameState.gamePhase === 'GAME_OVER') {
    if (keyCode === 82) { // R
      returnToStart(p);
    }
  }
}

function handleDesignPhaseInput(p, key, keyCode) {
  if (keyCode === 90) { // Z - select block
    gameState.selectedObject = 'block';
  } else if (keyCode === 88) { // X - select ramp
    gameState.selectedObject = 'ramp';
  } else if (keyCode === 37) { // Left arrow - rotate CCW
    gameState.rotationAngle -= Math.PI / 12;
  } else if (keyCode === 39) { // Right arrow - rotate CW
    gameState.rotationAngle += Math.PI / 12;
  } else if (keyCode === 32) { // SPACE - start simulation
    startSimulation(p);
  } else if (keyCode === 16) { // SHIFT - reset level
    resetLevel(p);
  }
}

function startGame(p) {
  gameState.gamePhase = 'PLAYING';
  gameState.currentLevel = 0;
  gameState.totalScore = 0;
  loadLevel(p, 0);
  
  p.logs.game_info.push({
    data: { phase: 'PLAYING', level: 1 },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function pauseGame(p) {
  gameState.gamePhase = 'PAUSED';
  p.logs.game_info.push({
    data: { phase: 'PAUSED' },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function unpauseGame(p) {
  gameState.gamePhase = 'PLAYING';
  p.logs.game_info.push({
    data: { phase: 'PLAYING' },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function returnToStart(p) {
  gameState.gamePhase = 'START';
  gameState.currentLevel = 0;
  gameState.totalScore = 0;
  
  p.logs.game_info.push({
    data: { phase: 'START' },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function startSimulation(p) {
  const level = levels[gameState.currentLevel];
  gameState.simulationRunning = true;
  gameState.designPhase = false;
  gameState.timeRemaining = level.maxTime;
  gameState.levelStartTime = Date.now();
  
  // Create and spawn package
  const { Package } = require('./entities.js');
  gameState.player = new Package(level.startPos.x, level.startPos.y);
  gameState.entities.push(gameState.player);
}

function stopSimulation(p) {
  gameState.simulationRunning = false;
  gameState.designPhase = true;
  
  // Remove package
  if (gameState.player && gameState.player.body) {
    const { removeBody } = require('./physics.js');
    removeBody(gameState.player.body);
  }
  gameState.player = null;
  gameState.entities = gameState.entities.filter(e => !(e instanceof require('./entities.js').Package));
}

function resetLevel(p) {
  gameState.resetCount++;
  gameState.firstAttempt = false;
  loadLevel(p, gameState.currentLevel);
}

export function loadLevel(p, levelIndex) {
  const { resetPhysics } = require('./physics.js');
  const { Wall, Spike, Enemy, DestructibleBlock, GoalZone } = require('./entities.js');
  
  resetPhysics();
  
  gameState.currentLevel = levelIndex;
  gameState.designPhase = true;
  gameState.simulationRunning = false;
  gameState.packageInGoal = false;
  gameState.packageInGoalTime = 0;
  gameState.levelComplete = false;
  gameState.levelFailed = false;
  gameState.objectsPlaced = { block: 0, ramp: 0, spring: 0 };
  gameState.rotationAngle = 0;
  gameState.selectedObject = 'block';
  gameState.score = 0;
  gameState.player = null;
  gameState.entities = [];
  
  const level = levels[levelIndex];
  
  // Create walls
  level.walls.forEach(w => {
    const wall = new Wall(w.x, w.y, w.width, w.height);
    gameState.entities.push(wall);
  });
  
  // Create spikes
  level.spikes.forEach(s => {
    const spike = new Spike(s.x, s.y, s.size);
    gameState.entities.push(spike);
  });
  
  // Create enemies
  level.enemies.forEach(e => {
    const enemy = new Enemy(e.x, e.y, e.size, e.type, e.path, e.speed);
    gameState.entities.push(enemy);
  });
  
  // Create destructible blocks
  level.destructibleBlocks.forEach(d => {
    const block = new DestructibleBlock(d.x, d.y, d.width, d.height);
    gameState.entities.push(block);
  });
  
  // Create goal zone
  const goal = new GoalZone(level.goalPos.x, level.goalPos.y, level.goalPos.width, level.goalPos.height);
  gameState.entities.push(goal);
  gameState.goalZone = goal;
  
  p.logs.game_info.push({
    data: { event: 'level_loaded', level: levelIndex + 1 },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function placeObject(p, mouseX, mouseY) {
  if (!gameState.designPhase) return;
  
  const level = levels[gameState.currentLevel];
  const type = gameState.selectedObject;
  const remaining = level.maxObjects[type] - gameState.objectsPlaced[type];
  
  if (remaining <= 0) return;
  
  const { ConstructionObject } = require('./entities.js');
  const obj = new ConstructionObject(type, mouseX, mouseY, gameState.rotationAngle);
  gameState.entities.push(obj);
  gameState.objectsPlaced[type]++;
}