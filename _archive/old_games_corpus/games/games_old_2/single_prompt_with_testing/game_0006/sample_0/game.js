// game.js - Main game file

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { initializeWorld, updateGenreBasedOnPosition, drawWorld } from './world.js';
import { handleKeyPressed, processAutomatedInput } from './input.js';
import { updateCardBattle, drawCardBattle } from './card_battle.js';
import { drawUI } from './ui.js';

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
    
    // Initialize world
    initializeWorld(p);
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    p.background(30, 30, 35);
    
    gameState.frameCount = p.frameCount;
    
    if (gameState.gamePhase === GAME_PHASES.START) {
      drawUI(p);
      return;
    }
    
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      drawUI(p);
      return;
    }
    
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      // Process automated input
      processAutomatedInput(p);
      
      // Update camera
      updateCamera(p);
      
      // Update game
      updateGame(p);
      
      // Render game
      renderGame(p);
      
      // Check game over conditions
      checkGameOverConditions(p);
      
      // Log player info periodically
      if (p.frameCount % 10 === 0 && gameState.player) {
        p.logs.player_info.push({
          screen_x: gameState.player.x - gameState.cameraX,
          screen_y: gameState.player.y - gameState.cameraY,
          game_x: gameState.player.x,
          game_y: gameState.player.y,
          framecount: p.frameCount
        });
      }
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      // Render game without updating
      renderGame(p);
    }
    
    // Always draw UI on top
    drawUI(p);
  };
  
  function updateGame(p) {
    // Update genre based on position
    updateGenreBasedOnPosition(p);
    
    // Update all entities
    for (let i = gameState.entities.length - 1; i >= 0; i--) {
      const entity = gameState.entities[i];
      if (entity && entity.update) {
        entity.update(p);
      }
      
      // Remove inactive entities
      if (entity.active === false) {
        gameState.entities.splice(i, 1);
        
        // Also remove from specific arrays
        const enemyIndex = gameState.enemies.indexOf(entity);
        if (enemyIndex > -1) gameState.enemies.splice(enemyIndex, 1);
        
        const projectileIndex = gameState.projectiles.indexOf(entity);
        if (projectileIndex > -1) gameState.projectiles.splice(projectileIndex, 1);
      }
    }
    
    // Update card battle
    updateCardBattle(p);
  }
  
  function renderGame(p) {
    p.push();
    
    // Apply camera transform
    p.translate(-gameState.cameraX, -gameState.cameraY);
    
    // Draw world
    drawWorld(p);
    
    // Draw all entities
    for (let entity of gameState.entities) {
      if (entity && entity.draw) {
        entity.draw(p);
      }
    }
    
    p.pop();
    
    // Draw card battle overlay (no camera transform)
    drawCardBattle(p);
  }
  
  function updateCamera(p) {
    if (!gameState.player) return;
    
    // Center camera on player
    gameState.cameraX = gameState.player.x - CANVAS_WIDTH / 2;
    gameState.cameraY = gameState.player.y - CANVAS_HEIGHT / 2;
    
    // Clamp camera to world bounds
    gameState.cameraX = p.constrain(gameState.cameraX, 0, 
                                     gameState.worldWidth - CANVAS_WIDTH);
    gameState.cameraY = p.constrain(gameState.cameraY, 0, 
                                     gameState.worldHeight - CANVAS_HEIGHT);
  }
  
  function checkGameOverConditions(p) {
    if (gameState.playerHealth <= 0) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase, reason: "health_depleted" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  p.keyPressed = function() {
    handleKeyPressed(p, p.keyCode);
    return false; // Prevent default
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switcher
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
  }
};