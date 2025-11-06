// controls.js - Input handling and automated testing

import { gameState } from './globals.js';
import { selectNextLayer, selectPreviousLayer } from './levels.js';

export function handleGameplayInput(p) {
  const now = Date.now();
  
  if (gameState.controlMode === "HUMAN") {
    // Human control
    if (gameState.keys[37]) { // Left arrow - previous layer
      if (now - gameState.lastTerrainAdjustTime > gameState.terrainAdjustDelay) {
        selectPreviousLayer();
        gameState.lastTerrainAdjustTime = now;
      }
    }
    
    if (gameState.keys[39]) { // Right arrow - next layer
      if (now - gameState.lastTerrainAdjustTime > gameState.terrainAdjustDelay) {
        selectNextLayer();
        gameState.lastTerrainAdjustTime = now;
      }
    }
    
    if (gameState.keys[38]) { // Up arrow - raise terrain
      if (now - gameState.lastTerrainAdjustTime > gameState.terrainAdjustDelay) {
        const selectedLayer = gameState.terrainLayers[gameState.selectedLayerIndex];
        if (selectedLayer && selectedLayer.canMove) {
          selectedLayer.adjustHeight(-10);
          gameState.lastTerrainAdjustTime = now;
        }
      }
    }
    
    if (gameState.keys[40]) { // Down arrow - lower terrain
      if (now - gameState.lastTerrainAdjustTime > gameState.terrainAdjustDelay) {
        const selectedLayer = gameState.terrainLayers[gameState.selectedLayerIndex];
        if (selectedLayer && selectedLayer.canMove) {
          selectedLayer.adjustHeight(10);
          gameState.lastTerrainAdjustTime = now;
        }
      }
    }
    
    if (gameState.keys[32]) { // Space - start walking
      if (!gameState.isMoving && !gameState.oldMan.isWalking) {
        gameState.oldMan.startWalking();
        gameState.isMoving = true;
      }
    }
  } else if (gameState.controlMode === "TEST_1") {
    runTest1(p, now);
  } else if (gameState.controlMode === "TEST_2") {
    runTest2(p, now);
  }
}

// TEST_1: Basic terrain manipulation and movement
let test1State = {
  phase: 0,
  timer: 0,
  adjustmentCount: 0
};

function runTest1(p, now) {
  test1State.timer++;
  
  if (test1State.phase === 0) {
    // Select first movable layer
    if (test1State.timer > 30) {
      selectNextLayer();
      test1State.phase = 1;
      test1State.timer = 0;
    }
  } else if (test1State.phase === 1) {
    // Adjust terrain up
    if (test1State.timer % 20 === 0 && test1State.adjustmentCount < 3) {
      const selectedLayer = gameState.terrainLayers[gameState.selectedLayerIndex];
      if (selectedLayer && selectedLayer.canMove) {
        selectedLayer.adjustHeight(-15);
        test1State.adjustmentCount++;
      }
    }
    
    if (test1State.adjustmentCount >= 3) {
      test1State.phase = 2;
      test1State.timer = 0;
      test1State.adjustmentCount = 0;
    }
  } else if (test1State.phase === 2) {
    // Start old man walking
    if (test1State.timer > 40) {
      if (!gameState.oldMan.isWalking) {
        gameState.oldMan.startWalking();
        gameState.isMoving = true;
      }
      test1State.phase = 3;
      test1State.timer = 0;
    }
  } else if (test1State.phase === 3) {
    // Wait for old man to get stuck or reach goal
    if (!gameState.oldMan.isWalking && !gameState.levelComplete) {
      // Old man stuck, adjust next layer
      test1State.phase = 4;
      test1State.timer = 0;
    }
  } else if (test1State.phase === 4) {
    // Select next layer
    if (test1State.timer > 20) {
      selectNextLayer();
      test1State.phase = 5;
      test1State.timer = 0;
    }
  } else if (test1State.phase === 5) {
    // Adjust terrain
    if (test1State.timer % 20 === 0 && test1State.adjustmentCount < 4) {
      const selectedLayer = gameState.terrainLayers[gameState.selectedLayerIndex];
      if (selectedLayer && selectedLayer.canMove) {
        selectedLayer.adjustHeight(-12);
        test1State.adjustmentCount++;
      }
    }
    
    if (test1State.adjustmentCount >= 4) {
      test1State.phase = 6;
      test1State.timer = 0;
      test1State.adjustmentCount = 0;
    }
  } else if (test1State.phase === 6) {
    // Continue walking
    if (test1State.timer > 40) {
      if (!gameState.oldMan.isWalking && !gameState.levelComplete) {
        gameState.oldMan.startWalking();
      }
      test1State.phase = 3;
      test1State.timer = 0;
    }
  }
}

