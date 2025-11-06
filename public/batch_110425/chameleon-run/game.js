// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, INITIAL_SPEED, MAX_SPEED, SPEED_INCREMENT } from './globals.js';
import { Player } from './player.js';
import { generateLevel } from './level_generator.js';
import { checkCollisions } from './collision.js';
import { renderGame, renderStartScreen, renderGameOverScreen } from './rendering.js';
import { handlePlayingInput, logInput, logPlayerInfo } from './input.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Game instance setup
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
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, message: "Game initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    if (gameState.gamePhase === PHASE_START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === PHASE_PLAYING) {
      updateGame(p);
      renderGame(p);
      
      // Log player info periodically
      if (p.frameCount % 10 === 0) {
        logPlayerInfo(p, gameState.player);
      }
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      renderGame(p);
    } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      renderGame(p);
      renderGameOverScreen(p);
    }
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === PHASE_PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action && action.keyCode) {
        handlePlayingInput(p, action.keyCode);
      }
    }
  };
  
  function updateGame(p) {
    gameState.levelTime++;
    
    // Update player
    if (gameState.player) {
      gameState.player.update();
      
      // Move camera to follow player
      gameState.cameraX = gameState.player.x - 200;
      if (gameState.cameraX < 0) gameState.cameraX = 0;
    }
    
    // Increase speed gradually
    if (gameState.gameSpeed < MAX_SPEED) {
      gameState.gameSpeed += SPEED_INCREMENT;
    }
    
    // Move player forward automatically
    if (gameState.player) {
      gameState.player.x += gameState.gameSpeed;
    }
    
    // Check collisions
    checkCollisions(p);
    
    // Check win condition (reached end of level)
    if (gameState.player && gameState.player.x > gameState.levelLength + 200) {
      gameState.gamePhase = PHASE_GAME_OVER_WIN;
      gameState.levelComplete = true;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase, message: "Level completed!" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  function startGame() {
    gameState.gamePhase = PHASE_PLAYING;
    gameState.score = 0;
    gameState.tokensCollected = 0;
    gameState.levelTime = 0;
    gameState.levelStartTime = Date.now();
    gameState.gameSpeed = INITIAL_SPEED;
    gameState.cameraX = 0;
    gameState.levelComplete = false;
    gameState.deathReason = "";
    
    // Create player
    gameState.player = new Player(p, 100, 300);
    
    // Generate level
    generateLevel(p);
    
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, message: "Game started" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  p.keyPressed = function() {
    logInput(p, "keyPressed", p.key, p.keyCode);
    
    if (gameState.gamePhase === PHASE_START) {
      if (p.keyCode === 13) { // ENTER
        startGame();
      }
    } else if (gameState.gamePhase === PHASE_PLAYING) {
      if (p.keyCode === 27) { // ESC
        gameState.gamePhase = PHASE_PAUSED;
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.controlMode === "HUMAN") {
        handlePlayingInput(p, p.keyCode);
      }
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      if (p.keyCode === 27) { // ESC
        gameState.gamePhase = PHASE_PLAYING;
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      if (p.keyCode === 82) { // R
        gameState.gamePhase = PHASE_START;
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase, message: "Restarting game" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // Prevent default browser behavior
    return false;
  };
  
  p.keyReleased = function() {
    logInput(p, "keyReleased", p.key, p.keyCode);
    return false;
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  if (mode === "HUMAN") {
    document.getElementById('humanModeBtn').classList.add('active');
  } else if (mode === "TEST_1") {
    document.getElementById('test_1_ModeBtn').classList.add('active');
  } else if (mode === "TEST_2") {
    document.getElementById('test_2_ModeBtn').classList.add('active');
  } else if (mode === "TEST_3") {
    document.getElementById('test_3_ModeBtn').classList.add('active');
  } else if (mode === "TEST_4") {
    document.getElementById('test_4_ModeBtn').classList.add('active');
  }
  
  console.log(`Control mode set to: ${mode}`);
};