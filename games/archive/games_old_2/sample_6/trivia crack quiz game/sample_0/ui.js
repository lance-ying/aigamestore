// ui.js - UI rendering functions

import { gameState, CATEGORIES, CANVAS_WIDTH, CANVAS_HEIGHT, LEVEL_CONFIG } from './globals.js';

export function drawStartScreen(p) {
  p.background(20, 25, 40);
  
  // Title
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("TRIVIA CRACK", CANVAS_WIDTH / 2, 60);
  p.textSize(20);
  p.text("Premium Quiz Game", CANVAS_WIDTH / 2, 95);
  
  // Instructions
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    "OBJECTIVE:",
    "Be the first to collect all 6 category tokens!",
    "",
    "HOW TO PLAY:",
    "• Press SPACE to spin the wheel",
    "• Answer questions from the selected category",
    "• Get 3 correct answers in a row to unlock a challenge",
    "• Landing on Crown gives instant challenge access",
    "• Win challenges to earn category tokens",
    "",
    "CONTROLS:",
    "SPACE - Spin wheel / Confirm",
    "LEFT/RIGHT ARROWS - Select answer",
    "ESC - Pause game",
    "R - Restart to menu"
  ];
  
  let y = 130;
  for (const line of instructions) {
    if (line.startsWith("•")) {
      p.fill(150, 200, 255);
    } else if (line.includes(":")) {
      p.fill(255, 215, 0);
    } else if (line.includes("-")) {
      p.fill(150, 255, 150);
    } else {
      p.fill(200);
    }
    p.text(line, 50, y);
    y += 18;
  }
  
  // Start prompt
  if (Math.floor(p.frameCount / 30) % 2 === 0) {
    p.fill(100, 255, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(18);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
  }
}

export function drawGameUI(p) {
  // Score
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  
  // Level
  p.textAlign(p.LEFT, p.TOP);
  p.text(`LEVEL ${gameState.currentLevel}/${gameState.maxLevel}`, 10, 10);
  p.textSize(12);
  p.text(LEVEL_CONFIG[gameState.currentLevel - 1].name, 10, 30);
  
  // Turn indicator
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(14);
  if (gameState.currentTurn === 'PLAYER') {
    p.fill(100, 255, 100);
    p.text("YOUR TURN", CANVAS_WIDTH / 2, 10);
  } else {
    p.fill(255, 100, 100);
    p.text("AI TURN", CANVAS_WIDTH / 2, 10);
  }
}

export function drawTokens(p, x, y, tokens, isPlayer) {
  const label = isPlayer ? "YOUR TOKENS" : "AI TOKENS";
  
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(12);
  p.fill(255);
  p.text(label, x, y);
  
  const tokenSize = 35;
  const spacing = 8;
  const startY = y + 20;
  
  for (let i = 0; i < CATEGORIES.length; i++) {
    const cat = CATEGORIES[i];
    const tokenY = startY + i * (tokenSize + spacing);
    
    // Token slot
    if (tokens.includes(cat.name)) {
      p.fill(...cat.color);
      p.stroke(255);
      p.strokeWeight(2);
    } else {
      p.fill(40);
      p.stroke(100);
      p.strokeWeight(1);
    }
    
    p.circle(x, tokenY, tokenSize);
    
    // Icon
    p.fill(tokens.includes(cat.name) ? 255 : 80);
    p.noStroke();
    p.textSize(20);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(cat.icon, x, tokenY);
  }
  
  // Streak indicator
  if (isPlayer && gameState.playerStreakCount > 0) {
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(11);
    p.fill(255, 215, 0);
    p.text(`Streak: ${gameState.playerStreakCount}/3`, x, startY + CATEGORIES.length * (tokenSize + spacing) + 10);
  }
}

export function drawPauseIndicator(p) {
  p.fill(255, 255, 0);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text("PAUSED", CANVAS_WIDTH - 10, 35);
}

export function drawGameOver(p, isWin) {
  p.background(20, 25, 40);
  
  // Title
  p.textAlign(p.CENTER, p.CENTER);
  if (isWin) {
    p.fill(100, 255, 100);
    p.textSize(48);
    p.text("YOU WIN!", CANVAS_WIDTH / 2, 100);
    
    if (gameState.currentLevel < gameState.maxLevel) {
      p.fill(255, 215, 0);
      p.textSize(24);
      p.text("Level Complete!", CANVAS_WIDTH / 2, 160);
      p.fill(255);
      p.textSize(16);
      p.text(`Advancing to Level ${gameState.currentLevel + 1}`, CANVAS_WIDTH / 2, 190);
      p.text(LEVEL_CONFIG[gameState.currentLevel].name, CANVAS_WIDTH / 2, 210);
    } else {
      p.fill(255, 215, 0);
      p.textSize(24);
      p.text("All Levels Complete!", CANVAS_WIDTH / 2, 160);
      p.fill(255);
      p.textSize(16);
      p.text("Congratulations, Knowledge Knight!", CANVAS_WIDTH / 2, 190);
    }
  } else {
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 120);
    
    p.fill(255);
    p.textSize(20);
    p.text("The AI collected all tokens first", CANVAS_WIDTH / 2, 170);
  }
  
  // Score
  p.fill(255);
  p.textSize(20);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 240);
  
  // Restart prompt
  if (Math.floor(p.frameCount / 30) % 2 === 0) {
    p.fill(200);
    p.textSize(16);
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  }
}

