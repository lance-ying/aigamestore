// game.js - Main game file

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  TARGET_FPS,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  PLAYER_COLORS
} from './globals.js';

import { Player, AIOpponent } from './entities.js';
import { generateLevel, checkLevelComplete, calculateRank } from './level_manager.js';
import { checkCollisions } from './collision_manager.js';
import { handlePlayerInput, handleAutomatedInput } from './input_handler.js';
import { renderStartScreen, renderPlayingScreen, renderGameOverScreen } from './render_manager.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Log initial game state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Single background call
    p.background(30, 30, 50);
    
    // Handle game phases
    switch (gameState.gamePhase) {
      case PHASE_START:
        renderStartScreen(p);
        break;
        
      case PHASE_PLAYING:
        updateGame(p);
        renderPlayingScreen(p);
        break;
        
      case PHASE_PAUSED:
        renderPlayingScreen(p);
        break;
        
      case PHASE_GAME_OVER_WIN:
      case PHASE_GAME_OVER_LOSE:
        renderGameOverScreen(p);
        break;
    }
  };
  
  function updateGame(p) {
    // Handle input
    if (gameState.controlMode === "HUMAN") {
      handlePlayerInput(p);
    } else {
      const action = get_automated_testing_action(gameState);
      handleAutomatedInput(p, action);
    }
    
    // Update player
    if (gameState.player) {
      gameState.player.update();
      
      // Log player info every 30 frames
      if (p.frameCount % 30 === 0) {
        p.logs.player_info.push({
          screen_x: gameState.player.x,
          screen_y: gameState.player.y,
          game_x: gameState.player.x,
          game_y: gameState.player.y,
          framecount: p.frameCount
        });
      }
    }
    
    // Update AI opponents
    for (let ai of gameState.aiOpponents) {
      ai.aiUpdate();
    }
    
    // Check collisions
    checkCollisions(p);
    
    // Check level completion
    if (checkLevelComplete()) {
      calculateRank();
      
      // Check for win/lose
      setTimeout(() => {
        if (gameState.playerRank === 1) {
          gameState.gamePhase = PHASE_GAME_OVER_WIN;
        } else {
          gameState.gamePhase = PHASE_GAME_OVER_LOSE;
        }
        
        p.logs.game_info.push({
          data: { 
            phase: gameState.gamePhase,
            rank: gameState.playerRank,
            score: gameState.score
          },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }, 1000);
    }
    
    // Check if all AI finished (lose condition)
    const allAIFinished = gameState.aiOpponents.every(ai => ai.hasFinished);
    if (allAIFinished && !gameState.player.hasFinished) {
      gameState.playerRank = gameState.totalRacers;
      gameState.gamePhase = PHASE_GAME_OVER_LOSE;
      
      p.logs.game_info.push({
        data: { 
          phase: gameState.gamePhase,
          reason: "all_ai_finished"
        },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // ENTER - Start game
    if (p.keyCode === 13) {
      if (gameState.gamePhase === PHASE_START) {
        startGame(p);
      }
    }
    
    // ESC - Pause/Unpause
    if (p.keyCode === 27) {
      if (gameState.gamePhase === PHASE_PLAYING) {
        gameState.gamePhase = PHASE_PAUSED;
        p.logs.game_info.push({
          data: { phase: PHASE_PAUSED },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === PHASE_PAUSED) {
        gameState.gamePhase = PHASE_PLAYING;
        p.logs.game_info.push({
          data: { phase: PHASE_PLAYING },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // R - Restart
    if (p.keyCode === 82) {
      if (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
          gameState.gamePhase === PHASE_GAME_OVER_LOSE ||
          gameState.gamePhase === PHASE_PLAYING ||
          gameState.gamePhase === PHASE_PAUSED) {
        resetGame(p);
      }
    }
    
    return false;
  };
  
  function startGame(p) {
    gameState.gamePhase = PHASE_PLAYING;
    gameState.score = 0;
    gameState.startTime = Date.now();
    
    // Create player
    gameState.player = new Player(p, 100, 200, PLAYER_COLORS.BLUE);
    gameState.entities = [gameState.player];
    
    // Create AI opponents
    gameState.aiOpponents = [];
    const aiColors = [PLAYER_COLORS.RED, PLAYER_COLORS.GREEN, PLAYER_COLORS.YELLOW];
    const aiSpeeds = [2.3, 2.4, 2.2];
    
    for (let i = 0; i < 3; i++) {
      const ai = new AIOpponent(
        p,
        100,
        200 - 30 + i * 30,
        aiColors[i],
        aiSpeeds[i]
      );
      gameState.aiOpponents.push(ai);
      gameState.entities.push(ai);
    }
    
    // Generate level
    generateLevel(p, gameState.level);
    
    p.logs.game_info.push({
      data: { phase: PHASE_PLAYING, level: gameState.level },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    p.logs.player_info.push({
      screen_x: gameState.player.x,
      screen_y: gameState.player.y,
      game_x: gameState.player.x,
      game_y: gameState.player.y,
      framecount: p.frameCount
    });
  }
  
  function resetGame(p) {
    gameState.gamePhase = PHASE_START;
    gameState.player = null;
    gameState.entities = [];
    gameState.blocks = [];
    gameState.bridges = [];
    gameState.platforms = [];
    gameState.aiOpponents = [];
    gameState.score = 0;
    gameState.playerRank = 0;
    
    p.logs.game_info.push({
      data: { phase: PHASE_START },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
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
  
  const activeBtn = document.getElementById(
    mode === 'HUMAN' ? 'humanModeBtn' : 
    mode === 'TEST_1' ? 'test_1_ModeBtn' :
    mode === 'TEST_2' ? 'test_2_ModeBtn' : 'humanModeBtn'
  );
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};