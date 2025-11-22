// game.js - Main game file with p5.js instance
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, loadHighScores } from './globals.js';
import { handleKeyPressed, handleKeyReleased } from './input.js';
import { renderGame } from './rendering.js';
import { updateGame, handleLevelUpMenuOpen } from './game_logic.js';
import { getTestingAction, applyTestingAction } from './testing.js';
import { GAME_PHASES } from './globals.js';
import { spawnWave, getWaveDuration } from './waves.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };
  
  let previousGamePhase = null;
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Load high scores
    loadHighScores();
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, action: 'setup' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Handle testing mode
    if (gameState.controlMode !== 'HUMAN') {
      const testAction = getTestingAction(p);
      applyTestingAction(testAction);
    }
    
    // Detect phase changes for level up menu
    if (gameState.gamePhase === GAME_PHASES.LEVEL_UP_MENU && 
        previousGamePhase !== GAME_PHASES.LEVEL_UP_MENU) {
      handleLevelUpMenuOpen(p);
    }
    
    // Detect phase changes for wave complete - spawn next wave
    if (gameState.gamePhase === GAME_PHASES.PLAYING && 
        previousGamePhase === GAME_PHASES.WAVE_COMPLETE) {
      const enemies = spawnWave(p, gameState.currentLevel, gameState.currentWave);
      gameState.enemies = enemies;
      gameState.entities = [gameState.player, ...enemies];
      gameState.enemiesRemainingInWave = enemies.length;
      gameState.waveTimer = getWaveDuration(gameState.currentLevel, gameState.currentWave);
    }
    
    previousGamePhase = gameState.gamePhase;
    
    // Update game logic
    updateGame(p);
    
    // Render
    renderGame(p);
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p, p.keyCode, p.key);
    return false; // Prevent default behavior
  };
  
  p.keyReleased = function() {
    handleKeyReleased(p, p.keyCode, p.key);
    return false;
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;
// Expose level loading for dev mode
window.loadLevel = function(levelNum) {
  const state = window.getGameState ? window.getGameState() : (window.gameState || (window.gameInstance && window.gameInstance.gameState));
  if (state) {
    // Set level using the property this game uses
    state.currentLevel = levelNum;
    state.currentLevel = levelNum; // Also set for compatibility
    // Try common reset/start patterns
    if (typeof resetGame === 'function') {
      resetGame();
    }
    if (typeof startGame === 'function') {
      startGame();
    } else if (state.gamePhase !== undefined) {
      state.gamePhase = "PLAYING";
    }
  }
};
// Expose level loading for dev mode
// Expose level loading for dev mode

// Expose getGameState function
window.getGameState = function() {
  return gameState;
};

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
  
  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  console.log('Control mode set to:', mode);
};