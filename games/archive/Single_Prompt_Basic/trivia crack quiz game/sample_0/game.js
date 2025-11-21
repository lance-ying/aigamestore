// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, CATEGORIES, CROWN_SEGMENT, LEVEL_CONFIG } from './globals.js';
import { QUESTION_DATABASE, getRandomQuestion } from './questions.js';
import { Wheel } from './wheel.js';
import { AI } from './ai.js';
import { drawStartScreen, drawGameUI, drawTokens, drawPauseIndicator, drawGameOver, drawQuestion, drawChallenge } from './ui.js';
import { TestingController } from './testing.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let wheel;
  let ai;
  let testingController;
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      "game_info": [],
      "inputs": [],
      "player_info": []
    };
    
    // Initialize game components
    wheel = new Wheel(p, CANVAS_WIDTH / 2, 130, 80);
    ai = new AI();
    testingController = new TestingController();
    
    // Initialize game state
    gameState.questionDatabase = QUESTION_DATABASE;
    
    logGameInfo("Game initialized", "START");
  };
  
  p.draw = function() {
    // Handle testing mode
    if (gameState.controlMode !== 'HUMAN') {
      const action = testingController.update(p);
      if (action) {
        handleInput(action);
      }
    }
    
    // Render based on game phase
    if (gameState.gamePhase === 'START') {
      drawStartScreen(p);
    } else if (gameState.gamePhase === 'PLAYING') {
      drawGameplay();
    } else if (gameState.gamePhase === 'PAUSED') {
      drawGameplay();
      drawPauseIndicator(p);
    } else if (gameState.gamePhase === 'GAME_OVER_WIN') {
      drawGameOver(p, true);
    } else if (gameState.gamePhase === 'GAME_OVER_LOSE') {
      drawGameOver(p, false);
    }
  };
  
  function drawGameplay() {
    p.background(20, 25, 40);
    
    drawGameUI(p);
    
    // Draw tokens
    drawTokens(p, 50, 60, gameState.playerTokens, true);
    drawTokens(p, CANVAS_WIDTH - 50, 60, gameState.aiTokens, false);
    
    // Draw based on sub-phase
    if (gameState.subPhase === 'SPIN_WHEEL') {
      wheel.update();
      wheel.draw();
      
      if (!gameState.wheelSpinning) {
        // Show spin prompt
        p.fill(255);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(14);
        if (gameState.currentTurn === 'PLAYER') {
          p.text("Press SPACE to spin", CANVAS_WIDTH / 2, 230);
        } else {
          p.text("AI is spinning...", CANVAS_WIDTH / 2, 230);
        }
        
        // Show selected segment
        if (gameState.selectedSegment) {
          p.fill(255, 215, 0);
          p.textSize(18);
          p.text(gameState.selectedSegment.name, CANVAS_WIDTH / 2, 260);
        }
      }
    } else if (gameState.subPhase === 'ANSWER_QUESTION') {
      if (gameState.currentQuestion) {
        drawQuestion(p, gameState.currentQuestion, gameState.showingFeedback, gameState.answeredCorrectly);
      }
    } else if (gameState.subPhase === 'CHALLENGE') {
      drawChallenge(p);
    } else if (gameState.subPhase === 'AI_TURN') {
      wheel.draw();
      p.fill(255);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(16);
      p.text("AI is thinking...", CANVAS_WIDTH / 2, 230);
    } else if (gameState.subPhase === 'LEVEL_TRANSITION') {
      p.fill(255, 215, 0);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(32);
      p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
      p.fill(255);
      p.textSize(20);
      p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      p.textSize(16);
      p.text("Press SPACE to continue", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    }
    
    // Update feedback timer
    if (gameState.showingFeedback) {
      gameState.feedbackTimer++;
    }
  }
  
  p.keyPressed = function() {
    const input = {
      input_type: 'keyPressed',
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    };
    p.logs.inputs.push(input);
    
    handleInput(input);
  };
  
  function handleInput(input) {
    const keyCode = input.data.keyCode;
    
    // Global controls
    if (keyCode === 82) { // R - Restart
      restartGame();
      return;
    }
    
    if (keyCode === 27) { // ESC - Pause
      if (gameState.gamePhase === 'PLAYING') {
        gameState.gamePhase = 'PAUSED';
        logGameInfo("Game paused", "PAUSED");
      } else if (gameState.gamePhase === 'PAUSED') {
        gameState.gamePhase = 'PLAYING';
        logGameInfo("Game resumed", "PLAYING");
      }
      return;
    }
    
    // Phase-specific controls
    if (gameState.gamePhase === 'START') {
      if (keyCode === 13) { // ENTER - Start
        startGame();
      }
    } else if (gameState.gamePhase === 'PLAYING') {
      handleGameplayInput(keyCode);
    } else if (gameState.gamePhase === 'GAME_OVER_WIN' || gameState.gamePhase === 'GAME_OVER_LOSE') {
      if (keyCode === 82) { // R - handled above
        // Already handled
      }
    }
  }
  
  function handleGameplayInput(keyCode) {
    if (gameState.subPhase === 'SPIN_WHEEL') {
      if (keyCode === 32 && !gameState.wheelSpinning && gameState.currentTurn === 'PLAYER') { // SPACE
        wheel.spin();
        
        // Wait for spin to complete
        const checkSpin = setInterval(() => {
          if (!gameState.wheelSpinning && gameState.selectedSegment) {
            clearInterval(checkSpin);
            handleWheelResult();
          }
        }, 100);
      }
    } else if (gameState.subPhase === 'ANSWER_QUESTION') {
      if (gameState.showingFeedback) {
        if (keyCode === 32) { // SPACE - Continue
          proceedAfterAnswer();
        }
      } else {
        if (keyCode === 37) { // LEFT
          gameState.highlightedAnswer = (gameState.highlightedAnswer - 1 + 4) % 4;
        } else if (keyCode === 39) { // RIGHT
          gameState.highlightedAnswer = (gameState.highlightedAnswer + 1) % 4;
        } else if (keyCode === 32) { // SPACE - Confirm
          submitAnswer(gameState.highlightedAnswer);
        }
      }
    } else if (gameState.subPhase === 'CHALLENGE') {
      if (gameState.showingFeedback) {
        if (keyCode === 32 && gameState.feedbackTimer > 30) {
          proceedChallenge();
        }
      } else {
        if (keyCode === 37) { // LEFT
          gameState.highlightedAnswer = (gameState.highlightedAnswer - 1 + 4) % 4;
        } else if (keyCode === 39) { // RIGHT
          gameState.highlightedAnswer = (gameState.highlightedAnswer + 1) % 4;
        } else if (keyCode === 32) { // SPACE
          submitChallengeAnswer(gameState.highlightedAnswer);
        }
      }
    } else if (gameState.subPhase === 'LEVEL_TRANSITION') {
      if (keyCode === 32) { // SPACE
        advanceLevel();
      }
    }
  }
  
  function startGame() {
    gameState.gamePhase = 'PLAYING';
    gameState.subPhase = 'SPIN_WHEEL';
    gameState.currentLevel = 1;
    gameState.score = 0;
    gameState.currentTurn = 'PLAYER';
    gameState.playerTokens = [];
    gameState.aiTokens = [];
    gameState.playerStreakCount = 0;
    gameState.aiStreakCount = 0;
    gameState.wheelRotation = 0;
    gameState.selectedSegment = null;
    
    ai.setLevel(1);
    
    logGameInfo("Game started", "PLAYING");
  }
  
  function restartGame() {
    gameState.gamePhase = 'START';
    gameState.subPhase = 'SPIN_WHEEL';
    gameState.currentLevel = 1;
    gameState.score = 0;
    gameState.currentTurn = 'PLAYER';
    gameState.playerTokens = [];
    gameState.aiTokens = [];
    gameState.playerStreakCount = 0;
    gameState.aiStreakCount = 0;
    gameState.wheelRotation = 0;
    gameState.selectedSegment = null;
    gameState.wheelSpinning = false;
    gameState.currentQuestion = null;
    gameState.inChallenge = false;
    
    logGameInfo("Game restarted", "START");
  }
  
  function handleWheelResult() {
    const segment = gameState.selectedSegment;
    
    if (segment.name === 'Crown') {
      // Crown - instant challenge
      startChallenge();
    } else {
      // Regular category - ask question
      const difficulty = LEVEL_CONFIG[gameState.currentLevel - 1].questionDifficulty;
      const question = getRandomQuestion(segment.name, difficulty);
      
      if (question) {
        gameState.currentQuestion = question;
        gameState.subPhase = 'ANSWER_QUESTION';
        gameState.highlightedAnswer = 0;
        gameState.selectedAnswer = -1;
        gameState.showingFeedback = false;
        gameState.feedbackTimer = 0;
        
        // AI turn
        if (gameState.currentTurn === 'AI') {
          setTimeout(() => {
            const aiAnswer = ai.selectAnswer(question);
            submitAnswer(aiAnswer);
          }, 1000 + Math.random() * 1000);
        }
      }
    }
  }
  
  function submitAnswer(answerIndex) {
    gameState.selectedAnswer = answerIndex;
    gameState.answeredCorrectly = answerIndex === gameState.currentQuestion.c;
    gameState.showingFeedback = true;
    gameState.feedbackTimer = 0;
    
    if (gameState.currentTurn === 'PLAYER') {
      if (gameState.answeredCorrectly) {
        gameState.score += 10;
        gameState.playerStreakCount++;
        
        if (gameState.playerStreakCount === 3) {
          gameState.score += 20; // Streak bonus
        }
      } else {
        gameState.playerStreakCount = 0;
      }
    } else {
      if (gameState.answeredCorrectly) {
        gameState.aiStreakCount++;
      } else {
        gameState.aiStreakCount = 0;
      }
    }
  }
  
  function proceedAfterAnswer() {
    const wasCorrect = gameState.answeredCorrectly;
    const currentPlayer = gameState.currentTurn;
    
    gameState.showingFeedback = false;
    gameState.currentQuestion = null;
    
    if (wasCorrect) {
      // Check for streak/challenge eligibility
      const streak = currentPlayer === 'PLAYER' ? gameState.playerStreakCount : gameState.aiStreakCount;
      
      if (streak >= 3) {
        // Reset streak and start challenge
        if (currentPlayer === 'PLAYER') {
          gameState.playerStreakCount = 0;
        } else {
          gameState.aiStreakCount = 0;
        }
        startChallenge();
      } else {
        // Continue turn - spin again
        gameState.subPhase = 'SPIN_WHEEL';
        gameState.selectedSegment = null;
        
        if (currentPlayer === 'AI') {
          setTimeout(() => {
            wheel.spin();
            const checkSpin = setInterval(() => {
              if (!gameState.wheelSpinning && gameState.selectedSegment) {
                clearInterval(checkSpin);
                handleWheelResult();
              }
            }, 100);
          }, 1000);
        }
      }
    } else {
      // Wrong answer - switch turns
      switchTurns();
    }
  }
  
  function startChallenge() {
    gameState.inChallenge = true;
    gameState.subPhase = 'CHALLENGE';
    
    // Select category
    if (gameState.currentTurn === 'PLAYER') {
      // For simplicity, auto-select a needed category
      const needed = CATEGORIES.filter(cat => !gameState.playerTokens.includes(cat.name));
      gameState.challengeCategory = needed.length > 0 ? needed[0].name : CATEGORIES[0].name;
    } else {
      gameState.challengeCategory = ai.selectChallengeCategory();
    }
    
    // Generate 3 challenge questions
    const difficulty = LEVEL_CONFIG[gameState.currentLevel - 1].questionDifficulty;
    gameState.challengeQuestions = [];
    for (let i = 0; i < 3; i++) {
      const q = getRandomQuestion(gameState.challengeCategory, difficulty);
      if (q) gameState.challengeQuestions.push(q);
    }
    
    gameState.challengeCurrentIndex = 0;
    gameState.challengeCorrectCount = 0;
    gameState.highlightedAnswer = 0;
    gameState.showingFeedback = false;
    gameState.feedbackTimer = 0;
    
    // AI auto-play
    if (gameState.currentTurn === 'AI') {
      setTimeout(() => {
        playAIChallenge();
      }, 1000);
    }
  }
  
  function playAIChallenge() {
    if (gameState.challengeCurrentIndex >= 3) return;
    
    const q = gameState.challengeQuestions[gameState.challengeCurrentIndex];
    const correct = ai.completeChallengeQuestion();
    const answer = correct ? q.c : (q.c + 1) % 4;
    
    submitChallengeAnswer(answer);
    
    setTimeout(() => {
      proceedChallenge();
    }, 1500);
  }
  
  function submitChallengeAnswer(answerIndex) {
    const q = gameState.challengeQuestions[gameState.challengeCurrentIndex];
    gameState.selectedAnswer = answerIndex;
    gameState.answeredCorrectly = answerIndex === q.c;
    gameState.showingFeedback = true;
    gameState.feedbackTimer = 0;
    
    if (gameState.answeredCorrectly) {
      gameState.challengeCorrectCount++;
      if (gameState.currentTurn === 'PLAYER') {
        gameState.score += 15;
      }
    }
  }
  
  function proceedChallenge() {
    gameState.showingFeedback = false;
    gameState.challengeCurrentIndex++;
    
    if (gameState.challengeCurrentIndex >= 3) {
      // Challenge complete
      completeChallenge();
    } else {
      gameState.highlightedAnswer = 0;
      gameState.feedbackTimer = 0;
      
      if (gameState.currentTurn === 'AI') {
        setTimeout(() => {
          playAIChallenge();
        }, 500);
      }
    }
  }
  
  function completeChallenge() {
    const success = gameState.challengeCorrectCount >= 3;
    
    if (success) {
      // Award token
      if (gameState.currentTurn === 'PLAYER') {
        if (!gameState.playerTokens.includes(gameState.challengeCategory)) {
          gameState.playerTokens.push(gameState.challengeCategory);
          gameState.score += 100;
        }
      } else {
        if (!gameState.aiTokens.includes(gameState.challengeCategory)) {
          gameState.aiTokens.push(gameState.challengeCategory);
        }
      }
    }
    
    gameState.inChallenge = false;
    gameState.challengeQuestions = [];
    
    // Check win conditions
    if (gameState.playerTokens.length === 6) {
      playerWins();
      return;
    }
    
    if (gameState.aiTokens.length === 6) {
      aiWins();
      return;
    }
    
    // Switch turns
    switchTurns();
  }
  
  function switchTurns() {
    gameState.currentTurn = gameState.currentTurn === 'PLAYER' ? 'AI' : 'PLAYER';
    gameState.subPhase = 'SPIN_WHEEL';
    gameState.selectedSegment = null;
    
    if (gameState.currentTurn === 'AI') {
      setTimeout(() => {
        wheel.spin();
        const checkSpin = setInterval(() => {
          if (!gameState.wheelSpinning && gameState.selectedSegment) {
            clearInterval(checkSpin);
            handleWheelResult();
          }
        }, 100);
      }, 1000);
    }
  }
  
  function playerWins() {
    gameState.score += 500;
    
    if (gameState.currentLevel < gameState.maxLevel) {
      gameState.subPhase = 'LEVEL_TRANSITION';
    } else {
      gameState.gamePhase = 'GAME_OVER_WIN';
      logGameInfo("Player wins - all levels complete", "GAME_OVER_WIN");
    }
  }
  
  function aiWins() {
    gameState.gamePhase = 'GAME_OVER_LOSE';
    logGameInfo("AI wins", "GAME_OVER_LOSE");
  }
  
  function advanceLevel() {
    gameState.currentLevel++;
    gameState.currentTurn = 'PLAYER';
    gameState.playerTokens = [];
    gameState.aiTokens = [];
    gameState.playerStreakCount = 0;
    gameState.aiStreakCount = 0;
    gameState.subPhase = 'SPIN_WHEEL';
    gameState.selectedSegment = null;
    
    ai.setLevel(gameState.currentLevel);
    
    logGameInfo(`Advanced to level ${gameState.currentLevel}`, "PLAYING");
  }
  
  function logGameInfo(data, phase) {
    p.logs.game_info.push({
      data: data,
      phase: phase,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Expose control mode setter
  window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    testingController.setTestMode(mode);
    
    // Update button states
    const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn'];
    buttons.forEach(btnId => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.classList.toggle('active', 
          (mode === 'HUMAN' && btnId === 'humanModeBtn') ||
          (mode === 'TEST_1' && btnId === 'test_1_ModeBtn') ||
          (mode === 'TEST_2' && btnId === 'test_2_ModeBtn')
        );
      }
    });
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;