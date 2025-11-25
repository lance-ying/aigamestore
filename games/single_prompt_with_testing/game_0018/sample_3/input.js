import { gameState, logs } from './globals.js';

const keys = {};

export function setupInput() {
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);
}

function handleKeyDown(event) {
  // Log input
  logs.inputs.push({
    input_type: 'keydown',
    data: { key: event.key, keyCode: event.keyCode },
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
  
  keys[event.keyCode] = true;
  
  // Phase controls
  if (event.keyCode === 13 && gameState.gamePhase === "START") { // ENTER
    gameState.gamePhase = "PLAYING";
    logs.game_info.push({
      game_status: "PLAYING",
      data: {},
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
  
  if (event.keyCode === 27) { // ESC
    if (gameState.gamePhase === "PLAYING") {
      gameState.gamePhase = "PAUSED";
      logs.game_info.push({
        game_status: "PAUSED",
        data: {},
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === "PAUSED") {
      gameState.gamePhase = "PLAYING";
      logs.game_info.push({
        game_status: "PLAYING",
        data: {},
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  if (event.keyCode === 82) { // R - Restart
    if (gameState.gamePhase === "GAME_OVER_WIN" || 
        gameState.gamePhase === "GAME_OVER_LOSE" ||
        gameState.gamePhase === "PAUSED") {
      location.reload();
    }
  }
  
  // Gameplay controls (only in PLAYING phase and HUMAN mode)
  if (gameState.gamePhase === "PLAYING" && gameState.controlMode === "HUMAN" && gameState.player) {
    handleGameplayInput(event.keyCode);
  }
}

function handleKeyUp(event) {
  logs.inputs.push({
    input_type: 'keyup',
    data: { key: event.key, keyCode: event.keyCode },
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
  
  keys[event.keyCode] = false;
}

function handleGameplayInput(keyCode) {
  if (!gameState.player) return;
  
  // Left: Arrow Left (37) or A (65)
  if (keyCode === 37 || keyCode === 65) {
    gameState.player.switchLane(-1);
  }
  
  // Right: Arrow Right (39) or D (68)
  if (keyCode === 39 || keyCode === 68) {
    gameState.player.switchLane(1);
  }
  
  // Jump: Arrow Up (38) or W (87)
  if (keyCode === 38 || keyCode === 87) {
    gameState.player.jump();
  }
  
  // Slide: Arrow Down (40) or S (83)
  if (keyCode === 40 || keyCode === 83) {
    gameState.player.slide();
  }
}

export function updateTestMode() {
  if (gameState.controlMode === "HUMAN" || !gameState.player) return;
  
  if (gameState.controlMode === "TEST_1") {
    // Basic movement test - cycle through lanes and actions
    const cycle = Math.floor(gameState.frameCount / 60) % 9;
    
    if (cycle < 3) {
      // Lane switching test
      if (gameState.frameCount % 60 === 0) {
        gameState.player.switchLane(cycle === 0 ? -1 : 1);
      }
    } else if (cycle < 6) {
      // Jump test
      if (gameState.frameCount % 120 === 0) {
        gameState.player.jump();
      }
    } else {
      // Slide test
      if (gameState.frameCount % 120 === 0) {
        gameState.player.slide();
      }
    }
  } else if (gameState.controlMode === "TEST_2") {
    // Survival test - smart avoidance
    const nearestObstacle = findNearestObstacle();
    
    if (nearestObstacle && nearestObstacle.mesh.position.z - gameState.player.mesh.position.z < 8) {
      const obstacleLane = nearestObstacle.lane;
      
      // Move to safe lane
      if (Math.abs(gameState.player.currentLane - obstacleLane) < 0.5) {
        const direction = obstacleLane === -2 ? 1 : -1;
        gameState.player.switchLane(direction);
      }
      
      // Jump or slide based on obstacle type
      if (Math.abs(gameState.player.currentLane - obstacleLane) < 0.5) {
        if (nearestObstacle.type === 'low_barrier') {
          gameState.player.jump();
        } else if (nearestObstacle.type === 'high_barrier') {
          gameState.player.slide();
        }
      }
    }
    
    // Collect coins
    const nearestCoin = findNearestCoin();
    if (nearestCoin && nearestCoin.mesh.position.z - gameState.player.mesh.position.z < 10) {
      const coinLane = nearestCoin.mesh.position.x;
      if (Math.abs(gameState.player.currentLane - coinLane) > 0.5) {
        const direction = coinLane > gameState.player.currentLane ? 1 : -1;
        gameState.player.switchLane(direction);
      }
      
      // Jump to high coins
      if (nearestCoin.mesh.position.y > 2 && !gameState.player.isJumping) {
        gameState.player.jump();
      }
    }
    
    // Win condition: survive for 60 seconds
    if (gameState.frameCount > 3600) {
      gameState.gamePhase = "GAME_OVER_WIN";
    }
  }
}

function findNearestObstacle() {
  let nearest = null;
  let minDistance = Infinity;
  
  for (const obstacle of gameState.obstacles) {
    const distance = obstacle.mesh.position.z - (gameState.player?.mesh.position.z || 0);
    if (distance > 0 && distance < minDistance) {
      minDistance = distance;
      nearest = obstacle;
    }
  }
  
  return nearest;
}

function findNearestCoin() {
  let nearest = null;
  let minDistance = Infinity;
  
  for (const coin of gameState.coins) {
    const distance = coin.mesh.position.z - (gameState.player?.mesh.position.z || 0);
    if (distance > 0 && distance < minDistance) {
      minDistance = distance;
      nearest = coin;
    }
  }
  
  return nearest;
}