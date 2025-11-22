// testing.js - Automated testing modes

import { gameState } from './globals.js';
import { executeTestAction } from './input.js';

export function updateTestMode(p) {
  if (gameState.controlMode === 'HUMAN') return;
  
  // Execute test actions based on mode
  if (gameState.controlMode === 'TEST_1') {
    runBasicTest(p);
  } else if (gameState.controlMode === 'TEST_2') {
    runWinTest(p);
  }
}

function runBasicTest(p) {
  const frame = p.frameCount;
  
  // Basic testing: Start game and play through first level
  if (frame === 60) {
    executeTestAction({ type: 'startGame' });
  } else if (frame === 180 && gameState.gameSubState === 'BASE_BUILDING') {
    executeTestAction({ type: 'collectResources' });
  } else if (frame === 240 && gameState.gameSubState === 'BASE_BUILDING') {
    executeTestAction({ type: 'startCombat' });
  } else if (gameState.gameSubState === 'COMBAT') {
    // Deploy heroes periodically
    if (frame % 180 === 0) {
      const heroTypes = gameState.unlockedHeroes;
      const randomHero = heroTypes[Math.floor(Math.random() * heroTypes.length)];
      const randomLane = Math.floor(Math.random() * 3);
      
      executeTestAction({ type: 'selectHero', heroType: randomHero });
      executeTestAction({ type: 'selectLane', lane: randomLane });
      executeTestAction({ type: 'deployHero' });
    }
  }
}

function runWinTest(p) {
  const frame = p.frameCount;
  
  // Win test: Boost resources and try to complete all levels
  if (frame === 60) {
    executeTestAction({ type: 'startGame' });
    // Boost resources for testing
    gameState.gold = 5000;
    gameState.supplies = 2000;
  } else if (frame === 120 && gameState.gameSubState === 'BASE_BUILDING') {
    // Upgrade all structures
    executeTestAction({ type: 'upgradeStructure', structure: 'resourceGenerator' });
    executeTestAction({ type: 'upgradeStructure', structure: 'trainingFacility' });
    executeTestAction({ type: 'upgradeStructure', structure: 'commandCenter' });
  } else if (frame === 180 && gameState.gameSubState === 'BASE_BUILDING') {
    executeTestAction({ type: 'startCombat' });
  } else if (gameState.gameSubState === 'COMBAT') {
    // Aggressively deploy heroes
    if (frame % 90 === 0) {
      const heroTypes = gameState.unlockedHeroes;
      for (let i = 0; i < 3; i++) {
        const randomHero = heroTypes[Math.floor(Math.random() * heroTypes.length)];
        executeTestAction({ type: 'selectHero', heroType: randomHero });
        executeTestAction({ type: 'selectLane', lane: i });
        executeTestAction({ type: 'deployHero' });
      }
    }
  } else if (gameState.gameSubState === 'BASE_BUILDING' && frame % 60 === 0) {
    // Quickly proceed to next level
    executeTestAction({ type: 'collectResources' });
    if (frame % 120 === 0) {
      executeTestAction({ type: 'startCombat' });
    }
  }
}