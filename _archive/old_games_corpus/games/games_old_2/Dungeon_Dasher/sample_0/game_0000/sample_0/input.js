// input.js - Input handling

import { gameState, GAME_PHASES, GRID_COLS, GRID_ROWS } from './globals.js';
import { checkWallCollision, checkEntityCollision } from './collision.js';
import { applyUpgrade } from './upgrades.js';
import { loadRoom } from './rooms.js';

export function handleKeyPressed(p) {
  if (!p || !p.keyCode) return;

  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // Global controls
  if (p.keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame();
    }
    return;
  }

  if (p.keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }

  if (p.keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      resetGame();
    }
    return;
  }

  // Game-specific controls
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    handleGameplayInput(p);
  } else if (gameState.gamePhase === GAME_PHASES.UPGRADE_SELECTION) {
    handleUpgradeInput(p);
  }
}

function handleGameplayInput(p) {
  if (!gameState.player || !gameState.player.isAlive()) return;

  let moved = false;
  let newGridX = gameState.player.gridX;
  let newGridY = gameState.player.gridY;

  if (p.keyCode === 37) { // LEFT
    newGridX--;
    moved = true;
  } else if (p.keyCode === 38) { // UP
    newGridY--;
    moved = true;
  } else if (p.keyCode === 39) { // RIGHT
    newGridX++;
    moved = true;
  } else if (p.keyCode === 40) { // DOWN
    newGridY++;
    moved = true;
  }

  if (moved) {
    // Check bounds
    if (newGridX >= 1 && newGridX < GRID_COLS - 1 && 
        newGridY >= 1 && newGridY < GRID_ROWS - 1) {
      // Check collisions
      if (!checkWallCollision(newGridX, newGridY) && 
          !checkEntityCollision(newGridX, newGridY, gameState.player)) {
        gameState.player.gridX = newGridX;
        gameState.player.gridY = newGridY;
        gameState.player.x = newGridX * 40 + 20;
        gameState.player.y = newGridY * 40 + 20;
        gameState.framesSinceLastMove = 0;

        // Log player position
        p.logs.player_info.push({
          screen_x: gameState.player.x,
          screen_y: gameState.player.y,
          game_x: gameState.player.gridX,
          game_y: gameState.player.gridY,
          framecount: p.frameCount
        });
      }
    }
  }
}

function handleUpgradeInput(p) {
  if (p.keyCode === 37) { // LEFT
    gameState.selectedUpgradeIndex = Math.max(0, gameState.selectedUpgradeIndex - 1);
  } else if (p.keyCode === 39) { // RIGHT
    gameState.selectedUpgradeIndex = Math.min(2, gameState.selectedUpgradeIndex + 1);
  } else if (p.keyCode === 32) { // SPACE
    const selectedUpgrade = gameState.availableUpgrades[gameState.selectedUpgradeIndex];
    applyUpgrade(selectedUpgrade, gameState.player);
    
    // Move to next room or level
    gameState.currentRoom++;
    const roomsInLevel = gameState.roomsPerLevel[gameState.currentLevel - 1];
    
    if (gameState.currentRoom > roomsInLevel) {
      if (gameState.currentLevel < 5) {
        gameState.currentLevel++;
        gameState.currentRoom = 1;
        gameState.score += 1000;
        gameState.gamePhase = GAME_PHASES.LEVEL_TRANSITION;
        gameState.levelTransitionTimer = 120;
      } else {
        gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
        updateHighScore();
      }
    } else {
      gameState.score += 50;
      loadRoom(gameState.currentLevel, gameState.currentRoom);
      gameState.gamePhase = GAME_PHASES.PLAYING;
    }

    p.logs.game_info.push({
      data: { 
        gamePhase: gameState.gamePhase,
        currentLevel: gameState.currentLevel,
        currentRoom: gameState.currentRoom
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function startGame() {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  gameState.currentLevel = 1;
  gameState.currentRoom = 1;
  gameState.score = 0;
  gameState.upgrades = [];
  gameState.framesSinceLastMove = 0;
  
  const Player = require('./entities.js').Player;
  gameState.player = new Player(2, 2);
  
  loadRoom(gameState.currentLevel, gameState.currentRoom);
  
  gameInstance.logs.game_info.push({
    data: { gamePhase: gameState.gamePhase },
    framecount: gameInstance.frameCount,
    timestamp: Date.now()
  });
}

function resetGame() {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.player = null;
  gameState.entities = [];
  gameState.projectiles = [];
  gameState.enemies = [];
  gameState.walls = [];
  gameState.currentLevel = 1;
  gameState.currentRoom = 1;
  gameState.score = 0;
  gameState.upgrades = [];
  gameState.attackCooldown = 0;
  gameState.roomCleared = false;
  gameState.framesSinceLastMove = 0;

  gameInstance.logs.game_info.push({
    data: { gamePhase: gameState.gamePhase },
    framecount: gameInstance.frameCount,
    timestamp: Date.now()
  });
}

function updateHighScore() {
  if (gameState.score > gameState.highScore) {
    gameState.highScore = gameState.score;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('dungeonDasherHighScore', gameState.highScore.toString());
    }
  }
}

// Make functions available globally for testing
if (typeof window !== 'undefined') {
  window.startGameForTest = startGame;
  window.resetGameForTest = resetGame;
}