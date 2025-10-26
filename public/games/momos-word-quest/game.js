// game.js - Main game file

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { LEVELS, getLevelData } from './levels.js';
import { generateQuestionsForLevel, loadNextQuestion, checkAnswer, applyHint } from './question.js';
import { updateScoreForAnswer, applyLevelCompletionBonus, saveHighScore } from './scoring.js';
import { renderStartScreen, renderPlaying, renderPaused, renderGameOver } from './rendering.js';
import { handleKeyPressed } from './input.js';
import { getTestingAction, executeTestAction } from './testing.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };
  
  let lastFrameTime = 0;
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize game state
    initializeGame();
    
    // Expose game state globally with both 'gamePhase' and 'phase' fields
    window.getGameState = function() {
      return {
        ...gameState,
        phase: gameState.gamePhase // Add 'phase' alias for compatibility
      };
    };
    
    // Log initial state
    logGameInfo(p, "Game initialized", { gamePhase: gameState.gamePhase });
  };
  
  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== 'HUMAN') {
      const testAction = getTestingAction(p);
      if (testAction) {
        executeTestAction(p, testAction);
      }
    }
    
    // Update game logic
    updateGame(p);
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        renderStartScreen(p);
        break;
      case GAME_PHASES.PLAYING:
        renderPlaying(p);
        break;
      case GAME_PHASES.PAUSED:
        renderPlaying(p);
        renderPaused(p);
        break;
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        renderGameOver(p);
        break;
    }
  };
  
  p.keyPressed = function() {
    const action = handleKeyPressed(p, p.key, p.keyCode);
    
    if (action) {
      executeGameAction(p, action);
    }
    
    return false; // Prevent default
  };
  
  // Store reference for testing
  p._handleKeyPressed = p.keyPressed;
  
  function initializeGame() {
    gameState.gamePhase = GAME_PHASES.START;
    gameState.currentLevel = 1;
    gameState.unlockedLevels = 1;
    gameState.totalScore = 0;
    
    // Initialize player entity for compatibility
    gameState.player = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2
    };
    gameState.entities = [gameState.player];
  }
  
  function startLevel(levelNumber) {
    const levelData = getLevelData(levelNumber);
    
    if (!levelData) {
      console.error("Level not found:", levelNumber);
      return;
    }
    
    // Set phase to PLAYING FIRST before any game setup
    gameState.gamePhase = GAME_PHASES.PLAYING;
    
    gameState.currentLevel = levelNumber;
    gameState.currentLevelData = levelData;
    gameState.levelScore = 0;
    gameState.currentQuestionIndex = 0;
    gameState.correctAnswersCount = 0;
    gameState.incorrectAnswersCount = 0;
    gameState.correctStreak = 0;
    
    // Generate questions
    gameState.questions = generateQuestionsForLevel(levelData);
    
    // Load first question
    loadNextQuestion();
    
    logGameInfo(p, "Level started", { level: levelNumber, gamePhase: gameState.gamePhase });
  }
  
  function updateGame(p) {
    if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
      return;
    }
    
    // Update timer
    if (!gameState.showingFeedback) {
      const deltaTime = 1 / 60; // Assuming 60 FPS
      gameState.timeLeftForQuestion -= deltaTime;
      
      // Check if time ran out
      if (gameState.timeLeftForQuestion <= 0) {
        submitAnswer(p, false); // Time's up, wrong answer
      }
    } else {
      // Feedback timer
      gameState.feedbackTimer += 1 / 60;
      
      if (gameState.feedbackTimer >= 1.5) {
        // Move to next question
        gameState.showingFeedback = false;
        gameState.feedbackTimer = 0;
        gameState.currentQuestionIndex++;
        
        if (!loadNextQuestion()) {
          // Level complete
          endLevel(p);
        }
      }
    }
    
    // Log player info periodically
    if (p.frameCount % 60 === 0) {
      logPlayerInfo(p);
    }
  }
  
  function executeGameAction(p, action) {
    switch (action.action) {
      case 'START_GAME':
        startLevel(1);
        break;
      case 'PAUSE':
        gameState.gamePhase = GAME_PHASES.PAUSED;
        logGameInfo(p, "Game paused");
        break;
      case 'RESUME':
        gameState.gamePhase = GAME_PHASES.PLAYING;
        logGameInfo(p, "Game resumed");
        break;
      case 'RESTART':
        initializeGame();
        logGameInfo(p, "Game restarted");
        break;
      case 'USE_HINT':
        applyHint(p);
        break;
      case 'SUBMIT_ANSWER':
        if (!gameState.showingFeedback) {
          const isCorrect = checkAnswer();
          submitAnswer(p, isCorrect);
        }
        break;
    }
  }
  
  function submitAnswer(p, isCorrect) {
    gameState.lastAnswerCorrect = isCorrect;
    gameState.showingFeedback = true;
    
    updateScoreForAnswer(isCorrect, gameState.timeLeftForQuestion);
    
    logGameInfo(p, "Answer submitted", {
      correct: isCorrect,
      score: gameState.levelScore,
      totalScore: gameState.totalScore
    });
  }
  
  function endLevel(p) {
    const levelData = gameState.currentLevelData;
    const passed = gameState.correctAnswersCount >= levelData.requiredCorrect;
    
    if (passed) {
      applyLevelCompletionBonus();
      gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
      
      // Unlock next level
      if (gameState.currentLevel < LEVELS.length) {
        gameState.unlockedLevels = Math.max(gameState.unlockedLevels, gameState.currentLevel + 1);
      }
      
      // Save high score
      saveHighScore(gameState.totalScore);
      
      logGameInfo(p, "Level completed", {
        level: gameState.currentLevel,
        score: gameState.levelScore,
        totalScore: gameState.totalScore
      });
    } else {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
      logGameInfo(p, "Level failed", {
        level: gameState.currentLevel,
        correctAnswers: gameState.correctAnswersCount,
        requiredCorrect: levelData.requiredCorrect
      });
    }
  }
  
  function logGameInfo(p, message, data = {}) {
    p.logs.game_info.push({
      message,
      data: { ...data, gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function logPlayerInfo(p) {
    p.logs.player_info.push({
      screen_x: gameState.player.x,
      screen_y: gameState.player.y,
      game_x: gameState.player.x,
      game_y: gameState.player.y,
      framecount: p.frameCount
    });
  }
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
};