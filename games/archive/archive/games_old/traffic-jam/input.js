import { gameState, GAME_PHASES } from './globals.js';
import { LEVELS } from './levels.js';
import { Vehicle } from './vehicle.js';

export function setupInputHandlers(p) {
  p.keyPressed = function() {
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
  };
}

function handleGameplayInput(p, keyCode) {
  const vehicles = gameState.entities;
  
  if (keyCode === 32) { // SPACE
    if (gameState.selectedVehicle !== null) {
      gameState.isGrabbing = !gameState.isGrabbing;
      vehicles[gameState.selectedVehicle].grabbed = gameState.isGrabbing;
    }
  } else if (!gameState.isGrabbing) {
    // Navigate between vehicles
    if (keyCode === 37 || keyCode === 38 || keyCode === 39 || keyCode === 40) {
      selectNextVehicle(keyCode);
    }
  } else {
    // Move grabbed vehicle
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

function selectNextVehicle(keyCode) {
  const vehicles = gameState.entities;
  if (vehicles.length === 0) return;

  if (gameState.selectedVehicle === null) {
    gameState.selectedVehicle = 0;
  } else {
    const current = vehicles[gameState.selectedVehicle];
    let bestIdx = gameState.selectedVehicle;
    let bestDist = Infinity;

    for (let i = 0; i < vehicles.length; i++) {
      if (i === gameState.selectedVehicle) continue;
      const v = vehicles[i];
      let dist = 0;
      let valid = false;

      if (keyCode === 37 && v.gridX < current.gridX) { // LEFT
        dist = current.gridX - v.gridX;
        valid = true;
      } else if (keyCode === 39 && v.gridX > current.gridX) { // RIGHT
        dist = v.gridX - current.gridX;
        valid = true;
      } else if (keyCode === 38 && v.gridY < current.gridY) { // UP
        dist = current.gridY - v.gridY;
        valid = true;
      } else if (keyCode === 40 && v.gridY > current.gridY) { // DOWN
        dist = v.gridY - current.gridY;
        valid = true;
      }

      if (valid && dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }

    // If no vehicle found in the spatial direction, cycle through array
    if (bestIdx === gameState.selectedVehicle) {
      if (keyCode === 37 || keyCode === 38) { // LEFT or UP - cycle backwards
        bestIdx = gameState.selectedVehicle - 1;
        if (bestIdx < 0) bestIdx = vehicles.length - 1;
      } else if (keyCode === 39 || keyCode === 40) { // RIGHT or DOWN - cycle forwards
        bestIdx = gameState.selectedVehicle + 1;
        if (bestIdx >= vehicles.length) bestIdx = 0;
      }
    }

    gameState.selectedVehicle = bestIdx;
  }

  // Update selection
  vehicles.forEach((v, i) => {
    v.selected = (i === gameState.selectedVehicle);
  });
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
  logGameInfo(p, "Game reset");
}

function loadLevel(levelIndex) {
  gameState.entities = [];
  gameState.selectedVehicle = null;
  gameState.isGrabbing = false;
  gameState.moveCount = 0;
  gameState.levelComplete = false;
  gameState.particles = [];

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

  if (gameState.entities.length > 0) {
    gameState.selectedVehicle = 0;
    gameState.entities[0].selected = true;
  }
}

function logGameInfo(p, data) {
  p.logs.game_info.push({
    data: data,
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export { startGame, resetGame, loadLevel };