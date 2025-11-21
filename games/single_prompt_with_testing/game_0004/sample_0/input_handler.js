import { gameState } from './globals.js';
import get_automated_testing_action from './automated_testing_controller.js';

export function handleKeyPressed(p, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Game phase controls
  if (keyCode === 13 && gameState.gamePhase === "START") { // ENTER
    if (gameState.currentMiniGame !== null) {
      startGame(p);
    }
  } else if (keyCode === 27 && gameState.gamePhase === "PLAYING") { // ESC
    pauseGame(p);
  } else if (keyCode === 27 && gameState.gamePhase === "PAUSED") { // ESC
    unpauseGame(p);
  } else if (keyCode === 82) { // R
    resetGame(p);
  }
  
  // Menu navigation
  if (gameState.gamePhase === "START") {
    handleMenuInput(keyCode);
  }
  
  // Gameplay inputs
  if (gameState.gamePhase === "PLAYING" && gameState.miniGameState) {
    gameState.miniGameState.handleInput(keyCode);
  }
}

export function handleKeyReleased(p, keyCode) {
  if (gameState.gamePhase === "PLAYING" && gameState.miniGameState) {
    gameState.miniGameState.handleRelease(keyCode);
  }
}

function handleMenuInput(keyCode) {
  const cols = 4;
  const totalGames = 12;
  
  if (keyCode === 37) { // Left
    gameState.menuSelection = (gameState.menuSelection - 1 + totalGames) % totalGames;
  } else if (keyCode === 39) { // Right
    gameState.menuSelection = (gameState.menuSelection + 1) % totalGames;
  } else if (keyCode === 38) { // Up
    gameState.menuSelection = (gameState.menuSelection - cols + totalGames) % totalGames;
  } else if (keyCode === 40) { // Down
    gameState.menuSelection = (gameState.menuSelection + cols) % totalGames;
  } else if (keyCode === 32) { // Space - select game
    gameState.currentMiniGame = gameState.menuSelection;
  }
}

function startGame(p) {
  gameState.gamePhase = "PLAYING";
  gameState.framesSinceStart = 0;
  gameState.totalGamesPlayed++;
  
  p.logs.game_info.push({
    data: { phase: "PLAYING", game: gameState.currentMiniGame },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function pauseGame(p) {
  gameState.gamePhase = "PAUSED";
  p.noLoop();
  
  p.logs.game_info.push({
    data: { phase: "PAUSED" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function unpauseGame(p) {
  gameState.gamePhase = "PLAYING";
  p.loop();
  
  p.logs.game_info.push({
    data: { phase: "PLAYING" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resetGame(p) {
  gameState.gamePhase = "START";
  gameState.currentMiniGame = null;
  gameState.miniGameState = null;
  gameState.score = 0;
  
  p.logs.game_info.push({
    data: { phase: "START" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function processAutomatedInput(p) {
  if (gameState.controlMode !== "HUMAN") {
    const action = get_automated_testing_action(gameState);
    if (action && action.keyCode) {
      handleKeyPressed(p, action.keyCode);
      if (action.release) {
        handleKeyReleased(p, action.keyCode);
      }
    }
  }
}