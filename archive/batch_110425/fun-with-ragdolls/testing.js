// testing.js - Automated testing modes

import { gameState, OBJECT_TYPES, AI_BEHAVIORS } from './globals.js';
import { placeObject, clearAllObjects } from './game.js';

export function runTestMode(p) {
  if (gameState.controlMode === 'TEST_1') {
    runTest1(p);
  } else if (gameState.controlMode === 'TEST_2') {
    runTest2(p);
  } else if (gameState.controlMode === 'TEST_3') {
    runTest3(p);
  } else if (gameState.controlMode === 'TEST_4') {
    runTest4(p);
  } else if (gameState.controlMode === 'TEST_5') {
    runTest5(p);
  } else if (gameState.controlMode === 'TEST_6') {
    runTest6(p);
  } else if (gameState.controlMode === 'TEST_7') {
    runTest7(p);
  }
}

// TEST_1: Basic object placement and physics
function runTest1(p) {
  const frame = p.frameCount;
  
  if (frame === 10) {
    // Place a ragdoll
    gameState.selectedObjectType = OBJECT_TYPES.RAGDOLL;
    gameState.cursorX = 100;
    gameState.cursorY = 100;
    placeObject(p);
  }
  
  if (frame === 30) {
    // Place a cannon
    gameState.selectedObjectType = OBJECT_TYPES.CANNON;
    gameState.cursorX = 300;
    gameState.cursorY = 200;
    placeObject(p);
  }
  
  if (frame === 50) {
    // Place a mine
    gameState.selectedObjectType = OBJECT_TYPES.MINE;
    gameState.cursorX = 450;
    gameState.cursorY = 300;
    placeObject(p);
  }
  
  if (frame === 70) {
    // Place a fan
    gameState.selectedObjectType = OBJECT_TYPES.FAN;
    gameState.cursorX = 200;
    gameState.cursorY = 350;
    placeObject(p);
  }
  
  if (frame === 90) {
    // Place a wall
    gameState.selectedObjectType = OBJECT_TYPES.WALL;
    gameState.cursorX = 400;
    gameState.cursorY = 370;
    placeObject(p);
  }
}

// TEST_2: AI behaviors
function runTest2(p) {
  const frame = p.frameCount;
  
  if (frame === 10) {
    // Spawn attacker
    gameState.selectedObjectType = OBJECT_TYPES.RAGDOLL;
    gameState.ragdollBehavior = AI_BEHAVIORS.ATTACKER;
    gameState.cursorX = 100;
    gameState.cursorY = 200;
    placeObject(p);
  }
  
  if (frame === 30) {
    // Spawn seeker
    gameState.ragdollBehavior = AI_BEHAVIORS.SEEKER;
    gameState.cursorX = 300;
    gameState.cursorY = 200;
    placeObject(p);
  }
  
  if (frame === 50) {
    // Spawn explorer
    gameState.ragdollBehavior = AI_BEHAVIORS.EXPLORER;
    gameState.cursorX = 500;
    gameState.cursorY = 200;
    placeObject(p);
  }
  
  if (frame === 70) {
    // Add obstacles
    gameState.selectedObjectType = OBJECT_TYPES.WALL;
    gameState.cursorX = 300;
    gameState.cursorY = 300;
    placeObject(p);
  }
}

// TEST_3: Property adjustments
function runTest3(p) {
  const frame = p.frameCount;
  
  if (frame === 10) {
    // Small ragdoll
    gameState.selectedObjectType = OBJECT_TYPES.RAGDOLL;
    gameState.ragdollScale = 0.5;
    gameState.cursorX = 150;
    gameState.cursorY = 200;
    placeObject(p);
  }
  
  if (frame === 30) {
    // Large ragdoll
    gameState.ragdollScale = 2.0;
    gameState.cursorX = 450;
    gameState.cursorY = 200;
    placeObject(p);
  }
  
  if (frame === 50) {
    // Weak cannon
    gameState.selectedObjectType = OBJECT_TYPES.CANNON;
    gameState.cannonForce = 0.5;
    gameState.cursorX = 200;
    gameState.cursorY = 100;
    placeObject(p);
  }
  
  if (frame === 70) {
    // Strong cannon
    gameState.cannonForce = 2.0;
    gameState.cursorX = 400;
    gameState.cursorY = 100;
    placeObject(p);
  }
}

// TEST_4: Deletion and clearing
function runTest4(p) {
  const frame = p.frameCount;
  
  if (frame === 10) {
    // Place multiple objects
    for (let i = 0; i < 5; i++) {
      gameState.selectedObjectType = OBJECT_TYPES.RAGDOLL;
      gameState.cursorX = 100 + i * 100;
      gameState.cursorY = 200;
      placeObject(p);
    }
  }
  
  if (frame === 100) {
    // Clear all
    clearAllObjects();
  }
  
  if (frame === 150) {
    // Place new objects to verify clean state
    gameState.selectedObjectType = OBJECT_TYPES.CANNON;
    gameState.cursorX = 300;
    gameState.cursorY = 200;
    placeObject(p);
  }
}

// TEST_5: Chain reactions
function runTest5(p) {
  const frame = p.frameCount;
  
  if (frame === 10) {
    // Create a cluster of mines
    for (let i = 0; i < 5; i++) {
      gameState.selectedObjectType = OBJECT_TYPES.MINE;
      gameState.cursorX = 300 + (i - 2) * 40;
      gameState.cursorY = 250;
      placeObject(p);
    }
  }
  
  if (frame === 30) {
    // Add ragdolls around
    for (let i = 0; i < 4; i++) {
      gameState.selectedObjectType = OBJECT_TYPES.RAGDOLL;
      gameState.cursorX = 200 + i * 70;
      gameState.cursorY = 150;
      placeObject(p);
    }
  }
  
  if (frame === 50) {
    // Add cannon to trigger chain
    gameState.selectedObjectType = OBJECT_TYPES.CANNON;
    gameState.cursorX = 100;
    gameState.cursorY = 250;
    placeObject(p);
  }
}

// TEST_6: Stress test
function runTest6(p) {
  const frame = p.frameCount;
  
  // Rapidly spawn objects
  if (frame >= 10 && frame <= 60 && frame % 3 === 0) {
    const types = Object.values(OBJECT_TYPES);
    gameState.selectedObjectType = types[Math.floor(Math.random() * types.length)];
    gameState.cursorX = Math.random() * 500 + 50;
    gameState.cursorY = Math.random() * 250 + 100;
    placeObject(p);
  }
  
  // Test boundary placement
  if (frame === 100) {
    gameState.selectedObjectType = OBJECT_TYPES.WALL;
    gameState.cursorX = 50;
    gameState.cursorY = 50;
    placeObject(p);
  }
  
  if (frame === 110) {
    gameState.cursorX = 550;
    gameState.cursorY = 350;
    placeObject(p);
  }
}

// TEST_7: Phase transitions
function runTest7(p) {
  const frame = p.frameCount;
  
  if (frame === 10) {
    // Place some objects
    gameState.selectedObjectType = OBJECT_TYPES.RAGDOLL;
    gameState.cursorX = 300;
    gameState.cursorY = 200;
    placeObject(p);
  }
  
  if (frame === 50) {
    // Simulate pause
    gameState.gamePhase = "PAUSED";
    p.logs.game_info.push({
      data: { gamePhase: "PAUSED" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  if (frame === 100) {
    // Unpause
    gameState.gamePhase = "PLAYING";
    p.logs.game_info.push({
      data: { gamePhase: "PLAYING" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}