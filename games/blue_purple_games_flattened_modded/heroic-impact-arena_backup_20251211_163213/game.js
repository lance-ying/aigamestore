// game.js - Main game file
// TAP-BASED CONTROLS: All inputs are single discrete taps, no key holding required

import { gameState, getGameState, GAME_PHASE, PLAYER_MODE, TURN_PHASE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { initializePlayerCharacters, generateEnemiesForLevel } from './levels.js';
import { handleKeyPressed } from './input.js';
import { executePlayerAction, executeTargetedAction, checkAllEnemiesDefeated, checkAllHeroesDefeated, completeLevelTransition } from './combat.js';
import { updateEnemyTurn, resetEnemyTurn } from './enemyTurn.js';
import { drawStartScreen, drawGameplayScreen, drawPausedScreen, drawGameOverScreen, drawLevelTransitionScreen } from './rendering.js';
import { getTestAction } from './testing.js';

function initGame() {
  const p5 = window.p5;
  
  if (!p5) {
    console.error('p5.js not loaded');
    return;
  }

  let gameInstance = new p5(p => {
    // Initialize logs
    p.logs = {
      "game_info": [],
      "inputs": [],
      "player_info": []
    };
    
    p.setup = function() {
      p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
      p.frameRate(60);
      p.randomSeed(42);
      
      // Initialize game state
      gameState.playerCharacters = initializePlayerCharacters(p);
      gameState.enemyCharacters = generateEnemiesForLevel(1, p);
      
      // Reset input state for tap-based controls
      gameState.lastKeyPressed = null;
      gameState.lastKeyPressedFrame = -999;
      gameState.inputCooldownActive = false;
      
      p.logs.game_info.push({
        data: { phase: 'SETUP_COMPLETE', controlType: 'TAP_BASED' },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    };
    
    p.draw = function() {
      // Update input cooldown state
      updateInputCooldownState();
      
      // Update animations
      updateAnimations();
      
      // Update particles
      updateParticles();
      
      // Handle game phases
      if (gameState.gamePhase === GAME_PHASE.START) {
        drawStartScreen(p);
      } else if (gameState.gamePhase === GAME_PHASE.PLAYING) {
        // Process automated testing
        if (gameState.controlMode !== 'HUMAN') {
          const testAction = getTestAction(p);
          if (testAction) {
            processAction(testAction, p);
          }
        }
        
        // Update enemy turn
        if (gameState.activeTurn === TURN_PHASE.ENEMY) {
          updateEnemyTurn(p);
        }
        
        drawGameplayScreen(p);
        
        // Log player info periodically
        if (p.frameCount % 10 === 0) {
          logPlayerInfo(p);
        }
      } else if (gameState.gamePhase === GAME_PHASE.LEVEL_TRANSITION) {
        // Handle level transition
        gameState.levelTransitionTimer--;
        drawLevelTransitionScreen(p);
        
        if (gameState.levelTransitionTimer <= 0) {
          completeLevelTransition(p);
        }
      } else if (gameState.gamePhase === GAME_PHASE.PAUSED) {
        drawPausedScreen(p);
      } else if (gameState.gamePhase === GAME_PHASE.GAME_OVER_WIN) {
        drawGameOverScreen(p, true);
      } else if (gameState.gamePhase === GAME_PHASE.GAME_OVER_LOSE) {
        drawGameOverScreen(p, false);
      }
    };
    
    // TAP-BASED INPUT: Each keypress triggers one discrete action
    // Key repeat/holding is prevented by cooldown system in input.js
    p.keyPressed = function() {
      if (gameState.controlMode !== 'HUMAN') {
        return; // Ignore human input in test mode
      }
      
      const action = handleKeyPressed(p, p.key, p.keyCode);
      if (action) {
        processAction(action, p);
      }
      
      // Prevent default browser behavior for game keys
      return false;
    };
    
    function updateInputCooldownState() {
      // Clear cooldown flag after sufficient frames have passed
      if (gameState.inputCooldownActive && 
          p.frameCount - gameState.lastKeyPressedFrame > 5) {
        gameState.inputCooldownActive = false;
      }
    }
    
    function processAction(action, p) {
      if (action.action === 'START_GAME') {
        startGame(p);
      } else if (action.action === 'RESTART') {
        restartGame(p);
      } else if (action.action === 'TOGGLE_PAUSE') {
        togglePause(p);
      } else if (action.action === 'CONFIRM_CHARACTER') {
        confirmCharacter();
      } else if (action.action === 'CONFIRM_ABILITY') {
        confirmAbility(p);
      } else if (action.action === 'CONFIRM_TARGET') {
        confirmTarget(p);
      } else if (action.action === 'CANCEL_ABILITY') {
        gameState.playerMode = PLAYER_MODE.CHARACTER_SELECT;
      } else if (action.action === 'CANCEL_TARGET') {
        gameState.playerMode = PLAYER_MODE.ABILITY_SELECT;
      } else if (action.action === 'END_TURN') {
        endPlayerTurn();
      }
    }
    
    function startGame(p) {
      gameState.gamePhase = GAME_PHASE.PLAYING;
      gameState.activeTurn = TURN_PHASE.PLAYER;
      gameState.playerMode = PLAYER_MODE.CHARACTER_SELECT;
      gameState.currentLevel = 1;
      gameState.score = 0;
      gameState.turnCounter = 0;
      gameState.animationQueue = [];
      gameState.particles = [];
      
      gameState.playerCharacters = initializePlayerCharacters(p);
      gameState.enemyCharacters = generateEnemiesForLevel(1, p);
      
      gameState.currentActingHeroIndex = 0;
      gameState.currentSelectedCharacterIndex = 0;
      gameState.currentSelectedAbilityIndex = 0;
      gameState.currentSelectedTargetIndex = 0;
      
      // Reset input state
      gameState.lastKeyPressed = null;
      gameState.lastKeyPressedFrame = -999;
      gameState.inputCooldownActive = false;
      
      resetEnemyTurn();
      
      p.logs.game_info.push({
        data: { phase: 'GAME_START' },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    function restartGame(p) {
      gameState.gamePhase = GAME_PHASE.START;
      gameState.animationQueue = [];
      gameState.particles = [];
      
      // Reset input state
      gameState.lastKeyPressed = null;
      gameState.lastKeyPressedFrame = -999;
      gameState.inputCooldownActive = false;
      
      p.logs.game_info.push({
        data: { phase: 'RESTART' },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    function togglePause(p) {
      if (gameState.gamePhase === GAME_PHASE.PLAYING) {
        gameState.gamePhase = GAME_PHASE.PAUSED;
        p.logs.game_info.push({
          data: { phase: 'PAUSED' },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === GAME_PHASE.PAUSED) {
        gameState.gamePhase = GAME_PHASE.PLAYING;
        p.logs.game_info.push({
          data: { phase: 'RESUMED' },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    function confirmCharacter() {
      const char = gameState.playerCharacters[gameState.currentSelectedCharacterIndex];
      if (char.isDefeated || char.hasActed) return;
      
      gameState.currentActingHeroIndex = gameState.currentSelectedCharacterIndex;
      gameState.playerMode = PLAYER_MODE.ABILITY_SELECT;
      gameState.currentSelectedAbilityIndex = 0;
      
      // Find first available ability
      for (let i = 0; i < char.abilities.length; i++) {
        if (char.abilities[i].isAvailable()) {
          gameState.currentSelectedAbilityIndex = i;
          break;
        }
      }
    }
    
    function confirmAbility(p) {
      executePlayerAction(p);
    }
    
    function confirmTarget(p) {
      executeTargetedAction(p);
    }
    
    function endPlayerTurn() {
      gameState.activeTurn = TURN_PHASE.ENEMY;
      gameState.playerMode = PLAYER_MODE.CHARACTER_SELECT;
      gameState.playerCharacters.forEach(char => char.resetTurn());
      resetEnemyTurn();
    }
    
    function updateAnimations() {
      for (let i = gameState.animationQueue.length - 1; i >= 0; i--) {
        const anim = gameState.animationQueue[i];
        anim.update();
        
        if (anim.completed) {
          gameState.animationQueue.splice(i, 1);
        }
      }
    }
    
    function updateParticles() {
      for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const particle = gameState.particles[i];
        particle.update();
        
        if (particle.dead) {
          gameState.particles.splice(i, 1);
        }
      }
    }
    
    function logPlayerInfo(p) {
      gameState.playerCharacters.forEach(char => {
        if (!char.isDefeated) {
          p.logs.player_info.push({
            screen_x: char.x,
            screen_y: char.y,
            game_x: char.x,
            game_y: char.y,
            framecount: p.frameCount
          });
        }
      });
    }
  });

  // Expose game instance globally
  window.gameInstance = gameInstance;
// Expose level loading for dev mode
window.loadLevel = function(levelNum) {
  const state = window.getGameState ? window.getGameState() : (window.gameState || (window.gameInstance && window.gameInstance.gameState));
  if (state) {
    state.currentLevel = levelNum;
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
}

// Wait for DOM and p5.js to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  // DOM already loaded, but wait a tick to ensure p5 is ready
  setTimeout(initGame, 0);
}

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  if (mode === 'HUMAN') {
    document.getElementById('humanModeBtn').classList.add('active');
  } else if (mode === 'TEST_1') {
    document.getElementById('test_1_ModeBtn').classList.add('active');
  } else if (mode === 'TEST_2') {
    document.getElementById('test_2_ModeBtn').classList.add('active');
  }
};