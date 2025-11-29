// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, LEVELS } from './globals.js';
import { Buddy } from './buddy.js';
import { handleKeyPressed, handleKeyReleased, initializeLevel } from './input.js';
import { renderStartScreen, renderPausedOverlay, renderGameOverScreen, renderHUD } from './ui.js';
import { getTestAction, executeTestAction } from './testing.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let currentGravity = 0.5;
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.randomSeed(42);
    p.frameRate(60);
    
    // Initialize logs
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Initialize Buddy
    gameState.buddy = new Buddy(300, 200);
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: GAME_PHASES.START },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN") {
      const action = getTestAction(p);
      if (action) {
        executeTestAction(p, action);
        if (action.keyCode) {
          handleKeyPressed(p, String.fromCharCode(action.keyCode), action.keyCode);
        }
      }
    }
    
    // Render based on game phase
    if (gameState.gamePhase === GAME_PHASES.START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updateGame(p);
      renderGame(p);
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      renderGame(p);
      renderPausedOverlay(p);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
               gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      renderGameOverScreen(p, gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN);
    }
  };
  
  function updateGame(p) {
    // Get current level gravity
    const levelIndex = gameState.currentLevel - 1;
    currentGravity = LEVELS[levelIndex]?.gravity || 0.5;
    
    // Update Buddy
    if (gameState.buddy) {
      gameState.buddy.update(currentGravity);
      
      // Log player info periodically
      if (p.frameCount % 10 === 0) {
        p.logs.player_info.push({
          screen_x: gameState.buddy.x,
          screen_y: gameState.buddy.y,
          game_x: gameState.buddy.x,
          game_y: gameState.buddy.y,
          framecount: p.frameCount
        });
      }
      
      // Check if Buddy is airborne
      if (!gameState.buddy.isOnGround()) {
        gameState.airborneFrames++;
        if (gameState.airborneFrames > 30 && gameState.airborneFrames % 60 === 0) {
          gameState.score += 2;
        }
      } else {
        gameState.airborneFrames = 0;
      }
    }
    
    // Update projectiles
    gameState.projectiles.forEach(proj => proj.update(currentGravity));
    gameState.projectiles = gameState.projectiles.filter(proj => proj.active);
    
    // Update particles
    gameState.particles.forEach(particle => particle.update(currentGravity));
    gameState.particles = gameState.particles.filter(particle => particle.active);
    
    // Update combo multiplier
    const timeSinceAction = Date.now() - gameState.lastActionTime;
    if (timeSinceAction < 1000) {
      gameState.comboMultiplier = Math.min(5, gameState.comboMultiplier + 0.01);
    } else {
      gameState.comboMultiplier = Math.max(1, gameState.comboMultiplier - 0.02);
    }
    
    // Update timer
    gameState.levelTimeRemaining--;
    
    // Check win condition
    if (gameState.score >= gameState.levelTargetScore) {
      winLevel(p);
    }
    
    // Check lose condition
    if (gameState.levelTimeRemaining <= 0) {
      loseLevel(p);
    }
  }
  
  function renderGame(p) {
    // Background
    const levelIndex = gameState.currentLevel - 1;
    const bgColors = [
      [40, 40, 60],
      [60, 50, 40],
      [20, 20, 40],
      [50, 40, 40],
      [30, 30, 50]
    ];
    const bgColor = bgColors[levelIndex] || [40, 40, 60];
    p.background(...bgColor);
    
    // Draw arena
    p.stroke(100);
    p.strokeWeight(2);
    p.noFill();
    p.rect(20, 20, 560, 360);
    
    // Draw floor
    p.fill(60, 60, 60);
    p.noStroke();
    p.rect(20, 380, 560, 20);
    
    // Level-specific elements
    if (gameState.currentLevel === 2) {
      // Tables and chairs
      p.fill(80, 60, 40);
      p.rect(100, 340, 60, 40);
      p.rect(450, 340, 60, 40);
    } else if (gameState.currentLevel === 3) {
      // Floating platforms
      p.fill(100, 100, 120);
      p.rect(150, 150, 80, 15);
      p.rect(370, 250, 80, 15);
    }
    
    // Render particles
    gameState.particles.forEach(particle => particle.render(p));
    
    // Render projectiles
    gameState.projectiles.forEach(proj => proj.render(p));
    
    // Render Buddy
    if (gameState.buddy) {
      gameState.buddy.render(p);
    }
    
    // Render HUD
    renderHUD(p);
  }
  
  function winLevel(p) {
    // Update high score
    const levelIndex = gameState.currentLevel - 1;
    if (gameState.score > gameState.highScores[levelIndex]) {
      gameState.highScores[levelIndex] = gameState.score;
    }
    
    // Award bucks
    const bucksEarned = Math.floor(gameState.score / 100);
    gameState.bucks += bucksEarned;
    
    // Check if there's a next level
    if (gameState.currentLevel < LEVELS.length) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
      setTimeout(() => {
        gameState.currentLevel++;
        initializeLevel(p);
        gameState.gamePhase = GAME_PHASES.PLAYING;
      }, 3000);
    } else {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    }
    
    p.logs.game_info.push({
      data: { gamePhase: GAME_PHASES.GAME_OVER_WIN, level: gameState.currentLevel, score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function loseLevel(p) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    
    p.logs.game_info.push({
      data: { gamePhase: GAME_PHASES.GAME_OVER_LOSE, level: gameState.currentLevel, score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, p.key, p.keyCode);
    }
  };
  
  p.keyReleased = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyReleased(p, p.key, p.keyCode);
    }
  };
  
  p.mousePressed = function() {
    if (gameState.controlMode === "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (gameState.buddy && p.mouseY > 60 && p.mouseY < CANVAS_HEIGHT - 60) {
        gameState.buddy.startDrag(p.mouseX, p.mouseY);
      }
    }
  };
  
  p.mouseReleased = function() {
    if (gameState.controlMode === "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (gameState.buddy) {
        gameState.buddy.endDrag(p.mouseX, p.mouseY);
      }
    }
  };
});

// Expose game instance
window.gameInstance = gameInstance;

// Expose getGameState function
window.getGameState = function() {
  return gameState;
};

// Expose setControlMode function
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
  
  if (mode === 'HUMAN') {
    document.getElementById('humanModeBtn')?.classList.add('active');
  } else if (mode === 'TEST_1') {
    document.getElementById('test_1_ModeBtn')?.classList.add('active');
  } else if (mode === 'TEST_2') {
    document.getElementById('test_2_ModeBtn')?.classList.add('active');
  }
};