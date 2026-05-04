// gym_api.js - Gym API for reinforcement learning
// AUTO-GENERATED from template - game-specific customizations applied

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  KEY,
  resetGame,
} from './globals.js';
import { Player } from './entities.js';
import { generateLevel } from './level.js';

// Add RL control mode
export const CONTROL_RL = "RL";

// Store the current RL action to be executed
let rlAction = {
  up: false,
  down: false,
  left: false,
  right: false,
  shoot: false,
  sprint: false,
  crouch: false,
};

// Previous state for reward calculation
let previousState = {
  score: 0,
  health: 100,
  ammo: 30,
  enemiesKilled: 0,
  isAlive: true,
};

// Frame counter for synchronization
let stepReady = true;

/**
 * Apply RL action to the player
 */
function applyRLAction() {
  if (!gameState.player || !gameState.player.health || gameState.player.health <= 0) return;
  
  // The game loop will read rlAction via getRLKeys()
  // No direct application needed here
}

/**
 * Calculate reward based on state changes
 */
function calculateReward() {
  let reward = 0;
  
  const currentScore = gameState.score || 0;
  const currentHealth = gameState.player ? gameState.player.health : 0;
  const currentAmmo = gameState.player ? gameState.player.ammo : 0;
  const currentEnemiesKilled = gameState.enemiesKilled || 0;
  const currentIsAlive = gameState.player && gameState.player.health > 0;
  
  // 1. Score delta (primary reward)
  const scoreDelta = currentScore - previousState.score;
  reward += scoreDelta * 1.0;
  
  // 2. Kill enemy reward
  const killDelta = currentEnemiesKilled - previousState.enemiesKilled;
  reward += killDelta * 10.0;
  
  // 3. Survival reward
  if (currentIsAlive) {
    reward += 0.01;
  }
  
  // 4. Death penalty
  if (previousState.isAlive && !currentIsAlive) {
    reward -= 100.0;
  }
  
  // 5. Damage taken penalty
  const damageTaken = previousState.health - currentHealth;
  if (damageTaken > 0) {
    reward -= damageTaken * 1.0;
  }
  
  // 6. Mission complete bonus
  if (gameState.gamePhase === "GAME_OVER_WIN") {
    reward += 500.0;
  }
  
  // Update previous state
  previousState.score = currentScore;
  previousState.health = currentHealth;
  previousState.ammo = currentAmmo;
  previousState.enemiesKilled = currentEnemiesKilled;
  previousState.isAlive = currentIsAlive;
  
  return reward;
}

/**
 * Get normalized player state for observation
 * CRITICAL: Always returns an object with consistent shape, never null
 */
function getPlayerState() {
  if (!gameState.player || !gameState.player.health || gameState.player.health <= 0) {
    return {
      x: 0.5,
      y: 0.5,
      health: 0,
      ammo: 0,
      direction: 0,
      isSprinting: false,
      isCrouching: false,
      reloading: false,
    };
  }
  
  return {
    x: gameState.player.x / gameState.level.width,
    y: gameState.player.y / gameState.level.height,
    health: gameState.player.health / gameState.player.maxHealth,
    ammo: gameState.player.ammo / gameState.player.maxAmmo,
    direction: gameState.player.direction,
    isSprinting: gameState.player.isSprinting,
    isCrouching: gameState.player.isCrouching,
    reloading: gameState.player.reloading,
  };
}

/**
 * Find nearest entity of a given type
 * CRITICAL: Always returns {x, y, distance} object, never null
 */
