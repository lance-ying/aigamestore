// game.js - Main game file with p5.js instance

import { GAME_PHASES, gameState, CANVAS_WIDTH, CANVAS_HEIGHT, getGameState } from './globals.js';
import { setP5Instance, handleKeyPressed, handleKeyReleased, processGameplayInputs } from './input_handler.js';
import { updateUnits, updateChampionCooldown, checkWinCondition, checkLoseCondition, calculateFinalScore, updateEnemySpawning, updateEnemyUnits } from './game_logic.js';
import { drawStartScreen, drawGameUI, drawPauseOverlay, drawGameOverScreen, drawBackground } from './rendering.js';
import './automated_testing_controller.js';

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
    p.frameRate(60);
    p.randomSeed(42);
    
    setP5Instance(p);
    
    // Initial log
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    if (gameState.gamePhase === GAME_PHASES.START) {
      drawStartScreen(p);
      return;
    }
    
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      // Draw background
      drawBackground(p);
      
      // Process inputs
      processGameplayInputs(p);
      
      // Update game state
      updateUnits(p.frameCount);
      updateChampionCooldown();
      updateEnemySpawning();
      updateEnemyUnits();
      
      // Update gates
      for (const gate of gameState.gates) {
        gate.update(p.frameCount);
      }
      
      // Draw game objects
      for (const speedPad of gameState.speedPads) {
        speedPad.draw(p);
      }
      
      for (const gate of gameState.gates) {
        gate.draw(p);
      }
      
      for (const obstacle of gameState.obstacles) {
        obstacle.draw(p);
      }
      
      for (const unit of gameState.units) {
        unit.draw(p);
      }
      
      for (const enemy of gameState.enemyUnits) {
        enemy.draw(p);
      }
      
      if (gameState.enemyBase) {
        gameState.enemyBase.draw(p);
      }
      
      if (gameState.cannon) {
        gameState.cannon.draw(p);
      }
      
      // Draw UI
      drawGameUI(p);
      
      // Log player info periodically
      if (p.frameCount % 30 === 0 && gameState.cannon) {
        p.logs.player_info.push({
          screen_x: gameState.cannon.x,
          screen_y: gameState.cannon.y,
          game_x: gameState.cannon.x,
          game_y: gameState.cannon.y,
          framecount: p.frameCount
        });
      }
      
      // Check lose condition
      if (checkLoseCondition()) {
        calculateFinalScore();
        gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
        
        p.logs.game_info.push({
          data: { 
            gamePhase: gameState.gamePhase,
            score: gameState.score
          },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      
      // Check win condition
      if (checkWinCondition()) {
        calculateFinalScore();
        gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
        
        p.logs.game_info.push({
          data: { 
            gamePhase: gameState.gamePhase,
            score: gameState.score,
            rank: gameState.finalRank
          },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      // Keep drawing the game
      drawBackground(p);
      
      for (const speedPad of gameState.speedPads) {
        speedPad.draw(p);
      }
      
      for (const gate of gameState.gates) {
        gate.draw(p);
      }
      
      for (const obstacle of gameState.obstacles) {
        obstacle.draw(p);
      }
      
      for (const unit of gameState.units) {
        unit.draw(p);
      }
      
      for (const enemy of gameState.enemyUnits) {
        enemy.draw(p);
      }
      
      if (gameState.enemyBase) {
        gameState.enemyBase.draw(p);
      }
      
      if (gameState.cannon) {
        gameState.cannon.draw(p);
      }
      
      drawGameUI(p);
      drawPauseOverlay(p);
    }
    
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      drawGameOverScreen(p);
    }
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p);
  };
  
  p.keyReleased = function() {
    handleKeyReleased(p);
  };
});

// Expose globally
window.gameInstance = gameInstance;
window.getGameState = getGameState;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn', 'test_4_ModeBtn', 'test_5_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn',
    'TEST_3': 'test_3_ModeBtn',
    'TEST_4': 'test_4_ModeBtn',
    'TEST_5': 'test_5_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};

export default gameInstance;