export function drawQuestion(p, question, showFeedback = false, isCorrect = false) {
  // Question box
  const boxX = 50;
  const boxY = 220;
  const boxW = CANVAS_WIDTH - 100;
  const boxH = 160;
  
  p.fill(30, 35, 50);
  p.stroke(255);
  p.strokeWeight(2);
  p.rect(boxX, boxY, boxW, boxH, 10);
  
  // Question text
  p.fill(255);
  p.noStroke();
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(14);
  const questionLines = wrapText(p, question.q, boxW - 20);
  let y = boxY + 15;
  for (const line of questionLines) {
    p.text(line, CANVAS_WIDTH / 2, y);
    y += 18;
  }
  
  // Answer options
  const answerY = boxY + 65;
  const answerW = (boxW - 30) / 2;
  const answerH = 35;
  
  for (let i = 0; i < 4; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const ax = boxX + 10 + col * (answerW + 10);
    const ay = answerY + row * (answerH + 8);
    
    // Determine color
    let bgColor = [50, 60, 80];
    if (showFeedback) {
      if (i === question.c) {
        bgColor = [50, 150, 50]; // Correct answer
      } else if (i === gameState.selectedAnswer && i !== question.c) {
        bgColor = [150, 50, 50]; // Wrong answer
      }
    } else if (i === gameState.highlightedAnswer && gameState.currentTurn === 'PLAYER') {
      bgColor = [80, 100, 140]; // Highlighted
    }
    
    p.fill(...bgColor);
    p.stroke(255);
    p.strokeWeight(2);
    p.rect(ax, ay, answerW, answerH, 5);
    
    // Answer text
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    const answerText = wrapText(p, question.a[i], answerW - 10);
    p.text(answerText.join('\n'), ax + answerW / 2, ay + answerH / 2);
  }
  
  // Feedback text
  if (showFeedback) {
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(20);
    if (isCorrect) {
      p.fill(100, 255, 100);
      p.text("CORRECT!", CANVAS_WIDTH / 2, boxY - 25);
    } else {
      p.fill(255, 100, 100);
      p.text("INCORRECT!", CANVAS_WIDTH / 2, boxY - 25);
    }
  }
}

export function drawChallenge(p) {
  const boxX = 50;
  const boxY = 80;
  const boxW = CANVAS_WIDTH - 100;
  const boxH = 300;
  
  p.fill(20, 25, 40);
  p.stroke(255, 215, 0);
  p.strokeWeight(3);
  p.rect(boxX, boxY, boxW, boxH, 10);
  
  // Title
  p.fill(255, 215, 0);
  p.noStroke();
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(24);
  p.text("TOKEN CHALLENGE!", CANVAS_WIDTH / 2, boxY + 15);
  
  p.fill(255);
  p.textSize(14);
  p.text(`Category: ${gameState.challengeCategory}`, CANVAS_WIDTH / 2, boxY + 50);
  p.text(`Question ${gameState.challengeCurrentIndex + 1}/3`, CANVAS_WIDTH / 2, boxY + 70);
  
  // Current challenge question
  if (gameState.challengeQuestions[gameState.challengeCurrentIndex]) {
    const q = gameState.challengeQuestions[gameState.challengeCurrentIndex];
    
    // Question
    p.textSize(13);
    const lines = wrapText(p, q.q, boxW - 40);
    let y = boxY + 100;
    for (const line of lines) {
      p.text(line, CANVAS_WIDTH / 2, y);
      y += 17;
    }
    
    // Answers
    const answerY = boxY + 160;
    const answerW = (boxW - 50) / 2;
    const answerH = 32;
    
    for (let i = 0; i < 4; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const ax = boxX + 20 + col * (answerW + 10);
      const ay = answerY + row * (answerH + 8);
      
      let bgColor = [50, 60, 80];
      if (gameState.showingFeedback) {
        if (i === q.c) {
          bgColor = [50, 150, 50];
        } else if (i === gameState.selectedAnswer && i !== q.c) {
          bgColor = [150, 50, 50];
        }
      } else if (i === gameState.highlightedAnswer) {
        bgColor = [80, 100, 140];
      }
      
      p.fill(...bgColor);
      p.stroke(255);
      p.strokeWeight(2);
      p.rect(ax, ay, answerW, answerH, 5);
      
      p.fill(255);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(11);
      const answerText = wrapText(p, q.a[i], answerW - 8);
      p.text(answerText.join('\n'), ax + answerW / 2, ay + answerH / 2);
    }
    
    // Progress
    p.textAlign(p.CENTER, p.BOTTOM);
    p.textSize(14);
    p.fill(255, 215, 0);
    p.text(`Correct: ${gameState.challengeCorrectCount}/3`, CANVAS_WIDTH / 2, boxY + boxH - 15);
  }
}

function wrapText(p, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const testWidth = p.textWidth(testLine);
    
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}