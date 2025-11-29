// game.js - Main game loop and p5.js instance

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  GAME_DURATION,
  FLASHLIGHT_DRAIN_RATE,
  NOISE_DECAY_RATE,
  MAMA_SPAWN_THRESHOLD
} from './globals.js';
import { Player, Tattletail, Mama } from './entities.js';
import { handleKeyPress, handleKeyRelease, updatePlayerInput, processAutomatedAction } from './input.js';
import { renderStartScreen, renderHUD, renderPausedOverlay, renderGameOver } from './ui.js';
import { renderFirstPersonView, renderMinimap } from './renderer.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

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
    gameState.gamePhase = "START";
    gameState.controlMode = "HUMAN";
    gameState.frameCount = 0;
    gameState.lastFrameTime = p.millis();
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Update frame count
    gameState.frameCount = p.frameCount;
    
    // Update delta time
    const currentTime = p.millis();
    gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
    gameState.lastFrameTime = currentTime;
    
    // Clear screen
    p.background(10, 5, 15);
    
    // Update and render based on game phase
    switch (gameState.gamePhase) {
      case "START":
        renderStartScreen(p);
        break;
        
      case "PLAYING":
        updateGame(p);
        renderGame(p);
        break;
        
      case "PAUSED":
        renderGame(p);
        renderPausedOverlay(p);
        break;
        
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        renderGame(p);
        renderGameOver(p);
        break;
    }
  };
  
  p.keyPressed = function() {
    handleKeyPress(p);
  };
  
  p.keyReleased = function() {
    handleKeyRelease(p);
  };
  
  function updateGame(p) {
    // Process automated testing input
    if (gameState.controlMode !== "HUMAN") {
      const action = get_automated_testing_action(gameState);
      if (action) {
        processAutomatedAction(action);
      }
    }
    
    // Update player input
    updatePlayerInput(p);
    
    // Update entities
    if (gameState.player) {
      gameState.player.update(p);
    }
    
    if (gameState.tattletail) {
      gameState.tattletail.update(p);
    }
    
    if (gameState.mama) {
      gameState.mama.update(p);
    }
    
    // Update flashlight battery
    if (gameState.flashlightOn) {
      gameState.flashlightBattery -= FLASHLIGHT_DRAIN_RATE;
      if (gameState.flashlightBattery <= 0) {
        gameState.flashlightBattery = 0;
        gameState.flashlightOn = false;
      }
    }
    
    // Decay noise level
    gameState.noiseLevel = Math.max(0, gameState.noiseLevel - NOISE_DECAY_RATE);
    
    // Spawn Mama if noise is too high
    if (gameState.noiseLevel > MAMA_SPAWN_THRESHOLD && !gameState.mamaSpawned) {
      if (gameState.mama && gameState.player) {
        // Spawn Mama in a random location away from player
        const angle = Math.random() * Math.PI * 2;
        const distance = 300;
        const spawnX = gameState.player.x + Math.cos(angle) * distance;
        const spawnY = gameState.player.y + Math.sin(angle) * distance;
        gameState.mama.spawn(spawnX, spawnY);
      }
    }
    
    // Update timer
    if (gameState.gameStartTime > 0) {
      const elapsed = (Date.now() - gameState.gameStartTime) / 1000;
      gameState.timeRemaining = Math.max(0, GAME_DURATION - elapsed);
      
      // Check win condition
      if (gameState.timeRemaining <= 0) {
        gameState.gamePhase = "GAME_OVER_WIN";
        p.logs.game_info.push({
          data: { gamePhase: "GAME_OVER_WIN" },
          framecount: gameState.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
  
  function renderGame(p) {
    // Render first-person view
    renderFirstPersonView(p);
    
    // Render HUD
    renderHUD(p);
    
    // Render minimap
    renderMinimap(p);
  }
});

// Initialize game entities
export function initGame(p) {
  // Clear entities
  gameState.entities = [];
  
  // Create player in center of house
  gameState.player = new Player(400, 300);
  
  // Create Tattletail in living room
  gameState.tattletail = new Tattletail(150, 450);
  
  // Create Mama (inactive)
  gameState.mama = new Mama();
  
  // Reset game variables
  gameState.score = 0;
  gameState.timeRemaining = GAME_DURATION;
  gameState.noiseLevel = 0;
  gameState.flashlightOn = false;
  gameState.flashlightBattery = 100;
  gameState.mamaSpawned = false;
  gameState.mamaActive = false;
  gameState.gameStartTime = Date.now();
}

// Reset game
export function resetGame(p) {
  gameState.entities = [];
  gameState.player = null;
  gameState.tattletail = null;
  gameState.mama = null;
  gameState.score = 0;
  gameState.timeRemaining = GAME_DURATION;
  gameState.noiseLevel = 0;
  gameState.flashlightOn = false;
  gameState.flashlightBattery = 100;
  gameState.mamaSpawned = false;
  gameState.mamaActive = false;
  gameState.gameStartTime = 0;
  gameState.keys = {};
}

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