// game.js - Main game file

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS } from './globals.js';
import { setupInputHandlers, updateContinuousInput } from './input.js';
import { updateGame, handleTestingControls, setParticleSystem } from './gameLogic.js';
import { renderGame } from './render.js';
import { ParticleSystem } from './particles.js';

const p5 = window.p5;

export let particleSystem = null;

let gameInstance = new p5(p => {
  // Initialize logs (write-only)
  p.logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
  };

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Initialize particle system
    particleSystem = new ParticleSystem();
    setParticleSystem(particleSystem);
    
    // Setup input handlers
    setupInputHandlers(p);
    
    // Log initial game state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Handle continuous input (smooth rotation)
    updateContinuousInput(p);
    
    // Handle automated testing controls
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      handleTestingControls(p);
    }
    
    // Update game logic
    updateGame(p);
    
    // Render
    renderGame(p);
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
  
  const activeBtn = document.getElementById(`${mode === 'HUMAN' ? 'human' : mode.toLowerCase()}ModeBtn`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};

// Export for use in other modules
export { gameInstance };