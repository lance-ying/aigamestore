// testing.js - Automated testing controller

import { gameState, CATEGORIES } from './globals.js';

export class TestingController {
  constructor() {
    this.actionQueue = [];
    this.currentTest = null;
  }

  setTestMode(mode) {
    this.currentTest = mode;
    this.actionQueue = [];
    
    if (mode === 'TEST_1') {
      this.setupBasicTest();
    } else if (mode === 'TEST_2') {
      this.setupWinTest();
    }
  }

  setupBasicTest() {
    // Basic test: Start game, spin wheel, answer some questions
    this.actionQueue = [
      { delay: 60, action: 'START' },
      { delay: 120, action: 'SPIN' },
      { delay: 180, action: 'ANSWER', answer: 0 },
      { delay: 240, action: 'SPIN' },
      { delay: 180, action: 'ANSWER', answer: 0 },
    ];
  }

  setupWinTest() {
    // Win test: Automatically answer correctly to win quickly
    this.actionQueue = [
      { delay: 60, action: 'START' }
    ];
  }

  update(p) {
    if (!this.currentTest || this.currentTest === 'HUMAN') return null;
    
    // Process action queue
    if (this.actionQueue.length > 0) {
      const nextAction = this.actionQueue[0];
      nextAction.delay--;
      
      if (nextAction.delay <= 0) {
        this.actionQueue.shift();
        return this.executeAction(nextAction, p);
      }
    } else {
      // Generate dynamic actions based on game state
      return this.generateDynamicAction(p);
    }
    
    return null;
  }

  executeAction(action, p) {
    switch (action.action) {
      case 'START':
        return { type: 'keyPressed', key: 'Enter', keyCode: 13 };
      case 'SPIN':
        return { type: 'keyPressed', key: ' ', keyCode: 32 };
      case 'ANSWER':
        if (action.answer !== undefined) {
          gameState.highlightedAnswer = action.answer;
        }
        return { type: 'keyPressed', key: ' ', keyCode: 32 };
      default:
        return null;
    }
  }

  generateDynamicAction(p) {
    if (gameState.gamePhase === 'START') {
      return { type: 'keyPressed', key: 'Enter', keyCode: 13 };
    }
    
    if (gameState.gamePhase === 'PLAYING') {
      if (gameState.subPhase === 'SPIN_WHEEL' && !gameState.wheelSpinning) {
        return { type: 'keyPressed', key: ' ', keyCode: 32 };
      }
      
      if (gameState.subPhase === 'ANSWER_QUESTION' && !gameState.showingFeedback) {
        if (gameState.currentQuestion) {
          // For TEST_2, always answer correctly
          if (this.currentTest === 'TEST_2') {
            gameState.highlightedAnswer = gameState.currentQuestion.c;
          }
          return { type: 'keyPressed', key: ' ', keyCode: 32 };
        }
      }
      
      if (gameState.subPhase === 'CHALLENGE' && !gameState.showingFeedback) {
        const q = gameState.challengeQuestions[gameState.challengeCurrentIndex];
        if (q) {
          if (this.currentTest === 'TEST_2') {
            gameState.highlightedAnswer = q.c;
          }
          return { type: 'keyPressed', key: ' ', keyCode: 32 };
        }
      }
      
      if (gameState.showingFeedback && gameState.feedbackTimer > 60) {
        return { type: 'keyPressed', key: ' ', keyCode: 32 };
      }
    }
    
    return null;
  }
}