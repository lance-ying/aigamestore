// gym_api.js - Gym API for reinforcement learning

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  PHASE_PLAYING,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  LEVEL_CONFIGS,
  BOOST_COST,
  PELLET_VALUE,
  MASS_VALUE,
} from './globals.js';

// Add RL control mode
export const CONTROL_RL = "RL";

// Store the current RL action to be executed
let rlAction = { left: false, right: false, boost: false };

// Previous state for reward calculation
let previousState = {
  score: 0,
  length: 0,
  isAlive: true,
};

// Frame counter for synchronization
let stepReady = true;

/**
 * Apply RL action to the player snake
 */
function applyRLAction() {
  if (!gameState.player || !gameState.player.isAlive) return;
  
  // Apply turning
  if (rlAction.left) {
    gameState.player.turnLeft();
  }
  if (rlAction.right) {
    gameState.player.turnRight();
  }
  
  // Apply boost
  if (rlAction.boost) {
    if (gameState.player.activateBoost()) {
      // Import spawnMassDrops from spawner
      const ejected = gameState.player.ejectMass(BOOST_COST);
      // We need to access the spawner, but we'll handle this through game logic
      // The game already handles mass ejection in handlePlayerInput
    }
  } else {
    gameState.player.deactivateBoost();
  }
}

/**
 * Calculate reward based on state changes
 */
function calculateReward() {
  let reward = 0;
  
  const currentScore = gameState.score;
  const currentLength = gameState.player ? gameState.player.getLength() : 0;
  const currentIsAlive = gameState.player ? gameState.player.isAlive : false;
  
  // 1. Score delta (primary reward)
  const scoreDelta = currentScore - previousState.score;
  reward += scoreDelta; // Direct score increase
  
  // 2. Length increase (secondary reward)
  const lengthDelta = currentLength - previousState.length;
  if (lengthDelta > 0) {
    reward += lengthDelta * 0.1; // Small bonus for growing
  }
  
  // 3. Survival bonus (tertiary reward)
  if (currentIsAlive) {
    reward += 0.01; // Small reward for staying alive each frame
  }
  
  // 4. Death penalty
  if (previousState.isAlive && !currentIsAlive) {
    reward -= 100; // Large penalty for dying
  }
  
  // 5. Boost cost penalty (to discourage wasteful boosting)
  if (rlAction.boost && currentIsAlive) {
    reward -= 0.5; // Small penalty for boost usage
  }
  
  // Update previous state
  previousState.score = currentScore;
  previousState.length = currentLength;
  previousState.isAlive = currentIsAlive;
  
  return reward;
}

/**
 * Get normalized player state for observation
 */
function getPlayerState() {
  if (!gameState.player || !gameState.player.isAlive) {
    // Return default state when dead (same shape as alive state)
    return {
      x: 0.5,
      y: 0.5,
      angle: 0,
      length: 0,
      speed: 0,
      isBoosting: false,
    };
  }
  
  const head = gameState.player.getHead();
  const angle = Math.atan2(gameState.player.direction.y, gameState.player.direction.x);
  
  return {
    x: head.x / CANVAS_WIDTH, // Normalized to [0, 1]
    y: head.y / CANVAS_HEIGHT, // Normalized to [0, 1]
    angle: angle, // Radians
    length: gameState.player.getLength(),
    speed: gameState.player.speed,
    isBoosting: gameState.player.isBoosting,
  };
}

/**
 * Find nearest entity of a given type
 */
function findNearest(entities, getPosition) {
  // Always return default structure for consistency
  const defaultResult = {
    x: 0.5,
    y: 0.5,
    distance: 1.0,
  };
  
  if (!gameState.player || !gameState.player.isAlive) {
    return defaultResult;
  }
  
  const head = gameState.player.getHead();
  if (!head) {
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
      
      // Handle wrapping for distance calculation
      let dx = pos.x - head.x;
      let dy = pos.y - head.y;
      
      // Shortest distance considering wrapping
      if (Math.abs(dx) > CANVAS_WIDTH / 2) {
        dx = dx > 0 ? dx - CANVAS_WIDTH : dx + CANVAS_WIDTH;
      }
      if (Math.abs(dy) > CANVAS_HEIGHT / 2) {
        dy = dy > 0 ? dy - CANVAS_HEIGHT : dy + CANVAS_HEIGHT;
      }
      
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
    // Normalize coordinates
    nearest.x = nearest.x / CANVAS_WIDTH;
    nearest.y = nearest.y / CANVAS_HEIGHT;
    // Normalize distance (max possible distance in wrapped space)
    const maxDist = Math.sqrt(Math.pow(CANVAS_WIDTH / 2, 2) + Math.pow(CANVAS_HEIGHT / 2, 2));
    nearest.distance = nearest.distance / maxDist;
    return nearest;
  }
  
  // Return default values when no entity found
  return defaultResult;
}

/**
 * Validate and normalize state to ensure consistent shape
 */
