import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Bodies, Composite } = Matter;

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { createPhysicsEngine, setupCollisionEvents, clearWorld } from './physics.js';
import { createLetterBody } from './letter_geometry.js';
import { Target, Obstacle } from './entities.js';
import { LEVELS } from './levels.js';
import { renderGame, renderStartScreen, renderGameOver } from './renderer.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize Physics
    gameState.engine = createPhysicsEngine();
    gameState.world = gameState.engine.world;
    setupCollisionEvents(gameState.engine);
    
    // Initialize Logs
    p.logs = { game_info: [], player_info: [], inputs: [] };
    
    logInfo(p, "GAME_INIT", { status: "ready" });
  };

  p.draw = function() {
    const now = p.millis();
    gameState.deltaTime = (now - gameState.lastFrameTime) / 1000;
    gameState.lastFrameTime = now;
    gameState.frameCount = p.frameCount;
    
    // Update State
    updateGameLogic(p);
    
    // Render
    switch (gameState.gamePhase) {
      case "START":
        renderStartScreen(p);
        break;
      case "PLAYING":
      case "PAUSED":
        renderGame(p);
        break;
      case "GAME_OVER_WIN":
        renderGameOver(p, true);
        break;
      case "GAME_OVER_LOSE":
        renderGameOver(p, false);
        break;
    }

    // Auto-test runner
    runAutomatedTests(p);
  };

  p.keyPressed = function() {
    // Log Input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    // Global Controls
    if (p.keyCode === 27) { // ESC
      togglePause(p);
      return false;
    }

    // Phase Specific
    if (gameState.gamePhase === "START") {
      if (p.keyCode === 13) { // ENTER
        loadLevel(p, 0);
        gameState.gamePhase = "PLAYING";
        logInfo(p, "PHASE_CHANGE", { phase: "PLAYING" });
      }
    } else if (gameState.gamePhase === "PLAYING") {
      handlePlayingInput(p);
    } else if (gameState.gamePhase.startsWith("GAME_OVER")) {
      if (p.keyCode === 82) { // R
        resetGame(p);
      }
    }
    
    return false; // Prevent default
  };
});

function updateGameLogic(p) {
  if (gameState.gamePhase === "PLAYING" || gameState.gamePhase === "PAUSED") {
    // Physics Step (always update unless paused)
    if (gameState.gamePhase !== "PAUSED" && gameState.isSimulating) {
      Engine.update(gameState.engine, 1000 / 60);
      
      // Check Level Completion
      checkWinCondition(p);
      
      // Check bodies out of bounds (simple cleanup)
      cleanupBounds();
    }
  }
}

function handlePlayingInput(p) {
  // If simulating, only R (Reset Level) is allowed
  if (gameState.isSimulating) {
    if (p.keyCode === 82) { // R
      resetLevel(p);
    }
    return;
  }
  
  // Typing Mode
  if (p.keyCode === 13) { // ENTER
    startSimulation(p);
  } else if (p.keyCode === 8) { // BACKSPACE
    gameState.inputString = gameState.inputString.slice(0, -1);
  } else if (p.key.length === 1 && /[a-z ]/i.test(p.key)) {
    // Limit string length to avoid overflow
    if (gameState.inputString.length < 20) {
      gameState.inputString += p.key;
    }
  }
}

function startSimulation(p) {
  if (gameState.inputString.trim().length === 0) return;
  
  gameState.isSimulating = true;
  spawnLetters(p);
  logInfo(p, "SIMULATION_START", { input: gameState.inputString });
}

function spawnLetters(p) {
  const level = LEVELS[gameState.currentLevelIndex];
  const charWidth = 25; // Spacing
  let startX = level.spawnXStart;
  const startY = level.spawnY;
  
  for (let i = 0; i < gameState.inputString.length; i++) {
    const char = gameState.inputString[i];
    if (char === " ") {
      startX += charWidth;
      continue;
    }
    
    const bodies = createLetterBody(startX, startY, char);
    
    bodies.forEach(b => {
      World.add(gameState.world, b);
      gameState.activeBodies.push(b);
    });
    
    startX += charWidth;
  }
}

