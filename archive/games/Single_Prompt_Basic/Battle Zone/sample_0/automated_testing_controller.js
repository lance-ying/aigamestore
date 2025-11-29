import { KEY, gameState } from './globals.js';

// TEST_1: Basic testing with sticky keys
function getStickyKeysAction(gameState) {
  // Use frame count to change actions periodically
  const frameCount = gameState.player ? gameState.player.lastShot : 0;
  const cycleLength = 120; // Change action every 2 seconds at 60 FPS
  const actionIndex = Math.floor(frameCount / cycleLength) % 5;
  
  // Track player's position to detect if stuck
  if (!gameState.testData) {
    gameState.testData = {
      lastPositions: [],
      stuckCounter: 0,
      randomActionTimer: 0
    };
  }
  
  // Store last 10 positions
  if (gameState.player) {
    gameState.testData.lastPositions.push({x: gameState.player.x, y: gameState.player.y});
    if (gameState.testData.lastPositions.length > 10) {
      gameState.testData.lastPositions.shift();
    }
    
    // Check if stuck (not moving much)
    if (gameState.testData.lastPositions.length === 10) {
      const firstPos = gameState.testData.lastPositions[0];
      const lastPos = gameState.testData.lastPositions[9];
      const distance = Math.sqrt(
        Math.pow(lastPos.x - firstPos.x, 2) + 
        Math.pow(lastPos.y - firstPos.y, 2)
      );
      
      if (distance < 5) {
        gameState.testData.stuckCounter++;
      } else {
        gameState.testData.stuckCounter = 0;
      }
      
      // If stuck for a while, use random actions
      if (gameState.testData.stuckCounter > 5) {
        gameState.testData.randomActionTimer = 60; // Use random actions for 1 second
        gameState.testData.stuckCounter = 0;
      }
    }
    
    // Use random actions if timer is active
    if (gameState.testData.randomActionTimer > 0) {
      gameState.testData.randomActionTimer--;
      return [KEY.UP, KEY.DOWN, KEY.LEFT, KEY.RIGHT, KEY.Z, KEY.SPACE, KEY.SHIFT][Math.floor(Math.random() * 7)];
    }
  }
  
  // Regular action patterns
  switch (actionIndex) {
    case 0: // Move right and shoot
      return frameCount % 10 < 5 ? KEY.RIGHT : KEY.Z;
    case 1: // Move left and shoot
      return frameCount % 10 < 5 ? KEY.LEFT : KEY.Z;
    case 2: // Move up and sprint
      return frameCount % 10 < 5 ? KEY.UP : KEY.SPACE;
    case 3: // Move down and take cover
      return frameCount % 10 < 5 ? KEY.DOWN : KEY.SHIFT;
    case 4: // Circle movement
      const subCycle = frameCount % 40;
      if (subCycle < 10) return KEY.RIGHT;
      if (subCycle < 20) return KEY.DOWN;
      if (subCycle < 30) return KEY.LEFT;
      return KEY.UP;
  }
  
  return KEY.Z; // Default to shooting
}

