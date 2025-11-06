// automation.js - Automated testing behaviors

import { gameState, JELLY_HEIGHTS } from './globals.js';

export function updateAutomation(p) {
  if (gameState.controlMode === "HUMAN") return;
  
  if (gameState.controlMode === "TEST_1") {
    // Random height shifting
    if (p.frameCount >= gameState.nextAutomationAction) {
      const rand = p.random();
      if (rand < 0.33) {
        gameState.player.setHeight("TALL");
      } else if (rand < 0.66) {
        gameState.player.setHeight("MEDIUM");
      } else {
        gameState.player.setHeight("FLAT");
      }
      
      gameState.nextAutomationAction = p.frameCount + p.random(30, 90);
    }
  } else if (gameState.controlMode === "TEST_2") {
    // Intelligent obstacle avoidance
    if (gameState.obstacles.length > 0) {
      // Find closest upcoming obstacle
      let closestObstacle = null;
      let minDist = Infinity;
      
      for (let obs of gameState.obstacles) {
        if (obs.x > gameState.player.x) {
          const dist = obs.x - gameState.player.x;
          if (dist < minDist) {
            minDist = dist;
            closestObstacle = obs;
          }
        }
      }
      
      // Shift to correct height when approaching
      if (closestObstacle && minDist < 150) {
        if (closestObstacle.gapPosition === "TOP") {
          gameState.player.setHeight("TALL");
        } else if (closestObstacle.gapPosition === "MIDDLE") {
          gameState.player.setHeight("MEDIUM");
        } else {
          gameState.player.setHeight("FLAT");
        }
      } else {
        gameState.player.setHeight("MEDIUM");
      }
    }
  }
}