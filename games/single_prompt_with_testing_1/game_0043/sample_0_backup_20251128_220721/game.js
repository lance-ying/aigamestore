// game.js - Main game file

import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Player } from './entities.js';
import { createCities, createRoutes, createTrainCardDeck, createDestinationTickets } from './game_data.js';
import { shuffleArray, drawCard } from './utils.js';
import { initInputHandler, handleKeyPressed } from './input_handler.js';
import { renderGame } from './renderer.js';
import get_automated_testing_action from './automated_testing_controller.js';

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
    
    // Initialize game data
    gameState.cities = createCities();
    gameState.routes = createRoutes(gameState.cities);
    gameState.trainCards = shuffleArray(createTrainCardDeck(), p);
    gameState.destinationTickets = shuffleArray(createDestinationTickets(), p);
    
    // Deal face-up cards
    gameState.faceUpCards = [];
    for (let i = 0; i < 5; i++) {
      gameState.faceUpCards.push(drawCard(p));
    }
    
    // Deal initial hand
    gameState.playerHand = [];
    for (let i = 0; i < 4; i++) {
      gameState.playerHand.push(drawCard(p));
    }
    
    // Initialize player
    gameState.player = new Player();
    gameState.entities = [gameState.player];
    
    // Initialize input handler
    initInputHandler(p);
    
    p.logs.game_info.push({
      data: { phase: "START", action: "Game Initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === "PLAYING") {
      if (p.frameCount % 10 === 0) { // Execute every 10 frames
        const action = get_automated_testing_action(gameState);
        if (action && action.keyCode) {
          simulateKeyPress(p, action.keyCode);
        }
      }
    }
    
    // Update message timer
    if (gameState.messageTimer > 0) {
      gameState.messageTimer--;
    }
    
    // Render
    renderGame(p);
    
    // Log player info periodically
    if (p.frameCount % 60 === 0 && gameState.player) {
      p.logs.player_info.push({
        screen_x: 0,
        screen_y: 0,
        game_x: 0,
        game_y: 0,
        framecount: p.frameCount
      });
    }
  };
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p);
    }
    return false;
  };
  
  function simulateKeyPress(p, keyCode) {
    p.keyCode = keyCode;
    p.key = String.fromCharCode(keyCode);
    handleKeyPressed(p);
  }
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode functions
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