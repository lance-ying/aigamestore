// game_logic.js - Core game logic
import { gameState, GAME_PHASES } from './globals.js';
import { setupLevel } from './levels.js';

export function updateGame(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  // Handle level transitions
  if (gameState.levelComplete) {
    gameState.transitionTimer--;
    
    if (gameState.transitionTimer <= 0) {
      gameState.currentLevel++;
      
      if (gameState.currentLevel >= gameState.totalLevels) {
        // Game won!
        gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
        p.logs.game_info.push({
          data: { 
            gamePhase: "GAME_OVER_WIN", 
            finalScore: gameState.score,
            orbsCollected: gameState.orbsCollected 
          },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else {
        // Next level
        gameState.panels = setupLevel(gameState.currentLevel);
        gameState.selectedPanel = 0;
        gameState.levelComplete = false;
        gameState.undosRemaining = 3; // Refresh undos for new level
        gameState.swapMode = false;
        gameState.swapFrom = -1;
        
        p.logs.game_info.push({
          data: { event: "level_complete", newLevel: gameState.currentLevel },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
  
  // Update panel effects
  for (let panel of gameState.panels) {
    // Animate glow for orbs
    if (panel.orbRevealed) {
      panel.glowIntensity = 0.5 + 0.5 * p.sin(p.frameCount * 0.1);
    }
  }
  
  // Log player info periodically (every 30 frames)
  if (p.frameCount % 30 === 0) {
    p.logs.player_info.push({
      screen_x: gameState.selectedPanel % 2,
      screen_y: Math.floor(gameState.selectedPanel / 2),
      game_x: gameState.selectedPanel,
      game_y: gameState.currentLevel,
      framecount: p.frameCount
    });
  }
}