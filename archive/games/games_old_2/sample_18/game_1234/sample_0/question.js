// question.js - Question display and logic

import { gameState, PLAY_STATES, CATEGORIES } from './globals.js';
import { getRandomQuestion } from './questionBank.js';

export function startNewQuestion(p) {
  const category = gameState.selectedCategory;
  const difficulty = gameState.levelConfig.difficulty;
  
  gameState.currentQuestion = getRandomQuestion(category, difficulty);
  gameState.selectedAnswerIndex = -1;
  gameState.questionStartTime = p.millis();
  gameState.usedRemoveTwoWrong = false;
  gameState.timeLimit = gameState.levelConfig.timeLimit;
  
  // Log question start
  if (p.logs) {
    p.logs.game_info.push({
      data: `Question started: ${category} - ${difficulty}`,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function updateQuestion(p) {
  if (gameState.playState !== PLAY_STATES.QUESTION) return;
  
  const elapsed = (p.millis() - gameState.questionStartTime) / 1000;
  
  if (elapsed >= gameState.timeLimit) {
    // Time's up!
    processAnswer(p, false, true);
  }
}

export function processAnswer(p, isCorrect, isTimeout = false) {
  gameState.playState = PLAY_STATES.FEEDBACK;
  
  if (isTimeout) {
    gameState.feedbackMessage = "TIME UP!";
    gameState.feedbackColor = [255, 140, 0];
    gameState.livesRemaining--;
  } else if (isCorrect) {
    gameState.feedbackMessage = "CORRECT!";
    gameState.feedbackColor = [50, 205, 50];
    
    // Calculate score with time bonus
    const timeRemaining = gameState.timeLimit - ((p.millis() - gameState.questionStartTime) / 1000);
    const basePoints = 100;
    const timeBonus = Math.floor(Math.max(0, timeRemaining) * 5);
    gameState.currentScore += basePoints + timeBonus;
    
    // Track correct answers for crowns
    const category = gameState.selectedCategory;
    gameState.categoryCorrectCounts[category]++;
    
    // Check if crown earned
    if (gameState.categoryCorrectCounts[category] >= 3 && !gameState.earnedCrowns[category]) {
      gameState.earnedCrowns[category] = true;
      
      // Show crown earned message
      setTimeout(() => {
        if (gameState.playState === PLAY_STATES.FEEDBACK) {
          gameState.feedbackMessage += "\n👑 CROWN EARNED!";
        }
      }, 500);
    }
  } else {
    gameState.feedbackMessage = "INCORRECT!";
    gameState.feedbackColor = [220, 20, 60];
    gameState.livesRemaining--;
  }
  
  gameState.feedbackTimer = p.millis();
  
  // Check game over conditions
  setTimeout(() => {
    if (gameState.livesRemaining <= 0) {
      gameState.gamePhase = "GAME_OVER_LOSE";
      if (p.logs) {
        p.logs.game_info.push({
          data: `Game Over - Lives depleted`,
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else {
      // Check if level complete
      const crownsEarned = Object.values(gameState.earnedCrowns).filter(c => c).length;
      if (crownsEarned >= gameState.levelConfig.crownsRequired) {
        gameState.playState = PLAY_STATES.LEVEL_COMPLETE;
        if (p.logs) {
          p.logs.game_info.push({
            data: `Level ${gameState.currentLevel} complete`,
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
      } else {
        // Continue to next question
        gameState.playState = PLAY_STATES.SPINNING;
        gameState.wheelSpeed = 0;
      }
    }
  }, 2000);
}

export function renderQuestion(p) {
  if (!gameState.currentQuestion) return;
  
  const q = gameState.currentQuestion;
  
  // Question box
  p.fill(40, 40, 60);
  p.stroke(255);
  p.strokeWeight(2);
  p.rect(50, 50, 500, 80, 10);
  
  // Question text
  p.fill(255);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.text(q.text, 300, 90);
  
  // Timer
  const elapsed = (p.millis() - gameState.questionStartTime) / 1000;
  const remaining = Math.max(0, gameState.timeLimit - elapsed);
  const timerPercent = remaining / gameState.timeLimit;
  
  // Timer bar
  const barColor = timerPercent > 0.5 ? [50, 205, 50] : timerPercent > 0.25 ? [255, 215, 0] : [220, 20, 60];
  p.fill(...barColor);
  p.noStroke();
  p.rect(50, 140, 500 * timerPercent, 10, 5);
  
  p.fill(255);
  p.textAlign(p.CENTER);
  p.textSize(12);
  p.text(`${remaining.toFixed(1)}s`, 300, 160);
  
  // Answer options
  const optionPositions = [
    { x: 80, y: 200, key: "↑" },   // Top-left
    { x: 320, y: 200, key: "→" },  // Top-right
    { x: 80, y: 280, key: "↓" },   // Bottom-left
    { x: 320, y: 280, key: "←" }   // Bottom-right
  ];
  
  for (let i = 0; i < 4; i++) {
    if (gameState.usedRemoveTwoWrong && i !== q.correctIndex && 
        i !== gameState.selectedAnswerIndex && removedAnswers[i]) {
      continue; // Skip removed answers
    }
    
    const pos = optionPositions[i];
    const isSelected = gameState.selectedAnswerIndex === i;
    
    // Answer box
    p.fill(...(isSelected ? [100, 150, 255] : [70, 70, 90]));
    p.stroke(255);
    p.strokeWeight(isSelected ? 3 : 1);
    p.rect(pos.x, pos.y, 220, 60, 10);
    
    // Answer text
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text(q.options[i], pos.x + 110, pos.y + 30);
    
    // Key hint
    p.textSize(10);
    p.fill(200);
    p.text(pos.key, pos.x + 200, pos.y + 15);
  }
  
  // Power-up hints
  if (gameState.availablePowerups.skip > 0) {
    p.fill(255, 215, 0);
    p.textAlign(p.LEFT);
    p.textSize(11);
    p.text(`Z: Skip (${gameState.availablePowerups.skip})`, 50, 360);
  }
  
  if (gameState.availablePowerups.removeTwoWrong > 0 && !gameState.usedRemoveTwoWrong) {
    p.fill(255, 140, 0);
    p.textAlign(p.LEFT);
    p.textSize(11);
    p.text(`SHIFT: Remove 2 (${gameState.availablePowerups.removeTwoWrong})`, 50, 380);
  }
}

export function renderFeedback(p) {
  if (gameState.playState !== PLAY_STATES.FEEDBACK) return;
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, p.width, p.height);
  
  // Feedback message
  p.fill(...gameState.feedbackColor);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(gameState.feedbackMessage, p.width / 2, p.height / 2);
  
  // Show correct answer if wrong
  if (gameState.feedbackMessage === "INCORRECT!" && gameState.currentQuestion) {
    p.fill(255);
    p.textSize(16);
    p.text(`Correct answer: ${gameState.currentQuestion.options[gameState.currentQuestion.correctIndex]}`, 
           p.width / 2, p.height / 2 + 60);
  }
}

// Track removed answers for the remove-two power-up
const removedAnswers = [false, false, false, false];

export function useSkipPowerup(p) {
  if (gameState.availablePowerups.skip <= 0) return;
  if (gameState.playState !== PLAY_STATES.QUESTION) return;
  
  gameState.availablePowerups.skip--;
  gameState.currentScore = Math.max(0, gameState.currentScore - 25);
  
  // Skip to next question
  gameState.playState = PLAY_STATES.SPINNING;
  gameState.wheelSpeed = 0;
  
  if (p.logs) {
    p.logs.game_info.push({
      data: "Skip power-up used",
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function useRemoveTwoPowerup(p) {
  if (gameState.availablePowerups.removeTwoWrong <= 0) return;
  if (gameState.playState !== PLAY_STATES.QUESTION) return;
  if (gameState.usedRemoveTwoWrong) return;
  
  gameState.availablePowerups.removeTwoWrong--;
  gameState.currentScore = Math.max(0, gameState.currentScore - 10);
  gameState.usedRemoveTwoWrong = true;
  
  // Mark two wrong answers for removal
  const correctIndex = gameState.currentQuestion.correctIndex;
  let removedCount = 0;
  for (let i = 0; i < 4; i++) {
    removedAnswers[i] = false;
  }
  
  for (let i = 0; i < 4 && removedCount < 2; i++) {
    if (i !== correctIndex) {
      removedAnswers[i] = true;
      removedCount++;
    }
  }
  
  if (p.logs) {
    p.logs.game_info.push({
      data: "Remove two power-up used",
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}