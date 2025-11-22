import { gameState } from './globals.js';

export function updatePower() {
  if (gameState.power <= 0) {
    gameState.power = 0;
    handlePowerOut();
    return;
  }
  
  // Base drain
  let drain = gameState.powerDrainRate;
  
  // Camera usage
  if (gameState.cameraOpen) {
    drain += 0.08;
  }
  
  // Door usage (each door)
  if (gameState.leftDoorClosed) {
    drain += 0.12;
  }
  if (gameState.rightDoorClosed) {
    drain += 0.12;
  }
  
  // Light usage
  if (gameState.leftLightOn) {
    drain += 0.06;
  }
  if (gameState.rightLightOn) {
    drain += 0.06;
  }
  
  // Scale drain by night difficulty
  drain *= (1 + (gameState.currentNight - 1) * 0.15);
  
  gameState.power -= drain;
  
  if (gameState.power < 0) {
    gameState.power = 0;
  }
}

function handlePowerOut() {
  // Force everything off
  gameState.cameraOpen = false;
  gameState.leftDoorClosed = false;
  gameState.rightDoorClosed = false;
  gameState.leftLightOn = false;
  gameState.rightLightOn = false;
  
  // Animatronics can now enter freely
  // Trigger jumpscare after a short delay
  if (!gameState.jumpscareActive) {
    // Find any animatronic to trigger jumpscare
    const nearbyAnim = gameState.animatronics.find(a => a.atLeftDoor || a.atRightDoor);
    if (nearbyAnim) {
      gameState.jumpscareActive = true;
      gameState.jumpscareFrame = 0;
      gameState.jumpscareAnimatronic = nearbyAnim;
    }
  }
}

export function getPowerUsageLevel() {
  let level = 1; // Base usage
  
  if (gameState.cameraOpen) level++;
  if (gameState.leftDoorClosed) level++;
  if (gameState.rightDoorClosed) level++;
  if (gameState.leftLightOn || gameState.rightLightOn) level++;
  
  return level;
}