function findNearest(entities, getPosition) {
  // Always return default structure for consistency
  const defaultResult = {
    x: 0,
    y: 0,
    distance: 1.0,
  };
  
  if (!gameState.player || !gameState.player.health || gameState.player.health <= 0) {
    return defaultResult;
  }
  
  let nearest = null;
  let minDist = Infinity;
  
  // Defensive: ensure entities is an array
  if (!entities || !Array.isArray(entities) || entities.length === 0) {
    return defaultResult;
  }
  
  for (let entity of entities) {
    try {
      const pos = getPosition(entity);
      if (!pos || typeof pos.x !== 'number' || typeof pos.y !== 'number') continue;
      
      const dx = pos.x - gameState.player.x;
      const dy = pos.y - gameState.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < minDist) {
        minDist = dist;
        nearest = { x: pos.x, y: pos.y, distance: dist };
      }
    } catch (e) {
      // Skip entities that cause errors
      continue;
    }
  }
  
  if (nearest) {
    // Normalize relative position
    nearest.x = (nearest.x - gameState.player.x) / gameState.level.width;
    nearest.y = (nearest.y - gameState.player.y) / gameState.level.height;
    // Normalize distance
    const maxDist = Math.sqrt(gameState.level.width * gameState.level.width + gameState.level.height * gameState.level.height);
    nearest.distance = nearest.distance / maxDist;
    return nearest;
  }
  
  // Return default values when no entity found
  return defaultResult;
}

/**
 * Find nearest N entities of a given type
 */
function findNearestN(entities, getPosition, n) {
  const results = [];
  const defaultResult = { x: 0, y: 0, distance: 1.0 };
  
  if (!gameState.player || !gameState.player.health || gameState.player.health <= 0) {
    for (let i = 0; i < n; i++) {
      results.push({ ...defaultResult });
    }
    return results;
  }
  
  if (!entities || !Array.isArray(entities) || entities.length === 0) {
    for (let i = 0; i < n; i++) {
      results.push({ ...defaultResult });
    }
    return results;
  }
  
  // Calculate distances for all entities
  const entitiesWithDist = [];
  for (let entity of entities) {
    try {
      const pos = getPosition(entity);
      if (!pos || typeof pos.x !== 'number' || typeof pos.y !== 'number') continue;
      
      const dx = pos.x - gameState.player.x;
      const dy = pos.y - gameState.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      entitiesWithDist.push({ entity, pos, distance: dist });
    } catch (e) {
      continue;
    }
  }
  
  // Sort by distance
  entitiesWithDist.sort((a, b) => a.distance - b.distance);
  
  // Take the nearest N
  for (let i = 0; i < n; i++) {
    if (i < entitiesWithDist.length) {
      const item = entitiesWithDist[i];
      // Normalize
      const relX = (item.pos.x - gameState.player.x) / gameState.level.width;
      const relY = (item.pos.y - gameState.player.y) / gameState.level.height;
      const maxDist = Math.sqrt(gameState.level.width * gameState.level.width + gameState.level.height * gameState.level.height);
      const normDist = item.distance / maxDist;
      
      results.push({
        x: relX,
        y: relY,
        distance: normDist,
        entity: item.entity,
      });
    } else {
      results.push({ ...defaultResult });
    }
  }
  
  return results;
}

/**
 * Get enemy type as number
 */
function getEnemyTypeNumber(enemy) {
  const typeMap = {
    'regular': 0,
    'elite': 1,
    'heavy': 2,
    'scout': 3,
    'sniper': 4,
    'tank': 5,
  };
  return typeMap[enemy.type] || 0;
}

/**
 * Validate and normalize state to ensure consistent shape
 * CRITICAL: Ensures all fields exist and have correct types
 */
