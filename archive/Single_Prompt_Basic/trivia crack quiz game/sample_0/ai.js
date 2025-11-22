// ai.js - AI opponent logic

import { gameState, CATEGORIES, LEVEL_CONFIG } from './globals.js';
import { getRandomQuestion } from './questions.js';

export class AI {
  constructor() {
    this.level = 0;
  }

  setLevel(level) {
    this.level = level - 1; // 0-indexed
  }

  shouldAnswerCorrectly() {
    const config = LEVEL_CONFIG[this.level];
    return Math.random() < config.aiAccuracy;
  }

  shouldAttemptChallenge() {
    const config = LEVEL_CONFIG[this.level];
    return Math.random() < config.aiChallengeChance;
  }

  selectAnswer(question) {
    if (this.shouldAnswerCorrectly()) {
      return question.c;
    } else {
      // Select a wrong answer
      const wrongAnswers = [0, 1, 2, 3].filter(i => i !== question.c);
      return wrongAnswers[Math.floor(Math.random() * wrongAnswers.length)];
    }
  }

  selectChallengeCategory() {
    // Prioritize categories the AI doesn't have
    const neededCategories = CATEGORIES.filter(cat => 
      !gameState.aiTokens.includes(cat.name)
    );
    
    if (neededCategories.length > 0) {
      // Smart AI targets categories player also needs (blocking strategy)
      const playerNeeds = neededCategories.filter(cat =>
        !gameState.playerTokens.includes(cat.name)
      );
      
      if (playerNeeds.length > 0 && Math.random() < 0.7) {
        return playerNeeds[Math.floor(Math.random() * playerNeeds.length)].name;
      }
      
      return neededCategories[Math.floor(Math.random() * neededCategories.length)].name;
    }
    
    // Already has all tokens (shouldn't happen)
    return CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)].name;
  }

  completeChallengeQuestion() {
    // AI answers challenge questions with same accuracy
    return this.shouldAnswerCorrectly();
  }
}