// ai.js - AI controller for automated testing

import { gameState, PHASE_PLAYING } from './globals.js';

export class AIController {
  constructor() {
    this.mode = 'IDLE';
    this.actionTimer = 0;
    this.strategy = null;
  }

  setStrategy(mode) {
    this.mode = mode;
    this.actionTimer = 0;
    
    switch(mode) {
      case 'TEST_1':
        this.strategy = this.basicTestStrategy.bind(this);
        break;
      case 'TEST_2':
        this.strategy = this.winTestStrategy.bind(this);
        break;
      default:
        this.strategy = null;
    }
  }

  update(p) {
    if (this.strategy && gameState.gamePhase === PHASE_PLAYING) {
      this.strategy(p);
    }
  }

  basicTestStrategy(p) {
    this.actionTimer++;
    
    // Wait at intersection for 2 seconds (120 frames)
    if (this.actionTimer === 120 && gameState.player && gameState.player.atIntersection) {
      // Find a gap in traffic
      const hasGap = this.checkForGap();
      
      if (hasGap || this.actionTimer > 180) {
        // Press space to accelerate
        p.keyCode = 32;
        gameState.player.accelerate();
      }
    }
    
    // Release after 60 frames
    if (this.actionTimer > 180) {
      if (gameState.player) {
        gameState.player.stopAccelerating();
      }
      this.actionTimer = 0;
    }
  }

  winTestStrategy(p) {
    this.actionTimer++;
    
    // More sophisticated strategy - wait for safe gaps
    if (gameState.player && gameState.player.atIntersection) {
      const safeGap = this.checkForSafeGap();
      
      if (safeGap) {
        gameState.player.accelerate();
        this.actionTimer = 0;
      } else if (this.actionTimer > 300) {
        // Force crossing if waiting too long
        gameState.player.accelerate();
        this.actionTimer = 0;
      }
    } else {
      // Stop accelerating once moving
      if (gameState.player && !gameState.player.atIntersection) {
        gameState.player.stopAccelerating();
      }
    }
  }

  checkForGap() {
    // Simple gap detection - check if any traffic is near center
    const nearbyTraffic = gameState.trafficCars.filter(car => {
      const distance = Math.abs(car.body.position.x - 300);
      return distance < 150;
    });
    
    return nearbyTraffic.length === 0;
  }

  checkForSafeGap() {
    // More sophisticated gap detection
    if (!gameState.player) return false;
    
    const playerX = 300;
    const intersectionCenter = gameState.intersectionY + 75;
    
    // Check each lane for incoming traffic
    let allLanesSafe = true;
    
    for (let lane = 0; lane < 3; lane++) {
      const laneY = gameState.intersectionY + (lane * 50) + 25;
      const laneCars = gameState.trafficCars.filter(car => {
        return Math.abs(car.body.position.y - laneY) < 30;
      });
      
      for (let car of laneCars) {
        const dx = car.body.position.x - playerX;
        const timeToReach = Math.abs(dx / car.speed);
        
        // If car will reach intersection in next 2 seconds, not safe
        if (timeToReach < 120) {
          allLanesSafe = false;
          break;
        }
      }
    }
    
    return allLanesSafe;
  }
}