// TEST_2: Win the game
function getTestWinAction(gameState) {
  if (!gameState.player) return null;
  
  // Initialize test data if not exists
  if (!gameState.testWinData) {
    gameState.testWinData = {
      mode: "explore",
      targetEnemy: null,
      targetPickup: null,
      lastPositions: [],
      stuckCounter: 0,
      pathTimer: 0,
      currentPath: [],
      lastHealth: gameState.player.health,
      healthCritical: false
    };
  }
  
  const data = gameState.testWinData;
  
  // Track positions to detect if stuck
  data.lastPositions.push({x: gameState.player.x, y: gameState.player.y});
  if (data.lastPositions.length > 15) {
    data.lastPositions.shift();
  }
  
  // Check if stuck
  if (data.lastPositions.length === 15) {
    const firstPos = data.lastPositions[0];
    const lastPos = data.lastPositions[14];
    const distance = Math.sqrt(
      Math.pow(lastPos.x - firstPos.x, 2) + 
      Math.pow(lastPos.y - firstPos.y, 2)
    );
    
    if (distance < 10) {
      data.stuckCounter++;
    } else {
      data.stuckCounter = 0;
    }
    
    // If stuck, change targets or use random movement
    if (data.stuckCounter > 10) {
      data.targetEnemy = null;
      data.targetPickup = null;
      data.mode = "random";
      data.pathTimer = 30;
      data.stuckCounter = 0;
    }
  }
  
  // Check if health decreased - prioritize finding health
  if (gameState.player.health < data.lastHealth) {
    data.lastHealth = gameState.player.health;
    if (gameState.player.health < 40) {
      data.healthCritical = true;
    }
  }
  
  // If health is critical, look for health packs
  if (data.healthCritical && gameState.player.health < 40) {
    // Find closest health pickup
    let closestHealth = null;
    let minDist = Infinity;
    
    for (const pickup of gameState.pickups) {
      if (pickup.type === "health") {
        const dist = distance(gameState.player, pickup);
        if (dist < minDist) {
          minDist = dist;
          closestHealth = pickup;
        }
      }
    }
    
    if (closestHealth) {
      data.mode = "get_health";
      data.targetPickup = closestHealth;
    } else {
      // No health packs, continue with mission
      data.healthCritical = false;
    }
  }
  
  // If ammo is low, look for ammo
  if (gameState.player.ammo < 5 && !data.healthCritical) {
    // Find closest ammo pickup
    let closestAmmo = null;
    let minDist = Infinity;
    
    for (const pickup of gameState.pickups) {
      if (pickup.type === "ammo") {
        const dist = distance(gameState.player, pickup);
        if (dist < minDist) {
          minDist = dist;
          closestAmmo = pickup;
        }
      }
    }
    
    if (closestAmmo) {
      data.mode = "get_ammo";
      data.targetPickup = closestAmmo;
    }
  }
  
  // Reset health critical if health is restored
  if (data.healthCritical && gameState.player.health > 60) {
    data.healthCritical = false;
  }
  
  // Decision making based on mission type
  if (gameState.mission === "elimination") {
    // For elimination mission, prioritize killing enemies
    if (!data.healthCritical && gameState.player.ammo > 5 && data.mode !== "get_ammo") {
      data.mode = "hunt";
    }
    
    // If we've killed enough enemies, switch to win mode
    if (gameState.enemiesKilled >= gameState.requiredKills) {
      return KEY.UP; // Just move up to trigger win condition
    }
  } else if (gameState.mission === "extraction") {
    // For extraction mission, prioritize reaching extraction point if healthy
    if (!data.healthCritical && gameState.player.ammo > 10 && data.mode !== "get_ammo" && data.mode !== "get_health") {
      data.mode = "extract";
    }
  }
  
  // Execute actions based on current mode
  switch (data.mode) {
    case "explore":
      // Random exploration to find items and enemies
      if (data.pathTimer <= 0) {
        data.pathTimer = 60 + Math.floor(Math.random() * 60);
        data.currentPath = Math.floor(Math.random() * 4);
      }
      data.pathTimer--;
      
      // Random direction movement
      switch (data.currentPath) {
        case 0: return KEY.UP;
        case 1: return KEY.RIGHT;
        case 2: return KEY.DOWN;
        case 3: return KEY.LEFT;
      }
      break;
      
    case "hunt":
      // Find closest enemy and attack
      if (!data.targetEnemy || !gameState.enemies.includes(data.targetEnemy)) {
        let closestEnemy = null;
        let minDist = Infinity;
        
        for (const enemy of gameState.enemies) {
          const dist = distance(gameState.player, enemy);
          if (dist < minDist) {
            minDist = dist;
            closestEnemy = enemy;
          }
        }
        
        data.targetEnemy = closestEnemy;
      }
      
      if (data.targetEnemy) {
        return moveTowardsAndAttack(gameState.player, data.targetEnemy);
      }
      break;
      
    case "get_health":
      if (data.targetPickup) {
        return moveTowards(gameState.player, data.targetPickup);
      } else {
        data.mode = "explore";
      }
      break;
      
    case "get_ammo":
      if (data.targetPickup) {
        return moveTowards(gameState.player, data.targetPickup);
      } else {
        data.mode = "explore";
      }
      break;
      
    case "extract":
      if (gameState.extractionPointObj) {
        return moveTowards(gameState.player, gameState.extractionPointObj);
      } else {
        data.mode = "explore";
      }
      break;
      
    case "random":
      // Random movement to get unstuck
      return [KEY.UP, KEY.DOWN, KEY.LEFT, KEY.RIGHT][Math.floor(Math.random() * 4)];
  }
  
  // Default action
  return KEY.Z; // Shoot as default
}

