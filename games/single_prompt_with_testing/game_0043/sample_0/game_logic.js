// game_logic.js - Core game logic

import { 
  gameState, 
  PHASE_PLAYING, PHASE_GAME_OVER_WIN,
  PACKAGES_TO_DELIVER, TREASURES_TO_WIN
} from './globals.js';
import { checkCollisions, handleInteraction } from './collision.js';
import { updateCamera } from './world.js';

export function updateGame(p, inputs) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  // Update player
  if (gameState.player) {
    gameState.player.update(p, inputs);
    
    // Log player info periodically
    if (p.frameCount % 10 === 0) {
      p.logs.player_info.push({
        screen_x: gameState.player.x - gameState.camera.x,
        screen_y: gameState.player.y - gameState.camera.y,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        framecount: p.frameCount
      });
    }
  }
  
  // Handle interactions
  if (inputs.interact) {
    handleInteraction(p);
  }
  
  // Check collisions
  checkCollisions(p);
  
  // Update camera
  updateCamera(p);
  
  // Check win condition
  if (gameState.deliveriesCompleted >= PACKAGES_TO_DELIVER && 
      gameState.treasuresCollected >= TREASURES_TO_WIN) {
    gameState.gamePhase = PHASE_GAME_OVER_WIN;
    p.logs.game_info.push({
      data: { phase: PHASE_GAME_OVER_WIN, win: true },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Update world time
  gameState.worldTime++;
}

export function resetGame(p) {
  gameState.score = 0;
  gameState.money = 0;
  gameState.deliveriesCompleted = 0;
  gameState.treasuresCollected = 0;
  gameState.worldTime = 0;
  
  // Reset will happen in setup when starting new game
}