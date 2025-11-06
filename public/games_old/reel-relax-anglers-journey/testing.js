import { gameState, KEY_SPACE, KEY_ENTER, KEY_ARROW_UP, KEY_ARROW_DOWN, KEY_S, STATE_CASTING, STATE_WAITING_BITE, STATE_REELING, STATE_FISH_CAUGHT, STATE_LINE_SNAPPED, STATE_LOCATION_SELECT, STATE_LEVEL_COMPLETE, PHASE_PLAYING } from './globals.js';

export class TestController {
  constructor(gameLogic) {
    this.gameLogic = gameLogic;
    this.testState = {
      framesSinceLastAction: 0,
      currentAction: null
    };
  }
  
  getAction() {
    if (gameState.controlMode === "HUMAN") {
      return null;
    }
    
    this.testState.framesSinceLastAction++;
    
    if (gameState.controlMode === "TEST_1") {
      return this.getBasicTestAction();
    } else if (gameState.controlMode === "TEST_2") {
      return this.getWinTestAction();
    }
    
    return null;
  }
  
  getBasicTestAction() {
    // Basic test: Start game, select location, cast a few times
    if (gameState.gamePhase !== PHASE_PLAYING) {
      if (this.testState.framesSinceLastAction > 30) {
        this.testState.framesSinceLastAction = 0;
        return { keyPressed: KEY_ENTER };
      }
    } else if (gameState.internalState === STATE_LOCATION_SELECT) {
      if (this.testState.framesSinceLastAction > 60) {
        this.testState.framesSinceLastAction = 0;
        return { keyPressed: KEY_SPACE };
      }
    } else if (gameState.internalState === STATE_CASTING) {
      if (!gameState.castingCharging && this.testState.framesSinceLastAction > 10) {
        this.testState.framesSinceLastAction = 0;
        return { keyPressed: KEY_SPACE };
      } else if (gameState.castingCharging && gameState.castingPower > 70) {
        this.testState.framesSinceLastAction = 0;
        return { keyReleased: KEY_SPACE };
      }
    } else if (gameState.internalState === STATE_REELING) {
      if (gameState.tensionValue > 55) {
        return { keyPressed: KEY_SPACE };
      }
    } else if (gameState.internalState === STATE_FISH_CAUGHT || gameState.internalState === STATE_LINE_SNAPPED) {
      if (this.testState.framesSinceLastAction > 60) {
        this.testState.framesSinceLastAction = 0;
        return { keyPressed: KEY_SPACE };
      }
    }
    
    return null;
  }
  
  getWinTestAction() {
    // Win test: Play optimally to complete levels quickly
    if (gameState.gamePhase !== PHASE_PLAYING) {
      if (this.testState.framesSinceLastAction > 20) {
        this.testState.framesSinceLastAction = 0;
        return { keyPressed: KEY_ENTER };
      }
    } else if (gameState.internalState === STATE_LOCATION_SELECT) {
      // Select first unlocked location
      const targetIndex = gameState.unlockedLocations[gameState.unlockedLocations.length - 1] - 1;
      if (gameState.selectedMenuIndex < targetIndex && this.testState.framesSinceLastAction > 5) {
        this.testState.framesSinceLastAction = 0;
        return { keyPressed: KEY_ARROW_DOWN };
      } else if (gameState.selectedMenuIndex === targetIndex && this.testState.framesSinceLastAction > 10) {
        this.testState.framesSinceLastAction = 0;
        return { keyPressed: KEY_SPACE };
      }
    } else if (gameState.internalState === STATE_CASTING) {
      if (!gameState.castingCharging && this.testState.framesSinceLastAction > 5) {
        this.testState.framesSinceLastAction = 0;
        return { keyPressed: KEY_SPACE };
      } else if (gameState.castingCharging && gameState.castingPower > 95) {
        this.testState.framesSinceLastAction = 0;
        return { keyReleased: KEY_SPACE };
      }
    } else if (gameState.internalState === STATE_REELING) {
      // Optimal reeling: stay in green zone
      const sweetSpotSize = 0.2 + (gameState.equippedGear.reel?.sweetSpotBonus || 0) * 0.01;
      const sweetSpotStart = 0.4;
      const sweetSpotEnd = sweetSpotStart + sweetSpotSize;
      const targetTension = (sweetSpotStart + sweetSpotEnd) / 2 * 100;
      
      if (gameState.tensionValue > targetTension + 5) {
        return { keyPressed: KEY_SPACE };
      }
    } else if (gameState.internalState === STATE_FISH_CAUGHT || gameState.internalState === STATE_LINE_SNAPPED) {
      if (this.testState.framesSinceLastAction > 30) {
        this.testState.framesSinceLastAction = 0;
        return { keyPressed: KEY_SPACE };
      }
    } else if (gameState.internalState === STATE_LEVEL_COMPLETE) {
      if (this.testState.framesSinceLastAction > 60) {
        this.testState.framesSinceLastAction = 0;
        return { keyPressed: KEY_SPACE };
      }
    }
    
    return null;
  }
  
  executeAction(action) {
    if (!action) return;
    
    if (action.keyPressed) {
      this.gameLogic.handleKeyPressed(action.keyPressed);
    }
    if (action.keyReleased) {
      this.gameLogic.handleKeyReleased(action.keyReleased);
    }
  }
}