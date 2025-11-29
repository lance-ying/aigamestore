import { gameState, LEVEL_CONFIG } from './globals.js';

const keys = {};

export function setupInput() {
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);
}

function handleKeyDown(event) {
  keys[event.keyCode] = true;
  
  // Log input
  window.logs.inputs.push({
    input_type: 'keydown',
    data: { key: event.key, keyCode: event.keyCode },
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
  
  // Phase controls
  if (event.keyCode === 13 && gameState.gamePhase === "START") {
    startGame();
  }
  
  if (event.keyCode === 27) {
    if (gameState.gamePhase === "PLAYING") {
      gameState.gamePhase = "PAUSED";
    } else if (gameState.gamePhase === "PAUSED") {
      gameState.gamePhase = "PLAYING";
    }
    
    window.logs.game_info.push({
      game_status: gameState.gamePhase,
      data: {},
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
  
  if (event.keyCode === 82) {
    if (gameState.gamePhase === "GAME_OVER_WIN" || 
        gameState.gamePhase === "GAME_OVER_LOSE") {
      resetGame();
    }
  }
  
  // Gameplay controls
  if (gameState.gamePhase === "PLAYING" && gameState.player && gameState.controlMode === "HUMAN") {
    handleGameplayInput(event.keyCode);
  }
}

function handleKeyUp(event) {
  keys[event.keyCode] = false;
  
  window.logs.inputs.push({
    input_type: 'keyup',
    data: { key: event.key, keyCode: event.keyCode },
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
}

function handleGameplayInput(keyCode) {
  if (keyCode === 37 || keyCode === 65) { // Left Arrow or A
    gameState.player.moveLeft();
  }
  if (keyCode === 39 || keyCode === 68) { // Right Arrow or D
    gameState.player.moveRight();
  }
  if (keyCode === 38 || keyCode === 87) { // Up Arrow or W
    gameState.player.jump();
  }
  if (keyCode === 40 || keyCode === 83) { // Down Arrow or S
    gameState.player.slide();
  }
}

function startGame() {
  gameState.gamePhase = "PLAYING";
  
  window.logs.game_info.push({
    game_status: "PLAYING",
    data: {},
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
}

function resetGame() {
  // Clear entities
  if (gameState.player) {
    gameState.scene.remove(gameState.player.mesh);
  }
  
  gameState.obstacles.forEach(obstacle => {
    gameState.scene.remove(obstacle.mesh);
  });
  
  gameState.coins.forEach(coin => {
    gameState.scene.remove(coin.mesh);
  });
  
  gameState.obstacles = [];
  gameState.coins = [];
  gameState.player = null;
  
  // Reset game state including level system
  gameState.score = 0;
  gameState.distance = 0;
  gameState.coins_collected = 0;
  gameState.speed = 0.3;
  gameState.spawnTimer = 0;
  gameState.currentLevel = 1;
  gameState.currentLevelConfig = LEVEL_CONFIG[0];
  gameState.spawnInterval = LEVEL_CONFIG[0].spawnInterval;
  gameState.difficultyLevel = 1;
  gameState.gamePhase = "START";
  
  window.logs.game_info.push({
    game_status: "START",
    data: {},
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
}

export function updateAutomatedControl() {
  if (gameState.controlMode === "HUMAN" || gameState.gamePhase !== "PLAYING" || !gameState.player) {
    return;
  }
  
  if (gameState.controlMode === "TEST_1") {
    // Basic testing - cycle through movements
    const cycle = Math.floor(gameState.frameCount / 60) % 6;
    
    if (cycle === 0 && gameState.frameCount % 60 === 0) {
      gameState.player.moveLeft();
    } else if (cycle === 1 && gameState.frameCount % 60 === 0) {
      gameState.player.moveRight();
    } else if (cycle === 2 && gameState.frameCount % 60 === 0) {
      gameState.player.moveRight();
    } else if (cycle === 3 && gameState.frameCount % 40 === 0) {
      gameState.player.jump();
    } else if (cycle === 4 && gameState.frameCount % 40 === 0) {
      gameState.player.slide();
    } else if (cycle === 5 && gameState.frameCount % 60 === 0) {
      gameState.player.moveLeft();
    }
  } else if (gameState.controlMode === "TEST_2") {
    // Advanced AI - avoid obstacles and collect coins
    if (!gameState.player.isAlive) return;
    
    // Look ahead for obstacles
    const lookAheadDistance = 15;
    let threatLanes = [false, false, false];
    let coinLanes = [false, false, false];
    
    for (const obstacle of gameState.obstacles) {
      const distance = gameState.player.mesh.position.z - obstacle.mesh.position.z;
      if (distance > 0 && distance < lookAheadDistance) {
        threatLanes[obstacle.lane] = true;
        
        // Decide action based on obstacle type
        if (distance < 8) {
          if (obstacle.type === 'low' && gameState.player.currentLane === obstacle.lane) {
            gameState.player.jump();
          } else if (obstacle.type === 'high' && gameState.player.currentLane === obstacle.lane) {
            gameState.player.slide();
          } else if (obstacle.type === 'train' && gameState.player.currentLane === obstacle.lane) {
            // Change lane
            if (obstacle.lane === 0) {
              gameState.player.moveRight();
            } else if (obstacle.lane === 2) {
              gameState.player.moveLeft();
            } else {
              gameState.player.moveLeft();
            }
          }
        }
      }
    }
    
    // Look for coins
    for (const coin of gameState.coins) {
      if (!coin.collected) {
        const distance = gameState.player.mesh.position.z - coin.mesh.position.z;
        if (distance > 0 && distance < lookAheadDistance) {
          coinLanes[coin.lane] = true;
        }
      }
    }
    
    // Move towards coins if safe
    if (gameState.frameCount % 30 === 0) {
      for (let i = 0; i < 3; i++) {
        if (coinLanes[i] && !threatLanes[i]) {
          if (i < gameState.player.currentLane) {
            gameState.player.moveLeft();
          } else if (i > gameState.player.currentLane) {
            gameState.player.moveRight();
          }
          break;
        }
      }
    }
  }
}