import { gameState, GAME_PHASES } from './globals.js';
import { playCard, drawCardFromPile, applyCardEffect, advanceTurn } from './gameLogic.js';
import { CARD_TYPES } from './globals.js';

export function updateTestingMode(p) {
  if (gameState.controlMode === 'HUMAN') return;
  
  if (gameState.controlMode === 'TEST_1') {
    runBasicTest(p);
  } else if (gameState.controlMode === 'TEST_2') {
    runWinTest(p);
  }
}

function runBasicTest(p) {
  if (gameState.gamePhase === GAME_PHASES.START) {
    if (p.frameCount % 60 === 30) {
      gameState.gamePhase = GAME_PHASES.LEVEL_INTRO;
    }
  } else if (gameState.gamePhase === GAME_PHASES.LEVEL_INTRO) {
    if (p.frameCount % 60 === 0) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
    }
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING && !gameState.colorSelectionMode) {
    if (gameState.currentPlayerIndex === 0 && p.frameCount % 30 === 0) {
      const player = gameState.player;
      const topCard = gameState.discardPile[gameState.discardPile.length - 1];
      
      const playableCards = player.getPlayableCards(gameState.currentColor, topCard);
      
      if (playableCards.length > 0) {
        const cardToPlay = playableCards[0];
        playCard(player, cardToPlay.index, p);
        
        const card = gameState.discardPile[gameState.discardPile.length - 1];
        if (card.type === CARD_TYPES.WILD || card.type === CARD_TYPES.WILD_DRAW_FOUR) {
          gameState.currentColor = 'RED';
        }
        
        applyCardEffect(card, p);
      } else {
        drawCardFromPile(player, p);
        advanceTurn();
      }
    }
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
             gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    if (p.frameCount % 120 === 0) {
      gameState.gamePhase = GAME_PHASES.START;
      gameState.score = 0;
      gameState.currentLevel = 1;
    }
  }
}

function runWinTest(p) {
  if (gameState.gamePhase === GAME_PHASES.START) {
    if (p.frameCount % 60 === 30) {
      gameState.gamePhase = GAME_PHASES.LEVEL_INTRO;
    }
  } else if (gameState.gamePhase === GAME_PHASES.LEVEL_INTRO) {
    if (p.frameCount % 60 === 0) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      
      const player = gameState.player;
      player.hand = player.hand.slice(0, 1);
    }
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING && !gameState.colorSelectionMode) {
    if (gameState.currentPlayerIndex === 0 && p.frameCount % 30 === 0) {
      const player = gameState.player;
      
      if (player.hand.length > 0) {
        playCard(player, 0, p);
        
        const card = gameState.discardPile[gameState.discardPile.length - 1];
        if (card.type === CARD_TYPES.WILD || card.type === CARD_TYPES.WILD_DRAW_FOUR) {
          gameState.currentColor = 'RED';
        }
        
        applyCardEffect(card, p);
      }
    }
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    if (p.frameCount % 120 === 0) {
      if (gameState.currentLevel < gameState.maxLevels) {
        gameState.currentLevel++;
        gameState.gamePhase = GAME_PHASES.LEVEL_INTRO;
      } else {
        gameState.gamePhase = GAME_PHASES.GAME_COMPLETE;
      }
    }
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    if (p.frameCount % 120 === 0) {
      gameState.gamePhase = GAME_PHASES.START;
      gameState.score = 0;
      gameState.currentLevel = 1;
    }
  } else if (gameState.gamePhase === GAME_PHASES.GAME_COMPLETE) {
    if (p.frameCount % 120 === 0) {
      gameState.gamePhase = GAME_PHASES.START;
      gameState.score = 0;
      gameState.currentLevel = 1;
    }
  }
}