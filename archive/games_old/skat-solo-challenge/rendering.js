// rendering.js - Rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, CARD_WIDTH, CARD_HEIGHT } from './globals.js';
import { Card } from './card.js';

export function drawStartScreen(p) {
  p.background(30, 80, 50);
  
  // Title
  p.fill(255, 230, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("SKAT SOLO CHALLENGE", CANVAS_WIDTH / 2, 80);
  
  // Instructions
  p.fill(255);
  p.textSize(16);
  p.text("Master the classic German card game!", CANVAS_WIDTH / 2, 140);
  
  p.textSize(14);
  p.textAlign(p.LEFT);
  const instructions = [
    "• Win 2/3 rounds per level to advance",
    "• Declarer needs 61+ points to win",
    "• Use Arrow Keys to select cards",
    "• Press SPACE to play selected card",
    "• Press SHIFT to take Skat (as declarer)",
    "• Press Z to discard cards"
  ];
  
  let yPos = 180;
  for (let line of instructions) {
    p.text(line, 100, yPos);
    yPos += 25;
  }
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER);
  p.textSize(24);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 350);
}

export function drawGameOverScreen(p, won) {
  p.background(30, 80, 50);
  
  p.fill(won ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(won ? "SKAT MASTER!" : "GAME OVER", CANVAS_WIDTH / 2, 120);
  
  p.fill(255);
  p.textSize(24);
  p.text(`Final Score: ${gameState.cumulativeScore}`, CANVAS_WIDTH / 2, 180);
  
  if (won) {
    p.textSize(18);
    p.text("You've mastered all three levels!", CANVAS_WIDTH / 2, 220);
  } else {
    p.textSize(18);
    p.text(`Failed at Level ${gameState.level}`, CANVAS_WIDTH / 2, 220);
  }
  
  p.fill(255, 255, 100);
  p.textSize(20);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
}

export function drawPausedIndicator(p) {
  p.fill(255, 255, 100);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

export function drawCard(p, card, x, y, faceUp, selected = false, width = CARD_WIDTH, height = CARD_HEIGHT) {
  p.push();
  
  if (selected) {
    p.fill(255, 255, 100, 150);
    p.noStroke();
    p.rect(x - 4, y - 4, width + 8, height + 8, 8);
  }
  
  // Card background
  if (faceUp) {
    p.fill(250, 245, 235);
  } else {
    p.fill(180, 50, 50);
  }
  p.stroke(0);
  p.strokeWeight(2);
  p.rect(x, y, width, height, 5);
  
  if (faceUp) {
    // Draw suit and rank
    const color = card.getSuitColor(p);
    p.fill(...color);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text(card.rank, x + width / 2, y + height * 0.3);
    
    p.textSize(18);
    p.text(card.getSuitSymbol(), x + width / 2, y + height * 0.6);
  } else {
    // Card back pattern
    p.fill(200, 100, 100);
    p.noStroke();
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 4; j++) {
        p.ellipse(x + 10 + i * 15, y + 10 + j * 15, 8, 8);
      }
    }
  }
  
  p.pop();
}

export function drawHand(p, hand, playerIndex, selectedIndex = -1) {
  if (playerIndex === 0) {
    // Human player - bottom of screen
    const spacing = Math.min(60, (CANVAS_WIDTH - 40) / hand.length);
    const startX = CANVAS_WIDTH / 2 - (hand.length * spacing) / 2;
    const y = CANVAS_HEIGHT - CARD_HEIGHT - 10;
    
    for (let i = 0; i < hand.length; i++) {
      const x = startX + i * spacing;
      const selected = i === selectedIndex;
      drawCard(p, hand[i], x, y, true, selected);
    }
  } else {
    // AI players - top corners (just show count)
    const x = playerIndex === 1 ? 20 : CANVAS_WIDTH - CARD_WIDTH - 20;
    const y = 20;
    
    // Draw stack of face-down cards
    for (let i = 0; i < Math.min(hand.length, 3); i++) {
      drawCard(p, hand[0], x + i * 2, y + i * 2, false);
    }
    
    // Draw count
    p.fill(255);
    p.textAlign(p.CENTER);
    p.textSize(12);
    p.text(`AI ${playerIndex}`, x + CARD_WIDTH / 2, y - 10);
    p.text(`${hand.length} cards`, x + CARD_WIDTH / 2, y + CARD_HEIGHT + 15);
  }
}

export function drawSkat(p, skatCards, faceUp) {
  const x = CANVAS_WIDTH / 2 - CARD_WIDTH - 5;
  const y = CANVAS_HEIGHT / 2 - CARD_HEIGHT / 2;
  
  for (let i = 0; i < skatCards.length; i++) {
    drawCard(p, skatCards[i], x + i * (CARD_WIDTH + 10), y, faceUp);
  }
  
  if (!faceUp) {
    p.fill(255);
    p.textAlign(p.CENTER);
    p.textSize(12);
    p.text("SKAT", CANVAS_WIDTH / 2, y - 15);
  }
}

