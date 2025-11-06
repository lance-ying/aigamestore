// game.js - Main game file

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { generateBoard } from './board.js';
import { Player } from './player.js';
import { SpinWheel } from './wheel.js';
import { handleInput } from './input.js';
import { updateGameLogic } from './game_logic.js';
import {
  renderStartScreen,
  renderBoard,
  renderUI,
  renderEventDialog,
  renderSpinPrompt,
  renderPausedIndicator,
  renderGameOver
} from './rendering.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let wheel;
  
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
    
    // Generate board
    gameState.boardPath = generateBoard();
    
    // Create player
    const startSpace = gameState.boardPath[0];
    gameState.player = new Player(startSpace.x, startSpace.y);
    gameState.entities.push(gameState.player);
    
    // Create wheel
    wheel = new SpinWheel(p);
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase, action: "init" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    p.background(30, 40, 60);
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action && action.keyCode) {
        handleInput(p, action.keyCode, true);
      }
    }
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        renderStartScreen(p);
        break;
        
      case GAME_PHASES.PLAYING:
        renderBoard(p, gameState.boardPath, gameState.currentPosition);
        
        if (gameState.player) {
          gameState.player.draw(p);
        }
        
        renderUI(p);
        renderSpinPrompt(p, wheel);
        
        if (gameState.showingEvent && gameState.currentEvent) {
          renderEventDialog(p, gameState.currentEvent);
        }
        
        updateGameLogic(p, wheel);
        break;
        
      case GAME_PHASES.PAUSED:
        renderBoard(p, gameState.boardPath, gameState.currentPosition);
        
        if (gameState.player) {
          gameState.player.draw(p);
        }
        
        renderUI(p);
        renderPausedIndicator(p);
        break;
        
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        renderGameOver(p);
        break;
    }
  };
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleInput(p, p.keyCode, true);
    }
    return false;
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
};