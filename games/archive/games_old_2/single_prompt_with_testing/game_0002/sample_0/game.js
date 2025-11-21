// game.js - Main game file

import { gameState, PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Terrain } from './terrain.js';
import { initializeGame, updateGameLogic, fireWeapon, cycleWeapon } from './game_logic.js';
import { renderStartScreen, renderGameOverScreen, renderGameUI, renderAimingLine } from './ui.js';
import { handleHumanInput, handleAutomatedInput, logInput, logPlayerInfo } from './input_handler.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let lastLogFrame = 0;
  
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
    
    // Initialize terrain
    gameState.terrain = new Terrain(p);
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: "START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    p.background(135, 206, 235); // Sky blue
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case PHASES.START:
        renderStartScreen(p);
        break;
        
      case PHASES.PLAYING:
      case PHASES.PAUSED:
        renderGame(p);
        break;
        
      case PHASES.GAME_OVER_WIN:
        renderGame(p);
        renderGameOverScreen(p, true);
        break;
        
      case PHASES.GAME_OVER_LOSE:
        renderGame(p);
        renderGameOverScreen(p, false);
        break;
    }
  };
  
  function renderGame(p) {
    // Render terrain
    if (gameState.terrain) {
      gameState.terrain.render(p);
    }
    
    // Render particles (behind)
    for (const particle of gameState.particles) {
      particle.render(p);
    }
    
    // Render explosions
    for (const explosion of gameState.explosions) {
      explosion.render(p);
    }
    
    // Render projectiles
    for (const projectile of gameState.projectiles) {
      projectile.render(p);
    }
    
    // Render worms
    for (const worm of gameState.entities) {
      worm.render(p);
    }
    
    // Render aiming line
    const activeWorm = gameState.entities.find(w => w.isActive);
    if (activeWorm) {
      renderAimingLine(p, activeWorm);
    }
    
    // Render UI
    renderGameUI(p);
    
    // Update game logic if playing and not paused
    if (gameState.gamePhase === PHASES.PLAYING) {
      // Handle automated testing
      if (gameState.controlMode !== "HUMAN") {
        const action = get_automated_testing_action(gameState);
        handleAutomatedInput(p, action);
      } else {
        handleHumanInput(p);
      }
      
      updateGameLogic(p);
      
      // Log player info periodically
      if (p.frameCount - lastLogFrame >= 30) {
        logPlayerInfo(p);
        lastLogFrame = p.frameCount;
      }
    }
  }
  
  p.keyPressed = function() {
    logInput(p, "keyPressed", p.key, p.keyCode);
    
    // Game phase transitions
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === PHASES.START) {
        gameState.gamePhase = PHASES.PLAYING;
        initializeGame(p);
        p.logs.game_info.push({
          data: { phase: "PLAYING" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === PHASES.PLAYING) {
        gameState.gamePhase = PHASES.PAUSED;
        p.logs.game_info.push({
          data: { phase: "PAUSED" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === PHASES.PAUSED) {
        gameState.gamePhase = PHASES.PLAYING;
        p.logs.game_info.push({
          data: { phase: "PLAYING" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    if (p.keyCode === 82) { // R
      if (gameState.gamePhase === PHASES.GAME_OVER_WIN || 
          gameState.gamePhase === PHASES.GAME_OVER_LOSE) {
        gameState.gamePhase = PHASES.START;
        p.logs.game_info.push({
          data: { phase: "START" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // Gameplay keys (only in HUMAN mode during PLAYING phase)
    if (gameState.gamePhase === PHASES.PLAYING && gameState.controlMode === "HUMAN") {
      if (p.keyCode === 90) { // Z - Fire
        fireWeapon(p);
      }
      
      if (p.keyCode === 16) { // Shift - Cycle weapon
        cycleWeapon();
      }
    }
    
    return false;
  };
  
  p.keyReleased = function() {
    logInput(p, "keyReleased", p.key, p.keyCode);
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
  
  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};