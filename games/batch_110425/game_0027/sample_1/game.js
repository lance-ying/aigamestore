// game.js - Main game logic

import { gameState, initializeGrid, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, BUILDING_TYPES, CONTROL_MODE_HUMAN } from './globals.js';
import { updateGuests, calculateAverageSatisfaction, spawnGuest } from './guest.js';
import { renderStartScreen, renderUI, renderPauseOverlay, renderGameOverScreen } from './ui.js';
import { initInput, handleKeyPressed, processAutomatedTestingInput } from './input.js';

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
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    initializeGrid();
    initInput(p);
    
    // Initialize game state
    gameState.player = { x: 0, y: 0 }; // Dummy player for logging
    
    // Set initial selections
    const firstBuilding = Object.keys(BUILDING_TYPES)[0];
    gameState.selectedBuildingType = firstBuilding;
    gameState.selectedGiftType = Object.keys(require('./globals.js').GIFT_ITEMS)[0];
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, action: "game_start" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    gameState.gameTime++;
    
    // Process automated testing input
    processAutomatedTestingInput(p);
    
    // Update game based on phase
    if (gameState.gamePhase === PHASE_START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === PHASE_PLAYING) {
      updateGame(p);
      renderGame(p);
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      renderGame(p);
      renderPauseOverlay(p);
    } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      renderGameOverScreen(p, gameState.gamePhase === PHASE_GAME_OVER_WIN);
    }
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p, p.keyCode);
  };
}, document.body);

function updateGame(p) {
  const currentTime = Date.now();
  
  // Update buildings
  gameState.buildings.forEach(building => building.update(currentTime));
  
  // Update guests
  updateGuests(currentTime);
  
  // Calculate statistics
  gameState.averageSatisfaction = calculateAverageSatisfaction();
  
  // Calculate park rating
  const followerRating = Math.min(5, Math.floor(gameState.snsFollowers / 200));
  const satisfactionRating = gameState.averageSatisfaction >= 80 ? 1 : 0;
  gameState.parkRating = followerRating + satisfactionRating;
  
  // Check win condition
  if (gameState.snsFollowers >= 1000 && gameState.averageSatisfaction >= 70) {
    gameState.gamePhase = PHASE_GAME_OVER_WIN;
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, reason: "win_condition" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Log player info periodically
  if (p.frameCount % 60 === 0) {
    p.logs.player_info.push({
      screen_x: gameState.cursorGridX,
      screen_y: gameState.cursorGridY,
      game_x: gameState.cursorGridX,
      game_y: gameState.cursorGridY,
      framecount: p.frameCount
    });
  }
}

function renderGame(p) {
  renderUI(p);
  
  // Render buildings
  gameState.buildings.forEach(building => building.render(p));
  
  // Render guests
  gameState.guests.forEach(guest => guest.render(p));
}

export function resetGame() {
  // Reset game state
  gameState.gamePhase = PHASE_START;
  gameState.money = 500;
  gameState.snsFollowers = 0;
  gameState.parkRating = 0;
  gameState.buildings = [];
  gameState.guests = [];
  gameState.totalGuestsServed = 0;
  gameState.gameTime = 0;
  gameState.lastGuestSpawn = 0;
  gameState.averageSatisfaction = 50;
  gameState.totalIncome = 0;
  gameState.entities = [];
  gameState.cursorGridX = 0;
  gameState.cursorGridY = 0;
  gameState.buildMode = 'BUILD';
  
  initializeGrid();
  
  const firstBuilding = Object.keys(BUILDING_TYPES)[0];
  gameState.selectedBuildingType = firstBuilding;
}

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const activeBtn = mode === CONTROL_MODE_HUMAN ? 'humanModeBtn' : `${mode.toLowerCase()}_ModeBtn`;
  const btn = document.getElementById(activeBtn);
  if (btn) {
    btn.classList.add('active');
  }
};