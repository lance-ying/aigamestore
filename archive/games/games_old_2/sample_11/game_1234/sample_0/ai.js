// ai.js - AI controller for automated testing
import { gameState, STYLES } from './globals.js';

export class AIController {
  constructor() {
    this.actionQueue = [];
    this.frameCounter = 0;
    this.currentTest = null;
  }

  setTestMode(mode) {
    this.currentTest = mode;
    this.actionQueue = [];
    this.frameCounter = 0;
  }

  getAction(p) {
    this.frameCounter++;
    
    if (this.currentTest === "TEST_1") {
      return this.runBasicTest(p);
    } else if (this.currentTest === "TEST_2") {
      return this.runWinTest(p);
    }
    
    return null;
  }

  runBasicTest(p) {
    const state = gameState.gamePhase;
    
    if (state === "START" && this.frameCounter > 60) {
      return { keyCode: 13 }; // ENTER
    }
    
    if (state === "PLAYING" && !gameState.showLevelComplete) {
      // Navigate and assign icons
      if (this.frameCounter % 120 === 30) {
        return { keyCode: 39 }; // Arrow Right
      }
      if (this.frameCounter % 120 === 60) {
        return { keyCode: 40 }; // Arrow Down
      }
      if (this.frameCounter % 120 === 90) {
        return { keyCode: 32 }; // Space - pick up
      }
      if (this.frameCounter % 120 === 110) {
        return { keyCode: 32 }; // Space - drop
      }
    }
    
    if (gameState.showLevelComplete && this.frameCounter % 60 === 0) {
      return { keyCode: 13 }; // ENTER to continue
    }
    
    return null;
  }

  runWinTest(p) {
    const state = gameState.gamePhase;
    
    if (state === "START" && this.frameCounter > 60) {
      return { keyCode: 13 }; // ENTER
    }
    
    if (state === "PLAYING" && !gameState.showLevelComplete) {
      const style = STYLES[gameState.currentStyleId];
      
      // Quickly assign icons to create combos
      if (gameState.discoveredCombos.size < style.requiredCombos) {
        const combo = style.combos[gameState.discoveredCombos.size];
        const iconIndex = this.frameCounter % combo.icons.length;
        const beatboxerIndex = this.frameCounter % style.beatboxerCount;
        
        if (this.frameCounter % 30 === 0) {
          // Navigate to icon
          for (let i = 0; i < combo.icons[iconIndex]; i++) {
            if (gameState.focusedIconIndex < combo.icons[iconIndex]) {
              return { keyCode: 39 }; // Arrow Right
            }
          }
        }
        
        if (this.frameCounter % 30 === 10) {
          return { keyCode: 32 }; // Pick up icon
        }
        
        if (this.frameCounter % 30 === 15) {
          // Navigate to beatboxer
          for (let i = 0; i < beatboxerIndex; i++) {
            if (gameState.focusedBeatboxerIndex < beatboxerIndex) {
              return { keyCode: 40 }; // Arrow Down
            }
          }
        }
        
        if (this.frameCounter % 30 === 20) {
          return { keyCode: 32 }; // Drop icon
        }
      }
    }
    
    if (gameState.showLevelComplete && this.frameCounter % 60 === 0) {
      return { keyCode: 13 }; // ENTER to continue
    }
    
    return null;
  }
}