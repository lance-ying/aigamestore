import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, CARD_WIDTH, CARD_HEIGHT, COLOR_VALUES } from './globals.js';

export function drawStartScreen(p) {
  p.background(20, 30, 60);
  
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('COLOR MATCH ROYALE', CANVAS_WIDTH / 2, 80);
  
  p.fill(200);
  p.textSize(16);
  p.text('Race to empty your hand!', CANVAS_WIDTH / 2, 140);
  p.text('Match colors or numbers.', CANVAS_WIDTH / 2, 165);
  p.text('Use action cards strategically.', CANVAS_WIDTH / 2, 190);
  
  p.textSize(14);
  p.text('CONTROLS:', CANVAS_WIDTH / 2, 230);
  p.textSize(12);
  p.text('Arrow Keys: Select card | Space: Play/Draw', CANVAS_WIDTH / 2, 255);
  p.text('Z: Call UNO (Levels 4-5) | ESC: Pause | R: Restart', CANVAS_WIDTH / 2, 275);
  
  p.fill(255, 255, 100);
  p.textSize(20);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 340);
}

export function drawLevelIntro(p) {
  p.background(30, 40, 70);
  
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(42);
  p.text(`LEVEL ${gameState.currentLevel}`, CANVAS_WIDTH / 2, 120);
  
  p.fill(200);
  p.textSize(18);
  const levelTitles = ['', 'Friendly Intro', 'Strategic Opponents', 'Aggressive Play', 'Master Challenger', 'Ultimate Showdown'];
  p.text(levelTitles[gameState.currentLevel], CANVAS_WIDTH / 2, 170);
  
  p.textSize(14);
  if (gameState.currentLevel === 1) {
    p.text('Learn the basics. UNO calls are automatic.', CANVAS_WIDTH / 2, 220);
  } else if (gameState.currentLevel === 2) {
    p.text('AI plays more strategically.', CANVAS_WIDTH / 2, 220);
  } else if (gameState.currentLevel === 3) {
    p.text('AI becomes aggressive!', CANVAS_WIDTH / 2, 220);
  } else if (gameState.currentLevel === 4) {
    p.text('Press Z to call UNO or draw 2 penalty cards!', CANVAS_WIDTH / 2, 220);
    p.text('Now facing 4 AI opponents!', CANVAS_WIDTH / 2, 245);
  } else if (gameState.currentLevel === 5) {
    p.text('Final Challenge! You start with only 5 cards.', CANVAS_WIDTH / 2, 220);
    p.text('AI starts with advantages. Good luck!', CANVAS_WIDTH / 2, 245);
  }
  
  p.fill(255, 255, 100);
  p.textSize(16);
  p.text('Starting in a moment...', CANVAS_WIDTH / 2, 320);
}

export function drawPlayingScreen(p) {
  p.background(20, 80, 40);
  
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`LEVEL: ${gameState.currentLevel}`, 10, 10);
  
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  
  drawDiscardPile(p);
  drawDrawPile(p);
  drawCurrentColorIndicator(p);
  drawAIPlayers(p);
  drawHumanPlayerHand(p);
  
  if (gameState.colorSelectionMode) {
    drawColorSelection(p);
  }
  
  if (gameState.mustCallUno && !gameState.unoCalledThisTurn) {
    p.fill(255, 100, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.text("Press 'Z' for UNO!", CANVAS_WIDTH / 2, 40);
  }
  
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(255);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    p.text('PAUSED', CANVAS_WIDTH - 10, 10);
  }
}

function drawDiscardPile(p) {
  const x = CANVAS_WIDTH / 2 + 30;
  const y = CANVAS_HEIGHT / 2 - CARD_HEIGHT / 2;
  
  if (gameState.discardPile.length > 0) {
    const topCard = gameState.discardPile[gameState.discardPile.length - 1];
    topCard.draw(p, x, y, CARD_WIDTH, CARD_HEIGHT, true);
  }
}

function drawDrawPile(p) {
  const x = CANVAS_WIDTH / 2 - 30 - CARD_WIDTH;
  const y = CANVAS_HEIGHT / 2 - CARD_HEIGHT / 2;
  
  if (gameState.drawPile.length > 0) {
    for (let i = 0; i < Math.min(3, gameState.drawPile.length); i++) {
      const card = gameState.drawPile[gameState.drawPile.length - 1];
      card.draw(p, x + i, y + i, CARD_WIDTH, CARD_HEIGHT, false);
    }
  }
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(10);
  p.text(gameState.drawPile.length, x + CARD_WIDTH / 2, y + CARD_HEIGHT + 15);
}

function drawCurrentColorIndicator(p) {
  const x = CANVAS_WIDTH / 2;
  const y = CANVAS_HEIGHT / 2 + CARD_HEIGHT / 2 + 30;
  
  p.fill(...COLOR_VALUES[gameState.currentColor]);
  p.stroke(255);
  p.strokeWeight(2);
  p.circle(x, y, 30);
}

