import { gameState, GAME_PHASES } from './globals.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Game phase transitions
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame(p);
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      restartGame(p);
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: "Game paused",
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: "Game resumed",
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  // Gameplay controls (only in PLAYING phase)
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  if (keyCode === 32) { // SPACE - Toggle camera
    gameState.cameraOpen = !gameState.cameraOpen;
    gameState.cameraButtonHighlight = false;
  }
  
  if (keyCode === 90) { // Z - Toggle left door
    gameState.leftDoorClosed = !gameState.leftDoorClosed;
  }
  
  if (keyCode === 16) { // SHIFT - Toggle right door
    gameState.rightDoorClosed = !gameState.rightDoorClosed;
  }
  
  // Arrow keys
  if (gameState.cameraOpen) {
    // Switch cameras
    if (keyCode === 37) { // LEFT
      gameState.currentCamera = (gameState.currentCamera - 1 + 6) % 6;
    } else if (keyCode === 39) { // RIGHT
      gameState.currentCamera = (gameState.currentCamera + 1) % 6;
    } else if (keyCode === 38) { // UP
      gameState.currentCamera = Math.max(0, gameState.currentCamera - 3);
    } else if (keyCode === 40) { // DOWN
      gameState.currentCamera = Math.min(5, gameState.currentCamera + 3);
    }
  } else {
    // Hallway lights
    if (keyCode === 37) { // LEFT
      gameState.leftLightOn = true;
    } else if (keyCode === 39) { // RIGHT
      gameState.rightLightOn = true;
    }
  }
}

export function handleKeyReleased(p, key, keyCode) {
  // Turn off lights when keys released
  if (keyCode === 37) { // LEFT
    gameState.leftLightOn = false;
  } else if (keyCode === 39) { // RIGHT
    gameState.rightLightOn = false;
  }
}

function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  
  p.logs.game_info.push({
    data: `Night ${gameState.currentNight} started`,
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function restartGame(p) {
  // Check if advancing to next night or restarting
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN && gameState.currentNight < 5) {
    gameState.currentNight++;
  } else {
    gameState.currentNight = 1;
  }
  
  // Reset to start screen
  gameState.gamePhase = GAME_PHASES.START;
  gameState.currentHour = 0;
  gameState.timeProgress = 0;
  gameState.power = 100;
  gameState.cameraOpen = false;
  gameState.currentCamera = 0;
  gameState.leftDoorClosed = false;
  gameState.rightDoorClosed = false;
  gameState.leftLightOn = false;
  gameState.rightLightOn = false;
  gameState.jumpscareActive = false;
  gameState.jumpscareFrame = 0;
  gameState.jumpscareAnimatronic = null;
  
  // Recalculate power drain for new night
  gameState.powerDrainRate = 0.05;
  
  // Reset animatronics with increased difficulty
  const ANIMATRONICS = [
    { name: "Freddy", startLocation: 0, color: [139, 69, 19], aggression: 1 },
    { name: "Bonnie", startLocation: 0, color: [75, 0, 130], aggression: 1.2 },
    { name: "Chica", startLocation: 0, color: [255, 215, 0], aggression: 1.1 }
  ];
  
  gameState.animatronics = ANIMATRONICS.map(anim => ({
    name: anim.name,
    location: anim.startLocation,
    targetLocation: anim.startLocation,
    moveTimer: 0,
    moveDelay: 180 / (anim.aggression * gameState.currentNight),
    atLeftDoor: false,
    atRightDoor: false,
    color: anim.color,
    baseAggression: anim.aggression
  }));
  
  p.logs.game_info.push({
    data: `Restarted - Night ${gameState.currentNight}`,
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}