// TEST_3: Test player damage and health system
function getTestDamageHealthAction(gameState) {
  if (!gameState.player) return null;
  
  // Initialize test data
  if (!gameState.testDamageData) {
    gameState.testDamageData = {
      phase: "find_enemy",
      targetEnemy: null,
      healthBefore: gameState.player.health,
      damageTestDone: false,
      healingTestDone: false,
      targetHealth: null,
      waitTimer: 0,
      stuckCounter: 0,
      lastPositions: []
    };
  }
  
  const data = gameState.testDamageData;
  
  // Track positions to detect if stuck
  data.lastPositions.push({x: gameState.player.x, y: gameState.player.y});
  if (data.lastPositions.length > 15) {
    data.lastPositions.shift();
  }
  
  // Check if stuck
  if (data.lastPositions.length === 15) {
    const firstPos = data.lastPositions[0];
    const lastPos = data.lastPositions[14];
    const distance = Math.sqrt(
      Math.pow(lastPos.x - firstPos.x, 2) + 
      Math.pow(lastPos.y - firstPos.y, 2)
    );
    
    if (distance < 10) {
      data.stuckCounter++;
    } else {
      data.stuckCounter = 0;
    }
    
    // If stuck, use random movement
    if (data.stuckCounter > 10) {
      data.stuckCounter = 0;
      return [KEY.UP, KEY.DOWN, KEY.LEFT, KEY.RIGHT][Math.floor(Math.random() * 4)];
    }
  }
  
  // Check if health changed
  if (gameState.player.health < data.healthBefore) {
    data.damageTestDone = true;
  } else if (gameState.player.health > data.healthBefore && data.damageTestDone) {
    data.healingTestDone = true;
  }
  
  data.healthBefore = gameState.player.health;
  
  // Test phases
  switch (data.phase) {
    case "find_enemy":
      // Find an enemy to test damage
      if (!data.targetEnemy || !gameState.enemies.includes(data.targetEnemy)) {
        let closestEnemy = null;
        let minDist = Infinity;
        
        for (const enemy of gameState.enemies) {
          const dist = distance(gameState.player, enemy);
          if (dist < minDist && dist > 100) { // Not too close
            minDist = dist;
            closestEnemy = enemy;
          }
        }
        
        data.targetEnemy = closestEnemy;
      }
      
      if (data.targetEnemy) {
        // Move towards enemy but keep some distance
        const dist = distance(gameState.player, data.targetEnemy);
        if (dist < 150) {
          // We're close enough, let enemy hit us
          data.phase = "test_damage";
          data.waitTimer = 60; // Wait 1 second
        } else {
          return moveTowards(gameState.player, data.targetEnemy);
        }
      } else {
        // No enemy found, explore
        return [KEY.UP, KEY.DOWN, KEY.LEFT, KEY.RIGHT][Math.floor(Math.random() * 4)];
      }
      break;
      
    case "test_damage":
      // Wait to get hit
      if (data.waitTimer > 0) {
        data.waitTimer--;
        return null; // Stand still
      }
      
      if (data.damageTestDone) {
        data.phase = "find_health";
      } else {
        // Move closer to enemy to ensure we get hit
        return moveTowards(gameState.player, data.targetEnemy);
      }
      break;
      
    case "find_health":
      // Find health pickup to test healing
      if (!data.targetHealth) {
        let closestHealth = null;
        let minDist = Infinity;
        
        for (const pickup of gameState.pickups) {
          if (pickup.type === "health") {
            const dist = distance(gameState.player, pickup);
            if (dist < minDist) {
              minDist = dist;
              closestHealth = pickup;
            }
          }
        }
        
        data.targetHealth = closestHealth;
      }
      
      if (data.targetHealth) {
        return moveTowards(gameState.player, data.targetHealth);
      } else {
        // No health found, explore
        return [KEY.UP, KEY.DOWN, KEY.LEFT, KEY.RIGHT][Math.floor(Math.random() * 4)];
      }
      
      if (data.healingTestDone) {
        data.phase = "test_complete";
      }
      break;
      
    case "test_complete":
      // Test is complete, just survive
      return getStickyKeysAction(gameState);
  }
  
  return KEY.Z; // Default action
}

