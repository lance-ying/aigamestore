// game.js - Main game file

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Player } from './player.js';
import { updateGame } from './game_logic.js';
import { handleKeyPress, processAutomatedInput } from './input_handler.js';
import { 
  renderStartScreen, 
  renderPauseOverlay, 
  renderGameOverScreen,
  renderHUD,
  renderMainMenu,
  renderCreateBurgerMenu,
  renderServeMenu,
  renderShopMenu,
  renderExpandMenu
} from './ui.js';

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
    
    // Initialize player
    gameState.player = new Player(300, 350);
    gameState.entities.push(gameState.player);
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: "START", event: "setup_complete" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    p.background(30, 25, 45);
    
    // Process automated testing input
    if (gameState.controlMode !== "HUMAN" && p.frameCount % 3 === 0) {
      processAutomatedInput(p);
    }
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        renderStartScreen(p);
        break;
        
      case GAME_PHASES.PLAYING:
        updateGame(p);
        renderPlayingScreen(p);
        break;
        
      case GAME_PHASES.PAUSED:
        renderPlayingScreen(p);
        renderPauseOverlay(p);
        break;
        
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        renderGameOverScreen(p);
        break;
    }
  };
  
  function renderPlayingScreen(p) {
    // Background
    p.fill(50, 45, 65);
    p.rect(0, 40, p.width, p.height - 40);
    
    // Render HUD
    renderHUD(p);
    
    // Render based on menu state
    switch (gameState.menuState) {
      case "MAIN":
        renderMainMenu(p);
        break;
      case "CREATE_BURGER":
        renderCreateBurgerMenu(p);
        break;
      case "SERVE":
        renderServeMenu(p);
        break;
      case "SHOP":
        renderShopMenu(p);
        break;
      case "EXPAND":
        renderExpandMenu(p);
        break;
    }
    
    // Render player character
    if (gameState.player) {
      gameState.player.render(p);
    }
  }
  
  p.keyPressed = function() {
    handleKeyPress(p, p.key, p.keyCode);
  };
});

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
                    mode === 'TEST_1' ? 'test_1_ModeBtn' :
                    mode === 'TEST_2' ? 'test_2_ModeBtn' : null;
  
  if (activeBtn) {
    const btn = document.getElementById(activeBtn);
    if (btn) {
      btn.classList.add('active');
    }
  }
  
  console.log(`Control mode set to: ${mode}`);
};