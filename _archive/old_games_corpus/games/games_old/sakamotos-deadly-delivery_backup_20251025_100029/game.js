// game.js - Main game file
import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { levels } from './levels.js';
import { initPhysics, updatePhysics } from './physics.js';
import { Package, Enemy } from './entities.js';
import { drawStartScreen, drawPauseIndicator, drawGameOverScreen, drawHUD, drawGhostObject } from './ui.js';
import { handleKeyPressed, loadLevel, placeObject } from './input.js';
import { setupCollisionHandling, checkGoalCompletion, checkPackageInGoal } from './collision.js';
import { calculateLevelScore, loadHighScores, saveHighScore } from './scoring.js';
import { getTestAction, executeTestAction } from './testing.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let mouseX = 0;
  let mouseY = 0;
  
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
    
    // Initialize physics
    initPhysics();
    setupCollisionHandling();
    
    // Load high scores
    loadHighScores();
    
    // Initial log
    p.logs.game_info.push({
      data: { phase: 'START' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    p.background(30, 35, 45);
    
    // Handle automated testing
    if (gameState.controlMode !== 'HUMAN') {
      const action = getTestAction(p);
      if (action) {
        executeTestAction(p, action);
      }
    }
    
    // Update mouse position
    mouseX = p.mouseX;
    mouseY = p.mouseY;
    
    if (gameState.gamePhase === 'START') {
      drawStartScreen(p);
    } else if (gameState.gamePhase === 'PLAYING') {
      // Update physics
      if (gameState.simulationRunning) {
        updatePhysics();
        
        // Update timer
        const elapsed = (Date.now() - gameState.levelStartTime) / 1000;
        const level = levels[gameState.currentLevel];
        gameState.timeRemaining = level.maxTime - elapsed;
        
        // Check time limit
        if (gameState.timeRemaining <= 0) {
          gameState.levelFailed = true;
        }
        
        // Check goal completion
        checkPackageInGoal();
        if (checkGoalCompletion()) {
          gameState.levelComplete = true;
        }
      }
      
      // Update entities
      gameState.entities.forEach(entity => {
        if (entity.update) {
          entity.update();
        }
      });
      
      // Check level completion/failure
      if (gameState.levelComplete) {
        calculateLevelScore();
        
        if (gameState.currentLevel >= levels.length - 1) {
          // Game won
          saveHighScore();
          gameState.gamePhase = 'GAME_OVER';
          p.logs.game_info.push({
            data: { phase: 'GAME_OVER', result: 'win', all_levels_complete: true },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        } else {
          // Level complete, go to next
          gameState.currentLevel++;
          gameState.firstAttempt = true;
          gameState.resetCount = 0;
          loadLevel(p, gameState.currentLevel);
        }
        gameState.levelComplete = false;
      } else if (gameState.levelFailed) {
        gameState.gamePhase = 'GAME_OVER';
        p.logs.game_info.push({
          data: { phase: 'GAME_OVER', result: 'lose' },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      
      // Render
      drawLevel(p);
      drawHUD(p);
      
      if (gameState.designPhase) {
        drawGhostObject(p, mouseX, mouseY);
      }
      
      // Log player info
      if (gameState.player && p.frameCount % 10 === 0) {
        const pos = gameState.player.getPosition();
        p.logs.player_info.push({
          screen_x: pos.x,
          screen_y: pos.y,
          game_x: pos.x,
          game_y: pos.y,
          framecount: p.frameCount
        });
      }
    } else if (gameState.gamePhase === 'PAUSED') {
      drawLevel(p);
      drawHUD(p);
      drawPauseIndicator(p);
    } else if (gameState.gamePhase === 'GAME_OVER') {
      drawLevel(p);
      const won = gameState.currentLevel >= levels.length || gameState.score > 0;
      drawGameOverScreen(p, won);
    }
  };
  
  function drawLevel(p) {
    // Draw all entities
    gameState.entities.forEach(entity => {
      if (entity.draw) {
        entity.draw(p);
      }
    });
    
    // Draw start position indicator
    const level = levels[gameState.currentLevel];
    if (level && gameState.designPhase) {
      p.push();
      p.fill(180, 180, 180);
      p.stroke(0);
      p.strokeWeight(2);
      p.rectMode(p.CENTER);
      p.rect(level.startPos.x, level.startPos.y, 50, 50);
      
      // Arrow
      p.fill(100);
      p.noStroke();
      p.triangle(
        level.startPos.x + 10, level.startPos.y - 10,
        level.startPos.x + 10, level.startPos.y + 10,
        level.startPos.x + 25, level.startPos.y
      );
      p.pop();
    }
  }
  
  p.keyPressed = function() {
    handleKeyPressed(p, p.key, p.keyCode);
  };
  
  p.mousePressed = function() {
    if (gameState.gamePhase === 'PLAYING' && gameState.designPhase) {
      placeObject(p, p.mouseX, p.mouseY);
      
      p.logs.inputs.push({
        input_type: 'mousePressed',
        data: { x: p.mouseX, y: p.mouseY },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const modes = ['HUMAN', 'TEST_1', 'TEST_2'];
  modes.forEach(m => {
    const btn = document.getElementById(`${m === 'HUMAN' ? 'humanMode' : m.toLowerCase() + '_Mode'}Btn`);
    if (btn) {
      if (m === mode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
  });
  
  console.log('Control mode set to:', mode);
};