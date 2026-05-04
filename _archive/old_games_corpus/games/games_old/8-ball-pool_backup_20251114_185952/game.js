// game.js - Main game file
const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Body } = Matter;

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { initializeGame, updateGame, executeShot, resetGame } from './gameLogic.js';
import { setupPhysics } from './physics.js';
import { renderStartScreen, renderGame, renderPausedOverlay, renderGameOver } from './rendering.js';

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Create Matter.js engine and world
    const engine = Engine.create();
    const world = engine.world;
    world.gravity.y = 0; // No gravity for pool table
    
    gameState.engine = engine;
    gameState.world = world;
    
    // Setup physics
    setupPhysics(p);
    
    // Initialize p5.logs
    p.logs = {
      game_info: [],
      player_info: [],
      inputs: []
    };
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Initialize game
    initializeGame(p);
  };
  
  p.draw = function() {
    // Update Matter.js physics with multiple substeps to prevent tunneling
    const substeps = 4;
    const timestep = (1000 / 60) / substeps;
    for (let i = 0; i < substeps; i++) {
      Engine.update(gameState.engine, timestep);
    }
    
    // Handle continuous input for aiming and power
    handleContinuousInput(p);
    
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
        renderGameOver(p);
        break;
    }
  };
  
  function handleContinuousInput(p) {
    // Only handle continuous input during player's aiming phase
    if (gameState.gamePhase !== "PLAYING" || 
        gameState.playingPhase !== "AIMING" || 
        gameState.currentTurn !== "PLAYER" || 
        gameState.controlMode !== "HUMAN") {
      return;
    }
    
    // Continuous aim adjustment
    if (p.keyIsDown(37)) { // Arrow Left
      if (!p.keyIsDown(16)) { // Not holding Shift
        gameState.aimAngle -= 0.02;
      }
    }
    
    if (p.keyIsDown(39)) { // Arrow Right
      if (!p.keyIsDown(16)) { // Not holding Shift
        gameState.aimAngle += 0.02;
      }
    }
    
    // Continuous power adjustment
    if (p.keyIsDown(38)) { // Arrow Up
      if (!p.keyIsDown(16)) { // Not holding Shift
        gameState.shotPower = Math.min(gameState.maxShotPower, gameState.shotPower + 1);
      }
    }
    
    if (p.keyIsDown(40)) { // Arrow Down
      if (!p.keyIsDown(16)) { // Not holding Shift
        gameState.shotPower = Math.max(0, gameState.shotPower - 1);
      }
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
    
    // Phase control keys
    if (p.keyCode === 13 && gameState.gamePhase === "START") { // ENTER
      gameState.gamePhase = "PLAYING";
      p.logs.game_info.push({
        data: { gamePhase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    if (p.keyCode === 27) { // ESC - Pause/Unpause
      if (gameState.gamePhase === "PLAYING") {
        gameState.gamePhase = "PAUSED";
        p.logs.game_info.push({
          data: { gamePhase: "PAUSED" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === "PAUSED") {
        gameState.gamePhase = "PLAYING";
        p.logs.game_info.push({
          data: { gamePhase: "PLAYING" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    if (p.keyCode === 82) { // R - Restart
      if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE" || gameState.gamePhase === "PAUSED") {
        gameState.level = 1;
        gameState.score = 0;
        resetGame(p);
        gameState.gamePhase = "START";
        p.logs.game_info.push({
          data: { gamePhase: "START" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // Gameplay controls (only during PLAYING phase)
    if (gameState.gamePhase === "PLAYING" && gameState.playingPhase === "AIMING" && gameState.currentTurn === "PLAYER" && gameState.controlMode === "HUMAN") {
      // Spin controls (discrete)
      if (p.keyCode === 37 && p.keyIsDown(16)) { // Shift + Left = Left spin
        gameState.spinEffect.x = Math.max(-1, gameState.spinEffect.x - 0.2);
      }
      
      if (p.keyCode === 39 && p.keyIsDown(16)) { // Shift + Right = Right spin
        gameState.spinEffect.x = Math.min(1, gameState.spinEffect.x + 0.2);
      }
      
      if (p.keyCode === 38 && p.keyIsDown(16)) { // Shift + Up = Top spin
        gameState.spinEffect.y = Math.max(-1, gameState.spinEffect.y - 0.2);
      }
      
      if (p.keyCode === 40 && p.keyIsDown(16)) { // Shift + Down = Back spin
        gameState.spinEffect.y = Math.min(1, gameState.spinEffect.y + 0.2);
      }
      
      // Execute shot
      if (p.keyCode === 32) { // Space
        if (gameState.shotPower > 0) {
          executeShot(p);
        }
      }
      
      // Ball placement confirmation
      if (p.keyCode === 90 && gameState.ballInHand) { // Z
        gameState.ballInHand = false;
      }
    }
    
    // Next level
    if (p.keyCode === 13 && gameState.gamePhase === "GAME_OVER_WIN") { // ENTER
      if (gameState.level < 4) {
        gameState.level++;
        resetGame(p);
        gameState.gamePhase = "PLAYING";
        p.logs.game_info.push({
          data: { gamePhase: "PLAYING", level: gameState.level },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    return false; // Prevent default
  };
});

// Expose globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  if (mode === "HUMAN") {
    document.getElementById('humanModeBtn').classList.add('active');
  } else if (mode === "TEST_1") {
    document.getElementById('test_1_ModeBtn').classList.add('active');
  } else if (mode === "TEST_2") {
    document.getElementById('test_2_ModeBtn').classList.add('active');
  }
};