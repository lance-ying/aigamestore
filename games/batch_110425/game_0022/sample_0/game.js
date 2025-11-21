// game.js - Main game file

import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, AREAS } from './globals.js';
import { Player } from './player.js';
import { ShopSystem } from './shop.js';
import { FishingSystem } from './fishing.js';
import { GardenSystem } from './garden.js';
import { CampfireSystem } from './campfire.js';
import { drawHUD, drawStartScreen, drawGameOverScreen } from './ui.js';
import { initializeGame, updatePassiveIncome, checkWinCondition } from './game_logic.js';
import { handleKeyPressed, processAutomatedInput } from './input_handler.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Game systems
  let shopSystem;
  let fishingSystem;
  let gardenSystem;
  let campfireSystem;
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: "START", action: "Game Initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Initialize game systems
    shopSystem = new ShopSystem();
    fishingSystem = new FishingSystem();
    gardenSystem = new GardenSystem();
    campfireSystem = new CampfireSystem();
    
    // Store systems on instance for access
    p.shopSystem = shopSystem;
    p.fishingSystem = fishingSystem;
    p.gardenSystem = gardenSystem;
    p.campfireSystem = campfireSystem;
    
    // Initialize player
    gameState.player = new Player(100, 300);
    gameState.entities = [gameState.player];
  };
  
  p.draw = function() {
    p.background(60, 80, 60);
    
    // Handle different game phases
    switch(gameState.gamePhase) {
      case GAME_PHASES.START:
        drawStartScreen(p);
        break;
        
      case GAME_PHASES.PLAYING:
      case GAME_PHASES.PAUSED:
        drawGameplay(p);
        
        // Update game logic only when playing
        if (gameState.gamePhase === GAME_PHASES.PLAYING) {
          updateGame(p);
        }
        break;
        
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        drawGameOverScreen(p);
        break;
    }
    
    // Process automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      const action = get_automated_testing_action(gameState);
      processAutomatedInput(p, action, shopSystem, fishingSystem, gardenSystem, campfireSystem);
    }
  };
  
  function updateGame(p) {
    // Update timing
    const now = Date.now();
    const deltaTime = now - gameState.lastUpdate;
    gameState.lastUpdate = now;
    gameState.totalPlayTime += deltaTime;
    
    // Update passive income
    updatePassiveIncome(deltaTime);
    
    // Update player
    if (gameState.player) {
      gameState.player.update();
      
      // Log player info periodically
      if (p.frameCount % 60 === 0) {
        p.logs.player_info.push({
          screen_x: gameState.player.x,
          screen_y: gameState.player.y,
          game_x: gameState.player.x,
          game_y: gameState.player.y,
          framecount: p.frameCount
        });
      }
    }
    
    // Update area-specific systems
    fishingSystem.update();
    gardenSystem.update();
    campfireSystem.update();
    
    // Check win condition
    checkWinCondition();
  }
  
  function drawGameplay(p) {
    // Draw background based on area
    switch(gameState.currentArea) {
      case AREAS.SHOP:
        p.background(70, 60, 50);
        break;
      case AREAS.POND:
        p.background(60, 90, 120);
        break;
      case AREAS.GARDEN:
        p.background(80, 100, 70);
        break;
      case AREAS.CAMPFIRE:
        p.background(60, 50, 70);
        break;
    }
    
    // Draw HUD first
    drawHUD(p);
    
    // Draw player in bottom left
    if (gameState.player) {
      gameState.player.draw(p);
    }
    
    // Draw current area content
    switch(gameState.currentArea) {
      case AREAS.SHOP:
        shopSystem.draw(p);
        break;
      case AREAS.POND:
        fishingSystem.draw(p);
        break;
      case AREAS.GARDEN:
        gardenSystem.draw(p);
        break;
      case AREAS.CAMPFIRE:
        campfireSystem.draw(p);
        break;
    }
  }
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, p.key, p.keyCode, shopSystem, fishingSystem, gardenSystem, campfireSystem);
    }
    return false; // Prevent default
  };
});

// Expose globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn', 'test_4_ModeBtn', 'test_5_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn',
    'TEST_3': 'test_3_ModeBtn',
    'TEST_4': 'test_4_ModeBtn',
    'TEST_5': 'test_5_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};