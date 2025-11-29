// game_logic.js - Core game logic

import { PHASE_PLAYING, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, NIGHT_DURATION, SPRINGTRAP_AT_OFFICE, MAX_NIGHTS } from './globals.js';
import { updateSystems } from './systems.js';

export function updateGame(p, gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  // Update time
  gameState.timeElapsed++;
  gameState.currentHour = Math.floor((gameState.timeElapsed / NIGHT_DURATION) * 6);
  
  // Check win condition (6 AM)
  if (gameState.timeElapsed >= NIGHT_DURATION) {
    winNight(p, gameState);
    return;
  }
  
  // Update systems
  updateSystems(p, gameState);
  
  // Update Springtrap
  if (gameState.springtrap) {
    gameState.springtrap.update(p, gameState);
    
    // Check lose condition
    if (gameState.springtrap.state === SPRINGTRAP_AT_OFFICE) {
      loseGame(p, gameState);
      return;
    }
  }
  
  // Update player
  if (gameState.player) {
    gameState.player.update();
  }
  
  // Update entities
  gameState.entities.forEach(entity => {
    if (entity.update) {
      entity.update();
    }
  });
  
  // Log player info periodically
  if (p.frameCount % 60 === 0 && gameState.player) {
    p.logs.player_info.push({
      screen_x: gameState.player.x,
      screen_y: gameState.player.y,
      game_x: gameState.player.x,
      game_y: gameState.player.y,
      framecount: p.frameCount
    });
  }
}

export function winNight(p, gameState) {
  gameState.gamePhase = PHASE_GAME_OVER_WIN;
  
  p.logs.game_info.push({
    data: { phase: "GAME_OVER_WIN", night: gameState.currentNight },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Prepare next night
  if (gameState.currentNight < MAX_NIGHTS) {
    gameState.currentNight++;
  }
}

export function loseGame(p, gameState) {
  gameState.gamePhase = PHASE_GAME_OVER_LOSE;
  
  p.logs.game_info.push({
    data: { phase: "GAME_OVER_LOSE", night: gameState.currentNight },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}