// game.js - Main game loop and p5 instance

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, getGameState } from './globals.js';
import { initializeLevel, isLevelComplete } from './levelManager.js';
import { handleKeyPressed, handleKeyReleased, updateMovement, updateTestMode } from './input.js';
import { renderGame } from './render.js';
import { checkAndSnapPieces } from './snapLogic.js';
import { getTotalLevels } from './levels.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let lastFrameTime = 0;
  let levelTransitionTimer = 0;
  let isTransitioning = false;
  
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
      event: "setup",
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    const currentTime = Date.now();
    const deltaTime = (currentTime - lastFrameTime) / 1000;
    lastFrameTime = currentTime;
    
    // Update game logic based on phase
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updateGameplay(p, deltaTime);
    }
    
    // Handle level transitions
    if (isTransitioning) {
      levelTransitionTimer -= deltaTime;
      if (levelTransitionTimer <= 0) {
        isTransitioning = false;
        if (gameState.currentLevel <= getTotalLevels()) {
          initializeLevel(p, gameState.currentLevel);
          gameState.gamePhase = GAME_PHASES.PLAYING;
        } else {
          gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
        }
      }
    }
    
    // Update test mode
    if (gameState.controlMode !== "HUMAN") {
      updateTestMode(p);
    }
    
    // Render
    renderGame(p);
    
    // Log player info periodically
    if (p.frameCount % 30 === 0 && gameState.gamePhase === GAME_PHASES.PLAYING) {
      const selectedPiece = gameState.entities.find(piece => piece.id === gameState.selectedPieceId);
      if (selectedPiece) {
        p.logs.player_info.push({
          screen_x: selectedPiece.x,
          screen_y: selectedPiece.y,
          game_x: selectedPiece.x,
          game_y: selectedPiece.y,
          framecount: p.frameCount
        });
      }
    }
  };
  
  function updateGameplay(p, deltaTime) {
    // Update timer
    gameState.timeRemaining -= deltaTime;
    if (gameState.timeRemaining <= 0) {
      gameState.timeRemaining = 0;
      gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
      p.logs.game_info.push({
        event: "game_over",
        reason: "time_up",
        finalScore: gameState.score,
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      return;
    }
    
    // Update movement
    updateMovement(p);
    
    // Check win condition
    if (isLevelComplete()) {
      // Calculate time bonus
      const timeBonus = Math.floor(gameState.timeRemaining * 10);
      gameState.score += 1000 + timeBonus; // Base completion + time bonus
      
      gameState.completedLevels.push(gameState.currentLevel);
      
      p.logs.game_info.push({
        event: "level_complete",
        level: gameState.currentLevel,
        score: gameState.score,
        timeRemaining: gameState.timeRemaining,
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      
      // Start level transition
      if (gameState.currentLevel < getTotalLevels()) {
        gameState.currentLevel++;
        isTransitioning = true;
        levelTransitionTimer = 2.0; // 2 second transition
      } else {
        // All levels complete
        gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
        p.logs.game_info.push({
          event: "all_levels_complete",
          finalScore: gameState.score,
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
  
  p.keyPressed = function() {
    handleKeyPressed(p);
    return false; // Prevent default
  };
  
  p.keyReleased = function() {
    handleKeyReleased(p);
    return false;
  };
});

// Expose game instance and state
window.gameInstance = gameInstance;
window.getGameState = getGameState;

// Control mode switcher
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const buttonId = mode === "HUMAN" ? "humanModeBtn" : `${mode}_ModeBtn`;
  const button = document.getElementById(buttonId);
  if (button) {
    button.classList.add('active');
  }
  
  gameInstance.logs.game_info.push({
    event: "control_mode_change",
    mode: mode,
    framecount: gameInstance.frameCount,
    timestamp: Date.now()
  });
};

export default gameInstance;