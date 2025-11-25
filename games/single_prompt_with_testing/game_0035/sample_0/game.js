// game.js - Main game file

import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  TARGET_FPS, 
  KEY_CODES, 
  GAME_PHASES, 
  CONTROL_MODES,
  gameState 
} from './globals.js';

import { handlePlayerInput, logInput, logPlayerInfo, logGameInfo } from './input.js';
import { checkCollisions } from './collision.js';
import { 
  initGame, 
  startGame, 
  updateGame, 
  updateRoundEnd, 
  applyUpgradeAndContinue 
} from './game_logic.js';
import { 
  renderStartScreen, 
  renderArena, 
  renderUI, 
  renderPauseIndicator,
  renderRoundEnd,
  renderGameOver
} from './rendering.js';
import { renderUpgradeScreen } from './upgrades.js';
import get_automated_testing_action from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // p5.js instance mode setup
  
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };
  
  let lastLogFrame = 0;
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    initGame(p);
    
    logGameInfo(p, { phase: 'START' });
  };
  
  p.draw = function() {
    p.background(20, 25, 35);
    
    // Handle automated testing
    if (gameState.controlMode !== CONTROL_MODES.HUMAN && gameState.gamePhase === GAME_PHASES.PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action) {
        // Simulate key press
        simulateKeyPress(action.keyCode);
      }
    } else if (gameState.controlMode !== CONTROL_MODES.HUMAN && gameState.gamePhase === GAME_PHASES.UPGRADE_SELECT) {
      const action = get_automated_testing_action(gameState);
      if (action) {
        // Simulate key press for upgrade selection
        if (action.keyCode === KEY_CODES.UP && gameState.selectedUpgrade > 0) {
          gameState.selectedUpgrade--;
        } else if (action.keyCode === KEY_CODES.DOWN && gameState.selectedUpgrade < gameState.upgradeOptions.length - 1) {
          gameState.selectedUpgrade++;
        } else if (action.keyCode === KEY_CODES.SPACE) {
          applyUpgradeAndContinue(p);
        }
      }
    }
    
    // Game state machine
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        renderStartScreen(p);
        break;
        
      case GAME_PHASES.PLAYING:
        // Update
        handlePlayerInput(p);
        updateGame(p);
        checkCollisions(p);
        
        // Render
        renderArena(p);
        
        // Render entities
        if (gameState.player) gameState.player.render(p);
        if (gameState.enemy) gameState.enemy.render(p);
        
        // Render projectiles
        gameState.projectiles.forEach(proj => proj.render(p));
        
        // Render particles
        gameState.particles.forEach(particle => particle.render(p));
        
        renderUI(p);
        
        // Log player info periodically
        if (p.frameCount - lastLogFrame >= 30) {
          logPlayerInfo(p);
          lastLogFrame = p.frameCount;
        }
        break;
        
      case GAME_PHASES.ROUND_END:
        // Keep rendering game state
        renderArena(p);
        if (gameState.player) gameState.player.render(p);
        if (gameState.enemy) gameState.enemy.render(p);
        gameState.projectiles.forEach(proj => proj.render(p));
        gameState.particles.forEach(particle => {
          particle.update();
          particle.render(p);
        });
        renderUI(p);
        
        renderRoundEnd(p, gameState.roundWinner);
        
        updateRoundEnd(p);
        break;
        
      case GAME_PHASES.UPGRADE_SELECT:
        // Keep rendering game state in background
        renderArena(p);
        if (gameState.player) gameState.player.render(p);
        if (gameState.enemy) gameState.enemy.render(p);
        renderUI(p);
        
        renderUpgradeScreen(p, gameState.upgradeOptions, gameState.selectedUpgrade);
        break;
        
      case GAME_PHASES.PAUSED:
        // Render frozen game state
        renderArena(p);
        if (gameState.player) gameState.player.render(p);
        if (gameState.enemy) gameState.enemy.render(p);
        gameState.projectiles.forEach(proj => proj.render(p));
        gameState.particles.forEach(particle => particle.render(p));
        renderUI(p);
        renderPauseIndicator(p);
        break;
        
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        renderGameOver(p, gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN ? 'player' : 'enemy');
        break;
    }
  };
  
  p.keyPressed = function() {
    logInput(p, 'keyPressed', { key: p.key, keyCode: p.keyCode });
    
    // Game phase transitions
    if (p.keyCode === KEY_CODES.ENTER && gameState.gamePhase === GAME_PHASES.START) {
      startGame(p);
      return;
    }
    
    if (p.keyCode === KEY_CODES.ESC) {
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        logGameInfo(p, { phase: 'PAUSED' });
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        logGameInfo(p, { phase: 'PLAYING' });
      }
      return;
    }
    
    if (p.keyCode === KEY_CODES.R) {
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        initGame(p);
        gameState.gamePhase = GAME_PHASES.START;
        logGameInfo(p, { phase: 'START' });
      }
      return;
    }
    
    // Upgrade selection
    if (gameState.gamePhase === GAME_PHASES.UPGRADE_SELECT) {
      if (p.keyCode === KEY_CODES.UP && gameState.selectedUpgrade > 0) {
        gameState.selectedUpgrade--;
      } else if (p.keyCode === KEY_CODES.DOWN && gameState.selectedUpgrade < gameState.upgradeOptions.length - 1) {
        gameState.selectedUpgrade++;
      } else if (p.keyCode === KEY_CODES.SPACE) {
        applyUpgradeAndContinue(p);
      }
    }
  };
  
  function simulateKeyPress(keyCode) {
    // Used by automated testing
    const fakeEvent = { keyCode: keyCode };
    
    switch (keyCode) {
      case KEY_CODES.LEFT:
      case KEY_CODES.RIGHT:
      case KEY_CODES.UP:
      case KEY_CODES.DOWN:
      case KEY_CODES.SPACE:
      case KEY_CODES.SHIFT:
      case KEY_CODES.Z:
        // These are handled by keyIsDown in handlePlayerInput
        break;
    }
  }
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Expose getGameState globally
window.getGameState = function() {
  return gameState;
};

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const activeBtn = mode === CONTROL_MODES.HUMAN ? 'humanModeBtn' : 
                    mode === CONTROL_MODES.TEST_1 ? 'test_1_ModeBtn' :
                    mode === CONTROL_MODES.TEST_2 ? 'test_2_ModeBtn' :
                    'test_3_ModeBtn';
  
  const btn = document.getElementById(activeBtn);
  if (btn) {
    btn.classList.add('active');
  }
};