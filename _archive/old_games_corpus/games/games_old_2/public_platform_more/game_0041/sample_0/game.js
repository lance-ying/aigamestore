// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { createPlayer } from './player.js';
import { initializeLocations, getCurrentLocation } from './location_manager.js';
import { handleKeyPressed, updateHighlights, renderLocationSelection } from './input_handler.js';
import { 
  renderUI, renderDialogue, renderInventory, 
  renderStartScreen, renderGameOver 
} from './ui.js';
import { checkWinCondition } from './game_logic.js';
import get_automated_testing_action from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let player;
  let lastLoggedFrame = -1;
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize logs (write-only)
    p.logs = {
      "game_info": [],
      "inputs": [],
      "player_info": []
    };
    
    // Initialize game
    player = createPlayer(100, 250);
    gameState.entities.push(player);
    
    initializeLocations();
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: "START", action: "game_initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    p.background(40, 35, 45);
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === "PLAYING") {
      const action = get_automated_testing_action(gameState);
      if (action && action.keyCode) {
        handleKeyPressed(p, String.fromCharCode(action.keyCode), action.keyCode);
      }
    }
    
    // Render based on game phase
    if (gameState.gamePhase === "START") {
      renderStartScreen(p);
    } else if (gameState.gamePhase === "PLAYING" || gameState.gamePhase === "PAUSED") {
      renderPlaying(p);
    } else if (gameState.gamePhase === "GAME_OVER_WIN") {
      renderGameOver(p, true);
    } else if (gameState.gamePhase === "GAME_OVER_LOSE") {
      renderGameOver(p, false);
    }
    
    // Log player info periodically
    if (gameState.player && p.frameCount % 30 === 0 && p.frameCount !== lastLoggedFrame) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.game_x,
        game_y: gameState.player.game_y,
        framecount: p.frameCount
      });
      lastLoggedFrame = p.frameCount;
    }
  };
  
  function renderPlaying(p) {
    const location = getCurrentLocation();
    
    // Render location
    if (location) {
      location.render(p);
      
      // Update highlights
      if (!gameState.showingDialogue && !gameState.showInventory) {
        updateHighlights(location);
      }
    }
    
    // Render player
    if (gameState.player) {
      gameState.player.render(p);
    }
    
    // Render UI
    renderUI(p);
    
    // Render overlays
    if (gameState.showingDialogue) {
      renderDialogue(p, gameState.currentDialogue);
    }
    
    if (gameState.showInventory) {
      renderInventory(p);
    }
    
    renderLocationSelection(p);
    
    // Check win condition
    if (checkWinCondition() && gameState.gamePhase === "PLAYING") {
      gameState.gamePhase = "GAME_OVER_WIN";
      p.logs.game_info.push({
        data: { phase: "GAME_OVER_WIN", action: "case_solved" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  p.keyPressed = function() {
    if (gameState.gamePhase === "PLAYING" || 
        gameState.gamePhase === "START" || 
        gameState.gamePhase === "PAUSED" ||
        gameState.gamePhase === "GAME_OVER_WIN" ||
        gameState.gamePhase === "GAME_OVER_LOSE") {
      handleKeyPressed(p, p.key, p.keyCode);
    }
    return false;
  };
});

// Expose globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 
                   'test_3_ModeBtn', 'test_4_ModeBtn', 'test_5_ModeBtn'];
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

export default gameInstance;