function validateState(state) {
  // Ensure all required fields exist with correct structure
  const validatedState = {
    player: state.player || {x: 0.5, y: 0.5, health: 0, ammo: 0, direction: 0, isSprinting: false, isCrouching: false, reloading: false},
    nearestEnemy: state.nearestEnemy || {x: 0, y: 0, distance: 1.0, health: 0, type: 0},
    secondNearestEnemy: state.secondNearestEnemy || {x: 0, y: 0, distance: 1.0, health: 0, type: 0},
    thirdNearestEnemy: state.thirdNearestEnemy || {x: 0, y: 0, distance: 1.0, health: 0, type: 0},
    nearestHealth: state.nearestHealth || {x: 0, y: 0, distance: 1.0},
    nearestAmmo: state.nearestAmmo || {x: 0, y: 0, distance: 1.0},
    nearestObstacle: state.nearestObstacle || {x: 0, y: 0, distance: 1.0},
    mission: state.mission || {missionType: 0, enemiesKilled: 0, requiredKills: 0, extractionDistance: 1.0},
    game: state.game || {score: 0, level: 1, timeElapsed: 0},
  };
  
  // Ensure player object has all fields
  if (validatedState.player) {
    validatedState.player = {
      x: typeof validatedState.player.x === 'number' ? validatedState.player.x : 0.5,
      y: typeof validatedState.player.y === 'number' ? validatedState.player.y : 0.5,
      health: typeof validatedState.player.health === 'number' ? validatedState.player.health : 0,
      ammo: typeof validatedState.player.ammo === 'number' ? validatedState.player.ammo : 0,
      direction: typeof validatedState.player.direction === 'number' ? validatedState.player.direction : 0,
      isSprinting: typeof validatedState.player.isSprinting === 'boolean' ? validatedState.player.isSprinting : false,
      isCrouching: typeof validatedState.player.isCrouching === 'boolean' ? validatedState.player.isCrouching : false,
      reloading: typeof validatedState.player.reloading === 'boolean' ? validatedState.player.reloading : false,
    };
  }
  
  // Ensure enemy objects have all fields
  ['nearestEnemy', 'secondNearestEnemy', 'thirdNearestEnemy'].forEach(key => {
    if (validatedState[key]) {
      validatedState[key] = {
        x: typeof validatedState[key].x === 'number' ? validatedState[key].x : 0,
        y: typeof validatedState[key].y === 'number' ? validatedState[key].y : 0,
        distance: typeof validatedState[key].distance === 'number' ? validatedState[key].distance : 1.0,
        health: typeof validatedState[key].health === 'number' ? validatedState[key].health : 0,
        type: typeof validatedState[key].type === 'number' ? validatedState[key].type : 0,
      };
    }
  });
  
  // Ensure pickup/obstacle objects have all fields
  ['nearestHealth', 'nearestAmmo', 'nearestObstacle'].forEach(key => {
    if (validatedState[key]) {
      validatedState[key] = {
        x: typeof validatedState[key].x === 'number' ? validatedState[key].x : 0,
        y: typeof validatedState[key].y === 'number' ? validatedState[key].y : 0,
        distance: typeof validatedState[key].distance === 'number' ? validatedState[key].distance : 1.0,
      };
    }
  });
  
  // Ensure mission object has all fields
  if (validatedState.mission) {
    validatedState.mission = {
      missionType: typeof validatedState.mission.missionType === 'number' ? validatedState.mission.missionType : 0,
      enemiesKilled: typeof validatedState.mission.enemiesKilled === 'number' ? validatedState.mission.enemiesKilled : 0,
      requiredKills: typeof validatedState.mission.requiredKills === 'number' ? validatedState.mission.requiredKills : 0,
      extractionDistance: typeof validatedState.mission.extractionDistance === 'number' ? validatedState.mission.extractionDistance : 1.0,
    };
  }
  
  // Ensure game object has all fields
  if (validatedState.game) {
    validatedState.game = {
      score: typeof validatedState.game.score === 'number' ? validatedState.game.score : 0,
      level: typeof validatedState.game.level === 'number' ? validatedState.game.level : 1,
      timeElapsed: typeof validatedState.game.timeElapsed === 'number' ? validatedState.game.timeElapsed : 0,
    };
  }
  
  return validatedState;
}

/**
 * Gym API implementation
 */
