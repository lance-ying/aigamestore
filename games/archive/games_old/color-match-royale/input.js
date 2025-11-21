import { gameState, GAME_PHASES } from './globals.js';
import { playCard, drawCardFromPile, applyCardEffect, checkWinCondition, callUno, advanceTurn, checkUnoPenalty } from './gameLogic.js';
import { CARD_TYPES } from './globals.js';
import { getAIMove } from './ai.js';

export function handleKeyPressed(p) {
  if (p.logs) {
    p.logs.inputs.push({
      input_type: 'keyPressed',
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  if (gameState.controlMode !== 'HUMAN') return;
  
  if (p.keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      gameState.gamePhase = GAME_PHASES.LEVEL_INTRO;
      if (p.logs) {
        p.logs.game_info.push({
          data: { phase: 'LEVEL_INTRO' },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  } else if (p.keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      if (p.logs) {
        p.logs.game_info.push({
          data: { phase: 'PAUSED' },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      if (p.logs) {
        p.logs.game_info.push({
          data: { phase: 'PLAYING' },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  } else if (p.keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE ||
        gameState.gamePhase === GAME_PHASES.GAME_COMPLETE ||
        gameState.gamePhase === GAME_PHASES.HIGH_SCORES) {
      gameState.gamePhase = GAME_PHASES.START;
      gameState.score = 0;
      gameState.currentLevel = 1;
      if (p.logs) {
        p.logs.game_info.push({
          data: { phase: 'START' },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
  
  if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.currentPlayerIndex === 0) {
    if (gameState.colorSelectionMode) {
      handleColorSelection(p);
    } else {
      handleGameplayInput(p);
    }
  }
}

function handleGameplayInput(p) {
  const player = gameState.player;
  
  if (p.keyCode === 37) { // LEFT
    if (player.hand.length > 0) {
      if (gameState.selectedCardIndex < 0) {
        gameState.selectedCardIndex = 0;
      } else {
        gameState.selectedCardIndex = (gameState.selectedCardIndex - 1 + player.hand.length) % player.hand.length;
      }
    }
  } else if (p.keyCode === 39) { // RIGHT
    if (player.hand.length > 0) {
      if (gameState.selectedCardIndex < 0) {
        gameState.selectedCardIndex = 0;
      } else {
        gameState.selectedCardIndex = (gameState.selectedCardIndex + 1) % player.hand.length;
      }
    }
  } else if (p.keyCode === 32) { // SPACE
    if (gameState.selectedCardIndex >= 0 && gameState.selectedCardIndex < player.hand.length) {
      const card = player.hand[gameState.selectedCardIndex];
      const topCard = gameState.discardPile[gameState.discardPile.length - 1];
      
      if (card.canPlayOn(topCard, gameState.currentColor)) {
        const success = playCard(player, gameState.selectedCardIndex, p);
        
        if (success) {
          if (card.type === CARD_TYPES.WILD || card.type === CARD_TYPES.WILD_DRAW_FOUR) {
            gameState.colorSelectionMode = true;
            gameState.pendingAction = { card: card, player: player };
          } else {
            applyCardEffect(card, p);
            if (!checkWinCondition()) {
              checkUnoPenalty(player, p);
            }
          }
        }
      } else {
        if (!player.hasPlayableCard(gameState.currentColor, topCard)) {
          drawCardFromPile(player, p);
          advanceTurn();
        }
      }
    } else {
      const topCard = gameState.discardPile[gameState.discardPile.length - 1];
      if (!player.hasPlayableCard(gameState.currentColor, topCard)) {
        drawCardFromPile(player, p);
        advanceTurn();
      }
    }
  } else if (p.keyCode === 90) { // Z
    if (gameState.currentLevel >= 4) {
      callUno(player);
    }
  }
}

function handleColorSelection(p) {
  if (!gameState.colorSelectionMode) return;
  
  const colors = ['RED', 'GREEN', 'BLUE', 'YELLOW'];
  let selectedColorIndex = 0;
  
  if (p.keyCode === 37) { // LEFT
    selectedColorIndex = (selectedColorIndex - 1 + colors.length) % colors.length;
  } else if (p.keyCode === 39) { // RIGHT
    selectedColorIndex = (selectedColorIndex + 1) % colors.length;
  } else if (p.keyCode === 32) { // SPACE
    const chosenColor = colors[selectedColorIndex];
    gameState.currentColor = chosenColor;
    gameState.colorSelectionMode = false;
    
    if (gameState.pendingAction) {
      applyCardEffect(gameState.pendingAction.card, p);
      if (!checkWinCondition()) {
        checkUnoPenalty(gameState.pendingAction.player, p);
      }
      gameState.pendingAction = null;
    }
  }
}

export function processAITurn(p) {
  if (gameState.currentPlayerIndex === 0) return;
  if (gameState.colorSelectionMode) return;
  if (gameState.aiThinkDelay > 0) {
    gameState.aiThinkDelay--;
    return;
  }
  
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const topCard = gameState.discardPile[gameState.discardPile.length - 1];
  
  const aiMove = getAIMove(currentPlayer, gameState.currentColor, topCard, gameState.currentLevel, p);
  
  if (aiMove.action === 'DRAW') {
    drawCardFromPile(currentPlayer, p);
    advanceTurn();
    gameState.aiThinkDelay = 30;
  } else if (aiMove.action === 'PLAY') {
    const card = currentPlayer.hand[aiMove.cardIndex];
    playCard(currentPlayer, aiMove.cardIndex, p);
    
    if (card.type === CARD_TYPES.WILD || card.type === CARD_TYPES.WILD_DRAW_FOUR) {
      gameState.currentColor = aiMove.chosenColor;
    }
    
    if (currentPlayer.hand.length === 1) {
      currentPlayer.hasCalledUno = true;
    }
    
    applyCardEffect(card, p);
    checkWinCondition();
    gameState.aiThinkDelay = 30;
  }
}