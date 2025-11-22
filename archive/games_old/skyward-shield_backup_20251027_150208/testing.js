import { gameState, GAME_PHASES, KEYS } from './globals.js';

export class TestingController {
  constructor() {
    this.actions = [];
    this.currentAction = 0;
  }

  getAction(testMode) {
    if (testMode === 'TEST_1') {
      return this.getBasicTestAction();
    } else if (testMode === 'TEST_2') {
      return this.getWinTestAction();
    }
    return {};
  }

  getBasicTestAction() {
    const keys = {};
    const frame = gameState.player ? Math.floor(Date.now() / 100) : 0;
    
    if (gameState.gamePhase === GAME_PHASES.START) {
      keys[KEYS.ENTER] = true;
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      // Move shield in a pattern
      const pattern = frame % 40;
      if (pattern < 10) {
        keys[KEYS.LEFT] = true;
      } else if (pattern < 20) {
        keys[KEYS.RIGHT] = true;
      } else if (pattern < 30) {
        keys[KEYS.UP] = true;
      } else {
        keys[KEYS.DOWN] = true;
      }
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE || 
               gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
      keys[KEYS.R] = true;
    }
    
    return keys;
  }

  getWinTestAction() {
    const keys = {};
    
    if (gameState.gamePhase === GAME_PHASES.START) {
      keys[KEYS.ENTER] = true;
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      // Aggressive shield movement to clear obstacles
      if (gameState.obstacles && gameState.obstacles.length > 0) {
        const nearestObstacle = this.findNearestObstacle();
        if (nearestObstacle) {
          if (nearestObstacle.x < gameState.shieldX - 10) {
            keys[KEYS.LEFT] = true;
            keys[KEYS.SHIFT] = true;
          } else if (nearestObstacle.x > gameState.shieldX + 10) {
            keys[KEYS.RIGHT] = true;
            keys[KEYS.SHIFT] = true;
          }
          
          if (nearestObstacle.y < gameState.shieldY - 10) {
            keys[KEYS.UP] = true;
            keys[KEYS.SHIFT] = true;
          }
        }
      }
    } else if (gameState.gamePhase === GAME_PHASES.LEVEL_TRANSITION) {
      // Wait for transition
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE || 
               gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
      keys[KEYS.R] = true;
    }
    
    return keys;
  }

  findNearestObstacle() {
    if (!gameState.obstacles || gameState.obstacles.length === 0) return null;
    
    let nearest = null;
    let minDist = Infinity;
    
    for (const obstacle of gameState.obstacles) {
      const dx = obstacle.x - gameState.balloonX;
      const dy = obstacle.y - gameState.balloonY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < minDist && obstacle.y > gameState.balloonY - 200) {
        minDist = dist;
        nearest = obstacle;
      }
    }
    
    return nearest;
  }
}