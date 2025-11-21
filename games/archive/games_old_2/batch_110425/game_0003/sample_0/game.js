import { gameState, GAME_PHASES, SCREEN_MODES, CANVAS_WIDTH, CANVAS_HEIGHT, getGameState } from './globals.js';
import { initializeGame, startGame, updateGame, handleBaseInput, handleHeroesInput, handleDungeonInput } from './game_logic.js';
import { drawStartScreen, drawBaseScreen, drawHeroesScreen, drawDungeonScreen, drawCombatScreen, drawPauseOverlay, drawGameOverScreen } from './rendering.js';
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
    
    initializeGame(p);
  };
  
  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action !== null) {
        handleKeyPress(action, p);
      }
    }
    
    // Render based on game phase
    if (gameState.gamePhase === GAME_PHASES.START) {
      drawStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      // Render based on screen mode
      switch (gameState.screenMode) {
        case SCREEN_MODES.BASE:
          drawBaseScreen(p);
          break;
        case SCREEN_MODES.HEROES:
          drawHeroesScreen(p);
          break;
        case SCREEN_MODES.DUNGEON:
          drawDungeonScreen(p);
          break;
        case SCREEN_MODES.COMBAT:
          drawCombatScreen(p);
          break;
      }
      
      // Update game logic
      updateGame(p);
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      // Draw current screen
      switch (gameState.screenMode) {
        case SCREEN_MODES.BASE:
          drawBaseScreen(p);
          break;
        case SCREEN_MODES.HEROES:
          drawHeroesScreen(p);
          break;
        case SCREEN_MODES.DUNGEON:
          drawDungeonScreen(p);
          break;
        case SCREEN_MODES.COMBAT:
          drawCombatScreen(p);
          break;
      }
      drawPauseOverlay(p);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      drawGameOverScreen(p, gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN);
    }
  };
  
  p.keyPressed = function() {
    const keyCode = p.keyCode;
    
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    handleKeyPress(keyCode, p);
    return false;
  };
  
  function handleKeyPress(keyCode, p) {
    // Global controls
    if (keyCode === 13) { // ENTER
      if (gameState.gamePhase === GAME_PHASES.START) {
        startGame(p);
      }
      return;
    }
    
    if (keyCode === 27) { // ESC
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        p.logs.game_info.push({
          data: { event: "game_paused" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        p.logs.game_info.push({
          data: { event: "game_resumed" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      return;
    }
    
    if (keyCode === 82) { // R
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        initializeGame(p);
      }
      return;
    }
    
    // Game-specific controls
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      switch (gameState.screenMode) {
        case SCREEN_MODES.BASE:
          handleBaseInput(keyCode, p);
          break;
        case SCREEN_MODES.HEROES:
          handleHeroesInput(keyCode, p);
          break;
        case SCREEN_MODES.DUNGEON:
        case SCREEN_MODES.COMBAT:
          handleDungeonInput(keyCode, p);
          break;
      }
    }
  }
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
  
  // Reset testing state
  gameState.testingState = {
    actionQueue: [],
    waitFrames: 0,
    phase: "INIT"
  };
};