// input.js - Input handling
import { gameState, logs } from './globals.js';

export function setupInputHandlers() {
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);
}

function handleKeyDown(event) {
  const keyCode = event.keyCode;
  
  // Log input
  logs.inputs.push({
    input_type: 'keydown',
    data: { key: event.key, keyCode: keyCode },
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });

  // Game phase controls
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === 'START') {
      startGame();
    }
    event.preventDefault();
    return;
  }

  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === 'PLAYING') {
      gameState.gamePhase = 'PAUSED';
      logs.game_info.push({
        game_status: 'PAUSED',
        data: {},
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === 'PAUSED') {
      gameState.gamePhase = 'PLAYING';
      logs.game_info.push({
        game_status: 'PLAYING',
        data: {},
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
    event.preventDefault();
    return;
  }

  if (keyCode === 82) { // R
    if (gameState.gamePhase === 'GAME_OVER_LOSE' || gameState.gamePhase === 'GAME_OVER_WIN') {
      restartGame();
    }
    event.preventDefault();
    return;
  }

  // Gameplay controls
  if (gameState.gamePhase !== 'PLAYING') return;

  // Left (A or Left Arrow)
  if (keyCode === 65 || keyCode === 37) {
    gameState.keys.left = true;
    if (gameState.player) {
      gameState.player.moveLeft();
    }
    event.preventDefault();
  }
  
  // Right (D or Right Arrow)
  if (keyCode === 68 || keyCode === 39) {
    gameState.keys.right = true;
    if (gameState.player) {
      gameState.player.moveRight();
    }
    event.preventDefault();
  }
  
  // Jump (W or Up Arrow)
  if (keyCode === 87 || keyCode === 38) {
    gameState.keys.up = true;
    if (gameState.player) {
      gameState.player.jump();
    }
    event.preventDefault();
  }
  
  // Slide (S or Down Arrow)
  if (keyCode === 83 || keyCode === 40) {
    gameState.keys.down = true;
    if (gameState.player) {
      gameState.player.slide();
    }
    event.preventDefault();
  }
}

function handleKeyUp(event) {
  const keyCode = event.keyCode;
  
  logs.inputs.push({
    input_type: 'keyup',
    data: { key: event.key, keyCode: keyCode },
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });

  if (keyCode === 65 || keyCode === 37) gameState.keys.left = false;
  if (keyCode === 68 || keyCode === 39) gameState.keys.right = false;
  if (keyCode === 87 || keyCode === 38) gameState.keys.up = false;
  if (keyCode === 83 || keyCode === 40) gameState.keys.down = false;
}

function startGame() {
  gameState.gamePhase = 'PLAYING';
  logs.game_info.push({
    game_status: 'PLAYING',
    data: {},
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
}

function restartGame() {
  // Clear all obstacles and coins
  gameState.obstacles.forEach(obstacle => {
    gameState.scene.remove(obstacle.mesh);
  });
  gameState.coins.forEach(coin => {
    gameState.scene.remove(coin.mesh);
  });
  
  gameState.obstacles = [];
  gameState.coins = [];
  gameState.entities = [gameState.player];
  gameState.score = 0;
  gameState.distance = 0;
  gameState.currentSpeed = 0.15;
  gameState.difficulty = 1;
  
  // Reset player position
  if (gameState.player) {
    gameState.player.mesh.position.set(0, 0.8, 0);
    gameState.player.velocity.set(0, 0, 0);
    gameState.player.targetLane = 1;
    gameState.player.currentLane = 1;
    gameState.player.isJumping = false;
    gameState.player.isSliding = false;
    gameState.player.onGround = true;
  }
  
  gameState.gamePhase = 'START';
  logs.game_info.push({
    game_status: 'START',
    data: {},
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
}