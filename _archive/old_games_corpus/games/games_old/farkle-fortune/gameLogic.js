// gameLogic.js - Core game logic

import { gameState, GAME_PHASES, TURN_PHASES, PLAYERS, LEVEL_CONFIG } from './globals.js';
import { calculateScore, hasAnyScoring } from './scoring.js';
import { aiSelectDice, aiDecideAction } from './ai.js';

export function rollDice(p) {
  // Determine which dice to roll
  const diceToRoll = [];
  
  if (gameState.selectedDiceIndices.length === gameState.dice.length) {
    // Hot dice! Roll all dice again
    gameState.selectedDiceIndices = [];
    gameState.remainingDiceToRoll = 6;
  }
  
  for (let i = 0; i < gameState.dice.length; i++) {
    if (!gameState.selectedDiceIndices.includes(i)) {
      diceToRoll.push(i);
    }
  }
  
  // Roll the dice
  for (let i of diceToRoll) {
    gameState.dice[i].roll(p);
  }
  
  gameState.remainingDiceToRoll = diceToRoll.length;
  gameState.turnPhase = TURN_PHASES.ROLLING;
  gameState.rollAnimationFrame = 0;
}

export function bankScore(p) {
  if (gameState.currentPlayer === PLAYERS.PLAYER) {
    gameState.playerScoreTotal += gameState.currentTurnScore;
    
    p.logs.player_info.push({
      screen_x: 0,
      screen_y: 0,
      game_x: 0,
      game_y: 0,
      score: gameState.playerScoreTotal,
      framecount: p.frameCount
    });
  } else {
    gameState.aiScoreTotal += gameState.currentTurnScore;
  }
  
  gameState.turnPhase = TURN_PHASES.BANKING;
  gameState.bankAnimationFrame = 0;
}

export function selectDice(index) {
  const i = gameState.selectedDiceIndices.indexOf(index);
  if (i >= 0) {
    // Deselect
    gameState.selectedDiceIndices.splice(i, 1);
  } else {
    // Select
    gameState.selectedDiceIndices.push(index);
  }
  
  // Update current turn score
  const selectedDice = gameState.selectedDiceIndices.map(i => gameState.dice[i]);
  gameState.currentTurnScore = calculateScore(selectedDice);
  
  // Update can bank/roll again
  updateActionAvailability();
}

export function deselectAllDice() {
  gameState.selectedDiceIndices = [];
  gameState.currentTurnScore = 0;
  updateActionAvailability();
}

function updateActionAvailability() {
  const selectedDice = gameState.selectedDiceIndices.map(i => gameState.dice[i]);
  const score = calculateScore(selectedDice);
  
  gameState.canBank = score >= gameState.minBankScore && selectedDice.length > 0;
  
  const unselectedDice = gameState.dice.filter((d, i) => !gameState.selectedDiceIndices.includes(i));
  gameState.canRollAgain = selectedDice.length > 0 && score > 0 && unselectedDice.length > 0;
}

export function checkFarkle(p) {
  const availableDice = gameState.dice.filter((d, i) => !gameState.selectedDiceIndices.includes(i));
  
  if (!hasAnyScoring(availableDice)) {
    // Farkle!
    gameState.currentTurnScore = 0;
    gameState.turnPhase = TURN_PHASES.FARKLE;
    gameState.farkleAnimationFrame = 0;
    return true;
  }
  
  return false;
}

