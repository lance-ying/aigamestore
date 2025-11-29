import { gameState, CAMERA_LOCATIONS } from './globals.js';

export function updateAnimatronics(p) {
  if (gameState.jumpscareActive) return;
  
  gameState.animatronics.forEach(anim => {
    anim.moveTimer++;
    
    // Check if it's time to move
    if (anim.moveTimer >= anim.moveDelay) {
      anim.moveTimer = 0;
      attemptMove(anim, p);
    }
    
    // Check if at doors
    checkDoorArrival(anim);
  });
}

function attemptMove(anim, p) {
  // Higher aggression = more likely to move
  const moveChance = (anim.baseAggression * gameState.currentNight) / 10;
  
  if (p.random() < moveChance) {
    // Reset door positions when moving
    anim.atLeftDoor = false;
    anim.atRightDoor = false;
    
    // Choose movement path towards office
    const possibleMoves = getPossibleMoves(anim.location);
    
    if (possibleMoves.length > 0) {
      // Prefer moving towards office (higher camera IDs generally closer)
      const weights = possibleMoves.map(loc => {
        if (loc === -1) return 3; // Left door
        if (loc === -2) return 3; // Right door
        return 1 + (loc - anim.location) * 0.5;
      });
      
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      let rand = p.random() * totalWeight;
      
      for (let i = 0; i < possibleMoves.length; i++) {
        rand -= weights[i];
        if (rand <= 0) {
          anim.location = possibleMoves[i];
          break;
        }
      }
    }
  }
}

function getPossibleMoves(currentLocation) {
  // Define movement graph (simplified)
  const moveGraph = {
    0: [1], // Show Stage -> Dining
    1: [2, 3], // Dining -> West Hall or East Hall
    2: [4, -1], // West Hall -> Supply Closet or Left Door
    3: [5, -2], // East Hall -> Backstage or Right Door
    4: [-1], // Supply Closet -> Left Door
    5: [-2], // Backstage -> Right Door
    '-1': [-1], // At left door
    '-2': [-2]  // At right door
  };
  
  return moveGraph[currentLocation] || [];
}

function checkDoorArrival(anim) {
  if (anim.location === -1) {
    anim.atLeftDoor = true;
    
    // If door is open, trigger jumpscare
    if (!gameState.leftDoorClosed && !gameState.jumpscareActive) {
      triggerJumpscare(anim);
    }
  } else if (anim.location === -2) {
    anim.atRightDoor = true;
    
    if (!gameState.rightDoorClosed && !gameState.jumpscareActive) {
      triggerJumpscare(anim);
    }
  }
}

function triggerJumpscare(anim) {
  gameState.jumpscareActive = true;
  gameState.jumpscareFrame = 0;
  gameState.jumpscareAnimatronic = anim;
}

export function isAnimatronicAtLocation(location) {
  return gameState.animatronics.some(anim => anim.location === location);
}

export function getAnimatronicsAtLocation(location) {
  return gameState.animatronics.filter(anim => anim.location === location);
}