export function drawTrick(p, trick) {
  if (trick.length === 0) return;
  
  const centerX = CANVAS_WIDTH / 2;
  const centerY = CANVAS_HEIGHT / 2;
  const radius = 60;
  
  const positions = [
    { x: centerX, y: centerY + radius },           // Player 0 (bottom)
    { x: centerX - radius, y: centerY - radius },  // Player 1 (top-left)
    { x: centerX + radius, y: centerY - radius }   // Player 2 (top-right)
  ];
  
  for (let i = 0; i < trick.length; i++) {
    const pos = positions[trick[i].playerIndex];
    drawCard(p, trick[i].card, pos.x - CARD_WIDTH / 2, pos.y - CARD_HEIGHT / 2, true);
  }
}

export function drawUI(p) {
  // Score
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(18);
  p.text(`Score: ${gameState.cumulativeScore}`, CANVAS_WIDTH - 10, 10);
  
  // Level and round
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Level ${gameState.level}/3 | Round ${gameState.roundsInLevel + 1}/3`, 10, 10);
  
  // Current turn indicator
  const playerNames = ['You', 'AI 1', 'AI 2'];
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(14);
  p.fill(255, 255, 100);
  p.text(`${playerNames[gameState.currentPlayerIndex]}'s Turn`, CANVAS_WIDTH / 2, 35);
  
  // Game type info
  if (gameState.gameType) {
    p.fill(255);
    p.textSize(12);
    p.text(`Game: ${gameState.gameType}`, CANVAS_WIDTH / 2, 55);
    
    if (gameState.declarer >= 0) {
      p.text(`Declarer: ${playerNames[gameState.declarer]}`, CANVAS_WIDTH / 2, 70);
    }
  }
}

export function drawBiddingUI(p) {
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.text("BIDDING PHASE", CANVAS_WIDTH / 2, 150);
  
  p.textSize(16);
  p.text(`Current Bid: ${gameState.currentBidValue}`, CANVAS_WIDTH / 2, 180);
  
  if (gameState.currentPlayerIndex === 0 && gameState.activeBidders[0]) {
    p.fill(100, 255, 100);
    p.textSize(14);
    p.text("Arrow Up: Bid Higher", CANVAS_WIDTH / 2, 220);
    p.text("Arrow Down: Pass", CANVAS_WIDTH / 2, 240);
  }
}

export function drawGameTypeSelectionUI(p) {
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.text("SELECT GAME TYPE", CANVAS_WIDTH / 2, 150);
  
  const gameTypes = ['CLUBS', 'SPADES', 'HEARTS', 'DIAMONDS', 'GRAND'];
  const buttonWidth = 80;
  const buttonHeight = 30;
  const spacing = 10;
  const startX = CANVAS_WIDTH / 2 - (gameTypes.length * (buttonWidth + spacing)) / 2;
  
  for (let i = 0; i < gameTypes.length; i++) {
    const x = startX + i * (buttonWidth + spacing);
    const y = 200;
    
    if (i === gameState.selectedGameTypeIndex) {
      p.fill(255, 255, 100);
    } else {
      p.fill(150);
    }
    p.rect(x, y, buttonWidth, buttonHeight, 5);
    
    p.fill(0);
    p.textSize(12);
    p.text(gameTypes[i], x + buttonWidth / 2, y + buttonHeight / 2);
  }
  
  p.fill(255);
  p.textSize(14);
  p.text("Arrow Keys: Select | SPACE: Confirm", CANVAS_WIDTH / 2, 260);
}

export function drawDiscardUI(p) {
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  p.text(`Discard ${gameState.cardsToDiscard} more cards`, CANVAS_WIDTH / 2, 120);
  p.textSize(14);
  p.text("Select card with Arrow Keys, press Z to discard", CANVAS_WIDTH / 2, 145);
}

export function drawRoundEnd(p) {
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  
  if (gameState.roundWinner === 'DECLARER') {
    p.fill(100, 255, 100);
    p.text("Declarer Wins!", CANVAS_WIDTH / 2, 120);
  } else {
    p.fill(255, 100, 100);
    p.text("Opponents Win!", CANVAS_WIDTH / 2, 120);
  }
  
  p.fill(255);
  p.textSize(18);
  p.text(`Declarer Points: ${gameState.declarerPoints}`, CANVAS_WIDTH / 2, 180);
  p.text(`Opponent Points: ${gameState.opponentPoints}`, CANVAS_WIDTH / 2, 210);
  p.text(`Round Score: +${gameState.lastRoundScore || 0}`, CANVAS_WIDTH / 2, 240);
  
  p.fill(255, 255, 100);
  p.textSize(16);
  p.text("Press SPACE to continue", CANVAS_WIDTH / 2, 300);
}

export function drawLevelComplete(p) {
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(100, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text(`Level ${gameState.level} Complete!`, CANVAS_WIDTH / 2, 120);
  
  p.fill(255);
  p.textSize(20);
  p.text(`Total Score: ${gameState.cumulativeScore}`, CANVAS_WIDTH / 2, 180);
  p.text(`Rounds Won: ${gameState.roundsWonInLevel}/3`, CANVAS_WIDTH / 2, 210);
  
  p.fill(255, 255, 100);
  p.textSize(16);
  p.text("Press SPACE to continue", CANVAS_WIDTH / 2, 270);
}