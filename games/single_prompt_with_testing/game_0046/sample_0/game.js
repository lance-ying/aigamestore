// game.js
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, getGameState } from './globals.js';
import { Player } from './player.js';
import { InputHandler } from './input.js';
import { spawnLevel, drawLevel } from './level.js';
import { updateGameLogic } from './game_logic.js';
import { drawUI } from './ui.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let inputHandler;
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      "game_info": [],
      "inputs": [],
      "player_info": []
    };
    
    // Initialize input handler
    inputHandler = new InputHandler(p);
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase, event: 'game_initialized' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    p.background(20, 15, 30);
    
    // Handle automated testing
    if (gameState.controlMode !== 'HUMAN' && gameState.gamePhase === GAME_PHASES.PLAYING) {
      const action = get_automated_testing_action(gameState);
      inputHandler.updateFromAutomated(action);
    } else if (gameState.controlMode === 'HUMAN') {
      inputHandler.updateFromHuman(p);
    }
    
    // Update game logic
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updateGameLogic(p, inputHandler);
    }
    
    // Render
    if (gameState.gamePhase === GAME_PHASES.PLAYING || gameState.gamePhase === GAME_PHASES.PAUSED) {
      drawLevel(p, gameState.cameraX);
      
      // Draw entities
      for (const entity of gameState.entities) {
        if (entity.draw) {
          entity.draw(p, gameState.cameraX);
        }
      }
      
      // Draw projectiles
      for (const proj of gameState.projectiles) {
        proj.draw(p, gameState.cameraX);
      }
      
      // Draw pickups
      for (const pickup of gameState.pickups) {
        pickup.draw(p, gameState.cameraX);
      }
      
      // Draw particles
      for (const particle of gameState.particles) {
        particle.draw(p, gameState.cameraX);
      }
      
      // Draw player last (on top)
      if (gameState.player) {
        gameState.player.draw(p, gameState.cameraX);
      }
    }
    
    // Draw UI
    drawUI(p);
  };
  
  p.keyPressed = function() {
    const { key, keyCode } = p;
    
    inputHandler.handleKeyPressed(p, key, keyCode);
    
    // Game phase transitions
    if (keyCode === 13) { // ENTER
      if (gameState.gamePhase === GAME_PHASES.START) {
        startGame(p);
      }
    } else if (keyCode === 27) { // ESC
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        p.logs.game_info.push({
          data: { gamePhase: gameState.gamePhase, event: 'game_paused' },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        p.logs.game_info.push({
          data: { gamePhase: gameState.gamePhase, event: 'game_resumed' },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (keyCode === 82) { // R
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        resetGame(p);
      }
    }
  };
  
  p.keyReleased = function() {
    const { key, keyCode } = p;
    inputHandler.handleKeyReleased(p, key, keyCode);
  };
  
  function startGame(p) {
    gameState.gamePhase = GAME_PHASES.PLAYING;
    gameState.score = 0;
    gameState.enemiesDefeated = 0;
    gameState.bossDefeated = false;
    gameState.cameraX = 0;
    gameState.entities = [];
    gameState.enemies = [];
    gameState.projectiles = [];
    gameState.pickups = [];
    gameState.particles = [];
    
    // Create player
    gameState.player = new Player(p, 50, 300);
    gameState.entities.push(gameState.player);
    
    // Spawn level
    spawnLevel(p);
    
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase, event: 'game_started' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function resetGame(p) {
    gameState.gamePhase = GAME_PHASES.START;
    gameState.player = null;
    gameState.entities = [];
    gameState.enemies = [];
    gameState.projectiles = [];
    gameState.pickups = [];
    gameState.particles = [];
    gameState.boss = null;
    gameState.score = 0;
    gameState.enemiesDefeated = 0;
    gameState.bossDefeated = false;
    gameState.cameraX = 0;
    
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase, event: 'game_reset' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switcher
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const activeBtn = mode === 'HUMAN' ? 'humanModeBtn' : 
                   mode === 'TEST_1' ? 'test_1_ModeBtn' :
                   mode === 'TEST_2' ? 'test_2_ModeBtn' :
                   mode === 'TEST_3' ? 'test_3_ModeBtn' : null;
  
  if (activeBtn) {
    const btn = document.getElementById(activeBtn);
    if (btn) {
      btn.classList.add('active');
    }
  }
};