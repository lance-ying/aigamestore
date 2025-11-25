// game_logic.js - Core game logic

import { 
  gameState, 
  PHASE_PLAYING, 
  PHASE_GAME_OVER_WIN, 
  PHASE_GAME_OVER_LOSE,
  TURN_STATE_CHOOSE_ACTION,
  TURN_STATE_ANIMATING,
  ROUNDS_TO_WIN,
  MAX_HEALTH
} from './globals.js';
import { initializeShells, getCurrentShell, advanceShell, getRemainingShells } from './shotgun.js';
import { generateItems, useItem, removeItem } from './items.js';
import { Player } from './player.js';

export function initializeGame(p) {
  // Create players
  gameState.player = new Player("You", false);
  gameState.dealer = new Player("Dealer", true);
  
  gameState.entities = [gameState.player, gameState.dealer];
  
  // Initialize first round
  startNewRound(p);
  
  gameState.currentTurn = "PLAYER";
  gameState.turnState = TURN_STATE_CHOOSE_ACTION;
  gameState.menuSelection = 0;
  gameState.targetSelection = 0;
  gameState.selectedItemIndex = -1;
  
  gameState.currentRound = 1;
  gameState.playerRoundsWon = 0;
  gameState.dealerRoundsWon = 0;
  gameState.score = 0;
}

export function startNewRound(p) {
  // Reset health
  gameState.player.reset();
  gameState.dealer.reset();
  
  // Initialize shells
  initializeShells(p);
  
  // Give items to both players
  const itemCount = Math.floor(p.random(2, 5));
  gameState.playerItems = generateItems(p, itemCount);
  gameState.dealerItems = generateItems(p, itemCount);
  
  gameState.currentTurn = "PLAYER";
  gameState.turnState = TURN_STATE_CHOOSE_ACTION;
  gameState.knownNextShell = null;
}

export function shoot(shooter, target) {
  const shell = getCurrentShell();
  advanceShell();
  
  let damage = 0;
  let message = "";
  
  if (shell === "LIVE") {
    damage = gameState.sawedOff ? 2 : 1;
    target.takeDamage(damage);
    message = `${shell}! ${target.name} took ${damage} damage!`;
  } else {
    message = `${shell}! No damage.`;
  }
  
  gameState.sawedOff = false;
  gameState.knownNextShell = null;
  
  // Check if need to reload
  if (getRemainingShells() === 0) {
    message += " Reloading...";
  }
  
  return { damage, message, wasLive: shell === "LIVE", targetWasSelf: shooter === target };
}

export function checkRoundEnd(p) {
  if (gameState.player.isDead()) {
    gameState.dealerRoundsWon++;
    if (gameState.dealerRoundsWon >= ROUNDS_TO_WIN) {
      gameState.gamePhase = PHASE_GAME_OVER_LOSE;
      return true;
    }
    gameState.currentRound++;
    startNewRound(p);
    return true;
  }
  
  if (gameState.dealer.isDead()) {
    gameState.playerRoundsWon++;
    gameState.score++;
    if (gameState.playerRoundsWon >= ROUNDS_TO_WIN) {
      gameState.gamePhase = PHASE_GAME_OVER_WIN;
      return true;
    }
    gameState.currentRound++;
    startNewRound(p);
    return true;
  }
  
  // Check if need reload
  if (getRemainingShells() === 0) {
    initializeShells(p);
    const itemCount = Math.floor(p.random(1, 4));
    gameState.playerItems.push(...generateItems(p, itemCount));
    gameState.dealerItems.push(...generateItems(p, itemCount));
  }
  
  return false;
}

export function switchTurn() {
  gameState.currentTurn = gameState.currentTurn === "PLAYER" ? "DEALER" : "PLAYER";
  gameState.turnState = TURN_STATE_CHOOSE_ACTION;
  gameState.menuSelection = 0;
  gameState.targetSelection = 0;
  gameState.selectedItemIndex = -1;
}

export function startAnimation(message, frames = 60) {
  gameState.turnState = TURN_STATE_ANIMATING;
  gameState.animationMessage = message;
  gameState.animationFrame = 0;
  gameState.animationMaxFrames = frames;
}