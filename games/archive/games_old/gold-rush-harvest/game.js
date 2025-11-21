// game.js - Main game file

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, getGameState } from './globals.js';
import { Player } from './player.js';
import { initializeFarm, updateFarm, renderFarm } from './farm.js';
import { updateLivestock, renderLivestock, addAnimal } from './livestock.js';
import { updateBuildings, renderBuildings } from './buildings.js';
import { updateExpedition } from './expedition.js';
import { renderUI } from './ui.js';
import { renderStartScreen, renderGameOverScreen } from './screens.js';
import { handleKeyPressed, handleMouseClicked } from './input.js';
import { initializeLevel } from './progression.js';
import { getTestAction, executeTestAction } from './testing.js';

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
    
    // Initialize game state
    gameState.gamePhase = GAME_PHASES.START;
    gameState.lastUpdateTime = Date.now();
    
    // Initialize player
    gameState.player = new Player(50, 80);
    gameState.player.gridX = 0;
    gameState.player.gridY = 0;
    
    // Initialize farm
    initializeFarm(gameState);
    
    // Initialize first level
    initializeLevel(gameState, 1);
    
    // Add starting animals
    if (gameState.livestock.length === 0) {
      addAnimal(gameState, 'chicken');
    }
    
    p.logs.game_info.push({
      data: { phase: 'START', message: 'Game initialized' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Single background call
    p.background(60, 120, 60);
    
    // Handle testing mode
    if (gameState.controlMode !== 'HUMAN') {
      const action = getTestAction(p);
      if (action) {
        executeTestAction(action, p);
      }
    }
    
    // Render based on game phase
    if (gameState.gamePhase === GAME_PHASES.START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (gameState.inExpedition && gameState.currentExpedition) {
        // Update and render expedition
        const currentTime = Date.now();
        const deltaTime = currentTime - gameState.lastUpdateTime;
        gameState.lastUpdateTime = currentTime;
        
        updateExpedition(gameState, deltaTime);
        gameState.currentExpedition.render(p);
      } else {
        // Update game time
        const currentTime = Date.now();
        const deltaTime = currentTime - gameState.lastUpdateTime;
        gameState.lastUpdateTime = currentTime;
        gameState.gameTime += deltaTime;
        
        // Update game systems
        updateFarm(gameState);
        updateLivestock(gameState);
        updateBuildings(gameState);
        
        // Render game
        renderFarm(p, gameState);
        renderLivestock(p, gameState);
        renderBuildings(p, gameState);
        
        // Render player cursor
        if (gameState.player) {
          gameState.player.render(p);
        }
        
        // Render UI
        renderUI(p, gameState);
      }
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      // Render paused game
      renderFarm(p, gameState);
      renderLivestock(p, gameState);
      renderBuildings(p, gameState);
      if (gameState.player) {
        gameState.player.render(p);
      }
      renderUI(p, gameState);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
      renderGameOverScreen(p, true);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      renderGameOverScreen(p, false);
    }
    
    // Log player info periodically
    if (p.frameCount % 60 === 0 && gameState.player && gameState.gamePhase === GAME_PHASES.PLAYING) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.gridX,
        game_y: gameState.player.gridY,
        framecount: p.frameCount
      });
    }
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p, p.key, p.keyCode);
  };
  
  p.mouseClicked = function() {
    handleMouseClicked(p);
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Expose getGameState
window.getGameState = getGameState;

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
  
  const activeBtn = document.getElementById(mode === 'HUMAN' ? 'humanModeBtn' : 
                                           mode === 'TEST_1' ? 'test_1_ModeBtn' : 
                                           'test_2_ModeBtn');
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};