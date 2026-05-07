import { gameState, GAME_PHASES, GRID_SIZE } from './globals.js';
import { LEVELS } from './levels.js';
import { Vehicle } from './vehicle.js';

// Track which keys have been processed in current press cycle
const keysProcessed = {};

export function setupInputHandlers(p) {
  p.keyPressed = function() {
    // Prevent processing same key multiple times while held (OS key repeat)
    if (keysProcessed[p.keyCode]) {
      return false; // Key already processed, ignore repeat
    }
    
    // Mark this key as processed
    keysProcessed[p.keyCode] = true;
    
    const input = {
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    };
    p.logs.inputs.push(input);

    // Global controls
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === GAME_PHASES.START) {
        startGame();
      }
    } else if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        logGameInfo(p, "Game paused");
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        logGameInfo(p, "Game resumed");
      }
    } else if (p.keyCode === 82) { // R
      resetGame(p);
    }

    // Gameplay controls
    if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.controlMode === "HUMAN") {
      handleGameplayInput(p, p.keyCode);
    }
    
    return false; // Prevent default browser behavior
  };
  
  // Reset key processed state when key is released
  p.keyReleased = function() {
    keysProcessed[p.keyCode] = false;
    return false;
  };
}

function handleGameplayInput(p, keyCode) {
  const vehicles = gameState.entities;
  
  if (keyCode === 32) { // SPACE
    if (!gameState.isGrabbing) {
      // Try to grab vehicle under cursor
      const vehicleUnderCursor = getVehicleAtCursor();
      if (vehicleUnderCursor !== null) {
        gameState.selectedVehicle = vehicleUnderCursor;
        gameState.isGrabbing = true;
        vehicles[vehicleUnderCursor].grabbed = true;
        vehicles[vehicleUnderCursor].selected = true;
      }
    } else {
      // Release grabbed vehicle
      if (gameState.selectedVehicle !== null) {
        vehicles[gameState.selectedVehicle].grabbed = false;
        vehicles[gameState.selectedVehicle].selected = false;
        gameState.isGrabbing = false;
        gameState.selectedVehicle = null;
      }
    }
  } else if (!gameState.isGrabbing) {
    // Move cursor
    if (keyCode === 37) { // LEFT
      gameState.cursorX = Math.max(0, gameState.cursorX - 1);
    } else if (keyCode === 39) { // RIGHT
      gameState.cursorX = Math.min(GRID_SIZE - 1, gameState.cursorX + 1);
    } else if (keyCode === 38) { // UP
      gameState.cursorY = Math.max(0, gameState.cursorY - 1);
    } else if (keyCode === 40) { // DOWN
      gameState.cursorY = Math.min(GRID_SIZE - 1, gameState.cursorY + 1);
    }
  } else {
    // Move grabbed vehicle - ONE tap = ONE grid cell move
    const vehicle = vehicles[gameState.selectedVehicle];
    let dx = 0, dy = 0;
    
    if (keyCode === 37) dx = -1; // LEFT
    else if (keyCode === 39) dx = 1; // RIGHT
    else if (keyCode === 38) dy = -1; // UP
    else if (keyCode === 40) dy = 1; // DOWN
    
    if ((dx !== 0 || dy !== 0) && vehicle.canMoveTo(dx, dy, vehicles)) {
      vehicle.move(dx, dy);
      gameState.moveCount++;
      
      // Check win condition
      if (vehicle.isTarget && vehicle.isAtExit()) {
        gameState.levelComplete = true;
        gameState.score += Math.max(100 - gameState.moveCount, 10);
        setTimeout(() => {
          if (gameState.currentLevel < 4) {
            gameState.currentLevel++;
            loadLevel(gameState.currentLevel);
          } else {
            gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
            logGameInfo(p, "All levels complete!");
          }
        }, 1500);
      }
    }
  }
}

function getVehicleAtCursor() {
  const vehicles = gameState.entities;
  const cursorX = gameState.cursorX;
  const cursorY = gameState.cursorY;
  
  for (let i = 0; i < vehicles.length; i++) {
    const vehicle = vehicles[i];
    const cells = vehicle.getCells();
    
    for (let cell of cells) {
      if (cell.x === cursorX && cell.y === cursorY) {
        return i;
      }
    }
  }
  
  return null;
}

function startGame() {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  gameState.currentLevel = 0;
  gameState.score = 0;
  loadLevel(0);
}

function resetGame(p) {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.entities = [];
  gameState.selectedVehicle = null;
  gameState.isGrabbing = false;
  gameState.moveCount = 0;
  gameState.levelComplete = false;
  gameState.particles = [];
  gameState.cursorX = 0;
  gameState.cursorY = 0;
  logGameInfo(p, "Game reset");
}

function loadLevel(levelIndex) {
  gameState.entities = [];
  gameState.selectedVehicle = null;
  gameState.isGrabbing = false;
  gameState.moveCount = 0;
  gameState.levelComplete = false;
  gameState.particles = [];
  gameState.cursorX = 0;
  gameState.cursorY = 2;

  const level = LEVELS[levelIndex];
  level.vehicles.forEach(vData => {
    const vehicle = new Vehicle(
      vData.x,
      vData.y,
      vData.length,
      vData.horizontal,
      vData.target
    );
    gameState.entities.push(vehicle);
  });
}

function logGameInfo(p, data) {
  p.logs.game_info.push({
    data: data,
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export { startGame, resetGame, loadLevel };