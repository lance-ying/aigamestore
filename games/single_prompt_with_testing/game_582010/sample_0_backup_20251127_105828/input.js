/**
 * Input handling system
 */
import { gameState, GAME_PHASE, CONTROL_MODE, logInput, logGameEvent } from './globals.js';

// Key state tracking
const keys = {};

// Test mode state
let testModeTimer = 0;
let testModePhase = 0;

/**
 * Initialize input handlers
 */
export function initInput() {
  // Keydown handler
  document.addEventListener('keydown', (event) => {
    logInput('keydown', event.key, event.keyCode);
    keys[event.keyCode] = true;
    
    handleKeyDown(event.keyCode);
  });
  
  // Keyup handler
  document.addEventListener('keyup', (event) => {
    logInput('keyup', event.key, event.keyCode);
    keys[event.keyCode] = false;
  });
}

/**
 * Handle key down events
 */
function handleKeyDown(keyCode) {
  // Phase control keys
  if (keyCode === 13 && gameState.gamePhase === GAME_PHASE.START) { // ENTER
    startGame();
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASE.PLAYING) {
      gameState.gamePhase = GAME_PHASE.PAUSED;
      logGameEvent('pause');
    } else if (gameState.gamePhase === GAME_PHASE.PAUSED) {
      gameState.gamePhase = GAME_PHASE.PLAYING;
      logGameEvent('resume');
    }
  }
  
  if (keyCode === 82) { // R - Restart
    if (gameState.gamePhase === GAME_PHASE.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASE.GAME_OVER_LOSE ||
        gameState.gamePhase === GAME_PHASE.PAUSED) {
      restartGame();
    }
  }
}

/**
 * Update input state and handle continuous inputs
 */
export function updateInput(deltaTime) {
  if (gameState.controlMode === CONTROL_MODE.HUMAN) {
    updateHumanInput();
  } else if (gameState.controlMode === CONTROL_MODE.TEST_1) {
    updateTest1Input(deltaTime);
  } else if (gameState.controlMode === CONTROL_MODE.TEST_2) {
    updateTest2Input(deltaTime);
  }
}

/**
 * Update human player input
 */
function updateHumanInput() {
  if (gameState.gamePhase !== GAME_PHASE.PLAYING || !gameState.player) return;
  
  // Movement
  if (keys[87] || keys[38]) { // W or Up Arrow
    gameState.player.moveForward();
  }
  if (keys[83] || keys[40]) { // S or Down Arrow
    gameState.player.moveBackward();
  }
  if (keys[65] || keys[37]) { // A or Left Arrow
    gameState.player.strafeLeft();
  }
  if (keys[68] || keys[39]) { // D or Right Arrow
    gameState.player.strafeRight();
  }
  
  // Actions (trigger once per press)
  if (keys[32]) { // Space - Attack
    gameState.player.attack();
    keys[32] = false; // Prevent spam
  }
  if (keys[16]) { // Shift - Dodge
    gameState.player.dodge();
    keys[16] = false;
  }
  if (keys[90]) { // Z - Heal
    gameState.player.heal();
    keys[90] = false;
  }
}

/**
 * Test mode 1 - Basic testing: movement and exploration
 */
function updateTest1Input(deltaTime) {
  if (gameState.gamePhase !== GAME_PHASE.PLAYING || !gameState.player) return;
  
  testModeTimer += deltaTime;
  
  // Move in a pattern to explore and collect tracks
  const cycle = testModeTimer % 8;
  
  if (cycle < 2) {
    gameState.player.moveForward();
  } else if (cycle < 4) {
    gameState.player.strafeRight();
  } else if (cycle < 6) {
    gameState.player.moveBackward();
  } else {
    gameState.player.strafeLeft();
  }
  
  // Periodically test dodge
  if (Math.floor(testModeTimer) % 5 === 0 && testModeTimer % 1 < deltaTime) {
    gameState.player.dodge();
  }
}

/**
 * Test mode 2 - Win condition: aggressively hunt and defeat monster
 */
function updateTest2Input(deltaTime) {
  if (gameState.gamePhase !== GAME_PHASE.PLAYING || !gameState.player) return;
  
  testModeTimer += deltaTime;
  
  // Phase 0: Collect all tracks quickly
  if (testModePhase === 0) {
    if (gameState.tracksCollected >= 8) {
      testModePhase = 1;
    } else {
      // Move toward nearest track
      let nearestTrack = null;
      let nearestDist = Infinity;
      
      for (const track of gameState.tracks) {
        if (!track.collected) {
          const dist = track.mesh.position.distanceTo(gameState.player.mesh.position);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearestTrack = track;
          }
        }
      }
      
      if (nearestTrack) {
        const dx = nearestTrack.mesh.position.x - gameState.player.mesh.position.x;
        const dz = nearestTrack.mesh.position.z - gameState.player.mesh.position.z;
        
        if (Math.abs(dx) > Math.abs(dz)) {
          if (dx > 0) gameState.player.strafeRight();
          else gameState.player.strafeLeft();
        } else {
          if (dz < 0) gameState.player.moveForward();
          else gameState.player.moveBackward();
        }
      }
    }
  }
  
  // Phase 1: Hunt and attack monster
  if (testModePhase === 1 && gameState.monster && gameState.monsterRevealed) {
    const distToMonster = gameState.player.mesh.position.distanceTo(gameState.monster.mesh.position);
    
    if (distToMonster > 2.5) {
      // Move toward monster
      const dx = gameState.monster.mesh.position.x - gameState.player.mesh.position.x;
      const dz = gameState.monster.mesh.position.z - gameState.player.mesh.position.z;
      
      if (Math.abs(dx) > Math.abs(dz)) {
        if (dx > 0) gameState.player.strafeRight();
        else gameState.player.strafeLeft();
      } else {
        if (dz < 0) gameState.player.moveForward();
        else gameState.player.moveBackward();
      }
    } else {
      // Attack when in range
      gameState.player.attack();
    }
    
    // Heal when low health
    if (gameState.player.health < 40) {
      gameState.player.heal();
    }
    
    // Dodge periodically
    if (Math.floor(testModeTimer * 2) % 3 === 0 && testModeTimer % 0.5 < deltaTime) {
      gameState.player.dodge();
    }
  }
}

/**
 * Start the game
 */
function startGame() {
  gameState.gamePhase = GAME_PHASE.PLAYING;
  gameState.huntStartTime = Date.now();
  logGameEvent('game_start');
}

/**
 * Restart the game
 */
function restartGame() {
  // This will be handled by the main game loop
  gameState.gamePhase = GAME_PHASE.START;
  testModeTimer = 0;
  testModePhase = 0;
  logGameEvent('restart');
}

/**
 * Check if a key is currently pressed
 */
export function isKeyPressed(keyCode) {
  return keys[keyCode] === true;
}