function drawAIPlayers(p) {
  const positions = [
    { x: CANVAS_WIDTH / 2, y: 50, label: 'AI 1' },
    { x: 50, y: CANVAS_HEIGHT / 2, label: 'AI 2' },
    { x: CANVAS_WIDTH - 50, y: CANVAS_HEIGHT / 2, label: 'AI 3' },
    { x: CANVAS_WIDTH / 2, y: 130, label: 'AI 4' }
  ];
  
  for (let i = 1; i < gameState.players.length; i++) {
    const player = gameState.players[i];
    const pos = positions[i - 1];
    
    const isCurrentPlayer = gameState.currentPlayerIndex === i;
    
    if (isCurrentPlayer) {
      p.fill(255, 255, 0, 100);
      p.noStroke();
      p.circle(pos.x, pos.y, 60);
    }
    
    p.fill(30, 50, 100);
    p.stroke(255);
    p.strokeWeight(2);
    p.rect(pos.x - 20, pos.y - 15, 40, 30, 3);
    
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    p.text(player.hand.length, pos.x, pos.y);
    
    p.textSize(10);
    p.text(pos.label, pos.x, pos.y + 25);
  }
}

function drawHumanPlayerHand(p) {
  const player = gameState.player;
  if (!player || player.hand.length === 0) return;
  
  const cardSpacing = Math.min(CARD_WIDTH + 10, (CANVAS_WIDTH - 100) / player.hand.length);
  const startX = CANVAS_WIDTH / 2 - (cardSpacing * (player.hand.length - 1)) / 2;
  const y = CANVAS_HEIGHT - CARD_HEIGHT - 20;
  
  for (let i = 0; i < player.hand.length; i++) {
    const x = startX + i * cardSpacing - CARD_WIDTH / 2;
    const yOffset = i === gameState.selectedCardIndex ? -10 : 0;
    
    if (i === gameState.selectedCardIndex) {
      p.fill(255, 255, 0, 100);
      p.noStroke();
      p.rect(x - 3, y + yOffset - 3, CARD_WIDTH + 6, CARD_HEIGHT + 6, 5);
    }
    
    player.hand[i].draw(p, x, y + yOffset, CARD_WIDTH, CARD_HEIGHT, true);
  }
  
  const isCurrentPlayer = gameState.currentPlayerIndex === 0;
  if (isCurrentPlayer) {
    p.fill(255, 255, 0);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text('YOUR TURN', CANVAS_WIDTH / 2, CANVAS_HEIGHT - CARD_HEIGHT - 35);
  }
}

function drawColorSelection(p) {
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.text('Choose a Color', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
  
  const colors = ['RED', 'GREEN', 'BLUE', 'YELLOW'];
  const buttonWidth = 100;
  const buttonHeight = 40;
  const spacing = 120;
  const startX = CANVAS_WIDTH / 2 - (spacing * 1.5);
  const y = CANVAS_HEIGHT / 2;
  
  gameState.colorChoiceButtons = [];
  
  for (let i = 0; i < colors.length; i++) {
    const x = startX + i * spacing;
    gameState.colorChoiceButtons.push({
      color: colors[i],
      x: x,
      y: y,
      w: buttonWidth,
      h: buttonHeight
    });
    
    p.fill(...COLOR_VALUES[colors[i]]);
    p.stroke(255);
    p.strokeWeight(2);
    p.rect(x, y, buttonWidth, buttonHeight, 5);
    
    p.fill(255);
    p.noStroke();
    p.textSize(14);
    p.text(colors[i], x + buttonWidth / 2, y + buttonHeight / 2);
  }
  
  p.fill(200);
  p.textSize(12);
  p.text('Use Arrow Keys and Space to select', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
}

export function drawGameOver(p, isWin) {
  p.background(isWin ? [20, 60, 20] : [60, 20, 20]);
  
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? 'ROUND WON!' : 'ROUND LOST!', CANVAS_WIDTH / 2, 100);
  
  p.fill(200);
  p.textSize(20);
  p.text(`Total Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
  
  if (isWin) {
    p.textSize(16);
    if (gameState.currentLevel < gameState.maxLevels) {
      p.text('Ready for the next level?', CANVAS_WIDTH / 2, 240);
    } else {
      p.fill(255, 215, 0);
      p.textSize(24);
      p.text('YOU COMPLETED ALL LEVELS!', CANVAS_WIDTH / 2, 240);
    }
  } else {
    p.textSize(16);
    p.text('Try again?', CANVAS_WIDTH / 2, 240);
  }
  
  p.fill(255, 255, 100);
  p.textSize(18);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 320);
}

export function drawHighScores(p) {
  p.background(30, 30, 60);
  
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text('HIGH SCORES', CANVAS_WIDTH / 2, 60);
  
  p.fill(200);
  p.textSize(16);
  
  if (gameState.highScores.length === 0) {
    p.text('No high scores yet!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  } else {
    for (let i = 0; i < Math.min(5, gameState.highScores.length); i++) {
      const score = gameState.highScores[i];
      p.text(`${i + 1}. ${score.score} points`, CANVAS_WIDTH / 2, 120 + i * 30);
    }
  }
  
  p.fill(255, 255, 100);
  p.textSize(18);
  p.text('PRESS R TO RETURN', CANVAS_WIDTH / 2, 340);
}