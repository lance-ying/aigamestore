import { gameState, PLACEMENT_STATE } from './globals.js';
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Body } = Matter;
import { OBJECT_TYPES } from './levels.js';

export function runAIControl(p) {
  if (gameState.controlMode === "TEST_1") {
    runTest1(p);
  } else if (gameState.controlMode === "TEST_2") {
    runTest2(p);
  }
}

function runTest1(p) {
  gameState.testFrameCount++;
  
  if (gameState.placementState === PLACEMENT_STATE.PLACING) {
    // Place objects quickly
    if (gameState.testFrameCount % 30 === 10) {
      if (gameState.availableObjects.length > 0) {
        const obj = gameState.availableObjects[gameState.selectedObjectIndex];
        
        // Position in center area
        const targetX = 300 + (Math.random() - 0.5) * 200;
        const targetY = 200 + (Math.random() - 0.5) * 100;
        
        Body.setPosition(obj.body, { x: targetX, y: targetY });
        obj.x = targetX;
        obj.y = targetY;
        
        // Random rotation
        obj.rotate(Math.random() * Math.PI / 4);
        
        // Place it
        obj.place();
        gameState.placedObjects.push(obj);
        gameState.availableObjects.splice(gameState.selectedObjectIndex, 1);
        
        if (gameState.availableObjects.length === 0) {
          gameState.placementState = PLACEMENT_STATE.READY;
        }
      }
    }
  } else if (gameState.placementState === PLACEMENT_STATE.READY) {
    if (gameState.testFrameCount % 30 === 0) {
      gameState.placementState = PLACEMENT_STATE.FIRING;
      gameState.cannonCooldown = 3;
    }
  }
}

function runTest2(p) {
  gameState.testFrameCount++;
  
  if (gameState.placementState === PLACEMENT_STATE.PLACING) {
    // Strategic placement for level 1
    if (gameState.testFrameCount === 20 && gameState.availableObjects.length > 0) {
      // Place first ramp pointing to left bucket
      const ramp1 = gameState.availableObjects.find(o => o.type === OBJECT_TYPES.RAMP);
      if (ramp1) {
        Body.setPosition(ramp1.body, { x: 250, y: 200 });
        ramp1.x = 250;
        ramp1.y = 200;
        ramp1.rotate(-0.3);
        ramp1.place();
        
        const idx = gameState.availableObjects.indexOf(ramp1);
        gameState.placedObjects.push(ramp1);
        gameState.availableObjects.splice(idx, 1);
      }
    }
    
    if (gameState.testFrameCount === 40 && gameState.availableObjects.length > 0) {
      // Place second ramp pointing to right bucket
      const ramp2 = gameState.availableObjects.find(o => o.type === OBJECT_TYPES.RAMP);
      if (ramp2) {
        Body.setPosition(ramp2.body, { x: 350, y: 200 });
        ramp2.x = 350;
        ramp2.y = 200;
        ramp2.rotate(0.3);
        ramp2.place();
        
        const idx = gameState.availableObjects.indexOf(ramp2);
        gameState.placedObjects.push(ramp2);
        gameState.availableObjects.splice(idx, 1);
      }
    }
    
    if (gameState.testFrameCount === 60 && gameState.availableObjects.length > 0) {
      // Place bumper in center
      const bumper = gameState.availableObjects.find(o => o.type === OBJECT_TYPES.BUMPER);
      if (bumper) {
        Body.setPosition(bumper.body, { x: 300, y: 150 });
        bumper.x = 300;
        bumper.y = 150;
        bumper.place();
        
        const idx = gameState.availableObjects.indexOf(bumper);
        gameState.placedObjects.push(bumper);
        gameState.availableObjects.splice(idx, 1);
      }
    }
    
    if (gameState.availableObjects.length === 0) {
      gameState.placementState = PLACEMENT_STATE.READY;
    }
  } else if (gameState.placementState === PLACEMENT_STATE.READY) {
    if (gameState.testFrameCount % 30 === 0) {
      gameState.placementState = PLACEMENT_STATE.FIRING;
      gameState.cannonCooldown = 3;
    }
  }
}