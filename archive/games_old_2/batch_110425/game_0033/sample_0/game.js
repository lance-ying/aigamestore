// game.js - Main game file

import { 
  gameState, 
  getGameState,
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  CONTROL_HUMAN
} from './globals.js';
import { createLocations, getAvailableHotspots } from './locations.js';
import { createPlayer } from './player.js';
import { 
  drawStartScreen, 
  drawPausedIndicator, 
  drawGameOverScreen,
  drawHUD,
  drawInventoryMenu,
  drawLocation
} from './ui.js';
import { updateGame } from './game_logic.js';
import { handleKeyPressed, processAutomatedInput } from './input_handler.js';
import { get_automated_testing_action, onControlModeChange } from './automated_testing_controller.js';

const p5 = window.p5;

let locations = [];

export function resetGame(locs) {
  gameState.gamePhase = PHASE_START;
  gameState.currentLocation = 0;
  gameState.selectedHotspot = 0;
  gameState.inventory = [];
  gameState.selectedInventoryItem = -1;
  gameState.inventoryOpen = false;
  gameState.score = 0;
  gameState.puzzlesSolved = [];
  gameState.dialogueState = null;
  gameState.message = "";
  gameState.messageTimer = 0;
  gameState.entities = [];
  gameState.actionHistory = [];
  gameState.framesSinceAction = 0;
  
  // Recreate locations to reset hotspot states
  locations = createLocations();
  
  // Recreate player
  gameState.player = createPlayer();
  gameState.entities = [gameState.player];
}

let gameInstance = new p5(p => {
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
    
    // Initialize game
    locations = createLocations();
    gameState.player = createPlayer();
    gameState.entities = [gameState.player];
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: PHASE_START, message: "Game initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    p.background(20, 30, 45);
    
    // Handle automated testing
    if (gameState.controlMode !== CONTROL_HUMAN && gameState.gamePhase === PHASE_PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action) {
        processAutomatedInput(p, action, locations);
      }
    }
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case PHASE_START:
        drawStartScreen(p);
        break;
        
      case PHASE_PLAYING:
        drawLocation(p, locations[gameState.currentLocation]);
        drawHUD(p, locations[gameState.currentLocation]);
        
        if (gameState.inventoryOpen) {
          drawInventoryMenu(p);
        }
        
        updateGame(p, locations);
        
        // Log player info periodically
        if (p.frameCount % 60 === 0) {
          p.logs.player_info.push({
            screen_x: gameState.player.x,
            screen_y: gameState.player.y,
            game_x: gameState.player.game_x,
            game_y: gameState.player.game_y,
            framecount: p.frameCount
          });
        }
        break;
        
      case PHASE_PAUSED:
        drawLocation(p, locations[gameState.currentLocation]);
        drawHUD(p, locations[gameState.currentLocation]);
        drawPausedIndicator(p);
        break;
        
      case PHASE_GAME_OVER_WIN:
        drawGameOverScreen(p, true);
        break;
        
      case PHASE_GAME_OVER_LOSE:
        drawGameOverScreen(p, false);
        break;
    }
  };
  
  p.keyPressed = function() {
    if (gameState.controlMode === CONTROL_HUMAN) {
      handleKeyPressed(p, p.keyCode, locations);
    }
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  onControlModeChange();
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn'];
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
    'TEST_3': 'test_3_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};

export { locations };