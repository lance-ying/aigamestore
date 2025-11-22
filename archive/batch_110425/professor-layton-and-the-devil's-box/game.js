// game.js - Main game file

import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, gameState } from './globals.js';
import { Player } from './player.js';
import { createPuzzles } from './puzzles.js';
import { createAreas, initializeArea } from './areas.js';
import { renderStartScreen, renderPlayingScreen, renderGameOverScreen } from './rendering.js';
import { setupInputHandling, handleInteractions } from './input.js';
import get_automated_testing_action from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let keys;
  
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
    
    // Log initial game state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, message: "Game initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Create player
    gameState.player = new Player(p, 300, 350);
    gameState.entities.push(gameState.player);
    
    // Create puzzles
    gameState.puzzles = createPuzzles(p);
    gameState.totalPuzzles = gameState.puzzles.filter(puz => puz.mandatory).length;
    
    // Create areas
    gameState.areas = createAreas(p);
    gameState.totalAreas = gameState.areas.length;
    
    // Initialize first area
    initializeArea(p, gameState, 0);
    
    // Setup input handling
    keys = setupInputHandling(p);
    
    // Store p5 instance reference
    gameState.p5Instance = p;
    gameState.keys = keys;
    
    // Log initial player info
    p.logs.player_info.push({
      screen_x: gameState.player.x,
      screen_y: gameState.player.y,
      game_x: gameState.player.x,
      game_y: gameState.player.y,
      framecount: p.frameCount
    });
  };
  
  p.draw = function() {
    gameState.frameCount = p.frameCount;
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      const action = get_automated_testing_action(gameState);
      
      // Clear keys
      keys.left = keys.right = keys.up = keys.down = keys.space = false;
      
      // Apply automated action
      if (action.keyCode === 37) keys.left = true;
      if (action.keyCode === 39) keys.right = true;
      if (action.keyCode === 38) keys.up = true;
      if (action.keyCode === 40) keys.down = true;
      if (action.keyCode === 32) keys.space = true;
      
      // Handle puzzle input for automated testing
      if (gameState.inPuzzleMode && action.key && action.key.length === 1) {
        if (action.keyCode === 32) {
          // Submit
          p.keyPressed = p.keyPressed || function() {};
          p.keyCode = 32;
          p.key = ' ';
          const keyPressedFunc = setupInputHandling(p);
        } else {
          // Add character
          gameState.puzzleInput += action.key;
        }
      }
    }
    
    // Render based on game phase
    if (gameState.gamePhase === GAME_PHASES.START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING || gameState.gamePhase === GAME_PHASES.PAUSED) {
      if (gameState.gamePhase === GAME_PHASES.PLAYING && !gameState.inPuzzleMode) {
        // Update player
        gameState.player.update(keys, gameState);
        
        // Handle interactions
        handleInteractions(p, keys, gameState);
        
        // Log player position periodically
        if (p.frameCount % 60 === 0) {
          p.logs.player_info.push({
            screen_x: gameState.player.x,
            screen_y: gameState.player.y,
            game_x: gameState.player.x,
            game_y: gameState.player.y,
            framecount: p.frameCount
          });
        }
        
        // Track position history for automated testing
        gameState.playerPositionHistory.push({
          x: gameState.player.x,
          y: gameState.player.y,
          frame: p.frameCount
        });
        if (gameState.playerPositionHistory.length > 300) {
          gameState.playerPositionHistory.shift();
        }
        
        // Check win condition
        const allMandatoryPuzzles = gameState.puzzles.filter(puz => puz.mandatory);
        if (allMandatoryPuzzles.every(puz => puz.solved)) {
          gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
          p.logs.game_info.push({
            data: { phase: gameState.gamePhase, message: "Game won!" },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
      }
      
      renderPlayingScreen(p, gameState);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      renderGameOverScreen(p, gameState);
    }
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const btnId = mode === "HUMAN" ? "humanModeBtn" : `${mode.toLowerCase()}_ModeBtn`;
  const activeBtn = document.getElementById(btnId);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  console.log(`Control mode changed to: ${mode}`);
};