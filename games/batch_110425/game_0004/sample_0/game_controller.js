// game_controller.js
import { gameState, GAME_PHASES } from './globals.js';
import { updateCastleResources, updateCrafting } from './castle_manager.js';
import { generateMaze, returnToCastle } from './maze_manager.js';

export function startGame() {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  gameState.currentMode = "CASTLE";
  
  // Initialize game
  gameState.materials = { iron: 50, wood: 50, leather: 20, crystal: 5 };
  gameState.craftingQueue = [];
  gameState.inventory = [];
  gameState.adventurers = [];
  gameState.score = 0;
  gameState.timeElapsed = 0;
  gameState.mazeDepth = 0;
  gameState.selectedRecipe = 0;
  gameState.selectedAdventurer = 0;
  gameState.castleTab = 0;
  gameState.selectedNodeIndex = 0;
  
  generateMaze(1);
  
  // Log game start
  if (window.gameInstance) {
    window.gameInstance.logs.game_info.push({
      data: { phase: "PLAYING", message: "Game started" },
      framecount: window.gameInstance.frameCount,
      timestamp: Date.now()
    });
  }
}

export function pauseGame() {
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    gameState.gamePhase = GAME_PHASES.PAUSED;
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    gameState.gamePhase = GAME_PHASES.PLAYING;
  }
  
  // Log pause state
  if (window.gameInstance) {
    window.gameInstance.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: window.gameInstance.frameCount,
      timestamp: Date.now()
    });
  }
}

export function restartGame() {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.testMoveHistory = [];
  
  // Log restart
  if (window.gameInstance) {
    window.gameInstance.logs.game_info.push({
      data: { phase: "START", message: "Game restarted" },
      framecount: window.gameInstance.frameCount,
      timestamp: Date.now()
    });
  }
}

export function updateGame(deltaTime, p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  gameState.timeElapsed += deltaTime;
  
  // Update castle resources
  updateCastleResources(deltaTime);
  updateCrafting(deltaTime);
  
  // Check win condition
  if (gameState.mazeDepth >= 5 && gameState.score >= 500) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_WIN", score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Check lose condition (all adventurers dead in maze)
  if (gameState.currentMode === "MAZE" && gameState.adventurers.length > 0) {
    const allDead = gameState.adventurers.every(adv => adv.currentHp <= 0);
    if (allDead) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
      p.logs.game_info.push({
        data: { phase: "GAME_OVER_LOSE", score: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  // Log player info periodically
  if (p.frameCount % 30 === 0) {
    p.logs.player_info.push({
      screen_x: gameState.player.x,
      screen_y: gameState.player.y,
      game_x: gameState.player.x,
      game_y: gameState.player.y,
      framecount: p.frameCount
    });
  }
}