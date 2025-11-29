// game.js - Main game file with p5.js instance

import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, KEY_SHIFT } from './globals.js';
import { createWorldMap } from './country.js';
import { renderStartScreen, renderPlayingScreen, renderPausedOverlay, renderGameOverScreen } from './ui.js';
import { handleKeyPress, handleKeyRelease, isKeyPressed } from './input.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize game
    gameState.gamePhase = PHASE_START;
    gameState.controlMode = "HUMAN";
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Initialize world
    createWorldMap();
  };
  
  p.draw = function() {
    // Update frame count and time
    gameState.frameCount = p.frameCount;
    
    const currentTime = p.millis();
    gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
    gameState.lastFrameTime = currentTime;
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === PHASE_PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action && action.keyCode) {
        simulateKeyPress(p, action.keyCode);
      }
    }
    
    // Time multiplier (speed up with SHIFT)
    if (gameState.gamePhase === PHASE_PLAYING) {
      gameState.timeMultiplier = isKeyPressed(KEY_SHIFT) ? 3 : 1;
    }
    
    // Render based on phase
    switch (gameState.gamePhase) {
      case PHASE_START:
        renderStartScreen(p);
        break;
        
      case PHASE_PLAYING:
        updateGame(p);
        renderPlayingScreen(p);
        break;
        
      case PHASE_PAUSED:
        renderPlayingScreen(p);
        renderPausedOverlay(p);
        break;
        
      case PHASE_GAME_OVER_WIN:
      case PHASE_GAME_OVER_LOSE:
        renderPlayingScreen(p);
        renderGameOverScreen(p);
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

function updateGame(p) {
  // Update countries
  for (const country of gameState.countries) {
    country.update(p);
  }
  
  // Update cure research
  updateCureResearch();
  
  // Update game time
  gameState.gameTime += gameState.deltaTime * gameState.timeMultiplier;
  
  // Check win/lose conditions
  checkGameOver();
}

function updateCureResearch() {
  // Cure research rate increases with severity and detection
  const detectionMultiplier = 1 + (gameState.severity * 0.1);
  const infectionMultiplier = 1 + ((gameState.infectedPopulation / gameState.totalPopulation) * 2);
  
  let researchRate = gameState.cureResearchRate * detectionMultiplier * infectionMultiplier;
  
  // Drug resistance slows cure
  if (gameState.abilities.drugResist1) researchRate *= 0.7;
  if (gameState.abilities.drugResist2) researchRate *= 0.5;
  
  // Apply time multiplier
  researchRate *= gameState.timeMultiplier;
  
  gameState.cureProgress += researchRate;
  gameState.cureProgress = Math.min(100, gameState.cureProgress);
}

function checkGameOver() {
  // Win condition: All humans dead or infected, cure not complete
  const totalLiving = gameState.totalPopulation - gameState.deadPopulation;
  
  if (gameState.deadPopulation >= gameState.totalPopulation * 0.99) {
    gameState.gamePhase = PHASE_GAME_OVER_WIN;
    return;
  }
  
  // Lose condition: Cure complete
  if (gameState.cureProgress >= 100) {
    gameState.gamePhase = PHASE_GAME_OVER_LOSE;
    return;
  }
}

export function resetGame(p) {
  // Reset all game state
  gameState.dnaPoints = 0;
  gameState.infectivity = 1;
  gameState.severity = 0;
  gameState.lethality = 0;
  
  // Reset evolutions
  for (const key in gameState.transmissions) {
    gameState.transmissions[key] = false;
  }
  for (const key in gameState.symptoms) {
    gameState.symptoms[key] = false;
  }
  for (const key in gameState.abilities) {
    gameState.abilities[key] = false;
  }
  
  // Reset world
  gameState.countries = [];
  gameState.totalPopulation = 0;
  gameState.infectedPopulation = 0;
  gameState.deadPopulation = 0;
  gameState.cureProgress = 0;
  
  // Reset UI
  gameState.selectedCountryIndex = 0;
  gameState.showInfoPanel = false;
  gameState.evolutionMenuOpen = false;
  gameState.evolutionCategory = 'transmission';
  gameState.evolutionMenuIndex = 0;
  
  // Clear arrays
  gameState.dnaBubbles = [];
  gameState.particles = [];
  gameState.entities = [];
  
  // Reset time
  gameState.gameTime = 0;
  gameState.timeMultiplier = 1;
  
  // Recreate world
  createWorldMap();
  
  // Log reset
  if (p.logs && p.logs.game_info) {
    p.logs.game_info.push({
      data: { event: 'game_reset' },
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
}

function simulateKeyPress(p, keyCode) {
  // Simulate key press for automated testing
  const originalKeyCode = p.keyCode;
  p.keyCode = keyCode;
  handleKeyPress(p);
  p.keyCode = originalKeyCode;
}

// Expose game instance globally
window.gameInstance = gameInstance;

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
  
  const activeBtn = mode === 'HUMAN' ? 'humanModeBtn' : 
                    mode === 'TEST_1' ? 'test_1_ModeBtn' : 'test_2_ModeBtn';
  const btn = document.getElementById(activeBtn);
  if (btn) {
    btn.classList.add('active');
  }
  
  console.log(`Control mode set to: ${mode}`);
};