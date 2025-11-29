// game.js - Main game file
import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  TARGET_FPS,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  CONTROL_HUMAN
} from './globals.js';
import { Player } from './player.js';
import { RoomManager } from './room_manager.js';
import { Renderer } from './renderer.js';
import { InputHandler } from './input_handler.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let roomManager;
  let renderer;
  let inputHandler;
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      "game_info": [],
      "inputs": [],
      "player_info": []
    };
    
    // Log game start
    p.logs.game_info.push({
      data: { phase: PHASE_START, message: "Game initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Initialize game systems
    roomManager = new RoomManager();
    renderer = new Renderer(p);
    
    // Initialize player
    gameState.player = new Player(300, 300);
    gameState.entities.push(gameState.player);
    inputHandler = new InputHandler(p, gameState.player);
    
    // Load first room (but don't start game yet)
    roomManager.loadRoom(0);
  };
  
  p.draw = function() {
    gameState.frameCount = p.frameCount;
    
    // Handle different game phases
    switch (gameState.gamePhase) {
      case PHASE_START:
        renderer.drawStartScreen();
        break;
        
      case PHASE_PLAYING:
        // Handle automated testing input
        if (gameState.controlMode !== CONTROL_HUMAN) {
          const action = get_automated_testing_action(gameState);
          inputHandler.handleAutomatedInput(action);
        } else {
          inputHandler.handleInput();
        }
        
        // Update game state
        updateGame();
        
        // Render
        renderer.drawPlayingScreen(roomManager);
        break;
        
      case PHASE_PAUSED:
        renderer.drawPlayingScreen(roomManager);
        renderer.drawPauseIndicator();
        break;
        
      case PHASE_GAME_OVER_WIN:
        renderer.drawGameOverScreen();
        break;
    }
  };
  
  function updateGame() {
    // Update player
    if (gameState.player) {
      gameState.player.update();
      
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
    }
    
    // Update Oculus energy
    if (gameState.oculusActive) {
      gameState.oculusEnergy -= gameState.oculusDrainRate;
      if (gameState.oculusEnergy <= 0) {
        gameState.oculusEnergy = 0;
        gameState.oculusActive = false;
      }
    } else {
      gameState.oculusEnergy += gameState.oculusRechargeRate;
      gameState.oculusEnergy = Math.min(100, gameState.oculusEnergy);
    }
    
    // Check room completion
    if (roomManager.checkRoomCompletion()) {
      const hasNextRoom = roomManager.progressToNextRoom();
      if (!hasNextRoom) {
        // Game won!
        transitionToPhase(PHASE_GAME_OVER_WIN);
      }
    }
  }
  
  function transitionToPhase(newPhase) {
    const oldPhase = gameState.gamePhase;
    gameState.gamePhase = newPhase;
    
    p.logs.game_info.push({
      data: { phase: newPhase, previousPhase: oldPhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    if (newPhase === PHASE_PLAYING) {
      p.loop();
    } else if (newPhase === PHASE_PAUSED) {
      p.noLoop();
    }
  }
  
  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Phase transition keys
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === PHASE_START) {
        transitionToPhase(PHASE_PLAYING);
      }
    } else if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === PHASE_PLAYING) {
        transitionToPhase(PHASE_PAUSED);
      } else if (gameState.gamePhase === PHASE_PAUSED) {
        transitionToPhase(PHASE_PLAYING);
      }
    } else if (p.keyCode === 82) { // R
      if (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
          gameState.gamePhase === PHASE_PAUSED ||
          gameState.gamePhase === PHASE_PLAYING) {
        restartGame();
      }
    }
    
    // Gameplay keys (only in PLAYING phase and HUMAN mode)
    if (gameState.gamePhase === PHASE_PLAYING && gameState.controlMode === CONTROL_HUMAN) {
      if (p.keyCode === 90) { // Z - interact
        inputHandler.handleInteraction();
      } else if (p.keyCode === 32) { // SPACE - toggle oculus
        inputHandler.toggleOculus();
      }
    }
    
    return false; // Prevent default
  };
  
  function restartGame() {
    // Reset game state
    gameState.score = 0;
    gameState.currentRoom = 0;
    gameState.roomsCompleted = 0;
    gameState.puzzlesSolved = 0;
    gameState.oculusActive = false;
    gameState.oculusEnergy = 100;
    gameState.cameraAngle = 0;
    gameState.cameraPitch = 0;
    gameState.targetElement = null;
    
    // Reset player
    gameState.player = new Player(300, 300);
    gameState.entities = [gameState.player];
    inputHandler = new InputHandler(p, gameState.player);
    
    // Reload first room
    roomManager.loadRoom(0);
    
    // Go to start screen
    transitionToPhase(PHASE_START);
    
    p.logs.game_info.push({
      data: { message: "Game restarted" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
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
  
  gameInstance.logs.game_info.push({
    data: { controlMode: mode },
    framecount: gameInstance.frameCount,
    timestamp: Date.now()
  });
};