function loadLevel(p, index) {
  if (index >= LEVELS.length) {
    gameState.gamePhase = "GAME_OVER_WIN";
    logInfo(p, "GAME_COMPLETE", { score: gameState.score });
    return;
  }
  
  // Reset physics world
  clearWorld(gameState.world);
  gameState.activeBodies = [];
  gameState.obstacles = [];
  gameState.targets = [];
  gameState.currentLevelIndex = index;
  gameState.isSimulating = false;
  gameState.inputString = "";
  
  const levelData = LEVELS[index];
  
  // Create Obstacles
  levelData.obstacles.forEach(obs => {
    const o = new Obstacle(p, obs.x, obs.y, obs.w, obs.h, obs.angle || 0, obs);
    gameState.obstacles.push(o);
  });
  
  // Create Targets
  levelData.targets.forEach(t => {
    const target = new Target(p, t.x, t.y);
    gameState.targets.push(target);
  });
  
  logInfo(p, "LEVEL_LOAD", { level: index });
}

function resetLevel(p) {
  loadLevel(p, gameState.currentLevelIndex);
}

function resetGame(p) {
  gameState.score = 0;
  loadLevel(p, 0);
  gameState.gamePhase = "START";
}

function checkWinCondition(p) {
  // Check if all targets collected
  const allCollected = gameState.targets.every(t => t.collected);
  if (allCollected && gameState.targets.length > 0) {
    // Success!
    gameState.score += 100;
    logInfo(p, "LEVEL_COMPLETE", { level: gameState.currentLevelIndex });
    
    // Short delay before next level? For now instant.
    setTimeout(() => {
       loadLevel(p, gameState.currentLevelIndex + 1);
    }, 1000);
    
    // To prevent multiple triggers, we could pause simulation or empty targets array immediately
    // For this implementation, the level reload handles it.
    // However, since this runs every frame, we need a flag "levelTransitioning"
    // For simplicity, we just clear targets now to stop re-triggering
    gameState.targets = []; 
  }
}

function cleanupBounds() {
  // Remove bodies that fall too far
  for (let i = gameState.activeBodies.length - 1; i >= 0; i--) {
    const body = gameState.activeBodies[i];
    if (body.position.y > CANVAS_HEIGHT + 200) {
      World.remove(gameState.world, body);
      gameState.activeBodies.splice(i, 1);
    }
  }
}

function togglePause(p) {
  if (gameState.gamePhase === "PLAYING") {
    gameState.gamePhase = "PAUSED";
  } else if (gameState.gamePhase === "PAUSED") {
    gameState.gamePhase = "PLAYING";
  }
}

function logInfo(p, type, data) {
  p.logs.game_info.push({
    game_status: gameState.gamePhase,
    event_type: type,
    data: data,
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

// Automated Testing System
let testState = {
  active: false,
  timer: 0,
  step: 0
};

function runAutomatedTests(p) {
  if (gameState.controlMode === 'HUMAN') return;
  
  if (!testState.active) {
    testState.active = true;
    testState.timer = p.frameCount;
    testState.step = 0;
    console.log("Starting Auto Test: " + gameState.controlMode);
    
    // Ensure we are in playing mode
    if (gameState.gamePhase === "START") {
      loadLevel(p, 0);
      gameState.gamePhase = "PLAYING";
    }
  }
  
  const elapsed = p.frameCount - testState.timer;
  
  if (gameState.controlMode === 'TEST_1') {
    // Test 1: Drop 'l' on level 1
    if (testState.step === 0 && elapsed > 10) {
       loadLevel(p, 0); // Force level 1
       gameState.inputString = "l";
       testState.step++;
       testState.timer = p.frameCount;
    }
    if (testState.step === 1 && elapsed > 20) {
      startSimulation(p);
      testState.step++;
    }
    // Wait for win
  }
  
  if (gameState.controlMode === 'TEST_2') {
    // Test 2: Roll 'o' on level 2
    if (testState.step === 0 && elapsed > 10) {
      loadLevel(p, 1); // Level 2
      gameState.inputString = "o";
      testState.step++;
      testState.timer = p.frameCount;
    }
    if (testState.step === 1 && elapsed > 20) {
      startSimulation(p);
      testState.step++;
    }
  }

  if (gameState.controlMode === 'TEST_3') {
    // Test 3: Interactions "oo"
    if (testState.step === 0 && elapsed > 10) {
      loadLevel(p, 0);
      gameState.inputString = "oo";
      testState.step++;
      testState.timer = p.frameCount;
    }
    if (testState.step === 1 && elapsed > 20) {
      startSimulation(p);
      testState.step++;
    }
  }
}

// Expose setControlMode
window.setControlMode = (mode) => {
  gameState.controlMode = mode;
  // Reset for clean test state
  if (gameInstance) {
     const p = gameInstance;
     resetGame(p);
     testState.active = false;
  }
};