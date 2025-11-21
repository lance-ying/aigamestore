// question.js - Question generation and management

import { gameState } from './globals.js';
import { MINI_GAME_TYPES } from './globals.js';

export function generateQuestionsForLevel(levelData) {
  const questions = [];
  const vocabCopy = [...levelData.vocabulary];
  
  // Shuffle vocabulary
  for (let i = vocabCopy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [vocabCopy[i], vocabCopy[j]] = [vocabCopy[j], vocabCopy[i]];
  }
  
  // Take required number of questions
  const selectedVocab = vocabCopy.slice(0, levelData.totalQuestions);
  
  selectedVocab.forEach(vocab => {
    const question = {
      word: vocab.word,
      correctAnswer: vocab.correctAnswer,
      options: vocab.options ? [...vocab.options] : null,
      clue: vocab.clue || null,
      sentence: vocab.sentence || null,
      timeLimit: levelData.timePerQuestion
    };
    
    // Shuffle options if they exist
    if (question.options) {
      for (let i = question.options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [question.options[i], question.options[j]] = [question.options[j], question.options[i]];
      }
    }
    
    questions.push(question);
  });
  
  return questions;
}

export function loadNextQuestion() {
  if (gameState.currentQuestionIndex >= gameState.questions.length) {
    return false; // No more questions
  }
  
  gameState.currentQuestion = gameState.questions[gameState.currentQuestionIndex];
  gameState.timeLeftForQuestion = gameState.currentQuestion.timeLimit;
  gameState.selectedAnswerIndex = -1;
  gameState.typedAnswer = "";
  gameState.showingFeedback = false;
  gameState.feedbackTimer = 0;
  gameState.hintUsed = false;
  gameState.removedOptionIndex = -1;
  gameState.revealedLetters = [];
  
  return true;
}

export function checkAnswer() {
  const question = gameState.currentQuestion;
  const miniGameType = gameState.currentLevelData.miniGameType;
  
  let isCorrect = false;
  
  if (miniGameType === MINI_GAME_TYPES.TYPING) {
    isCorrect = gameState.typedAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase();
  } else {
    const selectedAnswer = question.options[gameState.selectedAnswerIndex];
    isCorrect = selectedAnswer === question.correctAnswer;
  }
  
  return isCorrect;
}

export function applyHint(p) {
  if (gameState.hintUsed) return;
  
  // Deduct points
  gameState.levelScore = Math.max(0, gameState.levelScore - 100);
  gameState.totalScore = Math.max(0, gameState.totalScore - 100);
  gameState.hintUsed = true;
  
  const miniGameType = gameState.currentLevelData.miniGameType;
  const question = gameState.currentQuestion;
  
  if (miniGameType === MINI_GAME_TYPES.TYPING) {
    // Reveal first letter
    if (question.correctAnswer.length > 0) {
      gameState.revealedLetters = [0];
      gameState.typedAnswer = question.correctAnswer[0];
    }
  } else {
    // Remove one incorrect option
    const correctAnswer = question.correctAnswer;
    const options = question.options;
    
    for (let i = 0; i < options.length; i++) {
      if (options[i] !== correctAnswer && i !== gameState.selectedAnswerIndex) {
        gameState.removedOptionIndex = i;
        break;
      }
    }
  }
}