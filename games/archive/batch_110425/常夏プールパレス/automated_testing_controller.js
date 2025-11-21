// automated_testing_controller.js - Automated testing

import { gameState, FACILITY_TYPES } from './globals.js';

function getTestWinAction(gameState) {
  // Strategy: Build optimal resort layout to reach 1000 SNS buzz
  const { cursorX, cursorY, money, facilities, snsBuzz, time } = gameState;
  
  // Phase 1: Initial setup (0-500 frames)
  if (time < 500) {
    // Build pools and restaurants in a pattern
    const buildPlan = [
      { x: 1, y: 1, type: "POOL" },
      { x: 3, y: 1, type: "POOL" },
      { x: 5, y: 1, type: "RESTAURANT" },
      { x: 1, y: 3, type: "RESTAURANT" },
      { x: 3, y: 3, type: "POOL" },
      { x: 5, y: 3, type: "DECORATION" },
      { x: 7, y: 1, type: "DECORATION" },
      { x: 7, y: 3, type: "POOL" },
    ];
    
    const nextBuild = buildPlan.find(plan => {
      const exists = facilities.some(f => f.gridX === plan.x && f.gridY === plan.y);
      return !exists && money >= FACILITY_TYPES[plan.type].cost;
    });
    
    if (nextBuild) {
      if (cursorX !== nextBuild.x || cursorY !== nextBuild.y) {
        return { type: "MOVE", x: nextBuild.x, y: nextBuild.y };
      }
      return { type: "PLACE", facilityType: nextBuild.type };
    }
  }
  
  // Phase 2: Add waterslides when unlocked
  if (snsBuzz >= 100 && snsBuzz < 300) {
    const waterslidePositions = [
      { x: 1, y: 5, type: "WATERSLIDE" },
      { x: 4, y: 5, type: "WATERSLIDE" },
    ];
    
    const nextSlide = waterslidePositions.find(plan => {
      const exists = facilities.some(f => f.gridX === plan.x && f.gridY === plan.y);
      return !exists && money >= FACILITY_TYPES[plan.type].cost;
    });
    
    if (nextSlide) {
      if (cursorX !== nextSlide.x || cursorY !== nextSlide.y) {
        return { type: "MOVE", x: nextSlide.x, y: nextSlide.y };
      }
      return { type: "PLACE", facilityType: nextSlide.type };
    }
  }
  
  // Phase 3: Add cabanas and upgrade
  if (snsBuzz >= 300) {
    const cabanaPositions = [
      { x: 7, y: 5, type: "CABANA" },
      { x: 2, y: 6, type: "CABANA" },
    ];
    
    const nextCabana = cabanaPositions.find(plan => {
      const exists = facilities.some(f => f.gridX === plan.x && f.gridY === plan.y);
      return !exists && money >= FACILITY_TYPES[plan.type].cost;
    });
    
    if (nextCabana) {
      if (cursorX !== nextCabana.x || cursorY !== nextCabana.y) {
        return { type: "MOVE", x: nextCabana.x, y: nextCabana.y };
      }
      return { type: "PLACE", facilityType: nextCabana.type };
    }
    
    // Upgrade high-appeal facilities
    const upgradeTargets = facilities.filter(f => 
      f.level < 3 && 
      (f.type === "WATERSLIDE" || f.type === "CABANA") &&
      money >= f.getUpgradeCost()
    );
    
    if (upgradeTargets.length > 0) {
      const target = upgradeTargets[0];
      if (cursorX !== target.gridX || cursorY !== target.gridY) {
        return { type: "MOVE", x: target.gridX, y: target.gridY };
      }
      return { type: "UPGRADE" };
    }
  }
  
  // Fill empty spaces with decorations
  if (money >= 30) {
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 9; x++) {
        const exists = facilities.some(f => f.gridX === x && f.gridY === y);
        if (!exists) {
          if (cursorX !== x || cursorY !== y) {
            return { type: "MOVE", x, y };
          }
          return { type: "PLACE", facilityType: "DECORATION" };
        }
      }
    }
  }
  
  return { type: "WAIT" };
}

function getBasicTestAction(gameState) {
  // Basic test: Place a few facilities and let the game run
  const { cursorX, cursorY, money, facilities, time } = gameState;
  
  if (facilities.length < 3 && money >= 50) {
    const positions = [
      { x: 2, y: 2, type: "POOL" },
      { x: 5, y: 2, type: "RESTAURANT" },
      { x: 2, y: 5, type: "POOL" },
    ];
    
    const nextPos = positions.find(pos => {
      return !facilities.some(f => f.gridX === pos.x && f.gridY === pos.y);
    });
    
    if (nextPos) {
      if (cursorX !== nextPos.x || cursorY !== nextPos.y) {
        return { type: "MOVE", x: nextPos.x, y: nextPos.y };
      }
      return { type: "PLACE", facilityType: nextPos.type };
    }
  }
  
  return { type: "WAIT" };
}

export function get_automated_testing_action(gameState) {
  if (gameState.gamePhase !== "PLAYING" || gameState.paused) {
    return null;
  }
  
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return null;
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;