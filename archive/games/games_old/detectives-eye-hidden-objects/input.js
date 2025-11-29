import { gameState, GAME_PHASES, LEVELS } from './globals.js';
import { startGame, restartGame, pauseGame, unpauseGame, nextLevel } from './gameLogic.js';

export function handleKeyPressed(p, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // ENTER - Start game
  if (keyCode === 13) {
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame(p);
    } else if (gameState.gamePhase === GAME_PHASES.LEVEL_COMPLETE) {
      nextLevel(p);
    }
  }
  
  // R - Restart
  if (keyCode === 82) {
    restartGame(p);
  }
  
  // ESC - Pause/Unpause
  if (keyCode === 27) {
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      pauseGame(p);
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      unpauseGame(p);
    }
  }
  
  // Gameplay controls (only during PLAYING phase)
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    // SPACE - Use hint
    if (keyCode === 32) {
      useHint(p);
    }
    
    // Z - Zoom in
    if (keyCode === 90) {
      zoomIn();
    }
    
    // SHIFT - Zoom out
    if (keyCode === 16) {
      zoomOut();
    }
  }
}

export function handleKeyHeld(p) {
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    // Arrow keys - Pan camera
    if (p.keyIsDown(37)) { // LEFT
      gameState.panOffsetX += 5;
      constrainPan();
    }
    if (p.keyIsDown(39)) { // RIGHT
      gameState.panOffsetX -= 5;
      constrainPan();
    }
    if (p.keyIsDown(38)) { // UP
      gameState.panOffsetY += 5;
      constrainPan();
    }
    if (p.keyIsDown(40)) { // DOWN
      gameState.panOffsetY -= 5;
      constrainPan();
    }
  }
}

function zoomIn() {
  const level = LEVELS[gameState.currentLevelIndex];
  gameState.currentZoomLevel = Math.min(gameState.currentZoomLevel + 0.1, level.maxZoom);
  constrainPan();
}

function zoomOut() {
  gameState.currentZoomLevel = Math.max(gameState.currentZoomLevel - 0.1, 1.0);
  
  // Reset pan when fully zoomed out
  if (gameState.currentZoomLevel === 1.0) {
    gameState.panOffsetX = 0;
    gameState.panOffsetY = 0;
  }
  
  constrainPan();
}

function constrainPan() {
  // Constrain pan to keep scene visible
  const maxPanX = Math.max(0, (600 * gameState.currentZoomLevel - 600) / 2);
  const maxPanY = Math.max(0, (400 * gameState.currentZoomLevel - 400) / 2);
  
  gameState.panOffsetX = Math.max(-maxPanX, Math.min(maxPanX, gameState.panOffsetX));
  gameState.panOffsetY = Math.max(-maxPanY, Math.min(maxPanY, gameState.panOffsetY));
}

function useHint(p) {
  if (gameState.remainingHints > 0 && gameState.objectsToFind.length > 0) {
    gameState.remainingHints--;
    
    // Find a random unfound object
    const unfoundObjects = LEVELS[gameState.currentLevelIndex].objects.filter(
      obj => !gameState.foundObjects.includes(obj.name)
    );
    
    if (unfoundObjects.length > 0) {
      const randomObj = unfoundObjects[Math.floor(Math.random() * unfoundObjects.length)];
      
      gameState.hintFeedback = {
        x: randomObj.x,
        y: randomObj.y,
        frameCount: p.frameCount,
        objectName: randomObj.name
      };
    }
  }
}