// TEST_4: Test ammunition system
function getTestAmmoAction(gameState) {
  if (!gameState.player) return null;
  
  // Initialize test data
  if (!gameState.testAmmoData) {
    gameState.testAmmoData = {
      phase: "deplete_ammo",
      ammoTestDone: false,
      reloadTestDone: false,
      pickupTestDone: false,
      targetAmmo: null,
      lastAmmo: gameState.player.ammo,
      waitTimer: 0,
      stuckCounter: 0,
      lastPositions: []
    };
  }
  
  const data = gameState.testAmmoData;
  
  // Track positions to detect if stuck
  data.lastPositions.push({x: gameState.player.x, y: gameState.player.y});
  if (data.lastPositions.length > 15) {
    data.lastPositions.shift();
  }
  
  // Check if stuck
  if (data.lastPositions.length === 15) {
    const firstPos = data.lastPositions[0];
    const lastPos = data.lastPositions[14];
    const distance = Math.sqrt(
      Math.pow(lastPos.x - firstPos.x, 2) + 
      Math.pow(lastPos.y - firstPos.y, 2)
    );
    
    if (distance < 10) {
      data.stuckCounter++;
    } else {
      data.stuckCounter = 0;
    }
    
    // If stuck, use random movement
    if (data.stuckCounter > 10) {
      data.stuckCounter = 0;
      return [KEY.UP, KEY.DOWN, KEY.LEFT, KEY.RIGHT][Math.floor(Math.random() * 4)];
    }
  }
  
  // Check ammo changes
  if (gameState.player.ammo < data.lastAmmo) {
    data.ammoTestDone = true;
  }
  
  if (gameState.player.ammo === 0 && gameState.player.reloading) {
    data.reloadTestDone = true;
  }
  
  if (gameState.player.ammo > 0 && data.lastAmmo === 0) {
    data.pickupTestDone = true;
  }
  
  data.lastAmmo = gameState.player.ammo;
  
  // Test phases
  switch (data.phase) {
    case "deplete_ammo":
      // Keep shooting until ammo is depleted
      if (gameState.player.ammo === 0) {
        data.phase = "find_ammo";
      }
      return KEY.Z; // Shoot
      
    case "find_ammo":
      // Find ammo pickup
      if (!data.targetAmmo) {
        let closestAmmo = null;
        let minDist = Infinity;
        
        for (const pickup of gameState.pickups) {
          if (pickup.type === "ammo") {
            const dist = distance(gameState.player, pickup);
            if (dist < minDist) {
              minDist = dist;
              closestAmmo = pickup;
            }
          }
        }
        
        data.targetAmmo = closestAmmo;
      }
      
      if (data.targetAmmo) {
        return moveTowards(gameState.player, data.targetAmmo);
      } else {
        // No ammo found, explore
        return [KEY.UP, KEY.DOWN, KEY.LEFT, KEY.RIGHT][Math.floor(Math.random() * 4)];
      }
      
      if (data.pickupTestDone) {
        data.phase = "test_complete";
      }
      break;
      
    case "test_complete":
      // Test is complete, just survive
      return getStickyKeysAction(gameState);
  }
  
  return KEY.Z; // Default action
}

