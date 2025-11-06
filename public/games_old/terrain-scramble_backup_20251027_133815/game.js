// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { setupMatter } from './matter-setup.js';
import { Vehicle } from './vehicle.js';
import { TerrainManager, isVehicleOnGround } from './terrain.js';
import { spawnFuelCanister } from './fuel.js';
import { handleKeyPressed, handleKeyReleased, getPlayerInput } from './input.js';
import { updateGameLogic, handleLevelComplete } from './game-logic.js';
import { addParticleEffect, updateParticles } from './particles.js';
import { renderGame, renderStartScreen, renderGameOver, renderLevelComplete } from './render.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let physics;
  let terrainManager;
  
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
    
    // Setup Matter.js
    physics = setupMatter();
    
    // Initialize terrain manager
    terrainManager = new TerrainManager(physics, p);
    
    // Load high score
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('terrainScrambleHighScore');
      if (saved) {
        gameState.highScore = parseInt(saved);
      }
    }
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: "START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    p.background(135, 206, 235);
    
    // Handle game phases
    if (gameState.gamePhase === "START") {
      renderStartScreen(p);
    } else if (gameState.gamePhase === "PLAYING") {
      // Initialize game objects if needed
      if (!gameState.player || !gameState.player.vehicle) {
        const startX = gameState.distance > 0 ? gameState.distance * 10 + 100 : 100;
        const vehicle = new Vehicle(startX, 200, physics);
        gameState.player = {
          vehicle: vehicle,
          x: startX,
          y: 200,
          rotation: 0,
          velocityX: 0,
          velocityY: 0
        };
        
        // Initialize terrain if empty
        if (gameState.terrainSegments.length === 0) {
          terrainManager.initialize();
        }
      }
      
      // Update physics
      physics.Engine.update(physics.engine, 1000 / 60);
      
      // Handle input
      const input = getPlayerInput(p);
      if (input.accelerate) {
        gameState.player.vehicle.applyAcceleration();
        
        // Exhaust particles
        if (p.frameCount % 5 === 0) {
          const pos = gameState.player.vehicle.rearWheel.position;
          addParticleEffect(pos.x - 10, pos.y, 'exhaust');
        }
      }
      if (input.brake) {
        gameState.player.vehicle.applyBrake();
      }
      
      // Update vehicle
      gameState.player.vehicle.update();
      
      // Update game logic
      updateGameLogic(p, gameState.player.vehicle, gameState.terrainSegments);
      
      // Spawn fuel canisters
      spawnFuelCanister(physics, gameState.terrainSegments, p);
      
      // Update terrain
      terrainManager.update(gameState.camera.x);
      
      // Update particles
      updateParticles();
      
      // Render
      renderGame(p, gameState.player.vehicle, terrainManager);
      
    } else if (gameState.gamePhase === "LEVEL_COMPLETE") {
      // Continue physics and rendering
      if (gameState.player && gameState.player.vehicle) {
        physics.Engine.update(physics.engine, 1000 / 60);
        gameState.player.vehicle.update();
      }
      
      renderGame(p, gameState.player?.vehicle, terrainManager);
      renderLevelComplete(p);
      
      handleLevelComplete(p);
      
    } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
      renderGame(p, gameState.player?.vehicle, terrainManager);
      renderGameOver(p);
      
    } else if (gameState.gamePhase === "PAUSED") {
      renderGame(p, gameState.player?.vehicle, terrainManager);
    }
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p, p.keyCode);
    return false;
  };
  
  p.keyReleased = function() {
    handleKeyReleased(p, p.keyCode);
    return false;
  };
});

// Expose the game instance globally
window.gameInstance = gameInstance;

// Control mode setter
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
  
  const activeBtn = document.getElementById(`${mode === 'HUMAN' ? 'human' : mode.toLowerCase()}ModeBtn`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};