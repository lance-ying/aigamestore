// input.js - Input handling
import { gameState, GAME_PHASES } from './globals.js';
import { startGame, restartGame, togglePause, launchBird } from './gameLogic.js';
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
  
  console.log(`[INPUT] Key pressed: ${key} (code: ${keyCode})`);
  
  if (gameState.controlMode !== 'HUMAN') return;
  
  // START screen
  if (gameState.gamePhase === GAME_PHASES.START && keyCode === 13) { // ENTER
    console.log('[INPUT] Starting game from menu');
    startGame(p);
  }
  
  // GAME_OVER screen
  if ((gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
       gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) && keyCode === 82) { // R
    console.log('[INPUT] Restarting game');
    restartGame(p);
  }
  
  // PLAYING phase
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    // Pause
    if (keyCode === 27) { // ESC
      console.log('[INPUT] Toggling pause');
      togglePause(p);
    }
    
    // Slingshot aiming
    if (keyCode === 32 && !gameState.slingshotAiming && gameState.slingshotBird) { // SPACE
      console.log('[INPUT] Starting slingshot aim');
      gameState.slingshotAiming = true;
    }
    
    // Bird ability activation (tap space in flight)
    if (keyCode === 32 && gameState.birdInFlight && !gameState.slingshotAiming) {
      console.log('[INPUT] Activating bird ability');
      activateBirdAbility(p);
    }
    
    // Cycle birds
    if (keyCode === 65 && !gameState.slingshotAiming) { // A
      console.log('[INPUT] Cycling bird backward');
      cycleBird(-1, p);
    }
    if (keyCode === 68 && !gameState.slingshotAiming) { // D
      console.log('[INPUT] Cycling bird forward');
      cycleBird(1, p);
    }
  }
  
  // PAUSED phase
  if (gameState.gamePhase === GAME_PHASES.PAUSED && keyCode === 27) { // ESC
    console.log('[INPUT] Unpausing game');
    togglePause(p);
  }
  
  // Restart from playing
  if (gameState.gamePhase === GAME_PHASES.PLAYING && keyCode === 82) { // R
    console.log('[INPUT] Restarting from playing');
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
  
  console.log(`[INPUT] Key released: ${key} (code: ${keyCode})`);
  
  if (gameState.controlMode !== 'HUMAN') return;
  
  // Launch bird
  if (gameState.gamePhase === GAME_PHASES.PLAYING && keyCode === 32 && gameState.slingshotAiming) {
    console.log('[INPUT] Releasing slingshot - attempting to launch bird');
    console.log('[INPUT] Current bird:', gameState.slingshotBird);
    console.log('[INPUT] Aiming state:', gameState.slingshotAiming);
    
    try {
      gameState.slingshotAiming = false;
      launchBird(p);
      console.log('[INPUT] Launch command executed successfully');
    } catch (error) {
      console.error('[INPUT] ERROR launching bird:', error);
    }
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

function cycleBird(direction, p) {
  if (gameState.birds.length === 0) return;
  
  gameState.currentBirdIndex = (gameState.currentBirdIndex + direction + gameState.birds.length) % gameState.birds.length;
  
  if (gameState.slingshotBird && p) {
    import('./gameLogic.js').then(module => module.loadBirdInSlingshot(p));
  }
}

export function getKeysPressed() {
  return keysPressed;
}