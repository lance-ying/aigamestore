// game.js - Main game file
import { 
  gameState, 
  GAME_PHASES, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  LEVEL_CONFIG 
} from './globals.js';
import { Dog } from './dog.js';
import { TargetShape } from './shapes.js';
import { Distraction } from './distractions.js';
import { InputController } from './input.js';
import { createHealingParticles } from './particles.js';
import {
  drawStartScreen,
  drawPlayingUI,
  drawGameOverScreen,
  drawLevelTransition
} from './ui.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let dog;
  let inputController;

  // Initialize logs
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.randomSeed(42);
    p.frameRate(60);

    // Load high score
    const savedHighScore = localStorage.getItem('puffyPupHighScore');
    if (savedHighScore) {
      gameState.highScore = parseInt(savedHighScore);
    }

    // Initialize entities
    dog = new Dog(p);
    gameState.player = dog;
    gameState.entities.push(dog);

    inputController = new InputController(p);

    // Log initial state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    p.background(235, 245, 255);

    // Handle game phases
    if (gameState.gamePhase === GAME_PHASES.START) {
      drawStartScreen(p);
    } else if (gameState.showLevelTransition) {
      drawLevelTransition(p);
      
      // Auto-advance after 3 seconds
      gameState.levelTransitionTimer++;
      if (gameState.levelTransitionTimer > 180) {
        gameState.showLevelTransition = false;
        gameState.levelTransitionTimer = 0;
      }
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updatePlaying(p);
      drawPlaying(p);
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      drawPlaying(p);
      
      // Draw pause overlay
      p.fill(0, 0, 0, 100);
      p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      p.fill(255);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(48);
      p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      p.textSize(20);
      p.text('Press ESC to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
      drawGameOverScreen(p, true);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      drawGameOverScreen(p, false);
    }

    // Execute automated test actions if not in human mode
    if (gameState.controlMode !== 'HUMAN') {
      const action = inputController.getAction();
      inputController.executeAction(action);
    }
  };

  function updatePlaying(p) {
    const config = LEVEL_CONFIG[gameState.currentLevel - 1];

    // Update swelling meter
    gameState.swellingMeter += config.swellingRate;
    
    // Check lose condition
    if (gameState.swellingMeter >= 100) {
      transitionToGameOver(false);
      return;
    }

    // Check time limit
    if (config.timeLimit) {
      const elapsed = (Date.now() - gameState.levelStartTime) / 1000;
      if (elapsed >= config.timeLimit && gameState.successfulHeals < config.requiredHeals) {
        transitionToGameOver(false);
        return;
      }
    }

    // Check win condition
    if (gameState.successfulHeals >= config.requiredHeals) {
      if (gameState.currentLevel < 5) {
        // Next level
        gameState.currentLevel++;
        gameState.successfulHeals = 0;
        gameState.swellingMeter = 0;
        
        // Level completion bonus
        const bonus = 500 + (gameState.currentLevel - 2) * 250;
        gameState.score += bonus;
        
        startLevel();
        gameState.showLevelTransition = true;
        gameState.levelTransitionTimer = 0;
      } else {
        // Win game
        const bonus = 1500;
        gameState.score += bonus;
        transitionToGameOver(true);
      }
      return;
    }

    // Update entities
    dog.update();

    // Update distractions
    for (const distraction of gameState.distractions) {
      distraction.update();
    }

    // Update particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
      gameState.particles[i].update();
      if (gameState.particles[i].isDead()) {
        gameState.particles.splice(i, 1);
      }
    }

    // Update feedback timer
    if (gameState.feedbackTimer > 0) {
      gameState.feedbackTimer--;
    }

    // Handle drawing
    if (gameState.isDrawing) {
      gameState.drawnPath.push({ x: gameState.cursorX, y: gameState.cursorY });
    }

    // Get and execute input actions
    const action = inputController.getAction();
    inputController.executeAction(action);

    // Log player info periodically
    if (p.frameCount % 30 === 0) {
      p.logs.player_info.push({
        screen_x: gameState.cursorX,
        screen_y: gameState.cursorY,
        game_x: gameState.cursorX,
        game_y: gameState.cursorY,
        framecount: p.frameCount
      });
    }
  }

  function drawPlaying(p) {
    // Draw background elements
    drawBackground(p);

    // Draw dog
    dog.draw();

    // Draw target shape
    if (gameState.currentTargetShape) {
      gameState.currentTargetShape.draw(150);
    }

    // Draw drawn path
    if (gameState.drawnPath.length > 1) {
      p.push();
      p.noFill();
      p.stroke(100, 255, 100);
      p.strokeWeight(4);
      p.beginShape();
      for (const point of gameState.drawnPath) {
        p.vertex(point.x, point.y);
      }
      p.endShape();
      p.pop();
    }

    // Draw distractions
    for (const distraction of gameState.distractions) {
      distraction.draw();
    }

    // Draw particles
    for (const particle of gameState.particles) {
      particle.draw();
    }

    // Draw cursor
    p.push();
    p.fill(255, 200, 100);
    p.stroke(200, 100, 50);
    p.strokeWeight(2);
    p.ellipse(gameState.cursorX, gameState.cursorY, 12, 12);
    p.pop();

    // Draw UI
    drawPlayingUI(p);
  }

  function drawBackground(p) {
    // Simple cozy room background
    p.fill(245, 235, 220);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Floor
    p.fill(200, 180, 150);
    p.rect(0, CANVAS_HEIGHT - 80, CANVAS_WIDTH, 80);

    // Wall decorations
    p.fill(220, 200, 170);
    p.rect(50, 50, 80, 100, 5);
    p.rect(CANVAS_WIDTH - 130, 50, 80, 100, 5);
  }

  function startLevel() {
    const config = LEVEL_CONFIG[gameState.currentLevel - 1];
    
    gameState.levelStartTime = Date.now();
    gameState.swellingMeter = 0;
    gameState.successfulHeals = 0;
    gameState.currentTargetShape = new TargetShape(p, config.shapeComplexity);
    gameState.isDrawing = false;
    gameState.drawnPath = [];
    gameState.particles = [];

    // Create distractions
    gameState.distractions = [];
    for (let i = 0; i < config.distractionCount; i++) {
      gameState.distractions.push(new Distraction(p, config.distractionSpeed));
    }

    p.logs.game_info.push({
      data: { phase: 'LEVEL_START', level: gameState.currentLevel },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function transitionToGameOver(isWin) {
    gameState.gamePhase = isWin ? GAME_PHASES.GAME_OVER_WIN : GAME_PHASES.GAME_OVER_LOSE;
    
    // Update high score
    if (gameState.score > gameState.highScore) {
      gameState.highScore = gameState.score;
      localStorage.setItem('puffyPupHighScore', gameState.highScore.toString());
    }

    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  p.keyPressed = function() {
    p.logs.inputs.push({
      input_type: 'keyPressed',
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    // ENTER - Start game
    if (p.keyCode === 13) {
      if (gameState.gamePhase === GAME_PHASES.START) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        gameState.score = 0;
        gameState.currentLevel = 1;
        startLevel();
        gameState.showLevelTransition = true;
        gameState.levelTransitionTimer = 0;
        
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }

    // ESC - Pause/Unpause
    if (p.keyCode === 27) {
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
      }
      
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }

    // R - Restart
    if (p.keyCode === 82) {
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        gameState.gamePhase = GAME_PHASES.START;
        gameState.score = 0;
        gameState.currentLevel = 1;
        gameState.swellingMeter = 0;
        gameState.successfulHeals = 0;
        gameState.particles = [];
        gameState.distractions = [];
        gameState.showLevelTransition = false;
        
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }

    // SPACE - Drawing toggle
    if (p.keyCode === 32) {
      inputController.handleSpace();
    }

    // SHIFT - Alternative pause
    if (p.keyCode === 16) {
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
      }
      
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  };

  p.keyReleased = function() {
    p.logs.inputs.push({
      input_type: 'keyReleased',
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
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
  
  const activeBtn = document.getElementById(mode === 'HUMAN' ? 'humanModeBtn' : 
                                           mode === 'TEST_1' ? 'test_1_ModeBtn' : 
                                           'test_2_ModeBtn');
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  gameInstance.logs.game_info.push({
    data: { controlMode: mode },
    framecount: gameInstance.frameCount,
    timestamp: Date.now()
  });
};