// automated_testing_controller.js - Automated testing functions

import { PHASE_PLAYING, TOTAL_EVIDENCE } from './globals.js';

class TestingController {
  constructor() {
    this.targetIndex = 0;
    this.positionHistory = [];
    this.stuckCounter = 0;
    this.avoidanceMode = false;
    this.avoidanceTimer = 0;
  }

  getTestWinAction(gameState) {
    if (gameState.gamePhase !== PHASE_PLAYING || !gameState.player) {
      return this.getIdleAction();
    }

    const player = gameState.player;
    const action = {
      up: false,
      down: false,
      left: false,
      right: false,
      sprint: false,
      flashlight: false,
      space: false
    };

    // Check for nearby spirits and avoid them
    let closestSpirit = null;
    let closestSpiritDist = Infinity;
    
    for (const spirit of gameState.spirits) {
      if (spirit.state === "STUNNED") continue;
      
      const dx = spirit.x - player.x;
      const dy = spirit.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < closestSpiritDist) {
        closestSpiritDist = dist;
        closestSpirit = spirit;
      }
    }

    // If spirit is too close, enter avoidance mode
    if (closestSpiritDist < 150) {
      this.avoidanceMode = true;
      this.avoidanceTimer = 60;
    }

    if (this.avoidanceTimer > 0) {
      this.avoidanceTimer--;
      if (this.avoidanceTimer === 0) {
        this.avoidanceMode = false;
      }
    }

