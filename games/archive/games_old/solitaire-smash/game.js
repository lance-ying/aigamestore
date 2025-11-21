import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { dealLevel } from './levels.js';
import { updateCardPositions } from './layout.js';
import { checkWinCondition, calculateLevelBonus } from './gameLogic.js';
import { handleKeyPressed } from './input.js';
import { drawStartScreen, drawGameScreen, drawGameOverScreen } from './rendering.js';
import { getTestAction, executeTestAction } from './testController.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.randomSeed(42);
    p.frameRate(60);
    
    initializeGame();
    
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    if (gameState.controlMode !== "HUMAN") {
      const action = getTestAction(p);
      executeTestAction(p, action);
    }
    
    if (gameState.gamePhase === "START") {
      drawStartScreen(p);
    } else if (gameState.gamePhase === "PLAYING" || gameState.gamePhase === "PAUSED") {
      if (gameState.gamePhase === "PLAYING") {
        gameState.timeElapsed = (Date.now() - gameState.startTime) / 1000;
        
        if (checkWinCondition()) {
          const bonus = calculateLevelBonus();
          gameState.score += bonus;
          gameState.levelScores[gameState.currentLevel - 1] = gameState.score;
          gameState.totalScore += gameState.score;
          
          if (gameState.currentLevel < 5) {
            gameState.gamePhase = "GAME_OVER_WIN";
          } else {
            gameState.gamePhase = "GAME_OVER_WIN";
          }
          
          p.logs.game_info.push({
            data: { gamePhase: gameState.gamePhase, score: gameState.score },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
      }
      
      drawGameScreen(p);
    } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
      drawGameOverScreen(p, gameState.gamePhase === "GAME_OVER_WIN");
    }
  };

  p.keyPressed = function() {
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === "START") {
        startGame();
      } else if (gameState.gamePhase === "GAME_OVER_WIN") {
        if (gameState.currentLevel < 5) {
          gameState.currentLevel++;
          startGame();
        }
      }
    } else if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === "PLAYING") {
        gameState.gamePhase = "PAUSED";
        p.logs.game_info.push({
          data: { gamePhase: "PAUSED" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === "PAUSED") {
        gameState.gamePhase = "PLAYING";
        p.logs.game_info.push({
          data: { gamePhase: "PLAYING" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (p.keyCode === 82) { // R
      if (gameState.gamePhase === "GAME_OVER_WIN" || 
          gameState.gamePhase === "GAME_OVER_LOSE" ||
          gameState.gamePhase === "PLAYING" ||
          gameState.gamePhase === "PAUSED") {
        initializeGame();
        p.logs.game_info.push({
          data: { gamePhase: "START" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (gameState.gamePhase === "PLAYING") {
      handleKeyPressed(p, p.keyCode);
    }
    
    return false;
  };

  function initializeGame() {
    gameState.gamePhase = "START";
    gameState.currentLevel = 1;
    gameState.totalScore = 0;
    gameState.levelScores = [0, 0, 0, 0, 0];
  }

  function startGame() {
    gameState.gamePhase = "PLAYING";
    gameState.score = 0;
    gameState.moveCount = 0;
    gameState.timeElapsed = 0;
    gameState.startTime = Date.now();
    gameState.undoStack = [];
    gameState.selectedCards = [];
    gameState.selectedSource = null;
    gameState.highlightedArea = { type: 'tableau', index: 0 };
    gameState.stockpileCycles = 0;
    
    const level = dealLevel(gameState.currentLevel);
    gameState.tableau = level.tableau;
    gameState.stockpile = level.stockpile;
    gameState.waste = [];
    gameState.foundations = [[], [], [], []];
    
    gameState.allCards = [];
    for (let col of gameState.tableau) {
      gameState.allCards.push(...col);
    }
    gameState.allCards.push(...gameState.stockpile);
    
    updateCardPositions(gameState);
    
    p.logs.game_info.push({
      data: { gamePhase: "PLAYING", level: gameState.currentLevel },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
});

window.gameInstance = gameInstance;

window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn'];
  buttons.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.classList.remove('active');
  });
  
  if (mode === 'HUMAN') {
    document.getElementById('humanModeBtn').classList.add('active');
  } else if (mode === 'TEST_1') {
    document.getElementById('test_1_ModeBtn').classList.add('active');
  } else if (mode === 'TEST_2') {
    document.getElementById('test_2_ModeBtn').classList.add('active');
  }
};