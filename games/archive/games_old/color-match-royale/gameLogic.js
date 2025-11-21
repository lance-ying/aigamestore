import { gameState, GAME_PHASES, DIRECTION, CARD_WIDTH, CARD_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Card, createDeck, shuffleDeck } from './card.js';
import { Player } from './player.js';
import { CARD_TYPES } from './globals.js';

export function initializeLevel(level, p) {
  gameState.currentLevel = level;
  gameState.drawPile = createDeck();
  shuffleDeck(gameState.drawPile, p);
  gameState.discardPile = [];
  gameState.direction = DIRECTION.CLOCKWISE;
  gameState.selectedCardIndex = 0;
  gameState.colorSelectionMode = false;
  gameState.unoCalledThisTurn = false;
  gameState.mustCallUno = false;
  gameState.aiThinkDelay = 0;
  gameState.pendingAction = null;
  gameState.roundStartTime = Date.now();
  
  const numAI = level >= 4 ? 4 : 3;
  gameState.players = [];
  
  const humanPlayer = new Player(0, true);
  gameState.players.push(humanPlayer);
  gameState.player = humanPlayer;
  
  for (let i = 1; i <= numAI; i++) {
    gameState.players.push(new Player(i, false));
  }
  
  const initialHandSize = (level === 5 && humanPlayer.isHuman) ? 5 : 7;
  
  for (let i = 0; i < initialHandSize; i++) {
    humanPlayer.addCard(gameState.drawPile.pop());
  }
  
  for (let i = 1; i <= numAI; i++) {
    for (let j = 0; j < 7; j++) {
      gameState.players[i].addCard(gameState.drawPile.pop());
    }
  }
  
  let startCard = gameState.drawPile.pop();
  while (startCard.type === CARD_TYPES.WILD || startCard.type === CARD_TYPES.WILD_DRAW_FOUR) {
    gameState.drawPile.unshift(startCard);
    shuffleDeck(gameState.drawPile, p);
    startCard = gameState.drawPile.pop();
  }
  
  gameState.discardPile.push(startCard);
  gameState.currentColor = startCard.color;
  gameState.currentPlayerIndex = 0;
  gameState.turnStartTime = Date.now();
  
  if (p.logs) {
    p.logs.game_info.push({
      data: { phase: 'LEVEL_STARTED', level: level },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function drawCardFromPile(player, p) {
  if (gameState.drawPile.length === 0) {
    reshuffleDiscardPile(p);
  }
  
  if (gameState.drawPile.length > 0) {
    const card = gameState.drawPile.pop();
    player.addCard(card);
    
    if (p.logs && player.isHuman) {
      p.logs.player_info.push({
        screen_x: CANVAS_WIDTH / 2,
        screen_y: CANVAS_HEIGHT - 100,
        game_x: CANVAS_WIDTH / 2,
        game_y: CANVAS_HEIGHT - 100,
        framecount: p.frameCount
      });
    }
    
    return card;
  }
  return null;
}

function reshuffleDiscardPile(p) {
  if (gameState.discardPile.length <= 1) return;
  
  const topCard = gameState.discardPile.pop();
  gameState.drawPile = [...gameState.discardPile];
  gameState.discardPile = [topCard];
  shuffleDeck(gameState.drawPile, p);
}

export function playCard(player, cardIndex, p) {
  const card = player.hand[cardIndex];
  const topCard = gameState.discardPile[gameState.discardPile.length - 1];
  
  if (!card.canPlayOn(topCard, gameState.currentColor)) {
    return false;
  }
  
  player.removeCard(cardIndex);
  gameState.discardPile.push(card);
  
  if (card.type !== CARD_TYPES.WILD && card.type !== CARD_TYPES.WILD_DRAW_FOUR) {
    if (card.color) {
      gameState.currentColor = card.color;
    }
  }
  
  if (player.isHuman && gameState.selectedCardIndex === cardIndex) {
    gameState.selectedCardIndex = Math.min(gameState.selectedCardIndex, player.hand.length - 1);
    if (gameState.selectedCardIndex < 0 && player.hand.length > 0) {
      gameState.selectedCardIndex = 0;
    }
  } else if (player.isHuman && gameState.selectedCardIndex > cardIndex) {
    gameState.selectedCardIndex--;
  }
  
  if (player.hand.length === 1) {
    if (gameState.currentLevel >= 4 && player.isHuman) {
      gameState.mustCallUno = true;
    } else {
      player.hasCalledUno = true;
    }
  }
  
  if (p.logs && player.isHuman) {
    p.logs.player_info.push({
      screen_x: CANVAS_WIDTH / 2,
      screen_y: CANVAS_HEIGHT - 100,
      game_x: CANVAS_WIDTH / 2,
      game_y: CANVAS_HEIGHT - 100,
      framecount: p.frameCount
    });
  }
  
  return true;
}

export function applyCardEffect(card, p) {
  if (card.type === CARD_TYPES.SKIP) {
    advanceTurn();
  } else if (card.type === CARD_TYPES.REVERSE) {
    gameState.direction = gameState.direction === DIRECTION.CLOCKWISE 
      ? DIRECTION.COUNTER_CLOCKWISE 
      : DIRECTION.CLOCKWISE;
  } else if (card.type === CARD_TYPES.DRAW_TWO) {
    advanceTurn();
    const nextPlayer = gameState.players[gameState.currentPlayerIndex];
    for (let i = 0; i < 2; i++) {
      drawCardFromPile(nextPlayer, p);
    }
    advanceTurn();
    return;
  } else if (card.type === CARD_TYPES.WILD_DRAW_FOUR) {
    advanceTurn();
    const nextPlayer = gameState.players[gameState.currentPlayerIndex];
    for (let i = 0; i < 4; i++) {
      drawCardFromPile(nextPlayer, p);
    }
    advanceTurn();
    return;
  }
  
  advanceTurn();
}

export function advanceTurn() {
  if (gameState.direction === DIRECTION.CLOCKWISE) {
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
  } else {
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex - 1 + gameState.players.length) % gameState.players.length;
  }
  gameState.turnStartTime = Date.now();
  gameState.mustCallUno = false;
  gameState.unoCalledThisTurn = false;
}

export function checkWinCondition() {
  for (const player of gameState.players) {
    if (player.hand.length === 0) {
      if (player.isHuman) {
        calculateRoundScore();
        gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
      } else {
        gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
      }
      return true;
    }
  }
  return false;
}

function calculateRoundScore() {
  let roundScore = 0;
  
  for (const player of gameState.players) {
    if (!player.isHuman) {
      for (const card of player.hand) {
        roundScore += card.getPoints();
      }
    }
  }
  
  const roundDuration = (Date.now() - gameState.roundStartTime) / 1000;
  if (roundDuration < 120) {
    roundScore += 50;
  }
  
  gameState.score += roundScore;
}

export function callUno(player) {
  if (player.hand.length === 1) {
    player.hasCalledUno = true;
    gameState.unoCalledThisTurn = true;
    gameState.mustCallUno = false;
    return true;
  }
  return false;
}

export function checkUnoPenalty(player, p) {
  if (gameState.currentLevel >= 4 && player.isHuman && player.hand.length === 1 && !player.hasCalledUno) {
    for (let i = 0; i < 2; i++) {
      drawCardFromPile(player, p);
    }
    return true;
  }
  return false;
}