// game.js - Main game logic
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Bike } from './bike.js';
import { Level } from './level.js';
import { InputHandler } from './input.js';
import { UI } from './ui.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Matter.js engine
  let engine;
  let bike;
  let currentLevel;
  let inputHandler;
  let ui;
  let cameraX = 0;
  let cameraY = 0;
  
  // Initialize logs
  p.logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.rectMode(p.CENTER);
    p.randomSeed(42);
    
    // Initialize Matter.js
    const Matter = window.Matter;
    engine = Matter.Engine.create();
    engine.gravity.y = 1;
    
    // Initialize systems
    inputHandler = new InputHandler(p);
    ui = new UI(p);
    
    // Log game start
    p.logs.game_info.push({
      data: { phase: "START", message: "Game initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    p.background(10, 10, 30);
    
    if (gameState.gamePhase === GAME_PHASES.START) {
      ui.renderStartScreen();
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      // Update physics
      const Matter = window.Matter;
      Matter.Engine.update(engine, 1000 / 60);
      
      // Update bike
      if (bike) {
        bike.update();
        
        // Apply player input
        const actions = inputHandler.getPlayerActions();
        if (actions.rotateLeft) {
          bike.applyRotation(-1);
        }
        if (actions.rotateRight) {
          bike.applyRotation(1);
        }
        
        // Update camera
        const bikePos = bike.getPosition();
        cameraX = p.lerp(cameraX, bikePos.x - CANVAS_WIDTH / 2, 0.1);
        cameraY = p.lerp(cameraY, bikePos.y - CANVAS_HEIGHT / 2 - 50, 0.05);
        
        // Log player info periodically
        if (p.frameCount % 30 === 0) {
          p.logs.player_info.push({
            screen_x: bikePos.x - cameraX,
            screen_y: bikePos.y - cameraY,
            game_x: bikePos.x,
            game_y: bikePos.y,
            framecount: p.frameCount
          });
        }
        
        // Check win condition
        if (currentLevel && currentLevel.checkFinish(bikePos.x)) {
          if (!gameState.hasReachedFinish) {
            gameState.hasReachedFinish = true;
            gameState.score += 500; // Level completion bonus
            gameState.levelScores[gameState.currentLevel - 1] = gameState.score - gameState.totalScore;
            gameState.totalScore = gameState.score;
            
            if (gameState.currentLevel < 5) {
              gameState.currentLevel++;
              startLevel();
            } else {
              transitionToGameOver(true);
            }
          }
        }
        
        // Check lose conditions
        if (bikePos.y > CANVAS_HEIGHT + 100) {
          transitionToGameOver(false);
        }
        
        // Check if bike crashed (main body hit ground)
        checkCrashCondition();
      }
      
      // Render game
      renderGame();
      
      // Render UI
      ui.renderPlayingUI();
      
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      // Render game frozen
      renderGame();
      ui.renderPlayingUI();
      ui.renderPausedIndicator();
      
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
      renderGame();
      ui.renderGameOverScreen(true);
      
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      renderGame();
      ui.renderGameOverScreen(false);
    }
  };
  
  function renderGame() {
    // Render background elements
    renderBackground();
    
    // Render level
    if (currentLevel) {
      currentLevel.render(p, cameraX, cameraY);
    }
    
    // Render bike
    if (bike) {
      bike.render(p, cameraX, cameraY);
    }
  }
  
  function renderBackground() {
    // Parallax stars
    p.push();
    p.randomSeed(42);
    for (let i = 0; i < 50; i++) {
      const x = p.random(CANVAS_WIDTH * 3);
      const y = p.random(CANVAS_HEIGHT);
      const size = p.random(1, 2);
      const parallaxX = x - cameraX * 0.2;
      
      if (parallaxX > -50 && parallaxX < CANVAS_WIDTH + 50) {
        p.noStroke();
        p.fill(150, 150, 200, 150);
        p.circle(parallaxX, y, size);
      }
    }
    p.pop();
    
    // Neon grid lines
    p.stroke(0, 100, 100, 50);
    p.strokeWeight(1);
    for (let i = 0; i < 20; i++) {
      const lineX = i * 100 - (cameraX * 0.5 % 100);
      p.line(lineX, 0, lineX, CANVAS_HEIGHT);
    }
  }
  
  function checkCrashCondition() {
    if (!bike) return;
    
    const Matter = window.Matter;
    const pairs = engine.pairs.list;
    
    // Check if main body hit ground
    for (let pair of pairs) {
      if (!pair.isActive) continue;
      
      if (pair.bodyA === bike.mainBody || pair.bodyB === bike.mainBody) {
        // Main body collision detected
        const angle = normalizeAngle(bike.mainBody.angle);
        
        // Crash if angle is too extreme
        if (Math.abs(angle) > Math.PI / 3) { // 60 degrees
          transitionToGameOver(false);
          return;
        }
      }
    }
  }
  
  function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
  }
  
  function startGame() {
    gameState.gamePhase = GAME_PHASES.PLAYING;
    gameState.score = 0;
    gameState.totalScore = 0;
    gameState.currentLevel = 1;
    gameState.levelScores = [0, 0, 0, 0, 0];
    
    startLevel();
    
    p.logs.game_info.push({
      data: { phase: "PLAYING", message: "Game started" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function startLevel() {
    // Clean up previous level
    if (currentLevel) {
      currentLevel.cleanup();
    }
    if (bike) {
      bike.remove();
    }
    
    // Reset game state for new level
    gameState.distanceTraveled = 0;
    gameState.lastDistanceCheckpoint = 0;
    gameState.flipsInCurrentJump = 0;
    gameState.isAirborne = false;
    gameState.hasReachedFinish = false;
    gameState.lastKnownBikeAngle = 0;
    
    // Create new level
    currentLevel = new Level(p, gameState.currentLevel, engine);
    
    // Create bike at starting position
    bike = new Bike(p, 100, 300, engine);
    gameState.player = bike;
    gameState.entities = [bike];
    
    // Reset camera
    cameraX = 0;
    cameraY = 0;
    
    p.logs.game_info.push({
      data: { phase: "PLAYING", level: gameState.currentLevel, message: "Level started" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function transitionToGameOver(isWin) {
    gameState.gamePhase = isWin ? GAME_PHASES.GAME_OVER_WIN : GAME_PHASES.GAME_OVER_LOSE;
    
    if (!isWin) {
      gameState.levelScores[gameState.currentLevel - 1] = gameState.score - gameState.totalScore;
      gameState.totalScore = gameState.score;
    }
    
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, score: gameState.score, level: gameState.currentLevel },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function restartGame() {
    // Clean up
    if (currentLevel) {
      currentLevel.cleanup();
    }
    if (bike) {
      bike.remove();
    }
    
    // Reset to start screen
    gameState.gamePhase = GAME_PHASES.START;
    gameState.score = 0;
    gameState.totalScore = 0;
    gameState.currentLevel = 1;
    gameState.levelScores = [0, 0, 0, 0, 0];
    gameState.player = null;
    gameState.entities = [];
    
    bike = null;
    currentLevel = null;
    
    p.logs.game_info.push({
      data: { phase: "START", message: "Game restarted" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  p.keyPressed = function() {
    const command = inputHandler.handleKeyPressed(p.key, p.keyCode);
    
    if (command) {
      if (command.action === 'START_GAME') {
        startGame();
      } else if (command.action === 'PAUSE') {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        p.logs.game_info.push({
          data: { phase: "PAUSED" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (command.action === 'UNPAUSE') {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        p.logs.game_info.push({
          data: { phase: "PLAYING" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (command.action === 'RESTART') {
        restartGame();
      }
    }
    
    return false;
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

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
  
  console.log(`Control mode set to: ${mode}`);
};