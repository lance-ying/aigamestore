// game.js - Main game file

import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS,
         PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, 
         PHASE_GAME_OVER_LOSE, CONTROL_HUMAN, GROUND_Y, CAMERA_OFFSET } from './globals.js';
import { Player } from './player.js';
import { StageManager } from './stage.js';
import { renderUI } from './ui.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let stageManager;
  let backgroundPattern = [];

  p.logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
  };

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);

    // Generate background pattern
    for (let i = 0; i < 50; i++) {
      backgroundPattern.push({
        x: p.random(0, CANVAS_WIDTH * 3),
        y: p.random(0, CANVAS_HEIGHT),
        size: p.random(2, 8),
        speed: p.random(0.1, 0.3)
      });
    }

    // Initialize stage manager
    stageManager = new StageManager();

    // Log initial state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    gameState.frameCount = p.frameCount;

    if (gameState.gamePhase === PHASE_START) {
      renderUI(p);
    } else if (gameState.gamePhase === PHASE_PLAYING) {
      handleAutomatedTesting();
      updateGame();
      renderGame();
      renderUI(p);
      logPlayerInfo();
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      renderGame();
      renderUI(p);
    } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
               gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      renderUI(p);
    }
  };

  function handleAutomatedTesting() {
    if (gameState.controlMode !== CONTROL_HUMAN) {
      const action = get_automated_testing_action(gameState);
      
      if (action.left) {
        gameState.player.move(-1);
      } else if (action.right) {
        gameState.player.move(1);
      }
      
      if (action.space) {
        gameState.player.attack();
      }
      
      if (action.z) {
        gameState.player.specialAttack(p);
      }
      
      if (action.shift) {
        gameState.player.grab(p);
      }
    }
  }

  function updateGame() {
    // Update player
    if (gameState.player) {
      gameState.player.update(p);

      // Check player death
      if (gameState.player.health <= 0) {
        transitionToGameOver(false);
        return;
      }
    }

    // Update all entities
    gameState.entities.forEach(entity => {
      if (entity.update) {
        entity.update(p);
      }
    });

    // Remove collected items and dead enemies
    gameState.entities = gameState.entities.filter(entity => {
      if (entity.type === 'item' && entity.collected) return false;
      if (entity.type === 'breakable' && entity.destroyed) return false;
      return true;
    });

    // Update stage
    if (stageManager) {
      stageManager.update(p);
      
      if (stageManager.isStageComplete()) {
        // Check if boss was defeated (final stage)
        const bossAlive = gameState.entities.some(e => 
          e.type === 'enemy' && e.enemyType === 'boss' && e.health > 0
        );
        
        if (gameState.stage === gameState.totalStages && !bossAlive) {
          transitionToGameOver(true);
        } else if (gameState.stage < gameState.totalStages) {
          // Move to next stage
          gameState.stage++;
          stageManager.initStage(gameState.stage);
          
          // Heal player partially
          if (gameState.player) {
            gameState.player.heal(30);
          }
        }
      }
    }

    // Update camera
    if (gameState.player) {
      const targetCameraX = gameState.player.x - CAMERA_OFFSET;
      gameState.camera.x = p.constrain(targetCameraX, 0, 1200 - CANVAS_WIDTH);
    }
  }

  function renderGame() {
    // Background
    p.background(40, 45, 60);

    // Parallax background elements
    p.push();
    p.fill(60, 65, 80);
    p.noStroke();
    backgroundPattern.forEach(elem => {
      const x = (elem.x - gameState.camera.x * elem.speed) % (CANVAS_WIDTH * 2);
      p.circle(x, elem.y, elem.size);
    });
    p.pop();

    // Ground
    p.fill(80, 70, 60);
    p.noStroke();
    p.rect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

    // Ground details
    p.stroke(60, 50, 40);
    p.strokeWeight(2);
    for (let i = 0; i < CANVAS_WIDTH; i += 30) {
      const lineX = (i - (gameState.camera.x % 30));
      p.line(lineX, GROUND_Y, lineX, CANVAS_HEIGHT);
    }

    // Stage progress indicator
    p.fill(100, 100, 120);
    p.noStroke();
    const progressWidth = (gameState.camera.x / (1200 - CANVAS_WIDTH)) * CANVAS_WIDTH;
    p.rect(0, CANVAS_HEIGHT - 5, progressWidth, 5);

    // Render all entities
    const sortedEntities = [...gameState.entities].sort((a, b) => {
      const aY = a.y || 0;
      const bY = b.y || 0;
      return aY - bY;
    });

    sortedEntities.forEach(entity => {
      if (entity.render) {
        entity.render(p, gameState.camera);
      }
    });

    // Render player on top
    if (gameState.player) {
      gameState.player.render(p, gameState.camera);
    }
  }

  function logPlayerInfo() {
    if (gameState.player && p.frameCount % 10 === 0) {
      p.logs.player_info.push({
        screen_x: gameState.player.x - gameState.camera.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        framecount: p.frameCount
      });
    }
  }

  function startGame() {
    gameState.gamePhase = PHASE_PLAYING;
    gameState.score = 0;
    gameState.stage = 1;
    gameState.enemiesDefeated = 0;
    gameState.bossDefeated = false;
    gameState.camera = { x: 0 };
    gameState.entities = [];

    // Create player
    gameState.player = new Player(100, GROUND_Y);
    gameState.entities.push(gameState.player);

    // Initialize stage
    stageManager.initStage(gameState.stage);

    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, stage: gameState.stage },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function transitionToGameOver(won) {
    gameState.gamePhase = won ? PHASE_GAME_OVER_WIN : PHASE_GAME_OVER_LOSE;
    
    p.logs.game_info.push({
      data: { 
        phase: gameState.gamePhase, 
        won: won,
        finalScore: gameState.score,
        enemiesDefeated: gameState.enemiesDefeated
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function restartGame() {
    gameState.gamePhase = PHASE_START;
    gameState.player = null;
    gameState.entities = [];
    gameState.camera = { x: 0 };
    
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  p.keyPressed = function() {
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    // Game phase transitions
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === PHASE_START) {
        startGame();
      }
    } else if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === PHASE_PLAYING) {
        gameState.gamePhase = PHASE_PAUSED;
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === PHASE_PAUSED) {
        gameState.gamePhase = PHASE_PLAYING;
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (p.keyCode === 82) { // R
      if (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
          gameState.gamePhase === PHASE_GAME_OVER_LOSE ||
          gameState.gamePhase === PHASE_PAUSED) {
        restartGame();
      }
    }

    // Gameplay controls (only in HUMAN mode)
    if (gameState.gamePhase === PHASE_PLAYING && 
        gameState.controlMode === CONTROL_HUMAN && 
        gameState.player) {
      if (p.keyCode === 32) { // SPACE
        gameState.player.attack();
      } else if (p.keyCode === 90) { // Z
        gameState.player.specialAttack(p);
      } else if (p.keyCode === 16) { // SHIFT
        gameState.player.grab(p);
      }
    }

    return false;
  };

  p.keyReleased = function() {
    p.logs.inputs.push({
      input_type: "keyReleased",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return false;
  };

  // Handle movement with keyIsDown for smooth movement
  p.keyIsDown = p.keyIsDown || function() { return false; };
  
  const originalDraw = p.draw;
  p.draw = function() {
    if (gameState.gamePhase === PHASE_PLAYING && 
        gameState.controlMode === CONTROL_HUMAN && 
        gameState.player) {
      if (p.keyIsDown(37)) { // LEFT
        gameState.player.move(-1);
      }
      if (p.keyIsDown(39)) { // RIGHT
        gameState.player.move(1);
      }
    }
    originalDraw();
  };
});

// Expose globally
window.gameInstance = gameInstance;
window.getGameState = getGameState;

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
  
  const activeBtn = mode === 'HUMAN' ? 'humanModeBtn' : 
                    mode === 'TEST_1' ? 'test_1_ModeBtn' : 
                    'test_2_ModeBtn';
  const btn = document.getElementById(activeBtn);
  if (btn) {
    btn.classList.add('active');
  }
};