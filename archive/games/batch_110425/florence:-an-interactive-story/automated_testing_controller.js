// automated_testing_controller.js - Automated testing AI
import { gameState, VIGNETTE_TYPES } from './globals.js';

class TestingController {
  constructor() {
    this.actionQueue = [];
    this.lastActionFrame = 0;
    this.actionCooldown = 10;
    this.stateHistory = [];
  }
  
  getAction(gameState, mode) {
    const currentFrame = gameState.currentVignette ? 
      gameState.currentVignette.progress : 0;
    
    // Cooldown between actions
    if (currentFrame - this.lastActionFrame < this.actionCooldown) {
      return null;
    }
    
    let action = null;
    
    switch (mode) {
      case "TEST_1":
        action = this.getBasicTestAction(gameState);
        break;
      case "TEST_2":
        action = this.getWinAction(gameState);
        break;
      case "TEST_3":
        action = this.getStressTestAction(gameState);
        break;
      default:
        action = this.getRandomAction(gameState);
    }
    
    if (action) {
      this.lastActionFrame = currentFrame;
    }
    
    return action;
  }
  
  getBasicTestAction(gameState) {
    if (!gameState.currentVignette) return null;
    
    const vignette = gameState.currentVignette;
    const type = vignette.type;
    
    // Random but valid actions for each type
    const actions = [37, 39, 32]; // Left, Right, Space
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    
    return { keyCode: randomAction };
  }
  
  getWinAction(gameState) {
    if (!gameState.currentVignette) return null;
    
    const vignette = gameState.currentVignette;
    const type = vignette.type;
    const data = vignette.data;
    
    switch (type) {
      case VIGNETTE_TYPES.CONVERSATION:
        return this.solveConversation(data);
        
      case VIGNETTE_TYPES.PUZZLE:
        return this.solvePuzzle(data);
        
      case VIGNETTE_TYPES.CLEANING:
        return this.solveCleaning(data);
        
      case VIGNETTE_TYPES.DATING:
        return this.solveDating(data);
        
      case VIGNETTE_TYPES.REFLECTION:
        return this.solveReflection(data);
        
      default:
        return { keyCode: 32 };
    }
  }
  
  solveConversation(data) {
    // Find first unplaced bubble and place it
    for (let i = 0; i < data.bubbles.length; i++) {
      if (!data.bubbles[i].placed) {
        if (i !== data.selectedIndex) {
          // Navigate to it
          return { keyCode: i > data.selectedIndex ? 39 : 37 };
        } else {
          // Place it
          return { keyCode: 32 };
        }
      }
    }
    return null;
  }
  
  solvePuzzle(data) {
    // Find first unplaced piece
    for (let i = 0; i < data.pieces.length; i++) {
      const piece = data.pieces[i];
      if (!piece.placed) {
        if (i !== data.selectedPiece) {
          // Navigate to it
          return { keyCode: i > data.selectedPiece ? 39 : 37 };
        } else {
          // Check rotation
          const rotDiff = Math.abs(piece.rotation - piece.targetRotation);
          if (rotDiff > 30 && rotDiff < 330) {
            return { keyCode: 90 }; // Rotate
          } else {
            return { keyCode: 32 }; // Place
          }
        }
      }
    }
    return null;
  }
  
  solveCleaning(data) {
    // Find nearest uncleaned spot
    let nearestSpot = null;
    let minDist = Infinity;
    
    for (let spot of data.dirtSpots) {
      if (!spot.cleaned) {
        const dx = spot.x - data.brushX;
        const dy = spot.y - data.brushY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < minDist) {
          minDist = dist;
          nearestSpot = spot;
        }
      }
    }
    
    if (nearestSpot) {
      const dx = nearestSpot.x - data.brushX;
      const dy = nearestSpot.y - data.brushY;
      
      // Move towards nearest spot
      if (Math.abs(dx) > Math.abs(dy)) {
        return { keyCode: dx > 0 ? 39 : 37 }; // Right or Left
      } else {
        return { keyCode: dy > 0 ? 40 : 38 }; // Down or Up
      }
    }
    
    return null;
  }
  
  solveDating(data) {
    // Find nearest uncollected heart
    let nearestHeart = null;
    let minDist = Infinity;
    
    for (let heart of data.hearts) {
      if (!heart.collected) {
        const dx = heart.x - data.playerX;
        const dy = heart.y - data.playerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < minDist) {
          minDist = dist;
          nearestHeart = heart;
        }
      }
    }
    
    if (nearestHeart) {
      const dx = nearestHeart.x - data.playerX;
      const dy = nearestHeart.y - data.playerY;
      
      // Move towards nearest heart
      if (Math.abs(dx) > Math.abs(dy)) {
        return { keyCode: dx > 0 ? 39 : 37 };
      } else {
        return { keyCode: dy > 0 ? 40 : 38 };
      }
    }
    
    return null;
  }
  
  solveReflection(data) {
    // No input needed, just wait
    return null;
  }
  
  getStressTestAction(gameState) {
    // Rapid random inputs for stress testing
    const allKeys = [37, 38, 39, 40, 32, 90, 16];
    return { keyCode: allKeys[Math.floor(Math.random() * allKeys.length)] };
  }
  
  getRandomAction(gameState) {
    const actions = [37, 38, 39, 40, 32];
    return { keyCode: actions[Math.floor(Math.random() * actions.length)] };
  }
}

const controller = new TestingController();

export function get_automated_testing_action(gameState) {
  return controller.getAction(gameState, gameState.controlMode);
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;