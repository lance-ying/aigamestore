// game.js - Main game loop and p5.js instance

import { 
  gameState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  resetGameState,
  getCurrentTask
} from './globals.js';

import { Player } from './entities.js';
import { initializeRooms, getCurrentRoom, navigateToTaskRoom } from './rooms.js';
import { handleKeyPress, handleKeyRelease, handlePlayerMovement, handleInteraction, handleAutomatedAction } from './input.js';
import { renderUI } from './ui.js';

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
    
    // Initialize game state
    gameState.gamePhase = PHASE_START;
    gameState.controlMode = "HUMAN";
    gameState.lastFrameTime = p.millis();
    
    // Initialize rooms
    initializeRooms(p);
    
    // Create player (starts in bedroom)
    gameState.player = new Player(100, CANVAS_HEIGHT - 100);
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    console.log("The White Door - Game Initialized");
  };
  
  p.draw = function() {
    // Update frame count and delta time
    gameState.frameCount = p.frameCount;
    const currentTime = p.millis();
    gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
    gameState.lastFrameTime = currentTime;
    
    // Clear canvas
    p.background(20, 20, 30);
    
    // Handle different game phases
    switch (gameState.gamePhase) {
      case PHASE_START:
        renderUI(p);
        break;
        
      case PHASE_PLAYING:
        updateGame(p);
        renderGame(p);
        renderUI(p);
        break;
        
      case PHASE_PAUSED:
        renderGame(p);
        renderUI(p);
        break;
        
      case PHASE_GAME_OVER_WIN:
      case PHASE_GAME_OVER_LOSE:
        renderGame(p);
        renderUI(p);
        break;
    }
  };
  
  function updateGame(p) {
    // Handle automated testing
    handleAutomatedAction(p);
    
    // Handle player movement
    handlePlayerMovement();
    
    // Handle interaction
    handleInteraction(p);
    
    // Navigate to correct room based on task
    navigateToTaskRoom(p);
    
    // Update player
    if (gameState.player) {
      gameState.player.update(p);
    }
    
    // Update all interactables
    for (const obj of gameState.interactables) {
      obj.update(p);
    }
    
    // Update puzzle if active
    if (gameState.currentPuzzle) {
      gameState.currentPuzzle.update(p);
    }
    
    // Update particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
      gameState.particles[i].update();
      if (gameState.particles[i].isDead()) {
        gameState.particles.splice(i, 1);
      }
    }
    
    // Check win condition
    if (gameState.doorUnlocked && !gameState.taskInProgress) {
      const door = gameState.rooms[gameState.currentRoom].objects.find(obj => obj.constructor.name === 'WhiteDoor');
      if (door && gameState.player) {
        const dx = door.x - gameState.player.x;
        const dy = door.y - gameState.player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 60) {
          gameState.gamePhase = PHASE_GAME_OVER_WIN;
        }
      }
    }
  }
  
  function renderGame(p) {
    // Render current room
    const room = getCurrentRoom();
    if (room) {
      room.render(p);
    }
    
    // Render player
    if (gameState.player) {
      gameState.player.render(p);
    }
    
    // Render particles
    for (const particle of gameState.particles) {
      particle.render(p);
    }
    
    // Render puzzle overlay if active
    if (gameState.currentPuzzle) {
      gameState.currentPuzzle.render(p);
    }
  }
  
  p.keyPressed = function() {
    handleKeyPress(p);
  };
  
  p.keyReleased = function() {
    handleKeyRelease(p);
  };
}, document.body);

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switcher
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  console.log(`Control mode set to: ${mode}`);
  
  // Update button states
  const buttons = {
    'HUMAN': document.getElementById('humanModeBtn'),
    'TEST_1': document.getElementById('test_1_ModeBtn'),
    'TEST_2': document.getElementById('test_2_ModeBtn')
  };
  
  for (const [buttonMode, button] of Object.entries(buttons)) {
    if (button) {
      if (buttonMode === mode) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    }
  }
};