const gymAPI = {
  /**
   * Reset the environment to initial state
   * @returns {Object} Initial observation with done=false, reward=0
   */
  reset() {
    // Set control mode to RL
    gameState.controlMode = CONTROL_RL;
    
    // Reset action
    rlAction = {
      up: false,
      down: false,
      left: false,
      right: false,
      shoot: false,
      sprint: false,
      crouch: false,
    };
    
    // Reset game
    resetGame();
    
    // Get p5 instance (try different possible references)
    const p5Instance = window.gameInstance || window.p5Instance;
    if (p5Instance) {
      generateLevel(p5Instance);
    } else {
      console.warn('p5 instance not found, using fallback');
      // Create a minimal mock p5 object for level generation
      const mockP5 = {
        random: (min, max) => {
          if (max === undefined) {
            return Math.random() * min;
          }
          return min + Math.random() * (max - min);
        },
        floor: Math.floor,
        dist: (x1, y1, x2, y2) => Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1)),
      };
      generateLevel(mockP5);
    }
    
    gameState.player = new Player(gameState.level.width / 2, gameState.level.height / 2);
    gameState.gamePhase = "PLAYING";
    
    // Initialize previous state
    previousState = {
      score: 0,
      health: gameState.player.health,
      ammo: gameState.player.ammo,
      enemiesKilled: 0,
      isAlive: true,
    };
    
    stepReady = true;
    
    return {
      done: false,
      reward: 0,
    };
  },
  
  /**
   * Execute one step with the given action
   * @param {Number} action - Discrete action (0-12)
   * @returns {Object} {reward: number, done: boolean, info: Object}
   */
  step(action) {
    // Convert discrete action to control object
    // Action mapping:
    // 0: no-op
    // 1: up
    // 2: down
    // 3: left
    // 4: right
    // 5: shoot
    // 6: up + shoot
    // 7: down + shoot
    // 8: left + shoot
    // 9: right + shoot
    // 10: sprint
    // 11: crouch
    // 12: up + sprint
    
    // Reset all actions
    rlAction = {
      up: false,
      down: false,
      left: false,
      right: false,
      shoot: false,
      sprint: false,
      crouch: false,
    };
    
    // Ensure action is a number
    const actionNum = typeof action === 'number' ? action : parseInt(action, 10);
    
    // Validate action range
    if (isNaN(actionNum) || actionNum < 0 || actionNum > 12) {
      console.warn('Invalid action:', action);
      // Default to no-op
    } else {
      // Apply the discrete action
      switch (actionNum) {
        case 0: // no-op
          break;
        case 1: // up
          rlAction.up = true;
          break;
        case 2: // down
          rlAction.down = true;
          break;
        case 3: // left
          rlAction.left = true;
          break;
        case 4: // right
          rlAction.right = true;
          break;
        case 5: // shoot
          rlAction.shoot = true;
          break;
        case 6: // up + shoot
          rlAction.up = true;
          rlAction.shoot = true;
          break;
        case 7: // down + shoot
          rlAction.down = true;
          rlAction.shoot = true;
          break;
        case 8: // left + shoot
          rlAction.left = true;
          rlAction.shoot = true;
          break;
        case 9: // right + shoot
          rlAction.right = true;
          rlAction.shoot = true;
          break;
        case 10: // sprint
          rlAction.sprint = true;
          break;
        case 11: // crouch
          rlAction.crouch = true;
          break;
        case 12: // up + sprint
          rlAction.up = true;
          rlAction.sprint = true;
          break;
      }
    }
    
    // Check if game is in playable state
    if (gameState.gamePhase !== "PLAYING") {
      return {
        reward: 0,
        done: true,
        info: this.getInfo(),
      };
    }
    
    // Apply the action and update game state
    applyRLAction();
    
    // Calculate reward based on state changes
    const reward = calculateReward();
    
    // Check if episode is done
    const isDone = gameState.gamePhase === "GAME_OVER_WIN" || 
                   gameState.gamePhase === "GAME_OVER_LOSE" ||
                   !gameState.player ||
                   gameState.player.health <= 0;
    
    return {
      reward: reward,
      done: isDone,
      info: this.getInfo(),
    };
  },
  
  /**
   * Get structured state observation
   * @returns {Object} Normalized state representation
   */
  getState() {
    const player = getPlayerState();
    
    // Find nearest enemies (with defensive checks)
    const enemies = gameState.enemies || [];
    const nearestEnemies = findNearestN(enemies, (e) => ({ x: e.x, y: e.y }), 3);
    
    const nearestEnemy = nearestEnemies[0] || { x: 0, y: 0, distance: 1.0 };
    const secondNearestEnemy = nearestEnemies[1] || { x: 0, y: 0, distance: 1.0 };
    const thirdNearestEnemy = nearestEnemies[2] || { x: 0, y: 0, distance: 1.0 };
    
    // Add health and type to enemies
    if (nearestEnemy.entity) {
      nearestEnemy.health = nearestEnemy.entity.health;
      nearestEnemy.type = getEnemyTypeNumber(nearestEnemy.entity);
      delete nearestEnemy.entity;
    } else {
      nearestEnemy.health = 0;
      nearestEnemy.type = 0;
    }
    
    if (secondNearestEnemy.entity) {
      secondNearestEnemy.health = secondNearestEnemy.entity.health;
      secondNearestEnemy.type = getEnemyTypeNumber(secondNearestEnemy.entity);
      delete secondNearestEnemy.entity;
    } else {
      secondNearestEnemy.health = 0;
      secondNearestEnemy.type = 0;
    }
    
    if (thirdNearestEnemy.entity) {
      thirdNearestEnemy.health = thirdNearestEnemy.entity.health;
      thirdNearestEnemy.type = getEnemyTypeNumber(thirdNearestEnemy.entity);
      delete thirdNearestEnemy.entity;
    } else {
      thirdNearestEnemy.health = 0;
      thirdNearestEnemy.type = 0;
    }
    
    // Find nearest health pickup (with defensive checks)
    const pickups = gameState.pickups || [];
    const healthPickups = pickups.filter(p => p.type === "health");
    const nearestHealth = findNearest(healthPickups, (p) => ({ x: p.x, y: p.y }));
    
    // Find nearest ammo pickup (with defensive checks)
    const ammoPickups = pickups.filter(p => p.type === "ammo");
    const nearestAmmo = findNearest(ammoPickups, (p) => ({ x: p.x, y: p.y }));
    
    // Find nearest obstacle (with defensive checks)
    const obstacles = gameState.obstacles || [];
    const nearestObstacle = findNearest(
      obstacles,
      (o) => ({
        x: o.x + o.width / 2,
        y: o.y + o.height / 2,
      })
    );
    
    // Mission state
    const missionType = gameState.mission === "elimination" ? 0 : 1;
    const extractionDistance = gameState.extractionPointObj && gameState.player ? 
      Math.sqrt(
        Math.pow(gameState.extractionPoint.x - gameState.player.x, 2) +
        Math.pow(gameState.extractionPoint.y - gameState.player.y, 2)
      ) / Math.sqrt(gameState.level.width * gameState.level.width + gameState.level.height * gameState.level.height) : 1.0;
    
    const mission = {
      missionType: missionType,
      enemiesKilled: gameState.enemiesKilled || 0,
      requiredKills: gameState.requiredKills || 0,
      extractionDistance: extractionDistance,
    };
    
    // Game state
    const game = {
      score: gameState.score || 0,
      level: gameState.currentLevel || 1,
      timeElapsed: gameState.timeElapsed || 0,
    };
    
    const state = {
      player: player,
      nearestEnemy: nearestEnemy,
      secondNearestEnemy: secondNearestEnemy,
      thirdNearestEnemy: thirdNearestEnemy,
      nearestHealth: nearestHealth,
      nearestAmmo: nearestAmmo,
      nearestObstacle: nearestObstacle,
      mission: mission,
      game: game,
    };
    
    // Validate and normalize state to ensure consistent shape
    return validateState(state);
  },
  
  /**
   * Get debug information
   * @returns {Object} Current game state info
   */
  getInfo() {
    return {
      phase: gameState.gamePhase,
      level: gameState.currentLevel,
      score: gameState.score,
      playerHealth: gameState.player ? gameState.player.health : 0,
      playerAmmo: gameState.player ? gameState.player.ammo : 0,
      enemyCount: gameState.enemies.length,
      enemiesKilled: gameState.enemiesKilled,
      requiredKills: gameState.requiredKills,
      mission: gameState.mission,
      timeElapsed: gameState.timeElapsed,
    };
  },
  
  /**
   * Get the current RL action (for game loop to read)
   */
  getRLAction() {
    return rlAction;
  },
  
  /**
   * Get the current RL keys (for game loop to read)
   * This is what game.js expects
   */
  getRLKeys() {
    return rlAction;
  },
  
  /**
   * Check if control mode is RL
   */
  isRLMode() {
    return gameState.controlMode === CONTROL_RL;
  },
};

// Expose API on window object
window.gymAPI = gymAPI;

// Also expose the control mode constant
window.CONTROL_RL = CONTROL_RL;

export default gymAPI;