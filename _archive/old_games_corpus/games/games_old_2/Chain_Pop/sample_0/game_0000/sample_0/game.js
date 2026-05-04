import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS, CONTROL_MODES } from './globals.js';
import { handleKeyPressed, updateAutomatedControl } from './input.js';
import { drawStartScreen, drawPlayingScreen, drawPausedScreen, drawGameOverScreen } from './render.js';
import { initializeGrid } from './grid.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Load high score
    const savedHighScore = localStorage.getItem('chainPopHighScore');
    if (savedHighScore) {
      gameState.highScore = parseInt(savedHighScore);
    }
    
    p.logs.game_info.push({
      data: { phase: "START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Update particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
      gameState.particles[i].update();
      if (gameState.particles[i].isDead()) {
        gameState.particles.splice(i, 1);
      }
    }
    
    // Update balls
    for (let row = 0; row < gameState.gridRows; row++) {
      for (let col = 0; col < gameState.gridCols; col++) {
        const ball = gameState.grid[row][col];
        if (ball && !ball.isObstacle) {
          ball.update();
        }
      }
    }
    
    // Update falling state
    if (gameState.fallingBalls.length > 0) {
      let allSettled = true;
      for (const ball of gameState.fallingBalls) {
        if (ball.isFalling) {
          allSettled = false;
          break;
        }
      }
      if (allSettled) {
        gameState.fallingBalls = [];
      }
    }
    
    // Handle level transition
    if (gameState.gamePhase === "LEVEL_TRANSITION") {
      gameState.levelTransitionTimer--;
      if (gameState.levelTransitionTimer <= 0) {
        gameState.showLevelTransition = false;
        gameState.currentLevel++;
        initializeGrid(p);
        gameState.gamePhase = GAME_PHASES.PLAYING;
        
        p.logs.game_info.push({
          data: { phase: "PLAYING", level: gameState.currentLevel },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // Automated control
    updateAutomatedControl(p);
    
    // Render based on game phase
    if (gameState.gamePhase === GAME_PHASES.START) {
      drawStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING || gameState.gamePhase === "LEVEL_TRANSITION") {
      drawPlayingScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      drawPausedScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      drawGameOverScreen(p);
    }
    
    // Log player info periodically
    if (p.frameCount % 30 === 0 && gameState.gamePhase === GAME_PHASES.PLAYING) {
      const cursorScreenX = gameState.gridOffsetX + gameState.cursorX * gameState.cellSize + gameState.cellSize / 2;
      const cursorScreenY = gameState.gridOffsetY + gameState.cursorY * gameState.cellSize + gameState.cellSize / 2;
      
      p.logs.player_info.push({
        screen_x: cursorScreenX,
        screen_y: cursorScreenY,
        game_x: gameState.cursorX,
        game_y: gameState.cursorY,
        framecount: p.frameCount
      });
    }
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p);
  };
});

window.gameInstance = gameInstance;

window.getGameState = function() {
  return gameState;
};

window.setControlMode = function(mode) {
  if (CONTROL_MODES[mode]) {
    gameState.controlMode = mode;
    
    // Update button states
    document.querySelectorAll('.control-button').forEach(btn => {
      btn.classList.remove('active');
    });
    
    const buttonMap = {
      'HUMAN': 'humanModeBtn',
      'TEST_1': 'test_1_ModeBtn',
      'TEST_2': 'test_2_ModeBtn'
    };
    
    const activeButton = document.getElementById(buttonMap[mode]);
    if (activeButton) {
      activeButton.classList.add('active');
    }
  }
};