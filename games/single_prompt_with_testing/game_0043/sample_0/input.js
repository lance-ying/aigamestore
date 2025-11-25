// input.js - Input handling

import { 
  gameState, 
  KEY_LEFT, KEY_UP, KEY_RIGHT, KEY_DOWN,
  KEY_SPACE, KEY_SHIFT, KEY_Z,
  KEY_ENTER, KEY_ESC, KEY_R,
  PHASE_START, PHASE_PLAYING, PHASE_PAUSED,
  PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE
} from './globals.js';

export function getPlayerInputs(p, automatedAction) {
  const inputs = {
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    sprint: false,
    interact: false
  };
  
  if (gameState.controlMode === "HUMAN") {
    inputs.left = p.keyIsDown(KEY_LEFT);
    inputs.right = p.keyIsDown(KEY_RIGHT);
    inputs.up = p.keyIsDown(KEY_UP);
    inputs.down = p.keyIsDown(KEY_DOWN);
    inputs.jump = p.keyIsDown(KEY_SPACE);
    inputs.sprint = p.keyIsDown(KEY_SHIFT);
    inputs.interact = p.keyIsDown(KEY_Z);
  } else {
    // Automated testing mode
    if (automatedAction) {
      inputs.left = automatedAction.left || false;
      inputs.right = automatedAction.right || false;
      inputs.up = automatedAction.up || false;
      inputs.down = automatedAction.down || false;
      inputs.jump = automatedAction.jump || false;
      inputs.sprint = automatedAction.sprint || false;
      inputs.interact = automatedAction.interact || false;
    }
  }
  
  return inputs;
}

export function handleKeyPress(p, key, keyCode) {
  const phase = gameState.gamePhase;
  
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase transitions
  if (keyCode === KEY_ENTER && phase === PHASE_START) {
    gameState.gamePhase = PHASE_PLAYING;
    p.logs.game_info.push({
      data: { phase: PHASE_PLAYING },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  if (keyCode === KEY_ESC && phase === PHASE_PLAYING) {
    gameState.gamePhase = PHASE_PAUSED;
    p.logs.game_info.push({
      data: { phase: PHASE_PAUSED },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else if (keyCode === KEY_ESC && phase === PHASE_PAUSED) {
    gameState.gamePhase = PHASE_PLAYING;
    p.logs.game_info.push({
      data: { phase: PHASE_PLAYING },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  if (keyCode === KEY_R && (phase === PHASE_GAME_OVER_WIN || phase === PHASE_GAME_OVER_LOSE)) {
    // Return to start screen
    gameState.gamePhase = PHASE_START;
    p.logs.game_info.push({
      data: { phase: PHASE_START, restart: true },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}