// TEST_2: Win quickly by solving levels optimally
let test2State = {
  phase: 0,
  timer: 0,
  levelSolutions: [
    // Level 0 solution
    [
      { action: 'select', layer: 1 },
      { action: 'adjust', amount: -30 },
      { action: 'walk' }
    ],
    // Level 1 solution
    [
      { action: 'select', layer: 1 },
      { action: 'adjust', amount: -40 },
      { action: 'select', layer: 2 },
      { action: 'adjust', amount: -35 },
      { action: 'walk' }
    ],
    // Level 2 solution
    [
      { action: 'select', layer: 1 },
      { action: 'adjust', amount: -25 },
      { action: 'select', layer: 2 },
      { action: 'adjust', amount: -30 },
      { action: 'select', layer: 3 },
      { action: 'adjust', amount: -40 },
      { action: 'walk' }
    ],
    // Level 3 solution
    [
      { action: 'select', layer: 1 },
      { action: 'adjust', amount: -35 },
      { action: 'select', layer: 2 },
      { action: 'adjust', amount: -40 },
      { action: 'select', layer: 3 },
      { action: 'adjust', amount: -30 },
      { action: 'select', layer: 4 },
      { action: 'adjust', amount: -45 },
      { action: 'walk' }
    ],
    // Level 4 solution
    [
      { action: 'select', layer: 1 },
      { action: 'adjust', amount: -30 },
      { action: 'select', layer: 2 },
      { action: 'adjust', amount: -35 },
      { action: 'select', layer: 3 },
      { action: 'adjust', amount: -40 },
      { action: 'select', layer: 4 },
      { action: 'adjust', amount: -35 },
      { action: 'select', layer: 5 },
      { action: 'adjust', amount: -50 },
      { action: 'walk' }
    ]
  ],
  currentStep: 0
};

function runTest2(p, now) {
  test2State.timer++;
  
  const currentLevel = gameState.currentLevel;
  if (currentLevel >= test2State.levelSolutions.length) {
    return; // All levels complete
  }
  
  const solution = test2State.levelSolutions[currentLevel];
  
  if (test2State.currentStep >= solution.length) {
    // Wait for level to complete
    return;
  }
  
  const step = solution[test2State.currentStep];
  
  if (step.action === 'select') {
    if (test2State.timer > 15) {
      // Ensure we're on the right layer
      while (gameState.selectedLayerIndex !== step.layer) {
        selectNextLayer();
      }
      test2State.currentStep++;
      test2State.timer = 0;
    }
  } else if (step.action === 'adjust') {
    if (test2State.timer > 25) {
      const selectedLayer = gameState.terrainLayers[gameState.selectedLayerIndex];
      if (selectedLayer && selectedLayer.canMove) {
        selectedLayer.adjustHeight(step.amount);
      }
      test2State.currentStep++;
      test2State.timer = 0;
    }
  } else if (step.action === 'walk') {
    if (test2State.timer > 35) {
      if (!gameState.oldMan.isWalking && !gameState.levelComplete) {
        gameState.oldMan.startWalking();
        gameState.isMoving = true;
      }
      test2State.currentStep++;
      test2State.timer = 0;
    }
  }
}

export function resetTestStates() {
  test1State = {
    phase: 0,
    timer: 0,
    adjustmentCount: 0
  };
  
  test2State = {
    phase: 0,
    timer: 0,
    levelSolutions: test2State.levelSolutions,
    currentStep: 0
  };
}