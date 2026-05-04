// game.js - Main game logic

import { gameState, getGameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Player } from './player.js';
import { createRooms } from './room.js';
import { createInteractables } from './interactable.js';
import { ShadowEntity } from './shadow_entity.js';
import { renderStartScreen, renderPauseOverlay, renderGameOver, renderHUD } from './ui.js';
import { handleKeyPressed, handleKeyReleased, processMovement } from './input.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs (write-only)
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize game
    initializeGame();
    
    // Log initialization
    p.logs.game_info.push({
      data: { phase: "START", action: "initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  function initializeGame() {
    // Create rooms
    gameState.rooms = createRooms();
    
    // Create player
    gameState.player = new Player(100, 200, 0);
    gameState.entities.push(gameState.player);
    
    // Create interactables
    gameState.interactables = createInteractables();
    gameState.entities.push(...gameState.interactables);
    
    // Create shadow entity
    gameState.shadowEntity = new ShadowEntity(300, 200, 2);
    gameState.entities.push(gameState.shadowEntity);
  }
  
  p.draw = function() {
    gameState.frameCount = p.frameCount;
    
    // Handle different game phases
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        renderStartScreen(p);
        break;
        
      case GAME_PHASES.PLAYING:
        renderGameplay(p);
        break;
        
      case GAME_PHASES.PAUSED:
        renderGameplay(p);
        renderPauseOverlay(p);
        break;
        
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        renderGameOver(p);
        break;
    }
  };
  
  function renderGameplay(p) {
    // Process automated testing or human input
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action !== null) {
        simulateKeyPress(action);
      }
    } else {
      // Process human movement
      processMovement(p);
    }
    
    // Update game state
    updateGame(p);
    
    // Render
    renderGame(p);
    
    // Log player info periodically
    if (p.frameCount % 30 === 0 && gameState.player) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        framecount: p.frameCount
      });
    }
  }
  
  function updateGame(p) {
    // Update shadow entity
    if (gameState.shadowEntity) {
      gameState.shadowEntity.update(p);
    }
    
    // Update interactables
    for (const interactable of gameState.interactables) {
      interactable.update(p);
    }
  }
  
  function renderGame(p) {
    // Render current room
    const currentRoom = gameState.rooms[gameState.currentRoom];
    if (currentRoom) {
      currentRoom.render(p);
    }
    
    // Render shadow entity
    if (gameState.shadowEntity) {
      gameState.shadowEntity.render(p);
    }
    
    // Render interactables
    for (const interactable of gameState.interactables) {
      if (gameState.currentRoom === Math.floor(gameState.interactables.indexOf(interactable) / 3)) {
        interactable.render(p);
      }
    }
    
    // Render player
    if (gameState.player) {
      gameState.player.render(p);
    }
    
    // Render HUD
    renderHUD(p);
  }
  
  function simulateKeyPress(keyCode) {
    // Simulate holding key for movement
    if ([37, 38, 39, 40, 16].includes(keyCode)) {
      // These are handled by keyIsDown in processMovement
      return;
    }
    
    // Simulate key press for actions
    if (keyCode === 32 && gameState.player) { // SPACE
      gameState.player.interact(p);
    } else if (keyCode === 90 && gameState.player) { // Z
      gameState.player.useItem(p);
    }
  }
  
  p.keyPressed = function() {
    handleKeyPressed(p, p.key, p.keyCode);
  };
  
  p.keyReleased = function() {
    handleKeyReleased(p, p.key, p.keyCode);
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn', 'test_4_ModeBtn'];
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
    'TEST_3': 'test_3_ModeBtn',
    'TEST_4': 'test_4_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};

export default gameInstance;