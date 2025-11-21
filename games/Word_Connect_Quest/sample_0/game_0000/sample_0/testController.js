// testController.js - Automated testing controller

import { gameState, GAME_PHASES, levelData } from './globals.js';
import { getCurrentLevel } from './levelManager.js';

export class TestController {
  constructor() {
    this.testSequence = [];
    this.currentStep = 0;
    this.frameDelay = 0;
  }
  
  setupTest(mode) {
    this.testSequence = [];
    this.currentStep = 0;
    this.frameDelay = 0;
    
    if (mode === "TEST_1") {
      // Basic testing - start game, try a few words
      this.testSequence = [
        { delay: 30, action: "pressEnter" },
        { delay: 60, action: "tryWord", word: "RAT" },
        { delay: 60, action: "tryWord", word: "ART" },
        { delay: 60, action: "tryInvalidWord", word: "XYZ" },
        { delay: 60, action: "pause" },
        { delay: 60, action: "unpause" }
      ];
    } else if (mode === "TEST_2") {
      // Win test - complete all levels
      this.testSequence = [
        { delay: 30, action: "pressEnter" }
      ];
      
      // Add all words from all levels
      for (let levelIdx = 0; levelIdx < levelData.length; levelIdx++) {
        const level = levelData[levelIdx];
        for (let wordObj of level.words) {
          this.testSequence.push({
            delay: 45,
            action: "tryWord",
            word: wordObj.word
          });
        }
      }
    }
  }
  
  update(p, letterWheel) {
    if (gameState.controlMode === "HUMAN") return;
    
    if (this.frameDelay > 0) {
      this.frameDelay--;
      return;
    }
    
    if (this.currentStep >= this.testSequence.length) return;
    
    const step = this.testSequence[this.currentStep];
    this.frameDelay = step.delay;
    
    switch (step.action) {
      case "pressEnter":
        this.simulateKey(p, 13);
        break;
      case "tryWord":
        this.simulateWordInput(step.word, letterWheel);
        break;
      case "tryInvalidWord":
        this.simulateWordInput(step.word, letterWheel);
        break;
      case "pause":
        this.simulateKey(p, 27);
        break;
      case "unpause":
        this.simulateKey(p, 27);
        break;
    }
    
    this.currentStep++;
  }
  
  simulateKey(p, keyCode) {
    const mockEvent = { keyCode };
    p._onkeydown(mockEvent);
  }
  
  simulateWordInput(word, letterWheel) {
    if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
    
    const level = getCurrentLevel();
    gameState.currentWord = word.split("");
    gameState.selectedLetters = [];
    
    // Find letter indices
    for (let char of word) {
      const idx = level.letters.indexOf(char);
      if (idx !== -1) {
        gameState.selectedLetters.push(idx);
      }
    }
    
    // Submit
    letterWheel.handleMouseReleased();
  }
}