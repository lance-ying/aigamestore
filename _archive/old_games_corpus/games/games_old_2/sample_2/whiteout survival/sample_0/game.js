// game.js - Main game file

import { gameState, GAME_PHASES, PLAYING_SUBSTATES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { handleKeyPressed, updateAutomatedTesting } from './input.js';
import { 
  renderStartScreen, 
  renderExploreScreen, 
  renderCityMenu, 
  renderCombatScreen,
  renderLevelComplete,
  renderPausedIndicator,
  renderGameOver 
} from './rendering.js';

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
    p.randomSeed(42);
    p.frameRate(60);
    
    // Initialize game state
    p.logs.game_info.push({
      data: { phase: "START", action: "initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Single background call at top
    p.background(20, 30, 50);
    
    // Update automated testing
    updateAutomatedTesting(p);
    
    // Render based on game phase
    if (gameState.gamePhase === GAME_PHASES.START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (gameState.playingSubstate === PLAYING_SUBSTATES.EXPLORE) {
        renderExploreScreen(p);
      } else if (gameState.playingSubstate === PLAYING_SUBSTATES.CITY_MENU) {
        renderExploreScreen(p);
        renderCityMenu(p);
      } else if (gameState.playingSubstate === PLAYING_SUBSTATES.COMBAT) {
        renderCombatScreen(p);
      } else if (gameState.playingSubstate === PLAYING_SUBSTATES.LEVEL_COMPLETE) {
        renderLevelComplete(p);
      }
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      renderExploreScreen(p);
      renderPausedIndicator(p);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
      renderGameOver(p, true);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      renderGameOver(p, false);
    }
    
    // Log player info periodically
    if (p.frameCount % 60 === 0 && gameState.player) {
      p.logs.player_info.push({
        screen_x: gameState.player.screenX,
        screen_y: gameState.player.screenY,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        framecount: p.frameCount
      });
    }
  };
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, p.key, p.keyCode);
    }
    return false;
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode management
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};