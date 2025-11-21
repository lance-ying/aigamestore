// gym_api.js - Gym API for reinforcement learning
// AUTO-GENERATED from template - game-specific customizations applied

{{GAME_IMPORTS}}

// Add RL control mode
export const CONTROL_RL = "RL";

// Store the current RL action to be executed
let rlAction = {{DEFAULT_ACTION}};

// Previous state for reward calculation
let previousState = {{INITIAL_PREVIOUS_STATE}};

// Frame counter for synchronization
let stepReady = true;

/**
 * Apply RL action to the player
 */
function applyRLAction() {
  {{ACTION_APPLICATION}}
}

/**
 * Calculate reward based on state changes
 */
function calculateReward() {
  let reward = 0;
  
  {{REWARD_CALCULATION}}
  
  return reward;
}

/**
 * Get normalized player state for observation
 * CRITICAL: Always returns an object with consistent shape, never null
 */
function getPlayerState() {
  {{GET_PLAYER_STATE}}
}

/**
 * Find nearest entity of a given type
 * CRITICAL: Always returns {x, y, distance} object, never null
 */
function findNearest(entities, getPosition) {
  // Always return default structure for consistency
  const defaultResult = {
    x: 0.5,
    y: 0.5,
    distance: 1.0,
  };
  
  {{FIND_NEAREST_PLAYER_CHECK}}
  
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
      
      {{DISTANCE_CALCULATION}}
      
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
    {{NORMALIZE_ENTITY_POSITION}}
    return nearest;
  }
  
  // Return default values when no entity found
  return defaultResult;
}

/**
 * Validate and normalize state to ensure consistent shape
 * CRITICAL: Ensures all fields exist and have correct types
 */
function validateState(state) {
  {{VALIDATE_STATE_IMPLEMENTATION}}
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
    {{RESET_IMPLEMENTATION}}
    
    return {
      done: false,
      reward: 0,
    };
  },
  
  /**
   * Execute one step with the given action
   * @param {number} action - Action index (0 to n-1, as defined in gym_config.json)
   * @returns {Object} {reward: number, done: boolean, info: Object}
   */
  step(action) {
    {{STEP_VALIDATE_ACTION}}
    
    {{STEP_CHECK_GAME_STATE}}
    
    // Apply the action and update game state
    applyRLAction();
    
    // Calculate reward based on state changes
    const reward = calculateReward();
    
    {{STEP_CHECK_DONE}}
    
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
    {{GET_STATE_IMPLEMENTATION}}
  },
  
  /**
   * Get debug information
   * @returns {Object} Current game state info
   */
  getInfo() {
    {{GET_INFO_IMPLEMENTATION}}
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
    {{IS_RL_MODE_CHECK}}
  },
};

// Expose API on window object
window.gymAPI = gymAPI;

// Also expose the control mode constant
window.CONTROL_RL = CONTROL_RL;

export default gymAPI;

