// ai.js - Automated testing AI

import { gameState, CONTROL_MODES } from './globals.js';

export function updateAI(p) {
  if (gameState.controlMode === CONTROL_MODES.HUMAN) {
    return;
  }
  
  gameState.testTimer++;
  
  if (gameState.controlMode === CONTROL_MODES.TEST_1) {
    // Test basic mechanics - deploy claw periodically
    if (gameState.clawState === "SWINGING" && gameState.testTimer % 180 === 0) {
      // Simulate SPACE press
      p.keyCode = 32;
      gameState.clawState = "DEPLOYING";
      
      p.logs.inputs.push({
        input_type: "keyPressed_AI",
        data: { key: ' ', keyCode: 32 },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else if (gameState.controlMode === CONTROL_MODES.TEST_2) {
    // Test win condition - deploy aggressively when over valuable items
    if (gameState.clawState === "SWINGING") {
      // Deploy when angle is close to center or pointing at valuable items
      if (Math.abs(gameState.clawAngle) < 0.3 && gameState.testTimer % 90 === 0) {
        p.keyCode = 32;
        gameState.clawState = "DEPLOYING";
        
        p.logs.inputs.push({
          input_type: "keyPressed_AI",
          data: { key: ' ', keyCode: 32 },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // Use dynamite on low-value items
    if (gameState.grabbedItem && gameState.grabbedItem.value < 100 && 
        gameState.dynamiteCount > 0 && gameState.testTimer % 30 === 0) {
      p.keyCode = 68;
      gameState.grabbedItem.destroy();
      gameState.grabbedItem = null;
      gameState.dynamiteCount--;
      
      p.logs.inputs.push({
        input_type: "keyPressed_AI",
        data: { key: 'd', keyCode: 68 },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
}