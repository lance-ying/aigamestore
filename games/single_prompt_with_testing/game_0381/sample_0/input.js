import { gameState, COMPONENT_TYPES, GRID_COLS, GRID_ROWS } from './globals.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  if (gameState.gamePhase === "START") {
    if (keyCode === 13) { // ENTER
      startGame(p);
    }
  } else if (gameState.gamePhase === "PLAYING") {
    if (keyCode === 27) { // ESC
      pauseGame(p);
    } else if (keyCode === 16) { // SHIFT
      gameState.buildMode = !gameState.buildMode;
    } else if (keyCode === 90) { // Z
      cycleComponent();
    } else if (keyCode === 32) { // SPACE
      if (gameState.buildMode) {
        toggleComponent(p);
      }
    }
  } else if (gameState.gamePhase === "PAUSED") {
    if (keyCode === 27) { // ESC
      unpauseGame(p);
    }
  } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
    if (keyCode === 82) { // R
      restartGame(p);
    }
  }
}

export function handleMovement(p) {
  if (gameState.gamePhase !== "PLAYING" || !gameState.buildMode) return;

  if (p.keyIsDown(37)) { // LEFT
    gameState.cursorX = Math.max(0, gameState.cursorX - 1);
  }
  if (p.keyIsDown(39)) { // RIGHT
    gameState.cursorX = Math.min(GRID_COLS - 1, gameState.cursorX + 1);
  }
  if (p.keyIsDown(38)) { // UP
    gameState.cursorY = Math.max(0, gameState.cursorY - 1);
  }
  if (p.keyIsDown(40)) { // DOWN
    gameState.cursorY = Math.min(GRID_ROWS - 1, gameState.cursorY + 1);
  }
}

function startGame(p) {
  gameState.gamePhase = "PLAYING";
  p.logs.game_info.push({
    data: { phase: "PLAYING", level: gameState.level },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function pauseGame(p) {
  gameState.gamePhase = "PAUSED";
  p.logs.game_info.push({
    data: { phase: "PAUSED" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function unpauseGame(p) {
  gameState.gamePhase = "PLAYING";
  p.logs.game_info.push({
    data: { phase: "PLAYING" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function restartGame(p) {
  gameState.gamePhase = "START";
  gameState.level = 1;
  gameState.score = 0;
  gameState.deliveredProducts = 0;
  gameState.buildMode = false;
  gameState.materials = [];
  gameState.components = [];
  gameState.levelComplete = false;
  p.logs.game_info.push({
    data: { phase: "START" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function cycleComponent() {
  const types = Object.values(COMPONENT_TYPES);
  const currentIndex = types.indexOf(gameState.selectedComponent);
  gameState.selectedComponent = types[(currentIndex + 1) % types.length];
}

function toggleComponent(p) {
  const x = gameState.cursorX;
  const y = gameState.cursorY;

  // Check if spawner or goal at position
  const isSpawner = gameState.spawners.some(s => s.gridX === x && s.gridY === y);
  const isGoal = gameState.goals.some(g => g.gridX === x && g.gridY === y);
  if (isSpawner || isGoal) return;

  // Check if component exists
  const existingIndex = gameState.components.findIndex(c => c.gridX === x && c.gridY === y);

  if (existingIndex >= 0) {
    // Remove component
    gameState.components.splice(existingIndex, 1);
  } else {
    // Add component
    const Component = (await import('./entities.js')).Component;
    const newComponent = new Component(x, y, gameState.selectedComponent, 1);
    gameState.components.push(newComponent);
  }

  gameState.lastPlacementFrame = p.frameCount;
}