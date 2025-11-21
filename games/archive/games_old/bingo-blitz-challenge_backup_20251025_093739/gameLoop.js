// gameLoop.js
import { gameState, GAME_PHASES, LEVEL_CONFIG } from './globals.js';
import { updateNumberCalling } from './numberCaller.js';
import { updateBoosters } from './boosters.js';
import { updateAutoController } from './autoController.js';
import { generateBingoCard } from './bingoCard.js';

let lastFrameTime = 0;

export function updateGame(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  const currentTime = Date.now();
  const deltaTime = (currentTime - lastFrameTime) / 1000;
  lastFrameTime = currentTime;
  
  // Update time
  gameState.timeRemaining = Math.max(0, gameState.timeRemaining - deltaTime);
  
  // Update number calling
  updateNumberCalling(p);
  
  // Update boosters
  updateBoosters(p);
  
  // Auto controller
  updateAutoController(p);
  
  // Check win/lose conditions
  checkGameOver(p);
  
  // Log player info periodically
  if (p.frameCount % 60 === 0) {
    logPlayerInfo(p);
  }
}

function checkGameOver(p) {
  if (gameState.timeRemaining <= 0) {
    const config = LEVEL_CONFIG[gameState.level - 1];
    
    if (gameState.score >= config.targetScore) {
      // Level complete
      if (gameState.level < 4) {
        gameState.level++;
        gameState.timeRemaining = 180;
        gameState.bingoCard = generateBingoCard(p);
        gameState.markedSquares = new Set();
        gameState.markedSquares.add('2,2'); // FREE space
        gameState.calledNumbers = [];
        gameState.currentCalledNumber = null;
        gameState.bingosAchieved = 0;
        gameState.nextNumberCallTime = Date.now() + 1000;
        gameState.boosterMeter = 0;
        gameState.boosters = {
          instantMark: { available: false, active: false },
          scoreMultiplier: { available: false, active: false, endTime: 0 },
          freeMark: { available: false, active: false }
        };
        
        p.logs.game_info.push({
          data: { phase: 'LEVEL_COMPLETE', level: gameState.level - 1, score: gameState.score },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else {
        // Game won
        gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
        p.logs.game_info.push({
          data: { phase: 'GAME_OVER_WIN', score: gameState.score },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else {
      // Level failed
      gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
      p.logs.game_info.push({
        data: { phase: 'GAME_OVER_LOSE', score: gameState.score, level: gameState.level },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
}

function logPlayerInfo(p) {
  const CANVAS_WIDTH = 600;
  const CANVAS_HEIGHT = 400;
  p.logs.player_info.push({
    screen_x: CANVAS_WIDTH / 2,
    screen_y: CANVAS_HEIGHT / 2,
    game_x: gameState.selectedCol,
    game_y: gameState.selectedRow,
    framecount: p.frameCount
  });
}