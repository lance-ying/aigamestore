// game_logic.js - Core game logic

import { 
  gameState, 
  PHASE_PLAYING, 
  PHASE_GAME_OVER_WIN, 
  PHASE_GAME_OVER_LOSE,
  DUEL_INTRO,
  DUEL_READY,
  DUEL_STEADY,
  DUEL_WAIT,
  DUEL_BANG,
  DUEL_RESULT
} from './globals.js';
import { Player } from './player.js';
import { AIOpponent } from './ai_opponent.js';

let p5Instance = null;

export function initGameLogic(p) {
  p5Instance = p;
}

export function startNewGame() {
  gameState.currentRound = 0;
  gameState.roundsWon = 0;
  gameState.score = 0;
  gameState.gamePhase = PHASE_PLAYING;
  
  startNewRound();
}

export function startNewRound() {
  gameState.currentRound++;
  gameState.duelPhase = DUEL_INTRO;
  gameState.duelTimer = 0;
  gameState.playerDrawTime = null;
  gameState.aiDrawTime = null;
  gameState.playerFouled = false;
  gameState.aiFouled = false;
  gameState.roundWinner = null;
  gameState.roundResultTimer = 0;
  gameState.bangTimestamp = 0;
  
  // Create player
  if (!gameState.player || gameState.currentRound === 1) {
    gameState.player = new Player(150, 280);
  } else {
    gameState.player.reset();
  }
  
  // Create AI opponent with increasing difficulty
  const aiLevel = gameState.currentRound;
  const ai = new AIOpponent(450, 280, aiLevel);
  
  // Set AI difficulty based on level
  ai.reactionTime = 450 - (aiLevel * 20); // 430ms to 250ms
  ai.reactionTime = Math.max(ai.reactionTime, 150);
  
  // Chance AI will try to foul (draw early) increases with level
  const foulChance = Math.min(0.05 + (aiLevel * 0.01), 0.15);
  ai.willFoul = p5Instance.random() < foulChance;
  
  gameState.entities = [gameState.player, ai];
  
  // Log round start
  if (p5Instance) {
    p5Instance.logs.game_info.push({
      data: `Round ${gameState.currentRound} started vs Level ${aiLevel} AI`,
      framecount: p5Instance.frameCount,
      timestamp: Date.now()
    });
  }
}

export function updateGameLogic() {
  if (!p5Instance) return;
  
  // Update all entities
  gameState.entities.forEach(entity => {
    if (entity.update) {
      entity.update();
    }
  });
  
  // Duel phase state machine
  switch (gameState.duelPhase) {
    case DUEL_INTRO:
      gameState.duelTimer++;
      if (gameState.duelTimer > 90) { // 1.5 seconds
        gameState.duelPhase = DUEL_READY;
        gameState.duelTimer = 0;
        gameState.readyStartTime = Date.now();
      }
      break;
      
    case DUEL_READY:
      gameState.duelTimer++;
      if (gameState.duelTimer > 90) { // 1.5 seconds
        gameState.duelPhase = DUEL_STEADY;
        gameState.duelTimer = 0;
      }
      break;
      
    case DUEL_STEADY:
      gameState.duelTimer++;
      if (gameState.duelTimer > 90) { // 1.5 seconds
        gameState.duelPhase = DUEL_WAIT;
        gameState.duelTimer = 0;
      }
      break;
      
    case DUEL_WAIT:
      gameState.duelTimer++;
      // Random wait time between 0.5 to 2 seconds
      const waitFrames = 30 + p5Instance.floor(p5Instance.random(90));
      
      if (gameState.duelTimer > waitFrames) {
        gameState.duelPhase = DUEL_BANG;
        gameState.duelTimer = 0;
        gameState.bangTimestamp = Date.now();
        
        // Check if AI should foul
        const ai = gameState.entities[1];
        if (ai && !ai.willFoul) {
          // Schedule AI draw after reaction time
          setTimeout(() => {
            if (gameState.duelPhase === DUEL_BANG && !gameState.roundWinner) {
              handleAIDraw();
            }
          }, ai.reactionTime);
        }
      }
      break;
      
    case DUEL_BANG:
      // Waiting for player or AI to draw
      // Check if both have drawn or someone fouled
      if (gameState.roundWinner) {
        gameState.duelPhase = DUEL_RESULT;
        gameState.roundResultTimer = 0;
      }
      break;
      
    case DUEL_RESULT:
      gameState.roundResultTimer++;
      if (gameState.roundResultTimer > 150) { // 2.5 seconds
        // Move to next round or game over
        if (gameState.roundWinner === 'player') {
          gameState.roundsWon++;
          gameState.score += 100 * gameState.currentRound;
          
          if (gameState.currentRound >= gameState.totalRounds) {
            gameState.gamePhase = PHASE_GAME_OVER_WIN;
            p5Instance.logs.game_info.push({
              data: `Game Won! Final Score: ${gameState.score}`,
              framecount: p5Instance.frameCount,
              timestamp: Date.now()
            });
          } else {
            startNewRound();
          }
        } else {
          gameState.gamePhase = PHASE_GAME_OVER_LOSE;
          p5Instance.logs.game_info.push({
            data: `Game Lost at Round ${gameState.currentRound}`,
            framecount: p5Instance.frameCount,
            timestamp: Date.now()
          });
        }
      }
      break;
  }
}

