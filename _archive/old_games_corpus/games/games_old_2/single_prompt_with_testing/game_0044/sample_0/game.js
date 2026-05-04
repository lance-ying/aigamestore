// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, GAMEPLAY_OVERWORLD, GAMEPLAY_COMBAT, TILE_SIZE } from './globals.js';
import { Character, PlayerEntity } from './entities.js';
import { GameMap } from './map.js';
import { initiateCombat, updateCombat } from './combat.js';
import { handleKeyPressed, handleKeyReleased } from './input.js';
import { renderStartScreen, renderOverworld, renderCombat, renderPauseOverlay, renderGameOver } from './rendering.js';
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
    
    // Initialize game state
    initializeGame(p);
    
    // Log initial state
    p.logs.game_info.push({
      data: { event: "setup_complete", gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === PHASE_PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action && action.keyCode) {
        handleKeyPressed(p, String.fromCharCode(action.keyCode), action.keyCode);
        // Small delay between automated actions
        if (p.frameCount % 5 === 0) {
          handleKeyReleased(p, action.keyCode);
        }
      }
    }
    
    // Render based on game phase
    if (gameState.gamePhase === PHASE_START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === PHASE_PLAYING) {
      if (gameState.gameplayState === GAMEPLAY_OVERWORLD) {
        updateOverworld(p);
        renderOverworld(p);
      } else if (gameState.gameplayState === GAMEPLAY_COMBAT) {
        updateCombat(p);
        renderCombat(p);
      }
      
      if (gameState.gamePhase === PHASE_PAUSED) {
        renderPauseOverlay(p);
      }
    } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN) {
      renderGameOver(p, true);
    } else if (gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      renderGameOver(p, false);
    }
    
    // Log player info periodically
    if (gameState.player && p.frameCount % 30 === 0) {
      p.logs.player_info.push({
        screen_x: gameState.player.x - gameState.camera.x,
        screen_y: gameState.player.y - gameState.camera.y,
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
    return false; // Prevent default
  };
  
  p.keyReleased = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyReleased(p, p.keyCode);
    }
    return false;
  };
  
  function initializeGame(p) {
    // Create map
    gameState.map = new GameMap(p);
    
    // Create player entity
    gameState.player = new PlayerEntity(64, 64);
    
    // Create party
    gameState.party = [
      new Character("Draven", 100, 50, 20, 10, "FIRE"),
      new Character("Selene", 90, 60, 18, 8, "ICE"),
      new Character("Zephyr", 85, 65, 22, 7, "LIGHTNING")
    ];
    
    gameState.entities = [gameState.player, ...gameState.party];
    
    // Initialize camera
    updateCamera();
  }
  
  function updateOverworld(p) {
    // Update player movement
    if (gameState.player) {
      gameState.player.update();
      updateCamera();
    }
    
    // Random encounters
    if (!gameState.player.isMoving) {
      gameState.encounterTimer++;
      
      // Chance of encounter increases over time
      const encounterChance = Math.min(0.02, gameState.encounterTimer * 0.0001);
      if (p.random() < encounterChance) {
        gameState.encounterTimer = 0;
        gameState.gameplayState = GAMEPLAY_COMBAT;
        initiateCombat(p);
      }
    }
  }
  
  function updateCamera() {
    if (!gameState.player) return;
    
    // Center camera on player
    gameState.camera.x = gameState.player.x - CANVAS_WIDTH / 2;
    gameState.camera.y = gameState.player.y - CANVAS_HEIGHT / 2;
    
    // Clamp camera to map bounds
    const maxCameraX = gameState.map.width * TILE_SIZE - CANVAS_WIDTH;
    const maxCameraY = gameState.map.height * TILE_SIZE - CANVAS_HEIGHT;
    
    gameState.camera.x = Math.max(0, Math.min(maxCameraX, gameState.camera.x));
    gameState.camera.y = Math.max(0, Math.min(maxCameraY, gameState.camera.y));
  }
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ["humanModeBtn", "test_1_ModeBtn", "test_2_ModeBtn", "test_3_ModeBtn", "test_4_ModeBtn"];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove("active");
    }
  });
  
  const modeMap = {
    "HUMAN": "humanModeBtn",
    "TEST_1": "test_1_ModeBtn",
    "TEST_2": "test_2_ModeBtn",
    "TEST_3": "test_3_ModeBtn",
    "TEST_4": "test_4_ModeBtn"
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add("active");
  }
};