// TEST_5: Test enemy AI behavior
function getTestEnemyAIAction(gameState) {
  if (!gameState.player) return null;
  
  // Initialize test data
  if (!gameState.testAIData) {
    gameState.testAIData = {
      phase: "find_enemy",
      targetEnemy: null,
      observationTime: 0,
      testStates: ["patrol", "chase", "attack", "cover"],
      currentTestState: 0,
      stateTestDone: false,
      waitTimer: 0,
      circleTimer: 0,
      stuckCounter: 0,
      lastPositions: []
    };
  }
  
  const data = gameState.testAIData;
  
  // Track positions to detect if stuck
  data.lastPositions.push({x: gameState.player.x, y: gameState.player.y});
  if (data.lastPositions.length > 15) {
    data.lastPositions.shift();
  }
  
  // Check if stuck
  if (data.lastPositions.length === 15) {
    const firstPos = data.lastPositions[0];
    const lastPos = data.lastPositions[14];
    const distance = Math.sqrt(
      Math.pow(lastPos.x - firstPos.x, 2) + 
      Math.pow(lastPos.y - firstPos.y, 2)
    );
    
    if (distance < 10) {
      data.stuckCounter++;
    } else {
      data.stuckCounter = 0;
    }
    
    // If stuck, use random movement
    if (data.stuckCounter > 10) {
      data.stuckCounter = 0;
      return [KEY.UP, KEY.DOWN, KEY.LEFT, KEY.RIGHT][Math.floor(Math.random() * 4)];
    }
  }
  
  // Test phases
  switch (data.phase) {
    case "find_enemy":
      // Find an enemy to test AI
      if (!data.targetEnemy || !gameState.enemies.includes(data.targetEnemy)) {
        let suitableEnemy = null;
        
        for (const enemy of gameState.enemies) {
          const dist = distance(gameState.player, enemy);
          if (dist > 300) { // Far enough to observe patrol behavior
            suitableEnemy = enemy;
            break;
          }
        }
        
        data.targetEnemy = suitableEnemy;
      }
      
      if (data.targetEnemy) {
        data.phase = "test_patrol";
        data.observationTime = 180; // 3 seconds
      } else {
        // No suitable enemy, explore
        return [KEY.UP, KEY.DOWN, KEY.LEFT, KEY.RIGHT][Math.floor(Math.random() * 4)];
      }
      break;
      
    case "test_patrol":
      // Observe enemy patrol behavior from a distance
      if (data.observationTime > 0) {
        data.observationTime--;
        return null; // Stand still
      } else {
        data.phase = "test_chase";
        data.observationTime = 180; // 3 seconds
      }
      break;
      
    case "test_chase":
      // Move closer to trigger chase behavior
      const dist = distance(gameState.player, data.targetEnemy);
      if (dist > 200) {
        return moveTowards(gameState.player, data.targetEnemy);
      } else {
        // Close enough, observe chase
        if (data.observationTime > 0) {
          data.observationTime--;
          
          // Circle around to maintain distance
          data.circleTimer = (data.circleTimer + 1) % 60;
          if (data.circleTimer < 15) return KEY.UP;
          if (data.circleTimer < 30) return KEY.RIGHT;
          if (data.circleTimer < 45) return KEY.DOWN;
          return KEY.LEFT;
        } else {
          data.phase = "test_attack";
          data.observationTime = 180; // 3 seconds
        }
      }
      break;
      
    case "test_attack":
      // Get even closer to trigger attack behavior
      const attackDist = distance(gameState.player, data.targetEnemy);
      if (attackDist > 100) {
        return moveTowards(gameState.player, data.targetEnemy);
      } else {
        // Close enough, observe attack
        if (data.observationTime > 0) {
          data.observationTime--;
          
          // Strafe to avoid getting hit too much
          data.circleTimer = (data.circleTimer + 1) % 60;
          if (data.circleTimer < 30) return KEY.LEFT;
          return KEY.RIGHT;
        } else {
          data.phase = "test_complete";
        }
      }
      break;
      
    case "test_complete":
      // Test is complete, just survive
      return getStickyKeysAction(gameState);
  }
  
  return KEY.Z; // Default action
}

// Helper functions
function distance(obj1, obj2) {
  return Math.sqrt(Math.pow(obj1.x - obj2.x, 2) + Math.pow(obj1.y - obj2.y, 2));
}

function moveTowards(player, target) {
  const dx = target.x - player.x;
  const dy = target.y - player.y;
  const angle = Math.atan2(dy, dx);
  
  // Determine the best direction to move
  const directions = [
    { key: KEY.RIGHT, angle: 0 },
    { key: KEY.UP, angle: -Math.PI/2 },
    { key: KEY.LEFT, angle: Math.PI },
    { key: KEY.DOWN, angle: Math.PI/2 }
  ];
  
  let bestDirection = directions[0];
  let smallestAngleDiff = Math.abs(normalizeAngle(angle - directions[0].angle));
  
  for (let i = 1; i < directions.length; i++) {
    const angleDiff = Math.abs(normalizeAngle(angle - directions[i].angle));
    if (angleDiff < smallestAngleDiff) {
      smallestAngleDiff = angleDiff;
      bestDirection = directions[i];
    }
  }
  
  return bestDirection.key;
}

function moveTowardsAndAttack(player, target) {
  const dist = distance(player, target);
  
  if (dist < 200) {
    // Close enough to shoot
    return KEY.Z;
  } else {
    return moveTowards(player, target);
  }
}

function normalizeAngle(angle) {
  while (angle < -Math.PI) angle += 2 * Math.PI;
  while (angle > Math.PI) angle -= 2 * Math.PI;
  return angle;
}

// Main testing controller
export function game_testing_controller(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getStickyKeysAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestDamageHealthAction(gameState);
    case "TEST_4":
      return getTestAmmoAction(gameState);
    case "TEST_5":
      return getTestEnemyAIAction(gameState);
    default:
      return getStickyKeysAction(gameState);
  }
}

// Expose the game_testing_controller function globally
window.game_testing_controller = game_testing_controller;
export default game_testing_controller;