export function handlePlayerDraw() {
  if (!gameState.player || gameState.player.hasDrawn) return;
  
  const currentTime = Date.now();
  
  // Check if this is a foul (drawing before BANG)
  if (gameState.duelPhase !== DUEL_BANG) {
    gameState.playerFouled = true;
    gameState.roundWinner = 'ai';
    gameState.player.startDraw();
    
    p5Instance.logs.game_info.push({
      data: 'Player fouled - drew too early',
      framecount: p5Instance.frameCount,
      timestamp: currentTime
    });
    return;
  }
  
  // Valid draw
  gameState.playerDrawTime = currentTime - gameState.bangTimestamp;
  gameState.player.startDraw();
  
  p5Instance.logs.player_info.push({
    screen_x: gameState.player.x,
    screen_y: gameState.player.y,
    game_x: gameState.player.x,
    game_y: gameState.player.y,
    framecount: p5Instance.frameCount
  });
  
  // Check if AI has already drawn
  checkRoundWinner();
}

function handleAIDraw() {
  const ai = gameState.entities[1];
  if (!ai || ai.hasDrawn) return;
  
  const currentTime = Date.now();
  
  // AI draws
  gameState.aiDrawTime = currentTime - gameState.bangTimestamp;
  ai.startDraw();
  
  p5Instance.logs.game_info.push({
    data: `AI drew with reaction time: ${gameState.aiDrawTime}ms`,
    framecount: p5Instance.frameCount,
    timestamp: currentTime
  });
  
  checkRoundWinner();
}

export function handleAIFoul() {
  const ai = gameState.entities[1];
  if (!ai || ai.hasDrawn) return;
  
  gameState.aiFouled = true;
  gameState.roundWinner = 'player';
  ai.startDraw();
  
  p5Instance.logs.game_info.push({
    data: 'AI fouled - drew too early',
    framecount: p5Instance.frameCount,
    timestamp: Date.now()
  });
}

function checkRoundWinner() {
  if (gameState.roundWinner) return; // Already determined
  
  // Check if both have drawn
  if (gameState.playerDrawTime !== null && gameState.aiDrawTime !== null) {
    if (gameState.playerDrawTime < gameState.aiDrawTime) {
      gameState.roundWinner = 'player';
    } else {
      gameState.roundWinner = 'ai';
    }
    
    p5Instance.logs.game_info.push({
      data: `Round ${gameState.currentRound} winner: ${gameState.roundWinner} (Player: ${gameState.playerDrawTime}ms, AI: ${gameState.aiDrawTime}ms)`,
      framecount: p5Instance.frameCount,
      timestamp: Date.now()
    });
  }
}