// automated_testing_controller.js
import { 
  EVAC_X, 
  EVAC_Y,
  BUILDING_INTERACTION_RANGE,
  PLAYER_ATTACK_RANGE,
  ENEMY_DETECTION_RANGE
} from './globals.js';

function getTestWinAction(gameState) {
  const player = gameState.player;
  const evac = gameState.evacuationPoint;
  
  // Priority 1: Manage critical survival stats
  if (player.hunger < 30 && player.inventory.food > 0) {
    return { z: true };
  }
  if (player.thirst < 30 && player.inventory.water > 0) {
    return { z: true };
  }
  if (player.radiation > 70 && player.inventory.antirad > 0) {
    return { z: true };
  }
  
  // Priority 2: Combat nearby enemies
  for (let enemy of gameState.enemies) {
    if (enemy.dead) continue;
    
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < ENEMY_DETECTION_RANGE) {
      const angleToEnemy = Math.atan2(dy, dx);
      let angleDiff = angleToEnemy - player.angle;
      
      // Normalize angle
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      
      if (Math.abs(angleDiff) > 0.1) {
        return { [angleDiff > 0 ? 'right' : 'left']: true };
      } else if (dist < PLAYER_ATTACK_RANGE) {
        return { space: true };
      } else {
        return { up: true };
      }
    }
  }
  
  // Priority 3: Scavenge nearby unscavenged buildings if low on supplies
  const needsSupplies = player.inventory.food < 3 || 
                        player.inventory.water < 3 || 
                        player.inventory.antirad < 2;
  
  if (needsSupplies) {
    let closestBuilding = null;
    let closestDist = Infinity;
    
    for (let building of gameState.buildings) {
      if (building.scavenged) continue;
      
      const dx = building.x - player.x;
      const dy = building.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < closestDist && dist < 400) {
        closestDist = dist;
        closestBuilding = building;
      }
    }
    
    if (closestBuilding) {
      const dx = closestBuilding.x - player.x;
      const dy = closestBuilding.y - player.y;
      const angleToBuilding = Math.atan2(dy, dx);
      let angleDiff = angleToBuilding - player.angle;
      
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      
      if (Math.abs(angleDiff) > 0.1) {
        return { [angleDiff > 0 ? 'right' : 'left']: true };
      } else {
        return { up: true };
      }
    }
  }
  
  // Priority 4: Navigate to evacuation point
  const dx = evac.x - player.x;
  const dy = evac.y - player.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (dist > 50) {
    const angleToEvac = Math.atan2(dy, dx);
    let angleDiff = angleToEvac - player.angle;
    
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    
    if (Math.abs(angleDiff) > 0.1) {
      return { [angleDiff > 0 ? 'right' : 'left']: true };
    } else {
      // Use sprint if stats allow
      const useSprint = player.hunger > 50;
      return { up: true, shift: useSprint };
    }
  }
  
  return { up: true };
}

function getTestMovementAction(gameState) {
  const player = gameState.player;
  
  // Simple exploration pattern
  if (!gameState.testState) {
    gameState.testState = { phase: 0, timer: 0 };
  }
  
  gameState.testState.timer++;
  
  if (gameState.testState.timer > 60) {
    gameState.testState.timer = 0;
    gameState.testState.phase = (gameState.testState.phase + 1) % 4;
  }
  
  switch (gameState.testState.phase) {
    case 0: return { up: true };
    case 1: return { right: true };
    case 2: return { down: true };
    case 3: return { left: true };
  }
  
  return { up: true };
}

function getTestCombatAction(gameState) {
  const player = gameState.player;
  
  // Find and attack enemies
  for (let enemy of gameState.enemies) {
    if (enemy.dead) continue;
    
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < 500) {
      const angleToEnemy = Math.atan2(dy, dx);
      let angleDiff = angleToEnemy - player.angle;
      
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      
      if (Math.abs(angleDiff) > 0.1) {
        return { [angleDiff > 0 ? 'right' : 'left']: true };
      } else if (dist < PLAYER_ATTACK_RANGE) {
        return { space: true };
      } else {
        return { up: true };
      }
    }
  }
  
  return getTestMovementAction(gameState);
}

function getTestSurvivalAction(gameState) {
  const player = gameState.player;
  
  // Test consumable usage
  if (player.hunger < 50 && player.inventory.food > 0) {
    return { z: true };
  }
  if (player.thirst < 50 && player.inventory.water > 0) {
    return { z: true };
  }
  if (player.radiation > 50 && player.inventory.antirad > 0) {
    return { z: true };
  }
  
  // Navigate to buildings to scavenge
  let closestBuilding = null;
  let closestDist = Infinity;
  
  for (let building of gameState.buildings) {
    if (building.scavenged) continue;
    
    const dx = building.x - player.x;
    const dy = building.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < closestDist) {
      closestDist = dist;
      closestBuilding = building;
    }
  }
  
  if (closestBuilding) {
    const dx = closestBuilding.x - player.x;
    const dy = closestBuilding.y - player.y;
    const angleToBuilding = Math.atan2(dy, dx);
    let angleDiff = angleToBuilding - player.angle;
    
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    
    if (Math.abs(angleDiff) > 0.1) {
      return { [angleDiff > 0 ? 'right' : 'left']: true };
    } else {
      return { up: true };
    }
  }
  
  return { up: true };
}

function getTestGameOverAction(gameState) {
  const player = gameState.player;
  
  // Don't use any consumables or avoid damage - just move around
  // This should lead to game over from stat depletion
  return { up: true, shift: true }; // Sprint to deplete hunger faster
}

function getRandomAction(gameState) {
  const actions = ['up', 'down', 'left', 'right', 'space'];
  const randomAction = actions[Math.floor(Math.random() * actions.length)];
  return { [randomAction]: true };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestMovementAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestCombatAction(gameState);
    case "TEST_4":
      return getTestSurvivalAction(gameState);
    case "TEST_5":
      return getTestGameOverAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;