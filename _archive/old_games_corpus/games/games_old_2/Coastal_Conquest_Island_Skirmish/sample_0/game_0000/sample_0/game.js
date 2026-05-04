// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES } from './globals.js';
import { renderMap } from './map.js';
import { renderUI } from './ui.js';
import { handleKeyPressed, handleMousePressed } from './input.js';
import { updateTestController, setControlMode, resetTestController } from './testController.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.randomSeed(42);
    p.frameRate(60);
    
    // Initialize game state
    gameState.gamePhase = GAME_PHASES.START;
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    p.background(40, 50, 60);
    
    // Update test controller
    updateTestController(p);
    
    // Game rendering based on phase
    if (gameState.gamePhase === GAME_PHASES.START) {
      renderUI(p);
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING || gameState.gamePhase === GAME_PHASES.PAUSED) {
      // Render map
      renderMap(p);
      
      // Render buildings
      gameState.buildings.forEach(building => {
        building.update(p);
        building.render(p);
      });
      
      // Render units
      gameState.playerUnits.forEach(unit => {
        unit.update(p);
        unit.render(p);
      });
      
      gameState.enemyUnits.forEach(unit => {
        unit.update(p);
        unit.render(p);
      });
      
      // Render projectiles
      gameState.projectiles = gameState.projectiles.filter(proj => {
        proj.update();
        proj.render(p);
        return proj.active;
      });
      
      // Render UI
      renderUI(p);
      
      // Log player info periodically
      if (p.frameCount % 60 === 0 && gameState.playerHQ) {
        p.logs.player_info.push({
          screen_x: gameState.playerHQ.x,
          screen_y: gameState.playerHQ.y,
          game_x: gameState.playerHQ.gridX,
          game_y: gameState.playerHQ.gridY,
          framecount: p.frameCount
        });
      }
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
               gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      renderUI(p);
    }
    
    // Paused indicator (small text in top right)
    if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      p.fill(255, 255, 100);
      p.textAlign(p.RIGHT, p.TOP);
      p.textSize(12);
      p.text("PAUSED", CANVAS_WIDTH - 10, 10);
    }
  };
  
  p.keyPressed = function() {
    if (gameState.controlMode === 'HUMAN') {
      handleKeyPressed(p, p.key, p.keyCode);
    }
    return false;
  };
  
  p.mousePressed = function() {
    if (gameState.controlMode === 'HUMAN') {
      handleMousePressed(p, p.mouseX, p.mouseY);
    }
    return false;
  };
});

// Expose globally
window.gameInstance = gameInstance;

window.getGameState = function() {
  return gameState;
};

window.setControlMode = function(mode) {
  setControlMode(mode);
  resetTestController();
};

// Initial control mode
setControlMode('HUMAN');