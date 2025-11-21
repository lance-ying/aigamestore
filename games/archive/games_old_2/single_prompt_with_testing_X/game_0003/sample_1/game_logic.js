// game_logic.js - Core game logic
import { 
  gameState, 
  CANVAS_WIDTH,
  PHASE_PLAYING, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE 
} from './globals.js';

export function updateGame(p) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  gameState.framesSinceStart++;
  
  // Update player
  gameState.player.update(gameState.jellyFeverActive);
  
  // Update distance
  gameState.distance += gameState.currentSpeed;
  
  // Update camera (follow player)
  gameState.cameraOffsetX = gameState.distance - CANVAS_WIDTH / 4;
  gameState.backgroundOffset += gameState.currentSpeed;
  
  // Update obstacles
  for (let obstacle of gameState.obstacles) {
    obstacle.update();
    
    // Check if obstacle was passed (for combo)
    if (!obstacle.passed && obstacle.x < gameState.player.x) {
      obstacle.passed = true;
      gameState.obstaclesPassed++;
      gameState.combo++;
      gameState.score += 10 * gameState.combo;
      
      // Trigger Jelly Fever after 5 consecutive passes
      if (gameState.combo >= 5 && !gameState.jellyFeverActive) {
        activateJellyFever();
      }
    }
    
    // Check collision
    if (obstacle.checkCollision(gameState.player)) {
      gameOver(p, false);
      return;
    }
  }
  
  // Update diamonds
  for (let diamond of gameState.diamonds) {
    diamond.update();
    if (diamond.checkCollection(gameState.player)) {
      gameState.score += 50;
    }
  }
  
  // Update Jelly Fever
  if (gameState.jellyFeverActive) {
    gameState.jellyFeverTimer--;
    if (gameState.jellyFeverTimer <= 0) {
      deactivateJellyFever();
    }
  }
  
  // Check if reached finish line
  if (gameState.player.x >= gameState.finishLineX) {
    gameOver(p, true);
    return;
  }
  
  // Log player info
  if (p.frameCount % 10 === 0) {
    const bounds = gameState.player.getBounds();
    p.logs.player_info.push({
      screen_x: gameState.player.x - gameState.cameraOffsetX,
      screen_y: gameState.player.y,
      game_x: gameState.player.x,
      game_y: gameState.player.y,
      framecount: p.frameCount
    });
  }
}

function activateJellyFever() {
  gameState.jellyFeverActive = true;
  gameState.jellyFeverTimer = 300; // 5 seconds at 60 FPS
  gameState.currentSpeed = gameState.baseSpeed * 2;
}

function deactivateJellyFever() {
  gameState.jellyFeverActive = false;
  gameState.currentSpeed = gameState.baseSpeed;
}

function gameOver(p, win) {
  if (win) {
    gameState.gamePhase = PHASE_GAME_OVER_WIN;
    gameState.level++;
    gameState.score += 500; // Completion bonus
  } else {
    gameState.gamePhase = PHASE_GAME_OVER_LOSE;
    gameState.combo = 0; // Reset combo on collision
    gameState.jellyFeverActive = false;
    gameState.currentSpeed = gameState.baseSpeed;
  }
  
  p.logs.game_info.push({
    data: { 
      phase: gameState.gamePhase,
      score: gameState.score,
      level: gameState.level,
      distance: gameState.distance
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}