function validateState(state) {
  // Ensure all required fields exist with correct structure
  const validatedState = {
    player: state.player || {x: 0.5, y: 0.5, angle: 0, length: 0, speed: 0, isBoosting: false},
    nearestPellet: state.nearestPellet || {x: 0.5, y: 0.5, distance: 1.0},
    nearestEnemy: state.nearestEnemy || {x: 0.5, y: 0.5, distance: 1.0},
    nearestObstacle: state.nearestObstacle || {x: 0.5, y: 0.5, distance: 1.0},
    level: typeof state.level === 'number' ? state.level : 1,
    score: typeof state.score === 'number' ? state.score : 0,
    targetLength: typeof state.targetLength === 'number' ? state.targetLength : 10,
  };
  
  // Ensure player object has all fields
  if (validatedState.player) {
    validatedState.player = {
      x: typeof validatedState.player.x === 'number' ? validatedState.player.x : 0.5,
      y: typeof validatedState.player.y === 'number' ? validatedState.player.y : 0.5,
      angle: typeof validatedState.player.angle === 'number' ? validatedState.player.angle : 0,
      length: typeof validatedState.player.length === 'number' ? validatedState.player.length : 0,
      speed: typeof validatedState.player.speed === 'number' ? validatedState.player.speed : 0,
      isBoosting: typeof validatedState.player.isBoosting === 'boolean' ? validatedState.player.isBoosting : false,
    };
  }
  
  // Ensure entity objects have all fields
  ['nearestPellet', 'nearestEnemy', 'nearestObstacle'].forEach(key => {
    if (validatedState[key]) {
      validatedState[key] = {
        x: typeof validatedState[key].x === 'number' ? validatedState[key].x : 0.5,
        y: typeof validatedState[key].y === 'number' ? validatedState[key].y : 0.5,
        distance: typeof validatedState[key].distance === 'number' ? validatedState[key].distance : 1.0,
      };
    }
  });
  
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
    rlAction = { left: false, right: false, boost: false };

    // Initialize level 1 using exposed function
    if (typeof window.initializeGameLevel === 'function') {
      window.initializeGameLevel(1);
    } else {
      console.error('window.initializeGameLevel not found!');
      // Fallback: directly set game phase
      gameState.gamePhase = PHASE_PLAYING;
      gameState.currentLevel = 1;
      gameState.score = 0;
    }

    // Initialize previous state
    previousState = {
      score: gameState.score || 0,
      length: gameState.player ? gameState.player.getLength() : 0,
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
   * @param {Object} action - {left: bool, right: bool, boost: bool}
   * @returns {Object} {reward: number, done: boolean, info: Object}
   */
  step(action) {
    // Validate action
    if (!action || typeof action !== 'object') {
      action = { left: false, right: false, boost: false };
    }
    
    // Store action for game loop to use
    rlAction = {
      left: !!action.left,
      right: !!action.right,
      boost: !!action.boost,
    };
    
    // Check if game is in playable state
    if (gameState.gamePhase !== PHASE_PLAYING) {
      return {
        reward: 0,
        done: true,
        info: this.getInfo(),
      };
    }
    
    // Apply the action and update game state
    applyRLAction();
    
    // Manually trigger one game update
    // We need to call the updateGame function
    // Since it's private, we need to trigger it through the game loop
    // For now, we'll assume the game loop calls updateGame
    
    // Actually, we should call updateGame directly here
    // But it's not exported... we need to refactor
    
    // For the API to work, we need to either:
    // 1. Export updateGame from game.js
    // 2. Trigger a single frame update
    // 3. Manually replicate the update logic
    
    // Let's assume we can access it through window or import
    // For now, I'll structure the API assuming we can trigger updates
    
    // Calculate reward based on state changes
    const reward = calculateReward();
    
    // Check if episode is done
    const isDone = gameState.gamePhase === PHASE_GAME_OVER_WIN || 
                   gameState.gamePhase === PHASE_GAME_OVER_LOSE ||
                   !gameState.player ||
                   !gameState.player.isAlive;
    
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
    
    // Find nearest pellet (with defensive checks)
    const pellets = gameState.pellets || [];
    const massDrops = gameState.massDrops || [];
    const allFood = [...pellets, ...massDrops];
    const nearestPellet = findNearest(allFood, (f) => f.pos);
    
    // Find nearest enemy snake (with defensive checks)
    const aiSnakes = gameState.aiSnakes || [];
    const nearestEnemy = findNearest(
      aiSnakes.filter(s => s.isAlive),
      (s) => s.getHead()
    );
    
    // Find nearest obstacle (with defensive checks)
    const obstacles = gameState.obstacles || [];
    const nearestObstacle = findNearest(
      obstacles,
      (o) => {
        const bounds = o.getBounds();
        return {
          x: bounds.x + bounds.width / 2,
          y: bounds.y + bounds.height / 2,
        };
      }
    );
    
    const config = LEVEL_CONFIGS[gameState.currentLevel] || LEVEL_CONFIGS[1];
    
    const state = {
      player: player,
      nearestPellet: nearestPellet,
      nearestEnemy: nearestEnemy,
      nearestObstacle: nearestObstacle,
      level: gameState.currentLevel || 1,
      score: gameState.score || 0,
      targetLength: config ? config.targetLength : 10,
    };
    
    // Validate and normalize state to ensure consistent shape
    return validateState(state);
  },
  
  /**
   * Get debug information
   * @returns {Object} Current game state info
   */
  getInfo() {
    const config = LEVEL_CONFIGS[gameState.currentLevel] || LEVEL_CONFIGS[1];
    
    return {
      phase: gameState.gamePhase,
      level: gameState.currentLevel,
      score: gameState.score,
      playerLength: gameState.player ? gameState.player.getLength() : 0,
      targetLength: config.targetLength,
      aiSnakeCount: gameState.aiSnakes.filter(s => s.isAlive).length,
      pelletCount: gameState.pellets.length,
    };
  },
  
  /**
   * Get the current RL action (for game loop to read)
   */
  getRLAction() {
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