// testController.js - Automated testing controllers

import { gameState } from './globals.js';

export class TestController {
  constructor(type) {
    this.type = type;
    this.actionTimer = 0;
  }
  
  getAction(p) {
    this.actionTimer++;
    
    if (this.type === 'TEST_1') {
      return this.basicTest(p);
    } else if (this.type === 'TEST_2') {
      return this.winTest(p);
    }
    
    return { dx: 0, dy: 0, pressEnter: false, pressR: false };
  }
  
  basicTest(p) {
    const action = { dx: 0, dy: 0, pressEnter: false, pressR: false };
    
    if (gameState.gamePhase === 'START') {
      action.pressEnter = true;
    } else if (gameState.gamePhase === 'PLAYING') {
      // Move towards nearest consumable
      if (gameState.player && gameState.consumableObjects.length > 0) {
        let nearest = null;
        let nearestDist = Infinity;
        
        for (let obj of gameState.consumableObjects) {
          if (!obj.consumed && gameState.player.canSwallow(obj)) {
            const d = p.dist(gameState.player.x, gameState.player.y, obj.x, obj.y);
            if (d < nearestDist) {
              nearestDist = d;
              nearest = obj;
            }
          }
        }
        
        if (nearest) {
          const angle = p.atan2(nearest.y - gameState.player.y, nearest.x - gameState.player.x);
          action.dx = p.cos(angle);
          action.dy = p.sin(angle);
        }
      }
    } else if (gameState.gamePhase === 'GAME_OVER_LOSE' || gameState.gamePhase === 'GAME_OVER_WIN') {
      if (this.actionTimer > 180) {
        action.pressR = true;
      }
    }
    
    return action;
  }
  
  winTest(p) {
    const action = { dx: 0, dy: 0, pressEnter: false, pressR: false };
    
    if (gameState.gamePhase === 'START') {
      action.pressEnter = true;
    } else if (gameState.gamePhase === 'PLAYING') {
      // Aggressively consume everything
      if (gameState.player) {
        let bestTarget = null;
        let bestScore = -1;
        
        // Prioritize consumables
        for (let obj of gameState.consumableObjects) {
          if (!obj.consumed && gameState.player.canSwallow(obj)) {
            const d = p.dist(gameState.player.x, gameState.player.y, obj.x, obj.y);
            const score = obj.size / d;
            if (score > bestScore) {
              bestScore = score;
              bestTarget = obj;
            }
          }
        }
        
        // Then smaller black holes
        for (let bh of gameState.aiBlackHoles) {
          if (bh.alive && gameState.player.canSwallow(bh)) {
            const d = p.dist(gameState.player.x, gameState.player.y, bh.x, bh.y);
            const score = bh.radius * 10 / d;
            if (score > bestScore) {
              bestScore = score;
              bestTarget = bh;
            }
          }
        }
        
        if (bestTarget) {
          const angle = p.atan2(bestTarget.y - gameState.player.y, bestTarget.x - gameState.player.x);
          action.dx = p.cos(angle);
          action.dy = p.sin(angle);
        }
        
        // Evade larger black holes
        for (let bh of gameState.aiBlackHoles) {
          if (bh.alive && bh.radius > gameState.player.radius * 1.2) {
            const d = p.dist(gameState.player.x, gameState.player.y, bh.x, bh.y);
            if (d < 150) {
              const angle = p.atan2(gameState.player.y - bh.y, gameState.player.x - bh.x);
              action.dx = p.cos(angle);
              action.dy = p.sin(angle);
              break;
            }
          }
        }
      }
    } else if (gameState.gamePhase === 'GAME_OVER_WIN') {
      // Continue to next level or restart
      if (this.actionTimer > 120) {
        action.pressR = true;
      }
    } else if (gameState.gamePhase === 'GAME_OVER_LOSE') {
      if (this.actionTimer > 120) {
        action.pressR = true;
      }
    }
    
    return action;
  }
}