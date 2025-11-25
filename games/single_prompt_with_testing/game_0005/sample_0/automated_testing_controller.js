// automated_testing_controller.js
import { gameState } from './globals.js';

function getTestWinAction(gameState) {
  const player = gameState.player;
  if (!player) return { key: null, keyCode: null };
  
  // Priority 1: Capture weakened pals
  for (const pal of gameState.wildPals) {
    if (!pal.active || pal.isCaptured) continue;
    if (pal.canBeCaptured()) {
      const dx = pal.x - player.x;
      const dy = pal.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 50) {
        return { key: 'z', keyCode: 90 };
      } else if (dist < 200) {
        // Move towards weakened pal
        if (Math.abs(dx) > Math.abs(dy)) {
          return dx > 0 ? { key: 'ArrowRight', keyCode: 39 } : { key: 'ArrowLeft', keyCode: 37 };
        } else {
          return dy > 0 ? { key: 'ArrowDown', keyCode: 40 } : { key: 'ArrowUp', keyCode: 38 };
        }
      }
    }
  }
  
  // Priority 2: Attack nearest target
  let nearestTarget = null;
  let nearestDist = 150;
  
  for (const pal of gameState.wildPals) {
    if (!pal.active) continue;
    const dx = pal.x - player.x;
    const dy = pal.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestTarget = pal;
    }
  }
  
  for (const poacher of gameState.poachers) {
    if (!poacher.active) continue;
    const dx = poacher.x - player.x;
    const dy = poacher.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestTarget = poacher;
    }
  }
  
  if (nearestTarget && nearestDist < 100) {
    if (player.canAttack()) {
      return { key: ' ', keyCode: 32 };
    }
  }
  
  // Priority 3: Build workstations if we have resources
  if (gameState.resources.food > 100 && gameState.workstations.length < 8) {
    // Hold shift briefly to place a station
    if (gameState.frameCount % 180 < 45) {
      return { key: 'Shift', keyCode: 16 };
    }
  }
  
  // Priority 4: Assign pals to workstations
  if (gameState.capturedPals.length > gameState.workstations.filter(s => s.assignedPal).length) {
    for (const station of gameState.workstations) {
      if (!station.assignedPal) {
        const dx = station.x - player.x;
        const dy = station.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 60) {
          return { key: 'Shift', keyCode: 16 };
        } else if (dist < 300) {
          // Move towards station
          if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? { key: 'ArrowRight', keyCode: 39 } : { key: 'ArrowLeft', keyCode: 37 };
          } else {
            return dy > 0 ? { key: 'ArrowDown', keyCode: 40 } : { key: 'ArrowUp', keyCode: 38 };
          }
        }
      }
    }
  }
  
  // Priority 5: Move towards nearest wild pal to attack
  if (nearestTarget) {
    const dx = nearestTarget.x - player.x;
    const dy = nearestTarget.y - player.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? { key: 'ArrowRight', keyCode: 39 } : { key: 'ArrowLeft', keyCode: 37 };
    } else {
      return dy > 0 ? { key: 'ArrowDown', keyCode: 40 } : { key: 'ArrowUp', keyCode: 38 };
    }
  }
  
  // Default: Explore the map
  const center = { x: 600, y: 400 };
  const dx = center.x - player.x;
  const dy = center.y - player.y;
  
  if (Math.abs(dx) > 100 || Math.abs(dy) > 100) {
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? { key: 'ArrowRight', keyCode: 39 } : { key: 'ArrowLeft', keyCode: 37 };
    } else {
      return dy > 0 ? { key: 'ArrowDown', keyCode: 40 } : { key: 'ArrowUp', keyCode: 38 };
    }
  }
  
  return { key: null, keyCode: null };
}

function getBasicTestAction(gameState) {
  const player = gameState.player;
  if (!player) return { key: null, keyCode: null };
  
  // Simple exploration pattern
  const time = gameState.frameCount;
  const pattern = Math.floor(time / 60) % 4;
  
  if (time % 120 < 20) {
    return { key: ' ', keyCode: 32 }; // Attack periodically
  }
  
  switch(pattern) {
    case 0: return { key: 'ArrowRight', keyCode: 39 };
    case 1: return { key: 'ArrowDown', keyCode: 40 };
    case 2: return { key: 'ArrowLeft', keyCode: 37 };
    case 3: return { key: 'ArrowUp', keyCode: 38 };
  }
  
  return { key: null, keyCode: null };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return { key: null, keyCode: null };
  }
}

if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;