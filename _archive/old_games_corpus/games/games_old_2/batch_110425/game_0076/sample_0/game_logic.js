// game_logic.js - Core game logic
import { gameState, GAME_PHASES } from './globals.js';

export function updateGame(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  // Update current vignette
  if (gameState.currentVignette) {
    gameState.currentVignette.update(p);
    
    // Check for vignette completion
    if (gameState.currentVignette.checkCompletion() && !gameState.vignetteComplete) {
      gameState.vignetteComplete = true;
      gameState.transitionTimer = p.frameCount + 60; // 1 second delay
      
      gameState.completedVignettes++;
      gameState.score += 100;
      
      p.logs.game_info.push({
        data: { 
          event: "vignette_complete", 
          index: gameState.currentVignetteIndex,
          type: gameState.currentVignette.type
        },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    // Handle transition to next vignette
    if (gameState.vignetteComplete && p.frameCount >= gameState.transitionTimer) {
      advanceToNextVignette(p);
    }
  }
  
  // Log player info periodically (every 30 frames)
  if (p.frameCount % 30 === 0) {
    logPlayerInfo(p);
  }
}

function advanceToNextVignette(p) {
  gameState.currentVignetteIndex++;
  gameState.vignetteComplete = false;
  
  if (gameState.currentVignetteIndex >= gameState.totalVignettes) {
    // Game complete
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    gameState.currentVignette = null;
    
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_WIN", score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    return;
  }
  
  // Load next vignette
  gameState.currentVignette = gameState.storyBeats[gameState.currentVignetteIndex];
  
  p.logs.game_info.push({
    data: { 
      event: "vignette_started", 
      index: gameState.currentVignetteIndex,
      type: gameState.currentVignette.type
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function logPlayerInfo(p) {
  let playerData = {
    screen_x: 0,
    screen_y: 0,
    game_x: 0,
    game_y: 0,
    framecount: p.frameCount
  };
  
  // Extract player position from current vignette
  if (gameState.currentVignette && gameState.currentVignette.data) {
    const data = gameState.currentVignette.data;
    if (data.playerX !== undefined) {
      playerData.screen_x = data.playerX;
      playerData.screen_y = data.playerY;
      playerData.game_x = data.playerX;
      playerData.game_y = data.playerY;
    } else if (data.brushX !== undefined) {
      playerData.screen_x = data.brushX;
      playerData.screen_y = data.brushY;
      playerData.game_x = data.brushX;
      playerData.game_y = data.brushY;
    }
  }
  
  p.logs.player_info.push(playerData);
}