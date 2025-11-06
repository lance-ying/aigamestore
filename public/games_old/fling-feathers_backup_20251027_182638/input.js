// input.js - Input handling
import { gameState, GAME_PHASES } from './globals.js';
import { startGame, restartGame, togglePause } from './gameLogic.js';
import { activateBirdAbility } from './abilities.js';

let keysPressed = {};

export function handleKeyPressed(p, key, keyCode) {
  keysPressed[keyCode] = true;
  
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  if (gameState.controlMode !== 'HUMAN') return;
  
  // START screen
  if (gameState.gamePhase === GAME_PHASES.START && keyCode === 13) { // ENTER
    startGame(p);
  }
  
  // GAME_OVER screen
  if ((gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
       gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) && keyCode === 82) { // R
    restartGame(p);
  }
  
  // PLAYING phase
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    // Pause
    if (keyCode === 27) { // ESC
      togglePause(p);
    }
    
    // Slingshot aiming
    if (keyCode === 32 && !gameState.slingshotAiming && gameState.slingshotBird) { // SPACE
      gameState.slingshotAiming = true;
    }
    
    // Bird ability activation (tap space in flight)
    if (keyCode === 32 && gameState.birdInFlight && !gameState.slingshotAiming) {
      activateBirdAbility(p);
    }
    
    // Cycle birds
    if (keyCode === 65 && !gameState.slingshotAiming) { // A
      cycleBird(-1);
    }
    if (keyCode === 68 && !gameState.slingshotAiming) { // D
      cycleBird(1);
    }
  }
  
  // PAUSED phase
  if (gameState.gamePhase === GAME_PHASES.PAUSED && keyCode === 27) { // ESC
    togglePause(p);
  }
  
  // Restart from playing
  if (gameState.gamePhase === GAME_PHASES.PLAYING && keyCode === 82) { // R
    restartGame(p);
  }
}

export function handleKeyReleased(p, key, keyCode) {
  keysPressed[keyCode] = false;
  
  p.logs.inputs.push({
    input_type: 'keyReleased',
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  if (gameState.controlMode !== 'HUMAN') return;
  
  // Launch bird
  if (gameState.gamePhase === GAME_PHASES.PLAYING && keyCode === 32 && gameState.slingshotAiming) {
    gameState.slingshotAiming = false;
    import('./gameLogic.js').then(module => module.launchBird(p));
  }
}

export function updateSlingshotAiming(p) {
  if (!gameState.slingshotAiming || !gameState.slingshotBird) return;
  
  const angleSpeed = 0.03;
  const distanceSpeed = 2;
  
  // Arrow keys for aiming
  if (p.keyIsDown(38)) { // UP
    gameState.slingshotPullAngle -= angleSpeed;
  }
  if (p.keyIsDown(40)) { // DOWN
    gameState.slingshotPullAngle += angleSpeed;
  }
  if (p.keyIsDown(37)) { // LEFT - increase power
    gameState.slingshotPullDistance = Math.min(gameState.slingshotPullDistance + distanceSpeed, gameState.maxPullDistance);
  }
  if (p.keyIsDown(39)) { // RIGHT - decrease power
    gameState.slingshotPullDistance = Math.max(gameState.slingshotPullDistance - distanceSpeed, 0);
  }
  
  // Clamp angle
  gameState.slingshotPullAngle = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, gameState.slingshotPullAngle));
}

function cycleBird(direction) {
  if (gameState.birds.length === 0) return;
  
  gameState.currentBirdIndex = (gameState.currentBirdIndex + direction + gameState.birds.length) % gameState.birds.length;
  
  if (gameState.slingshotBird) {
    import('./gameLogic.js').then(module => module.loadBirdInSlingshot(null));
  }
}

export function getKeysPressed() {
  return keysPressed;
}