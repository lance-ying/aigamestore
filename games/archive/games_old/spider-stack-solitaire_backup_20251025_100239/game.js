import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, LEVEL_CONFIGS } from './globals.js';
import { handleKeyPressed, handleMousePressed, handleMouseReleased } from './input.js';
import { drawStartScreen, drawPlayingScreen, drawGameOverScreen } from './render.js';
import { updateGameLogic, logPlayerInfo } from './gameLogic.js';
import { initializeTableau } from './tableau.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    gameState.gameDifficultySuits = LEVEL_CONFIGS[0].suits;
    
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    p.logs.game_info.push({
      data: { gamePhase: "START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    if (gameState.gamePhase === "START") {
      drawStartScreen(p);
    } else if (gameState.gamePhase === "PLAYING" || gameState.gamePhase === "PAUSED") {
      drawPlayingScreen(p);
      if (!gameState.isPaused) {
        updateGameLogic(p);
        logPlayerInfo(p);
      }
    } else if (gameState.gamePhase === "GAME_OVER") {
      drawGameOverScreen(p);
    }
  };

  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, p.keyCode);
    }
  };

  p.mousePressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleMousePressed(p);
    }
  };

  p.mouseReleased = function() {
    if (gameState.controlMode === "HUMAN") {
      handleMouseReleased(p);
    }
  };
});

window.gameInstance = gameInstance;

window.getGameState = function() {
  return gameState;
};

window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  if (mode === "HUMAN") {
    document.getElementById('humanModeBtn').classList.add('active');
  } else if (mode === "TEST_1") {
    document.getElementById('test_1_ModeBtn').classList.add('active');
    runBasicTest();
  } else if (mode === "TEST_2") {
    document.getElementById('test_2_ModeBtn').classList.add('active');
    runWinTest();
  }
};

function runBasicTest() {
  setTimeout(() => {
    if (gameState.gamePhase === "START") {
      handleKeyPressed(gameInstance, 13);
    }
  }, 500);
  
  setTimeout(() => {
    if (gameState.gamePhase === "PLAYING") {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          handleKeyPressed(gameInstance, 32);
        }, 1000 + i * 500);
      }
    }
  }, 1500);
}

function runWinTest() {
  setTimeout(() => {
    if (gameState.gamePhase === "START") {
      handleKeyPressed(gameInstance, 13);
    }
  }, 500);
  
  setTimeout(() => {
    if (gameState.gamePhase === "PLAYING") {
      for (let i = 0; i < 8; i++) {
        gameState.foundations.push([]);
      }
      gameState.tableau = gameState.tableau.map(() => []);
    }
  }, 1500);
}