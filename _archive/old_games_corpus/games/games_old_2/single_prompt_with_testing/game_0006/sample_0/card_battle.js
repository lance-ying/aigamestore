// card_battle.js - Card battle system

import { gameState } from './globals.js';

export function updateCardBattle(p) {
  if (!gameState.cardBattleActive) return;
  
  // Auto-resolve after a delay
  if (gameState.battleTurn === "resolve" && gameState.battleResult) {
    gameState.cardBattleActive = false;
    gameState.battleResult = null;
  }
}

export function drawCardBattle(p) {
  if (!gameState.cardBattleActive) return;
  
  // Semi-transparent overlay
  p.push();
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, p.width, p.height);
  
  // Title
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.text("CARD BATTLE", p.width / 2, 30);
  
  // Player cards
  drawCards(p, gameState.playerCards, p.height - 100, true);
  
  // Enemy cards
  drawCards(p, gameState.enemyCards, 100, false);
  
  // Instructions
  p.fill(255);
  p.textSize(14);
  if (gameState.battleTurn === "player") {
    p.text("Use ARROWS to select, SPACE to play card", p.width / 2, p.height / 2);
  } else if (gameState.battleResult) {
    p.textSize(20);
    p.fill(...(gameState.battleResult === "win" ? [100, 255, 100] : [255, 100, 100]));
    p.text(gameState.battleResult === "win" ? "YOU WIN!" : "YOU LOSE!", p.width / 2, p.height / 2);
    p.fill(255);
    p.textSize(12);
    p.text("Battle will close shortly...", p.width / 2, p.height / 2 + 30);
  }
  
  p.pop();
}

function drawCards(p, cards, y, isPlayer) {
  const cardWidth = 80;
  const cardHeight = 100;
  const spacing = 100;
  const startX = p.width / 2 - (cards.length - 1) * spacing / 2;
  
  cards.forEach((card, i) => {
    const x = startX + i * spacing;
    const isSelected = isPlayer && i === gameState.selectedCardIndex;
    
    p.push();
    p.fill(...(isSelected ? [255, 255, 150] : [240, 240, 240]));
    p.stroke(0);
    p.strokeWeight(isSelected ? 3 : 2);
    p.rect(x - cardWidth / 2, y - cardHeight / 2, cardWidth, cardHeight, 5);
    
    // Card name
    p.fill(0);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text(card.name, x, y - 20);
    
    // Card power
    p.textSize(24);
    p.fill(255, 100, 100);
    p.text(card.power, x, y + 10);
    p.pop();
  });
}

export function handleCardBattleInput(p, keyCode) {
  if (!gameState.cardBattleActive || gameState.battleTurn !== "player") return;
  
  if (keyCode === 37) { // Left arrow
    gameState.selectedCardIndex = Math.max(0, gameState.selectedCardIndex - 1);
  } else if (keyCode === 39) { // Right arrow
    gameState.selectedCardIndex = Math.min(gameState.playerCards.length - 1, 
                                            gameState.selectedCardIndex + 1);
  } else if (keyCode === 32) { // Space
    playCard(p);
  }
}

function playCard(p) {
  const playerCard = gameState.playerCards[gameState.selectedCardIndex];
  const enemyCard = gameState.enemyCards[p.floor(p.random(gameState.enemyCards.length))];
  
  if (playerCard.power > enemyCard.power) {
    gameState.battleResult = "win";
    gameState.score += 200;
  } else {
    gameState.battleResult = "lose";
    gameState.playerHealth -= 20;
  }
  
  gameState.battleTurn = "resolve";
  
  // Auto-close after delay
  setTimeout(() => {
    gameState.cardBattleActive = false;
    gameState.battleResult = null;
  }, 2000);
}