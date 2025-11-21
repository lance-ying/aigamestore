// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS } from './globals.js';
import { Player } from './player.js';
import { BubbleGrid } from './grid.js';
import { handleKeyPressed, handleKeyReleased, handleContinuousInput, getTestAction, executeTestAction } from './controls.js';
import { updateGame } from './gameLogic.js';
import { drawStartScreen, drawPauseIndicator, drawGameOver, drawUI, drawShooter, drawLaserGuide } from './rendering.js';
import { calculateLaserPath } from './physics.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let bubbleGrid;
  let lastFrameTime = 0;
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Initialize player
    gameState.player = new Player(CANVAS_WIDTH / 2, gameState.shooterY);
    
    // Initialize bubble grid
    bubbleGrid = new BubbleGrid(15, 13, gameState.gridOffsetY);
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: 'START' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    lastFrameTime = Date.now();
  };
  
  p.draw = function() {
    const currentTime = Date.now();
    const deltaTime = (currentTime - lastFrameTime) / 1000;
    lastFrameTime = currentTime;
    
    p.background(15, 20, 35);
    
    // Handle automated testing
    if (gameState.controlMode !== 'HUMAN') {
      const testAction = getTestAction(p, bubbleGrid);
      executeTestAction(testAction, p, bubbleGrid, deltaTime);
    } else {
      handleContinuousInput(p, deltaTime);
    }
    
    // Game phase rendering
    if (gameState.gamePhase === 'START') {
      drawStartScreen(p);
    } else if (gameState.gamePhase === 'PLAYING' || gameState.gamePhase === 'PAUSED') {
      // Draw game
      drawUI(p);
      bubbleGrid.draw(p);
      
      // Draw shooter
      drawShooter(p, CANVAS_WIDTH / 2, gameState.shooterY);
      
      // Draw current and next bubbles
      if (gameState.currentBubble) {
        gameState.currentBubble.draw(p);
        
        // Draw laser guide when not moving
        if (!gameState.currentBubble.isMoving && gameState.laserGuideVisible) {
          const laserPath = calculateLaserPath(
            gameState.currentBubble.x,
            gameState.currentBubble.y,
            gameState.aimAngle,
            500,
            bubbleGrid.getAllBubbles(),
            p
          );
          drawLaserGuide(p, laserPath);
        }
      }
      
      // Draw next bubble preview
      if (gameState.nextBubble) {
        p.push();
        p.textAlign(p.LEFT, p.CENTER);
        p.textSize(12);
        p.fill(200, 200, 200);
        p.text('NEXT:', 15, gameState.shooterY);
        gameState.nextBubble.x = 60;
        gameState.nextBubble.y = gameState.shooterY;
        gameState.nextBubble.draw(p);
        p.pop();
      }
      
      // Update game logic
      if (gameState.gamePhase === 'PLAYING') {
        updateGame(p, bubbleGrid, deltaTime);
        
        // Log player info periodically
        if (p.frameCount % 30 === 0 && gameState.player) {
          p.logs.player_info.push({
            screen_x: gameState.player.x,
            screen_y: gameState.player.y,
            game_x: gameState.player.x,
            game_y: gameState.player.y,
            framecount: p.frameCount
          });
        }
      }
      
      if (gameState.gamePhase === 'PAUSED') {
        drawPauseIndicator(p);
      }
    } else if (gameState.gamePhase.startsWith('GAME_OVER')) {
      // Draw final game state
      drawUI(p);
      bubbleGrid.draw(p);
      drawShooter(p, CANVAS_WIDTH / 2, gameState.shooterY);
      if (gameState.currentBubble) {
        gameState.currentBubble.draw(p);
      }
      
      drawGameOver(p);
    }
  };
  
  p.keyPressed = function() {
    if (gameState.controlMode === 'HUMAN') {
      handleKeyPressed(p, bubbleGrid);
    }
  };
  
  p.keyReleased = function() {
    if (gameState.controlMode === 'HUMAN') {
      handleKeyReleased(p);
    }
  };
});

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
  
  const activeBtn = document.getElementById(mode === 'HUMAN' ? 'humanModeBtn' : `${mode.toLowerCase()}_ModeBtn`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};