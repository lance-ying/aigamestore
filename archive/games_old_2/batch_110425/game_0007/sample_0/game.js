// game.js - Main game file

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  PHASE_START, 
  PHASE_PLAYING, 
  PHASE_PAUSED, 
  PHASE_GAME_OVER_WIN, 
  PHASE_GAME_OVER_LOSE,
  TILE_SIZE,
  getGameState
} from './globals.js';
import { World } from './world.js';
import { Player } from './player.js';
import { NPC } from './npc.js';
import { initializeGame, updateGame } from './game_logic.js';
import { renderWorld, renderEntities, renderBlockBreakingEffect } from './rendering.js';
import { renderUI, renderStartScreen, renderGameOver, renderPausedIndicator } from './ui.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let world = null;
  let keys = {
    left: false,
    right: false,
    up: false,
    space: false,
    z: false,
    shift: false
  };
  let lastShiftState = false;
  let lastZState = false;

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
    
    // Create world
    world = new World(p);
    gameState.world = world;
    
    // Create player
    const player = new Player(p, TILE_SIZE * 3, TILE_SIZE * 8);
    gameState.player = player;
    gameState.entities.push(player);
    
    // Create NPC
    const npc = new NPC(p, TILE_SIZE * 5, TILE_SIZE * 10, "Builder");
    gameState.entities.push(npc);
    
    // Log initial state
    p.logs.game_info.push({
      data: "Game initialized",
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    p.background(135, 206, 235); // Sky blue
    
    switch (gameState.gamePhase) {
      case PHASE_START:
        renderStartScreen(p);
        break;
        
      case PHASE_PLAYING:
        // Get input from automated testing if needed
        if (gameState.controlMode !== "HUMAN") {
          const action = get_automated_testing_action(gameState);
          keys = action;
        }
        
        // Update game
        updateGame(p, world, keys);
        
        // Render world
        renderWorld(p, world, gameState.camera.x, gameState.camera.y);
        
        // Render breaking effect
        renderBlockBreakingEffect(p, gameState.breakingBlock, gameState.breakProgress, gameState.camera.x, gameState.camera.y);
        
        // Render entities
        renderEntities(p, gameState.entities, gameState.camera.x, gameState.camera.y);
        
        // Render UI
        renderUI(p);
        break;
        
      case PHASE_PAUSED:
        // Render game state
        renderWorld(p, world, gameState.camera.x, gameState.camera.y);
        renderEntities(p, gameState.entities, gameState.camera.x, gameState.camera.y);
        renderUI(p);
        renderPausedIndicator(p);
        break;
        
      case PHASE_GAME_OVER_WIN:
      case PHASE_GAME_OVER_LOSE:
        // Render final game state
        renderWorld(p, world, gameState.camera.x, gameState.camera.y);
        renderEntities(p, gameState.entities, gameState.camera.x, gameState.camera.y);
        renderGameOver(p, gameState.gamePhase === PHASE_GAME_OVER_WIN);
        break;
    }
  };

  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Handle game phase transitions
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === PHASE_START) {
        gameState.gamePhase = PHASE_PLAYING;
        initializeGame(p, world);
        p.logs.game_info.push({
          data: "Game started",
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      return;
    }
    
    if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === PHASE_PLAYING) {
        gameState.gamePhase = PHASE_PAUSED;
        p.logs.game_info.push({
          data: "Game paused",
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === PHASE_PAUSED) {
        gameState.gamePhase = PHASE_PLAYING;
        p.logs.game_info.push({
          data: "Game resumed",
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      return;
    }
    
    if (p.keyCode === 82) { // R
      if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
        gameState.gamePhase = PHASE_START;
        p.logs.game_info.push({
          data: "Game restarted",
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      return;
    }
    
    // Gameplay controls (only in HUMAN mode during PLAYING phase)
    if (gameState.controlMode === "HUMAN" && gameState.gamePhase === PHASE_PLAYING) {
      if (p.keyCode === 37) keys.left = true;   // LEFT
      if (p.keyCode === 39) keys.right = true;  // RIGHT
      if (p.keyCode === 38) keys.up = true;     // UP
      if (p.keyCode === 40) keys.down = true;   // DOWN
      if (p.keyCode === 32) keys.space = true;  // SPACE
      if (p.keyCode === 90) keys.z = true;      // Z
      if (p.keyCode === 16) {                   // SHIFT
        if (!lastShiftState) {
          gameState.craftingOpen = !gameState.craftingOpen;
          lastShiftState = true;
        }
      }
    }
  };

  p.keyReleased = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyReleased",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    if (gameState.controlMode === "HUMAN") {
      if (p.keyCode === 37) keys.left = false;
      if (p.keyCode === 39) keys.right = false;
      if (p.keyCode === 38) keys.up = false;
      if (p.keyCode === 40) keys.down = false;
      if (p.keyCode === 32) keys.space = false;
      if (p.keyCode === 90) keys.z = false;
      if (p.keyCode === 16) lastShiftState = false;
    }
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const btnId = mode === "HUMAN" ? "humanModeBtn" : `${mode.toLowerCase()}_ModeBtn`;
  const btn = document.getElementById(btnId);
  if (btn) {
    btn.classList.add('active');
  }
};