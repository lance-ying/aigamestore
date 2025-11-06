// input.js - Input handling
import { gameState } from './globals.js';
import { canPlaceTile, placeTile, generateRandomTile } from './tiles.js';
import { spawnEnemy } from './enemies.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  if (gameState.gamePhase === 'START') {
    if (keyCode === 13) { // ENTER
      startGame(p);
    }
  } else if (gameState.gamePhase === 'PLAYING') {
    if (keyCode === 27) { // ESC
      pauseGame(p);
    } else if (!gameState.waveInProgress && gameState.currentTile) {
      handleGameplayInput(p, keyCode);
    } else if (keyCode === 90 && !gameState.waveInProgress && gameState.wave < gameState.maxWaves) { // Z
      callWave(p);
    }
  } else if (gameState.gamePhase === 'PAUSED') {
    if (keyCode === 27) { // ESC
      unpauseGame(p);
    }
  } else if (gameState.gamePhase.startsWith('GAME_OVER')) {
    if (keyCode === 82) { // R
      restartGame(p);
    }
  }
}

function handleGameplayInput(p, keyCode) {
  if (keyCode === 37) { // LEFT
    gameState.cursorX = Math.max(0, gameState.cursorX - 1);
  } else if (keyCode === 39) { // RIGHT
    gameState.cursorX = Math.min(7, gameState.cursorX + 1);
  } else if (keyCode === 38) { // UP
    gameState.cursorY = Math.max(0, gameState.cursorY - 1);
  } else if (keyCode === 40) { // DOWN
    gameState.cursorY = Math.min(7, gameState.cursorY + 1);
  } else if (keyCode === 32) { // SPACE
    if (canPlaceTile(gameState.cursorX, gameState.cursorY)) {
      placeTile(gameState.cursorX, gameState.cursorY, gameState.currentTile);
      gameState.currentTile = generateRandomTile(p);
    }
  } else if (keyCode === 16) { // SHIFT
    if (gameState.coins >= 10) {
      gameState.coins -= 10;
      gameState.currentTile = generateRandomTile(p);
    }
  }
}

function startGame(p) {
  gameState.gamePhase = 'PLAYING';
  gameState.currentTile = generateRandomTile(p);
  
  p.logs.game_info.push({
    data: { phase: 'PLAYING', event: 'game_started' },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function pauseGame(p) {
  gameState.gamePhase = 'PAUSED';
  p.noLoop();
  
  p.logs.game_info.push({
    data: { phase: 'PAUSED', event: 'game_paused' },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function unpauseGame(p) {
  gameState.gamePhase = 'PLAYING';
  p.loop();
  
  p.logs.game_info.push({
    data: { phase: 'PLAYING', event: 'game_unpaused' },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function restartGame(p) {
  const { resetGameState } = await import('./globals.js');
  resetGameState();
  gameState.gamePhase = 'START';
  
  p.logs.game_info.push({
    data: { phase: 'START', event: 'game_restarted' },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function callWave(p) {
  gameState.waveInProgress = true;
  gameState.wave++;
  gameState.enemiesSpawned = 0;
  gameState.enemiesToSpawn = 5 + gameState.wave * 3;
  gameState.spawnTimer = 0;
  
  p.logs.game_info.push({
    data: { event: 'wave_called', wave: gameState.wave },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function processAutomatedInput(p, action) {
  if (!action) return;
  
  if (action.keyCode) {
    handleKeyPressed(p, action.key, action.keyCode);
  }
}