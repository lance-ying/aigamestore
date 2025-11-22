import { gameState, KEYS } from './globals.js';

// Process key input for the game
export function processInput(p, keyCode, player) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Handle key press based on game phase
  switch (gameState.gamePhase) {
    case "START":
      if (keyCode === KEYS.ENTER) {
        startGame(p);
      }
      break;
      
    case "PLAYING":
      if (keyCode === KEYS.SPACE) {
        player.jump(p, gameState);
      } else if (keyCode === KEYS.ESC) {
        pauseGame(p);
      } else if (keyCode === KEYS.R) {
        restartGame(p);
      }
      break;
      
    case "PAUSED":
      if (keyCode === KEYS.ESC) {
        resumeGame(p);
      } else if (keyCode === KEYS.R) {
        restartGame(p);
      }
      break;
      
    case "GAME_OVER_WIN":
    case "GAME_OVER_LOSE":
      if (keyCode === KEYS.R) {
        resetGame(p);
      }
      break;
  }
}

// Process key release for the game
export function processKeyReleased(p, keyCode) {
  // Log input release
  p.logs.inputs.push({
    input_type: "keyReleased",
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

// Start the game
function startGame(p) {
  gameState.gamePhase = "PLAYING";
  
  // Log game status change
  p.logs.game_info.push({
    game_status: gameState.gamePhase,
    data: {},
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  p.loop();
}

// Pause the game
function pauseGame(p) {
  gameState.gamePhase = "PAUSED";
  
  // Log game status change
  p.logs.game_info.push({
    game_status: gameState.gamePhase,
    data: {},
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  p.noLoop();
}

// Resume the game
function resumeGame(p) {
  gameState.gamePhase = "PLAYING";
  
  // Log game status change
  p.logs.game_info.push({
    game_status: gameState.gamePhase,
    data: {},
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  p.loop();
}

// Restart the game
function restartGame(p) {
  resetGame(p);
  startGame(p);
}

// Reset the game state
export function resetGame(p) {
  gameState.gamePhase = "START";
  gameState.score = 0;
  gameState.distance = 0;
  gameState.scrollSpeed = 5;
  gameState.currentCheckpoint = 0;
  gameState.jumpCount = 0;
  
  // Reset player position
  if (gameState.player) {
    gameState.player.reset(100, 200);
  }
  
  // Reset level
  if (gameState.level) {
    gameState.level.reset();
  }
  
  // Log game status change
  p.logs.game_info.push({
    game_status: gameState.gamePhase,
    data: {},
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

// Game over (win)
export function winGame(p) {
  gameState.gamePhase = "GAME_OVER_WIN";
  
  // Log game status change
  p.logs.game_info.push({
    game_status: gameState.gamePhase,
    data: { score: gameState.score, jumps: gameState.jumpCount, deaths: gameState.deathCount },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  p.noLoop();
}

// Game over (lose)
export function loseGame(p) {
  gameState.gamePhase = "GAME_OVER_LOSE";
  gameState.deathCount++;
  
  // Log game status change
  p.logs.game_info.push({
    game_status: gameState.gamePhase,
    data: { distance: Math.floor(gameState.distance), deaths: gameState.deathCount },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // If we have checkpoints, respawn at the last checkpoint
  if (gameState.checkpoints.length > 0 && gameState.currentCheckpoint > 0) {
    // Find the checkpoint we need to respawn at
    const checkpoint = gameState.checkpoints.find(c => c.id === gameState.currentCheckpoint - 1);
    if (checkpoint) {
      // Reset player to checkpoint position
      gameState.player.reset(100, 200);
      gameState.distance = checkpoint.x - 100;
      gameState.gamePhase = "PLAYING";
      
      // Log respawn
      p.logs.game_info.push({
        game_status: "CHECKPOINT_RESPAWN",
        data: { checkpoint: gameState.currentCheckpoint - 1, distance: Math.floor(gameState.distance) },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      
      p.loop();
      return;
    }
  }
  
  p.noLoop();
}