    // Use flashlight if spirit is in front and battery available
    if (closestSpirit && closestSpiritDist < 120 && player.battery > 20) {
      action.flashlight = true;
      
      const dx = closestSpirit.x - player.x;
      const dy = closestSpirit.y - player.y;
      const angleToSpirit = Math.atan2(dy, dx);
      
      // Face the spirit
      if (Math.abs(Math.cos(angleToSpirit)) > Math.abs(Math.sin(angleToSpirit))) {
        action.right = Math.cos(angleToSpirit) > 0;
        action.left = Math.cos(angleToSpirit) < 0;
      } else {
        action.down = Math.sin(angleToSpirit) > 0;
        action.up = Math.sin(angleToSpirit) < 0;
      }
    } else if (this.avoidanceMode && closestSpirit) {
      // Run away from spirit
      const dx = player.x - closestSpirit.x;
      const dy = player.y - closestSpirit.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 0) {
        action.right = dx > 0;
        action.left = dx < 0;
        action.down = dy > 0;
        action.up = dy < 0;
        action.sprint = player.stamina > 20;
      }
    } else {
      // Find nearest uncollected evidence
      let targetEvidence = null;
      let minDist = Infinity;
      
      for (const evidence of gameState.evidence) {
        if (evidence.collected) continue;
        
        const dx = evidence.x - player.x;
        const dy = evidence.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < minDist) {
          minDist = dist;
          targetEvidence = evidence;
        }
      }

      if (targetEvidence) {
        // Check if we can collect
        if (minDist < 30) {
          action.space = true;
        } else {
          // Move towards evidence
          const dx = targetEvidence.x - player.x;
          const dy = targetEvidence.y - player.y;
          
          if (Math.abs(dx) > Math.abs(dy)) {
            action.right = dx > 0;
            action.left = dx < 0;
          } else {
            action.down = dy > 0;
            action.up = dy < 0;
          }
          
          // Sprint if safe and stamina available
          action.sprint = player.stamina > 30 && closestSpiritDist > 200;
        }
      }
    }

    // Track position to detect stuck state
    this.positionHistory.push({ x: player.x, y: player.y });
    if (this.positionHistory.length > 30) {
      this.positionHistory.shift();
      
      // Check if stuck
      const recent = this.positionHistory.slice(-10);
      const avgX = recent.reduce((sum, p) => sum + p.x, 0) / recent.length;
      const avgY = recent.reduce((sum, p) => sum + p.y, 0) / recent.length;
      const variance = recent.reduce((sum, p) => {
        return sum + Math.pow(p.x - avgX, 2) + Math.pow(p.y - avgY, 2);
      }, 0) / recent.length;
      
      if (variance < 5) {
        this.stuckCounter++;
        if (this.stuckCounter > 20) {
          // Try random direction to get unstuck
          const rand = Math.random();
          if (rand < 0.25) action.up = true;
          else if (rand < 0.5) action.down = true;
          else if (rand < 0.75) action.left = true;
          else action.right = true;
        }
      } else {
        this.stuckCounter = 0;
      }
    }

    return action;
  }

  getTestMovementAction(gameState) {
    if (gameState.gamePhase !== PHASE_PLAYING || !gameState.player) {
      return this.getIdleAction();
    }

    const action = {
      up: false,
      down: false,
      left: false,
      right: false,
      sprint: false,
      flashlight: false,
      space: false
    };

    // Simple patrol pattern
    const time = Math.floor(gameState.frameCount / 60);
    const pattern = time % 4;
    
    switch (pattern) {
      case 0: action.right = true; break;
      case 1: action.down = true; break;
      case 2: action.left = true; break;
      case 3: action.up = true; break;
    }

    return action;
  }

  getTestResourcesAction(gameState) {
    if (gameState.gamePhase !== PHASE_PLAYING || !gameState.player) {
      return this.getIdleAction();
    }

    const player = gameState.player;
    const action = {
      up: false,
      down: false,
      left: false,
      right: false,
      sprint: false,
      flashlight: false,
      space: false
    };

    // Test sprinting
    const time = Math.floor(gameState.frameCount / 60);
    if (time % 4 < 2) {
      action.right = true;
      action.sprint = true;
    } else {
      action.left = true;
    }

    // Toggle flashlight periodically
    if (time % 3 === 0 && player.battery > 30) {
      action.flashlight = true;
    }

    return action;
  }

  getTestSpiritAction(gameState) {
    if (gameState.gamePhase !== PHASE_PLAYING || !gameState.player) {
      return this.getIdleAction();
    }

    const player = gameState.player;
    const action = {
      up: false,
      down: false,
      left: false,
      right: false,
      sprint: false,
      flashlight: false,
      space: false
    };

    // Find nearest spirit
    let closestSpirit = null;
    let minDist = Infinity;
    
    for (const spirit of gameState.spirits) {
      const dx = spirit.x - player.x;
      const dy = spirit.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < minDist) {
        minDist = dist;
        closestSpirit = spirit;
      }
    }

    if (closestSpirit) {
      // Move towards spirit to trigger detection
      const dx = closestSpirit.x - player.x;
      const dy = closestSpirit.y - player.y;
      
      if (minDist > 50) {
        action.right = dx > 0;
        action.left = dx < 0;
        action.down = dy > 0;
        action.up = dy < 0;
      }
      
      // Use flashlight when close
      if (minDist < 100 && player.battery > 20) {
        action.flashlight = true;
      }
    }

    return action;
  }

  getTestCollectionAction(gameState) {
    if (gameState.gamePhase !== PHASE_PLAYING || !gameState.player) {
      return this.getIdleAction();
    }

    const player = gameState.player;
    const action = {
      up: false,
      down: false,
      left: false,
      right: false,
      sprint: false,
      flashlight: false,
      space: false
    };

    // Find nearest uncollected evidence
    let targetEvidence = null;
    let minDist = Infinity;
    
    for (const evidence of gameState.evidence) {
      if (evidence.collected) continue;
      
      const dx = evidence.x - player.x;
      const dy = evidence.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < minDist) {
        minDist = dist;
        targetEvidence = evidence;
      }
    }

    if (targetEvidence) {
      if (minDist < 30) {
        action.space = true;
      } else {
        const dx = targetEvidence.x - player.x;
        const dy = targetEvidence.y - player.y;
        
        action.right = dx > 0;
        action.left = dx < 0;
        action.down = dy > 0;
        action.up = dy < 0;
      }
    }

    return action;
  }

  getRandomAction(gameState) {
    if (gameState.gamePhase !== PHASE_PLAYING) {
      return this.getIdleAction();
    }

    const action = {
      up: Math.random() < 0.25,
      down: Math.random() < 0.25,
      left: Math.random() < 0.25,
      right: Math.random() < 0.25,
      sprint: Math.random() < 0.3,
      flashlight: Math.random() < 0.2,
      space: Math.random() < 0.1
    };

    return action;
  }

  getIdleAction() {
    return {
      up: false,
      down: false,
      left: false,
      right: false,
      sprint: false,
      flashlight: false,
      space: false
    };
  }
}

const controller = new TestingController();

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return controller.getTestMovementAction(gameState);
    case "TEST_2":
      return controller.getTestWinAction(gameState);
    case "TEST_3":
      return controller.getTestResourcesAction(gameState);
    case "TEST_4":
      return controller.getTestSpiritAction(gameState);
    case "TEST_5":
      return controller.getTestCollectionAction(gameState);
    default:
      return controller.getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;