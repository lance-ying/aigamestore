// gameLoop.js - Main game loop and level management

import { gameState, GAME_PHASES, PLAY_STATES, CATEGORIES } from './globals.js';
import { getLevelConfig } from './levelConfig.js';
import { updateWheel, renderWheel } from './wheel.js';
import { updateQuestion, renderQuestion, renderFeedback, startNewQuestion } from './question.js';
import { renderHUD, renderPausedIndicator, renderStartScreen, renderLevelComplete, renderGameOver } from './ui.js';
import { Player } from './player.js';

export function startLevel(p, level) {
  gameState.currentLevel = level;
  gameState.levelConfig = getLevelConfig(level);
  gameState.livesRemaining = gameState.levelConfig.startingLives;
  gameState.availablePowerups = { ...gameState.levelConfig.powerups };
  gameState.playState = PLAY_STATES.SPINNING;
  gameState.wheelSpeed = 0;
  
  // Reset category tracking
  for (const cat of CATEGORIES) {
    gameState.categoryCorrectCounts[cat.name] = 0;
    gameState.earnedCrowns[cat.name] = false;
  }
  
  // Initialize player if not exists
  if (!gameState.player) {
    gameState.player = new Player();
  }
  
  if (p.logs) {
    p.logs.game_info.push({
      data: `Level ${level} started: ${gameState.levelConfig.name}`,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    p.logs.player_info.push({
      screen_x: 0,
      screen_y: 0,
      game_x: 0,
      game_y: 0,
      framecount: p.frameCount
    });
  }
}

export function nextLevel(p) {
  const nextLevelNum = gameState.currentLevel + 1;
  
  if (nextLevelNum > 5) {
    // Game won!
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    
    // Update high score
    if (gameState.currentScore > gameState.highScore) {
      gameState.highScore = gameState.currentScore;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('triviaHighScore', gameState.highScore.toString());
      }
    }
    
    if (p.logs) {
      p.logs.game_info.push({
        data: "Game won! All levels completed",
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else {
    startLevel(p, nextLevelNum);
  }
}

export function updateGame(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  if (gameState.playState === PLAY_STATES.SPINNING) {
    updateWheel(p);
  } else if (gameState.playState === PLAY_STATES.QUESTION) {
    updateQuestion(p);
  }
  
  // Update player
  if (gameState.player) {
    gameState.player.update();
  }
}

export function renderGame(p) {
  p.background(30, 20, 50);
  
  if (gameState.gamePhase === GAME_PHASES.START) {
    renderStartScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    if (gameState.playState === PLAY_STATES.SPINNING) {
      renderWheel(p);
    } else if (gameState.playState === PLAY_STATES.QUESTION) {
      renderQuestion(p);
    } else if (gameState.playState === PLAY_STATES.FEEDBACK) {
      renderQuestion(p);
      renderFeedback(p);
    } else if (gameState.playState === PLAY_STATES.LEVEL_COMPLETE) {
      renderLevelComplete(p);
    }
    
    renderHUD(p);
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    // Render game state but with pause indicator
    if (gameState.playState === PLAY_STATES.SPINNING) {
      renderWheel(p);
    } else if (gameState.playState === PLAY_STATES.QUESTION) {
      renderQuestion(p);
    }
    renderHUD(p);
    renderPausedIndicator(p);
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    renderGameOver(p, true);
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    renderGameOver(p, false);
  }
}