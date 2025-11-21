// input.js - Input handling and test automation
import { gameState, GAME_PHASES, SHOT_TYPES } from './globals.js';

export function handleKeyPressed(p) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase controls
  if (p.keyCode === 13 && gameState.gamePhase === GAME_PHASES.START) { // ENTER
    gameState.gamePhase = GAME_PHASES.PLAYING;
    p.logs.game_info.push({
      data: { gamePhase: GAME_PHASES.PLAYING },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return false;
  }
  
  if (p.keyCode === 27) { // ESC - Pause/Unpause
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { gamePhase: GAME_PHASES.PAUSED },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { gamePhase: GAME_PHASES.PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return false;
  }
  
  if (p.keyCode === 82) { // R - Restart
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN ||
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      resetGame(p);
      gameState.gamePhase = GAME_PHASES.START;
      p.logs.game_info.push({
        data: { gamePhase: GAME_PHASES.START },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return false;
  }
  
  // Gameplay controls (only during PLAYING phase)
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    handleGameplayInput(p);
  }
  
  return false;
}

function handleGameplayInput(p) {
  if (!gameState.ballInPlay) return;
  
  const isPowerShot = p.keyIsDown(16); // Shift
  gameState.isPowerShot = isPowerShot;
  
  // Front foot (W or Up Arrow)
  if (p.keyCode === 87 || p.keyCode === 38) {
    prepareShot(SHOT_TYPES.FRONT_FOOT, isPowerShot);
  }
  
  // Back foot (S or Down Arrow)
  if (p.keyCode === 83 || p.keyCode === 40) {
    prepareShot(SHOT_TYPES.BACK_FOOT, isPowerShot);
  }
  
  // Off side (A or Left Arrow)
  if (p.keyCode === 65 || p.keyCode === 37) {
    prepareShot(SHOT_TYPES.OFF_SIDE, isPowerShot);
  }
  
  // On side (D or Right Arrow)
  if (p.keyCode === 68 || p.keyCode === 39) {
    prepareShot(SHOT_TYPES.ON_SIDE, isPowerShot);
  }
  
  // Defensive (Space)
  if (p.keyCode === 32) {
    prepareShot(SHOT_TYPES.DEFENSIVE, false);
  }
  
  // Late cut (Z)
  if (p.keyCode === 90) {
    prepareShot(SHOT_TYPES.LATE_CUT, isPowerShot);
  }
}

function prepareShot(shotType, isPowerShot) {
  if (!gameState.player) return;
  
  gameState.shotPrepared = true;
  gameState.shotType = shotType;
  gameState.isPowerShot = isPowerShot;
  gameState.shotTiming = Date.now();
  
  gameState.player.executeShot(shotType, isPowerShot);
}

export function updateTestAutomation(p) {
  if (gameState.controlMode === "HUMAN") return;
  
  // Test delay counter
  if (gameState.testDelay > 0) {
    gameState.testDelay--;
    return;
  }
  
  // Initialize test sequences
  if (gameState.testSequence.length === 0) {
    initializeTestSequence();
  }
  
  // Execute test sequence
  if (gameState.testIndex < gameState.testSequence.length) {
    const action = gameState.testSequence[gameState.testIndex];
    executeTestAction(p, action);
    gameState.testIndex++;
    gameState.testDelay = action.delay || 60;
  }
}

function initializeTestSequence() {
  if (gameState.controlMode === "TEST_1") {
    // Basic testing - variety of shots
    gameState.testSequence = [
      { type: "start", delay: 30 },
      { type: "shot", shotType: SHOT_TYPES.FRONT_FOOT, delay: 90 },
      { type: "shot", shotType: SHOT_TYPES.BACK_FOOT, delay: 90 },
      { type: "shot", shotType: SHOT_TYPES.OFF_SIDE, delay: 90 },
      { type: "shot", shotType: SHOT_TYPES.ON_SIDE, delay: 90 },
      { type: "shot", shotType: SHOT_TYPES.DEFENSIVE, delay: 90 },
      { type: "shot", shotType: SHOT_TYPES.LATE_CUT, delay: 90 },
      { type: "shot", shotType: SHOT_TYPES.FRONT_FOOT, power: true, delay: 90 },
      { type: "shot", shotType: SHOT_TYPES.BACK_FOOT, power: true, delay: 90 }
    ];
    
    // Repeat for more balls
    const baseSequence = [...gameState.testSequence];
    for (let i = 0; i < 3; i++) {
      gameState.testSequence.push(...baseSequence.map(s => ({...s})));
    }
  } else if (gameState.controlMode === "TEST_2") {
    // Win test - optimal shots
    gameState.testSequence = [
      { type: "start", delay: 30 }
    ];
    
    // Generate winning shots
    for (let i = 0; i < 15; i++) {
      gameState.testSequence.push({
        type: "shot",
        shotType: SHOT_TYPES.FRONT_FOOT,
        power: true,
        delay: 80
      });
    }
  }
}

function executeTestAction(p, action) {
  if (action.type === "start") {
    if (gameState.gamePhase === GAME_PHASES.START) {
      // Simulate ENTER key
      p.keyCode = 13;
      handleKeyPressed(p);
    }
  } else if (action.type === "shot") {
    if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.ballInPlay) {
      prepareShot(action.shotType, action.power || false);
    }
  }
}

function resetGame(p) {
  // Clear entities
  gameState.entities.forEach(entity => {
    if (entity.body) {
      Matter.World.remove(gameState.world, entity.body);
    }
  });
  
  gameState.entities = [];
  gameState.player = null;
  gameState.ball = null;
  gameState.bowler = null;
  gameState.fieldZones = [];
  gameState.particles = [];
  
  // Reset stats
  gameState.score = 0;
  gameState.wickets = 10;
  gameState.ballsPlayed = 0;
  gameState.ballInPlay = false;
  gameState.ballDelivered = false;
  gameState.shotPrepared = false;
  gameState.shotType = null;
  gameState.deliveryType = null;
  
  // Reset test automation
  gameState.testSequence = [];
  gameState.testIndex = 0;
  gameState.testDelay = 0;
}

// Expose reset function
export { resetGame };