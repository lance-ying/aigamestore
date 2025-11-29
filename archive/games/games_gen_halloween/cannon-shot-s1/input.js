import { gameState, GAME_PHASES, PLACEMENT_STATE } from './globals.js';
import { OBJECT_TYPES } from './levels.js';

export function handleGameInput(p) {
  const { gamePhase, placementState } = gameState;
  
  if (gamePhase !== GAME_PHASES.PLAYING) return;
  
  if (placementState === PLACEMENT_STATE.PLACING) {
    handlePlacementInput(p);
  } else if (placementState === PLACEMENT_STATE.READY) {
    handleReadyInput(p);
  } else if (placementState === PLACEMENT_STATE.COMPLETE) {
    handleCompleteInput(p);
  }
}

function handlePlacementInput(p) {
  const moveSpeed = 3;
  const rotateSpeed = 0.05;
  
  if (gameState.availableObjects.length === 0) return;
  
  const currentObj = gameState.availableObjects[gameState.selectedObjectIndex];
  
  if (p.keyIsDown(37)) { // LEFT
    currentObj.move(-moveSpeed, 0);
  }
  if (p.keyIsDown(39)) { // RIGHT
    currentObj.move(moveSpeed, 0);
  }
  if (p.keyIsDown(38)) { // UP
    currentObj.move(0, -moveSpeed);
  }
  if (p.keyIsDown(40)) { // DOWN
    currentObj.move(0, moveSpeed);
  }
}

export function handleKeyPress(p) {
  const { gamePhase, placementState } = gameState;
  
  if (gamePhase !== GAME_PHASES.PLAYING) return;
  
  if (placementState === PLACEMENT_STATE.PLACING) {
    const currentObj = gameState.availableObjects[gameState.selectedObjectIndex];
    
    if (p.keyCode === 90) { // Z - rotate left
      if (currentObj) {
        currentObj.rotate(-0.1);
      }
    } else if (p.keyCode === 88) { // X - rotate right
      if (currentObj) {
        currentObj.rotate(0.1);
      }
    } else if (p.keyCode === 65) { // A - previous object
      if (gameState.availableObjects.length > 0) {
        gameState.selectedObjectIndex = (gameState.selectedObjectIndex - 1 + gameState.availableObjects.length) % gameState.availableObjects.length;
      }
    } else if (p.keyCode === 68) { // D - next object
      if (gameState.availableObjects.length > 0) {
        gameState.selectedObjectIndex = (gameState.selectedObjectIndex + 1) % gameState.availableObjects.length;
      }
    } else if (p.keyCode === 32) { // SPACE - place object
      if (currentObj) {
        currentObj.place();
        gameState.placedObjects.push(currentObj);
        gameState.availableObjects.splice(gameState.selectedObjectIndex, 1);
        
        if (gameState.availableObjects.length === 0) {
          gameState.placementState = PLACEMENT_STATE.READY;
        } else {
          gameState.selectedObjectIndex = gameState.selectedObjectIndex % gameState.availableObjects.length;
        }
      }
    }
  } else if (placementState === PLACEMENT_STATE.READY) {
    if (p.keyCode === 32) { // SPACE - fire cannon
      gameState.placementState = PLACEMENT_STATE.FIRING;
      gameState.cannonCooldown = 3;
    }
  } else if (placementState === PLACEMENT_STATE.COMPLETE) {
    if (p.keyCode === 32) { // SPACE - reset level
      resetLevel(p);
    }
  }
}

function resetLevel(p) {
  // Clean up old objects
  gameState.balls.forEach(ball => ball.destroy());
  gameState.balls = [];
  gameState.placedObjects.forEach(obj => obj.destroy());
  gameState.placedObjects = [];
  gameState.availableObjects.forEach(obj => obj.destroy());
  gameState.availableObjects = [];
  
  gameState.ballsFired = 0;
  gameState.placementState = PLACEMENT_STATE.PLACING;
  gameState.levelComplete = false;
  gameState.levelFailed = false;
  
  // Reinitialize level
  const { initializeLevel } = await import('./game.js');
  initializeLevel(p);
}