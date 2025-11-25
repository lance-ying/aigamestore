import { gameState } from './globals.js';

export function setupInput() {
  document.addEventListener('keydown', (event) => {
    gameState.keys[event.keyCode] = true;
    
    // Log input
    window.logs.inputs.push({
      input_type: 'keydown',
      data: { key: event.key, keyCode: event.keyCode },
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
    
    // Phase controls
    if (event.keyCode === 13 && gameState.gamePhase === "START") { // ENTER
      startGame();
    }
    
    if (event.keyCode === 27) { // ESC
      if (gameState.gamePhase === "PLAYING") {
        gameState.gamePhase = "PAUSED";
        window.logs.game_info.push({
          game_status: "PAUSED",
          data: { score: gameState.score },
          framecount: gameState.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === "PAUSED") {
        gameState.gamePhase = "PLAYING";
        window.logs.game_info.push({
          game_status: "PLAYING",
          data: { score: gameState.score },
          framecount: gameState.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    if (event.keyCode === 82) { // R
      if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
        resetGame();
      }
    }
    
    // Gameplay controls
    if (gameState.gamePhase === "PLAYING" && gameState.player) {
      if (event.keyCode === 37 || event.keyCode === 65) { // Left Arrow or A
        gameState.player.switchLane(-1);
      }
      if (event.keyCode === 39 || event.keyCode === 68) { // Right Arrow or D
        gameState.player.switchLane(1);
      }
      if (event.keyCode === 38 || event.keyCode === 87 || event.keyCode === 32) { // Up Arrow, W, or Space
        gameState.player.jump();
      }
      if (event.keyCode === 40 || event.keyCode === 83) { // Down Arrow or S
        gameState.player.slide();
      }
    }
  });
  
  document.addEventListener('keyup', (event) => {
    gameState.keys[event.keyCode] = false;
    
    window.logs.inputs.push({
      input_type: 'keyup',
      data: { key: event.key, keyCode: event.keyCode },
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  });
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
  gameState.obstacles.forEach(obs => obs.destroy());
  gameState.coins.forEach(coin => coin.destroy());
  gameState.obstacles = [];
  gameState.coins = [];
  
  // Reset game state
  gameState.score = 0;
  gameState.distance = 0;
  gameState.gameSpeed = 0.15;
  gameState.spawnCounter = 0;
  gameState.frameCount = 0;
  
  // Reset player
  if (gameState.player) {
    gameState.player.mesh.position.set(0, 1, 0);
    gameState.player.currentLane = 1;
    gameState.player.targetX = 0;
    gameState.player.velocity.set(0, 0, 0);
    gameState.player.isJumping = false;
    gameState.player.isSliding = false;
    gameState.player.onGround = true;
    gameState.player.health = 1;
  }
  
  gameState.gamePhase = "START";
  window.logs.game_info.push({
    game_status: "START",
    data: {},
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
}