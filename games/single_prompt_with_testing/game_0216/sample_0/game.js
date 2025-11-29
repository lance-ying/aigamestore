// game.js - Main game file with p5.js instance

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  initializeRoomStates,
  getGameState,
  ANOMALY_CHECK_INTERVAL,
  BASE_ANOMALY_CHANCE,
  SHIFT_END_HOUR,
  GAME_TIME_SCALE,
  MAX_STRIKES
} from './globals.js';

import { handleKeyPress, handleKeyRelease } from './input.js';

import { 
  renderStartScreen, 
  renderGame, 
  renderPausedOverlay, 
  renderGameOver 
} from './rendering.js';

import { spawnRandomAnomaly } from './entities.js';

import { 
  get_automated_testing_action,
  initializeTesting
} from './automated_testing_controller.js';

// Get p5 from window
const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize game
    gameState.gamePhase = "START";
    gameState.controlMode = "HUMAN";
    
    initializeRoomStates();
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Update frame count
    gameState.frameCount = p.frameCount;
    
    // Update delta time
    const currentTime = p.millis();
    gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
    gameState.lastFrameTime = currentTime;
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === "PLAYING") {
      const action = get_automated_testing_action(gameState);
      if (action) {
        simulateKeyPress(p, action.keyCode);
      }
    }
    
    // Render based on phase
    switch (gameState.gamePhase) {
      case "START":
        renderStartScreen(p);
        break;
        
      case "PLAYING":
        updateGame(p);
        renderGame(p);
        break;
        
      case "PAUSED":
        renderGame(p);
        renderPausedOverlay(p);
        break;
        
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        renderGame(p);
        renderGameOver(p);
        break;
    }
  };
  
  p.keyPressed = function() {
    handleKeyPress(p);
  };
  
  p.keyReleased = function() {
    handleKeyRelease(p);
  };
});

// Simulate key press for automated testing
function simulateKeyPress(p, keyCode) {
  p.keyCode = keyCode;
  handleKeyPress(p);
  
  // Auto-release after a frame
  setTimeout(() => {
    handleKeyRelease(p);
  }, 16);
}

// Update game logic
function updateGame(p) {
  // Update game time
  gameState.gameTime += GAME_TIME_SCALE / 60; // Converts to minutes
  
  // Check win condition (6 AM = 360 minutes)
  const totalMinutes = gameState.gameTime;
  const hours = Math.floor(totalMinutes / 60);
  
  if (hours >= SHIFT_END_HOUR) {
    gameState.gamePhase = "GAME_OVER_WIN";
    return;
  }
  
  // Check lose condition (too many strikes)
  if (gameState.strikes >= MAX_STRIKES) {
    gameState.gamePhase = "GAME_OVER_LOSE";
    return;
  }
  
  // Spawn anomalies
  if (gameState.frameCount - gameState.lastAnomalyCheck >= ANOMALY_CHECK_INTERVAL) {
    gameState.lastAnomalyCheck = gameState.frameCount;
    
    // Increase spawn chance over time
    const timeMultiplier = 1 + (hours * 0.2);
    const spawnChance = BASE_ANOMALY_CHANCE * timeMultiplier;
    
    if (Math.random() < spawnChance) {
      spawnRandomAnomaly();
    }
  }
  
  // Update anomalies
  for (let i = gameState.activeAnomalies.length - 1; i >= 0; i--) {
    const anomaly = gameState.activeAnomalies[i];
    anomaly.update();
    
    if (!anomaly.active) {
      gameState.activeAnomalies.splice(i, 1);
    }
  }
  
  // Update particles
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    const particle = gameState.particles[i];
    particle.update();
    
    if (particle.isDead()) {
      gameState.particles.splice(i, 1);
    }
  }
}

// Reset game
export function resetGame(p) {
  // Reset state
  gameState.currentCamera = 0;
  gameState.selectedReportRoom = 0;
  gameState.selectedReportType = 0;
  gameState.reportMenuOpen = false;
  
  gameState.score = 0;
  gameState.strikes = 0;
  gameState.anomaliesDetected = 0;
  gameState.anomaliesMissed = 0;
  gameState.totalAnomalies = 0;
  gameState.falseReports = 0;
  
  gameState.gameTime = 0;
  gameState.lastAnomalyCheck = 0;
  gameState.anomalySpawnTimer = 0;
  
  gameState.activeAnomalies = [];
  gameState.particles = [];
  
  gameState.uiAlertMessage = '';
  gameState.uiAlertTimer = 0;
  
  // Reinitialize rooms
  initializeRoomStates();
  
  // Reinitialize testing
  if (gameState.controlMode !== "HUMAN") {
    initializeTesting();
  }
  
  // Log reset
  if (p.logs && p.logs.game_info) {
    p.logs.game_info.push({
      data: { event: 'game_reset' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const activeBtn = document.getElementById(`${mode === 'HUMAN' ? 'humanModeBtn' : mode.toLowerCase() + 'ModeBtn'}`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  // Reset game if switching modes
  if (gameState.gamePhase !== "START") {
    resetGame(gameInstance);
    gameState.gamePhase = "START";
  }
  
  // Initialize testing if needed
  if (mode !== "HUMAN") {
    initializeTesting();
  }
};

// Expose game instance globally
window.gameInstance = gameInstance;

// Expose getGameState globally (already done in globals.js but ensure it's set)
window.getGameState = getGameState;