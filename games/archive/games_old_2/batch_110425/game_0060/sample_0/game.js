import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Player } from './entities.js';
import { initializeDesktop } from './desktop.js';
import { renderStartScreen, renderPlayingScreen, renderPauseIndicator, renderGameOverScreen } from './rendering.js';
import { handleInput, handleAutomatedInput } from './input.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let apps = [];
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize logs (write-only)
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Log initial game state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, message: "Game initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Initialize player
    gameState.player = new Player();
    gameState.entities.push(gameState.player);
    
    // Initialize desktop apps
    apps = initializeDesktop();
  };
  
  p.draw = function() {
    gameState.frameCount = p.frameCount;
    
    // Automated testing control
    if (gameState.controlMode !== "HUMAN" && p.frameCount % 10 === 0) {
      handleAutomatedInput(p, apps);
    }
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        renderStartScreen(p);
        break;
        
      case GAME_PHASES.PLAYING:
        renderPlayingScreen(p, apps);
        
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
        break;
        
      case GAME_PHASES.PAUSED:
        renderPlayingScreen(p, apps);
        renderPauseIndicator(p);
        break;
        
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        renderGameOverScreen(p);
        break;
    }
  };
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleInput(p, apps);
    }
    return false; // Prevent default browser behavior
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Expose getGameState function
window.getGameState = function() {
  return gameState;
};

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ["humanModeBtn", "test_1_ModeBtn", "test_2_ModeBtn"];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove("active");
    }
  });
  
  const activeBtn = document.getElementById(
    mode === "HUMAN" ? "humanModeBtn" : 
    mode === "TEST_1" ? "test_1_ModeBtn" : 
    "test_2_ModeBtn"
  );
  if (activeBtn) {
    activeBtn.classList.add("active");
  }
};

export default gameInstance;