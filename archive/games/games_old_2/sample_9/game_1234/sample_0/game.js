// game.js - Main game file

import { gameState, getGameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { BlackHole } from './blackhole.js';
import { generateLevel, getLevelAICount, getLevelAIStartRadius, getPlayerStartRadius } from './levelgen.js';
import { handleKeyPressed, handleKeyReleased, getPlayerMovement } from './input.js';
import { TestController } from './testController.js';
import { renderStartScreen, renderPlaying, renderPaused, renderGameOver } from './rendering.js';
import { OBJECT_TYPES } from './consumable.js';

const p5 = window.p5;
let testController = null;

let gameInstance = new p5(p => {
  // Initialize variables
  let lastPauseTime = 0;
  
  // Initialize the logs
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize game state
    initializeGame(p);
    
    p.logs.game_info.push({
      data: { phase: 'START', action: 'initialize' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== 'HUMAN' && testController) {
      const action = testController.getAction(p);
      
      // Apply test actions
      if (action.pressEnter && gameState.gamePhase === GAME_PHASES.START) {
        startLevel(p);
      }
      if (action.pressR && (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
                            gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE)) {
        restartGame(p);
      }
      
      // Apply movement
      if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.player) {
        const speed = gameState.player.speed;
        gameState.player.x += action.dx * speed;
        gameState.player.y += action.dy * speed;
      }
    }
    
    // Render based on game phase
    if (gameState.gamePhase === GAME_PHASES.START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updateGame(p);
      renderPlaying(p);
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      renderPaused(p);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
               gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      renderGameOver(p);
    }
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p);
    
    // Additional key handling for game flow
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === GAME_PHASES.START) {
        startLevel(p);
      } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN && 
                 gameState.currentLevel < gameState.totalLevels) {
        advanceLevel(p);
      }
    }
  };
  
  p.keyReleased = function() {
    handleKeyReleased(p);
  };
  
  function initializeGame(p) {
    gameState.player = null;
    gameState.entities = [];
    gameState.aiBlackHoles = [];
    gameState.consumableObjects = [];
    gameState.score = 0;
    gameState.currentLevel = 1;
    gameState.levelTimer = 120;
    gameState.gamePhase = GAME_PHASES.START;
  }
  
  function startLevel(p) {
    // Initialize level
    gameState.consumableObjects = generateLevel(p, gameState.currentLevel);
    
    // Create player
    const playerRadius = getPlayerStartRadius(gameState.currentLevel);
    gameState.player = new BlackHole(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, playerRadius, true);
    gameState.entities = [gameState.player];
    
    // Create AI black holes
    gameState.aiBlackHoles = [];
    const aiCount = getLevelAICount(gameState.currentLevel);
    const aiRadius = getLevelAIStartRadius(gameState.currentLevel);
    
    for (let i = 0; i < aiCount; i++) {
      const angle = (i / aiCount) * Math.PI * 2;
      const distance = 150;
      const x = CANVAS_WIDTH / 2 + Math.cos(angle) * distance;
      const y = CANVAS_HEIGHT / 2 + Math.sin(angle) * distance;
      const ai = new BlackHole(x, y, aiRadius, false);
      gameState.aiBlackHoles.push(ai);
      gameState.entities.push(ai);
    }
    
    gameState.levelTimer = 120;
    gameState.levelStartTime = Date.now();
    gameState.gamePhase = GAME_PHASES.PLAYING;
    
    p.logs.game_info.push({
      data: { phase: 'PLAYING', level: gameState.currentLevel },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function advanceLevel(p) {
    gameState.currentLevel++;
    if (gameState.currentLevel > gameState.totalLevels) {
      // Game won!
      endGame(p, true);
    } else {
      startLevel(p);
    }
  }
  
  function restartGame(p) {
    gameState.score = 0;
    gameState.currentLevel = 1;
    gameState.gamePhase = GAME_PHASES.START;
    
    if (testController) {
      testController.actionTimer = 0;
    }
    
    p.logs.game_info.push({
      data: { phase: 'START', action: 'restart' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function updateGame(p) {
    // Update timer
    const elapsed = (Date.now() - gameState.levelStartTime) / 1000;
    gameState.levelTimer = Math.max(0, 120 - elapsed);
    
    // Handle player movement (HUMAN mode)
    if (gameState.controlMode === 'HUMAN' && gameState.player) {
      const movement = getPlayerMovement(p);
      gameState.player.x += movement.dx * gameState.player.speed;
      gameState.player.y += movement.dy * gameState.player.speed;
    }
    
    // Update entities
    gameState.player.update(p, gameState.consumableObjects, gameState.aiBlackHoles);
    
    for (let ai of gameState.aiBlackHoles) {
      ai.update(p, gameState.consumableObjects, [...gameState.aiBlackHoles, gameState.player]);
    }
    
    // Check collisions with consumables
    for (let i = gameState.consumableObjects.length - 1; i >= 0; i--) {
      const obj = gameState.consumableObjects[i];
      
      if (obj.consumed) {
        if (obj.updateFade(p)) {
          gameState.consumableObjects.splice(i, 1);
        }
        continue;
      }
      
      // Check player collision
      if (gameState.player.checkCollision(p, obj) && gameState.player.canSwallow(obj)) {
        obj.startConsume();
        gameState.player.grow(obj.size * 0.1);
        gameState.score += OBJECT_TYPES[obj.type].score;
        continue;
      }
      
      // Check AI collisions
      for (let ai of gameState.aiBlackHoles) {
        if (ai.alive && ai.checkCollision(p, obj) && ai.canSwallow(obj)) {
          obj.startConsume();
          ai.grow(obj.size * 0.1);
          break;
        }
      }
    }
    
    // Check black hole vs black hole collisions
    const allBlackHoles = [gameState.player, ...gameState.aiBlackHoles];
    
    for (let i = 0; i < allBlackHoles.length; i++) {
      for (let j = i + 1; j < allBlackHoles.length; j++) {
        const bh1 = allBlackHoles[i];
        const bh2 = allBlackHoles[j];
        
        if (!bh1.alive || !bh2.alive) continue;
        
        if (bh1.checkCollision(p, bh2)) {
          if (bh1.canSwallow(bh2)) {
            bh2.alive = false;
            bh1.grow(bh2.radius * 0.5);
            
            if (bh1.isPlayer) {
              gameState.score += 500;
            }
            
            if (bh2.isPlayer) {
              endGame(p, false);
              return;
            }
          } else if (bh2.canSwallow(bh1)) {
            bh1.alive = false;
            bh2.grow(bh1.radius * 0.5);
            
            if (bh2.isPlayer) {
              gameState.score += 500;
            }
            
            if (bh1.isPlayer) {
              endGame(p, false);
              return;
            }
          }
        }
      }
    }
    
    // Log player info every 60 frames
    if (p.frameCount % 60 === 0 && gameState.player) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        framecount: p.frameCount
      });
    }
    
    // Check timer
    if (gameState.levelTimer <= 0) {
      checkLevelComplete(p);
    }
  }
  
  function checkLevelComplete(p) {
    // Find largest black hole
    let largest = gameState.player;
    let largestRadius = gameState.player ? gameState.player.radius : 0;
    
    for (let ai of gameState.aiBlackHoles) {
      if (ai.alive && ai.radius > largestRadius) {
        largest = ai;
        largestRadius = ai.radius;
      }
    }
    
    if (largest === gameState.player) {
      // Player wins level
      gameState.score += 1000; // Bonus
      
      if (gameState.currentLevel >= gameState.totalLevels) {
        endGame(p, true);
      } else {
        gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
        
        p.logs.game_info.push({
          data: { phase: 'GAME_OVER_WIN', level: gameState.currentLevel },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else {
      endGame(p, false);
    }
  }
  
  function endGame(p, won) {
    if (won) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    } else {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    }
    
    // Update high score
    if (gameState.score > gameState.highScore) {
      gameState.highScore = gameState.score;
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('holeio_highscore', gameState.highScore.toString());
      }
    }
    
    p.logs.game_info.push({
      data: { 
        phase: won ? 'GAME_OVER_WIN' : 'GAME_OVER_LOSE',
        score: gameState.score,
        level: gameState.currentLevel
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
});

// Expose the game instance globally
window.gameInstance = gameInstance;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  if (mode !== 'HUMAN') {
    testController = new TestController(mode);
  } else {
    testController = null;
  }
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const activeBtn = document.getElementById(mode === 'HUMAN' ? 'humanModeBtn' : 
                                           mode === 'TEST_1' ? 'test_1_ModeBtn' : 
                                           'test_2_ModeBtn');
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};