export function updateTurnPhases(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  // Rolling animation
  if (gameState.turnPhase === TURN_PHASES.ROLLING) {
    gameState.rollAnimationFrame++;
    
    // Animate dice
    for (let i = 0; i < gameState.dice.length; i++) {
      if (!gameState.selectedDiceIndices.includes(i)) {
        const progress = gameState.rollAnimationFrame / gameState.rollAnimationDuration;
        if (progress < 1) {
          gameState.dice[i].animX = gameState.dice[i].x + p.sin(gameState.rollAnimationFrame * 0.5) * 20;
          gameState.dice[i].animY = gameState.dice[i].y + p.cos(gameState.rollAnimationFrame * 0.5) * 20;
          gameState.dice[i].animRotation = gameState.rollAnimationFrame * 0.3;
        } else {
          gameState.dice[i].animX = gameState.dice[i].x;
          gameState.dice[i].animY = gameState.dice[i].y;
          gameState.dice[i].animRotation = 0;
        }
      }
    }
    
    if (gameState.rollAnimationFrame >= gameState.rollAnimationDuration) {
      // Check for farkle
      if (checkFarkle(p)) {
        return;
      }
      
      // If AI, auto-select dice
      if (gameState.currentPlayer === PLAYERS.AI) {
        gameState.turnPhase = TURN_PHASES.AI_THINKING;
        gameState.aiDecisionDelay = 30;
      } else {
        gameState.turnPhase = TURN_PHASES.SELECTING;
        gameState.selectedDieIndex = 0;
      }
      
      updateActionAvailability();
    }
    return;
  }
  
  // AI thinking
  if (gameState.turnPhase === TURN_PHASES.AI_THINKING) {
    gameState.aiDecisionDelay--;
    
    if (gameState.aiDecisionDelay <= 0) {
      // AI selects dice
      const selectedIndices = aiSelectDice();
      gameState.selectedDiceIndices = selectedIndices;
      
      const selectedDice = gameState.selectedDiceIndices.map(i => gameState.dice[i]);
      gameState.currentTurnScore = calculateScore(selectedDice);
      
      updateActionAvailability();
      
      // AI decides action
      gameState.aiDecisionDelay = 30;
      gameState.aiDecisionMade = false;
      gameState.turnPhase = TURN_PHASES.SELECTING;
      
      // Auto-execute AI decision after delay
      setTimeout(() => {
        if (gameState.currentPlayer === PLAYERS.AI && gameState.gamePhase === GAME_PHASES.PLAYING) {
          const action = aiDecideAction();
          if (action === 'BANK') {
            bankScore(p);
          } else if (action === 'ROLL') {
            rollDice(p);
          }
        }
      }, 500);
    }
    return;
  }
  
  // Banking animation
  if (gameState.turnPhase === TURN_PHASES.BANKING) {
    gameState.bankAnimationFrame++;
    
    if (gameState.bankAnimationFrame >= gameState.animationDuration) {
      // Check win condition
      if (gameState.currentPlayer === PLAYERS.PLAYER && gameState.playerScoreTotal >= gameState.targetScore) {
        if (gameState.level < 3) {
          // Next level
          gameState.level++;
          const levelConfig = LEVEL_CONFIG[gameState.level - 1];
          gameState.targetScore = levelConfig.targetScore;
          gameState.playerScoreTotal = 0;
          gameState.aiScoreTotal = 0;
          gameState.currentTurnScore = 0;
          gameState.selectedDiceIndices = [];
          gameState.remainingDiceToRoll = 6;
          gameState.currentPlayer = PLAYERS.PLAYER;
          gameState.turnPhase = TURN_PHASES.WAITING_TO_ROLL;
          
          p.logs.game_info.push({
            data: { event: "level_complete", level: gameState.level },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        } else {
          // Win game
          gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
          
          p.logs.game_info.push({
            data: { phase: "GAME_OVER_WIN" },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
        return;
      } else if (gameState.currentPlayer === PLAYERS.AI && gameState.aiScoreTotal >= gameState.targetScore) {
        // AI wins
        gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
        
        p.logs.game_info.push({
          data: { phase: "GAME_OVER_LOSE" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
        return;
      }
      
      // Switch player
      endTurn(p);
    }
    return;
  }
  
  // Farkle animation
  if (gameState.turnPhase === TURN_PHASES.FARKLE) {
    gameState.farkleAnimationFrame++;
    
    if (gameState.farkleAnimationFrame >= gameState.animationDuration) {
      endTurn(p);
    }
    return;
  }
}

function endTurn(p) {
  gameState.currentPlayer = gameState.currentPlayer === PLAYERS.PLAYER ? PLAYERS.AI : PLAYERS.PLAYER;
  gameState.currentTurnScore = 0;
  gameState.selectedDiceIndices = [];
  gameState.remainingDiceToRoll = 6;
  gameState.turnPhase = TURN_PHASES.WAITING_TO_ROLL;
  
  // If AI turn, auto-roll after delay
  if (gameState.currentPlayer === PLAYERS.AI) {
    setTimeout(() => {
      if (gameState.currentPlayer === PLAYERS.AI && gameState.gamePhase === GAME_PHASES.PLAYING) {
        rollDice(p);
      }
    }, 500);
  }
}