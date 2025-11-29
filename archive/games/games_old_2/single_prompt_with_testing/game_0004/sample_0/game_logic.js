import { gameState } from './globals.js';
import { HoopFever, FormulaRace, PenaltyShot, HomeRunDerby, SpeedSkate, SurfMaster, TennisAce } from './mini_games/all_games.js';

export function initializeMiniGame(p) {
  const gameId = gameState.currentMiniGame;
  
  switch(gameId) {
    case 0:
      gameState.miniGameState = new HoopFever(p);
      break;
    case 1:
      gameState.miniGameState = new FormulaRace(p);
      break;
    case 2:
      gameState.miniGameState = new PenaltyShot(p);
      break;
    case 3:
      gameState.miniGameState = new HomeRunDerby(p);
      break;
    case 4:
      gameState.miniGameState = new SpeedSkate(p);
      break;
    case 5:
      gameState.miniGameState = new SurfMaster(p);
      break;
    case 6:
      gameState.miniGameState = new TennisAce(p);
      break;
    default:
      // Placeholder for remaining games
      gameState.miniGameState = new HoopFever(p);
  }
}

export function updateGame(p) {
  if (gameState.gamePhase === "PLAYING" && gameState.miniGameState) {
    gameState.framesSinceStart++;
    
    const result = gameState.miniGameState.update();
    
    // Update score from mini-game state
    if (gameState.miniGameState.state) {
      gameState.score = gameState.miniGameState.state.score;
    }
    
    // Check for game over
    if (result) {
      gameState.gamePhase = result;
      
      p.logs.game_info.push({
        data: { phase: result, finalScore: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    // Log player info periodically
    if (p.frameCount % 30 === 0) {
      p.logs.player_info.push({
        screen_x: gameState.miniGameState.state?.playerX || 0,
        screen_y: gameState.miniGameState.state?.playerY || 0,
        game_x: gameState.miniGameState.state?.playerX || 0,
        game_y: gameState.miniGameState.state?.playerY || 0,
        framecount: p.frameCount
      });
    }
  }
}