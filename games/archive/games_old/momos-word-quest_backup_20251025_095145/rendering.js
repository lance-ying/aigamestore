// rendering.js - All rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, MINI_GAME_TYPES } from './globals.js';
import { LEVELS } from './levels.js';

export function renderStartScreen(p) {
  p.background(135, 206, 235); // Sky blue
  
  // Draw clouds
  drawCloud(p, 100, 80, 60);
  drawCloud(p, 400, 100, 80);
  drawCloud(p, 500, 60, 50);
  
  // Draw Momo (cute character)
  drawMomo(p, 150, 200, 1.5);
  
  // Title
  p.fill(255, 215, 0);
  p.stroke(255, 140, 0);
  p.strokeWeight(4);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("MOMO'S WORD QUEST", CANVAS_WIDTH / 2, 80);
  
  // Description box
  p.noStroke();
  p.fill(255, 255, 255, 230);
  p.rect(200, 140, 350, 180, 10);
  
  p.fill(50);
  p.textSize(16);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    "Help Momo learn English vocabulary!",
    "",
    "• Match words to images",
    "• Choose correct definitions",
    "• Type words correctly",
    "• Complete sentences",
    "",
    "Use ARROW KEYS to navigate",
    "SPACE/ENTER to select",
    "H for hints (-100 points)"
  ];
  
  let yPos = 150;
  instructions.forEach(line => {
    p.text(line, 220, yPos);
    yPos += 18;
  });
  
  // Press Enter prompt
  const flash = Math.sin(p.frameCount * 0.1) > 0;
  if (flash) {
    p.fill(255, 100, 100);
    p.textSize(24);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 350);
  }
}

export function renderPlaying(p) {
  p.background(245, 245, 220); // Beige background
  
  // Draw UI elements
  drawScoreAndLevel(p);
  drawTimer(p);
  drawMomo(p, 80, 320, 0.8);
  
  // Draw question area
  drawQuestionArea(p);
  
  // Draw answers based on game type
  const miniGameType = gameState.currentLevelData.miniGameType;
  
  if (miniGameType === MINI_GAME_TYPES.TYPING) {
    drawTypingInterface(p);
  } else {
    drawMultipleChoiceOptions(p);
  }
  
  // Draw hint button
  drawHintButton(p);
  
  // Draw feedback if showing
  if (gameState.showingFeedback) {
    drawFeedback(p);
  }
}

export function renderPaused(p) {
  // Darken the playing screen
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // PAUSED text
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  
  p.textSize(20);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  p.text("Press R to restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
}

export function renderGameOver(p) {
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  if (isWin) {
    p.background(200, 255, 200); // Light green
  } else {
    p.background(255, 200, 200); // Light red
  }
  
  // Draw Momo with emotion
  drawMomo(p, CANVAS_WIDTH / 2, 150, 1.2, isWin);
  
  // Title
  p.fill(isWin ? 0, 150, 0 : 150, 0, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text(isWin ? "LEVEL COMPLETE!" : "LEVEL FAILED!", CANVAS_WIDTH / 2, 60);
  
  // Stats box
  p.fill(255, 255, 255, 230);
  p.noStroke();
  p.rect(150, 220, 300, 120, 10);
  
  p.fill(50);
  p.textSize(20);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(`Level Score: ${gameState.levelScore}`, CANVAS_WIDTH / 2, 250);
  p.text(`Total Score: ${gameState.totalScore}`, CANVAS_WIDTH / 2, 280);
  p.text(`Correct: ${gameState.correctAnswersCount}/${gameState.questions.length}`, CANVAS_WIDTH / 2, 310);
  
  // Instructions
  p.textSize(18);
  p.text("Press R to restart", CANVAS_WIDTH / 2, 360);
}

function drawScoreAndLevel(p) {
  // Level indicator (top-left)
  p.fill(255, 255, 255, 200);
  p.noStroke();
  p.rect(10, 10, 120, 30, 5);
  p.fill(50);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(18);
  p.text(`LEVEL: ${gameState.currentLevel}`, 20, 25);
  
  // Score (top-right)
  p.fill(255, 255, 255, 200);
  p.rect(CANVAS_WIDTH - 150, 10, 140, 30, 5);
  p.fill(50);
  p.textAlign(p.LEFT, p.CENTER);
  p.text(`SCORE: ${gameState.totalScore}`, CANVAS_WIDTH - 140, 25);
}

function drawTimer(p) {
  const timeLeft = gameState.timeLeftForQuestion;
  const timeLimit = gameState.currentQuestion.timeLimit;
  const ratio = timeLeft / timeLimit;
  
  // Timer bar
  const barWidth = 200;
  const barHeight = 20;
  const barX = CANVAS_WIDTH / 2 - barWidth / 2;
  const barY = 50;
  
  // Background
  p.fill(200);
  p.noStroke();
  p.rect(barX, barY, barWidth, barHeight, 5);
  
  // Fill
  const fillColor = ratio > 0.5 ? [100, 200, 100] : ratio > 0.25 ? [255, 200, 0] : [255, 100, 100];
  p.fill(...fillColor);
  p.rect(barX, barY, barWidth * ratio, barHeight, 5);
  
  // Time text
  p.fill(50);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.text(`${Math.ceil(timeLeft)}s`, CANVAS_WIDTH / 2, barY + barHeight / 2);
}

function drawQuestionArea(p) {
  const miniGameType = gameState.currentLevelData.miniGameType;
  const question = gameState.currentQuestion;
  
  // Question box
  p.fill(255, 255, 255, 230);
  p.noStroke();
  p.rect(150, 90, 400, 100, 10);
  
  p.fill(50);
  p.textAlign(p.CENTER, p.CENTER);
  
  if (miniGameType === MINI_GAME_TYPES.IMAGE_TO_WORD) {
    drawWordImage(p, 350, 140, question.word);
  } else if (miniGameType === MINI_GAME_TYPES.WORD_TO_DEFINITION) {
    p.textSize(32);
    p.text(question.word.toUpperCase(), 350, 140);
  } else if (miniGameType === MINI_GAME_TYPES.TYPING) {
    p.textSize(16);
    p.text(question.clue, 350, 140);
  } else if (miniGameType === MINI_GAME_TYPES.WORD_TO_IMAGE) {
    p.textSize(28);
    p.text(question.word.toUpperCase(), 350, 140);
  } else if (miniGameType === MINI_GAME_TYPES.SENTENCE_COMPLETION) {
    p.textSize(18);
    const words = question.sentence.split(' ');
    let line1 = '';
    let line2 = '';
    let charCount = 0;
    
    words.forEach(word => {
      if (charCount + word.length < 40) {
        line1 += word + ' ';
        charCount += word.length + 1;
      } else {
        line2 += word + ' ';
      }
    });
    
    p.text(line1, 350, 125);
    if (line2) p.text(line2, 350, 155);
  }
}

function drawMultipleChoiceOptions(p) {
  const question = gameState.currentQuestion;
  const options = question.options;
  const miniGameType = gameState.currentLevelData.miniGameType;
  
  const startY = 210;
  const optionHeight = 40;
  const optionWidth = 450;
  const optionX = (CANVAS_WIDTH - optionWidth) / 2;
  
  options.forEach((option, index) => {
    const y = startY + index * (optionHeight + 10);
    const isSelected = gameState.selectedAnswerIndex === index;
    const isRemoved = gameState.removedOptionIndex === index;
    
    if (isRemoved) {
      p.fill(150, 150, 150, 100);
    } else if (isSelected) {
      p.fill(255, 215, 0, 200);
    } else {
      p.fill(255, 255, 255, 200);
    }
    
    p.noStroke();
    p.rect(optionX, y, optionWidth, optionHeight, 5);
    
    // Number indicator
    p.fill(100);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(20);
    p.text(`${index + 1}.`, optionX + 15, y + optionHeight / 2);
    
    // Option content
    if (miniGameType === MINI_GAME_TYPES.IMAGE_TO_WORD || miniGameType === MINI_GAME_TYPES.SENTENCE_COMPLETION || miniGameType === MINI_GAME_TYPES.WORD_TO_DEFINITION) {
      p.fill(isRemoved ? 150 : 50);
      p.textAlign(p.LEFT, p.CENTER);
      p.textSize(16);
      p.text(option, optionX + 50, y + optionHeight / 2);
    } else if (miniGameType === MINI_GAME_TYPES.WORD_TO_IMAGE) {
      drawWordImage(p, optionX + optionWidth / 2 + 20, y + optionHeight / 2, option, 0.6);
    }
  });
}

function drawTypingInterface(p) {
  // Input box
  const inputY = 220;
  p.fill(255, 255, 255, 230);
  p.noStroke();
  p.rect(150, inputY, 400, 50, 5);
  
  p.fill(50);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.text(gameState.typedAnswer || "_", 350, inputY + 25);
  
  // Virtual keyboard
  drawVirtualKeyboard(p);
}

function drawVirtualKeyboard(p) {
  const keys = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '←']
  ];
  
  const startX = 180;
  const startY = 290;
  const keySize = 35;
  const gap = 5;
  
  keys.forEach((row, rowIndex) => {
    const rowWidth = row.length * (keySize + gap) - gap;
    const rowX = startX + (keys[0].length * (keySize + gap) - rowWidth) / 2;
    
    row.forEach((key, colIndex) => {
      const x = rowX + colIndex * (keySize + gap);
      const y = startY + rowIndex * (keySize + gap);
      
      p.fill(240);
      p.stroke(150);
      p.strokeWeight(1);
      p.rect(x, y, key === '←' ? keySize * 1.5 : keySize, keySize, 3);
      
      p.fill(50);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(16);
      p.text(key, x + (key === '←' ? keySize * 0.75 : keySize / 2), y + keySize / 2);
    });
  });
  
  // Space bar
  p.fill(240);
  p.stroke(150);
  p.strokeWeight(1);
  p.rect(startX + 40, startY + 3 * (keySize + gap), 280, keySize, 3);
  p.fill(50);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(16);
  p.text("SPACE", startX + 180, startY + 3 * (keySize + gap) + keySize / 2);
}

function drawHintButton(p) {
  const buttonX = CANVAS_WIDTH - 80;
  const buttonY = 50;
  
  p.fill(gameState.hintUsed ? 150 : 255, 200, 100, 200);
  p.noStroke();
  p.rect(buttonX, buttonY, 60, 30, 5);
  
  p.fill(50);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(16);
  p.text("HINT (H)", buttonX + 30, buttonY + 15);
}

function drawFeedback(p) {
  const isCorrect = gameState.lastAnswerCorrect;
  
  // Semi-transparent overlay
  p.fill(isCorrect ? 0 : 255, isCorrect ? 255 : 0, 0, 100);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Feedback text
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isCorrect ? "CORRECT!" : "WRONG!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  // Particles for correct answer
  if (isCorrect) {
    for (let i = 0; i < 5; i++) {
      const angle = (p.frameCount + i * 50) * 0.1;
      const radius = 80 + Math.sin(p.frameCount * 0.2 + i) * 20;
      const x = CANVAS_WIDTH / 2 + Math.cos(angle) * radius;
      const y = CANVAS_HEIGHT / 2 + Math.sin(angle) * radius;
      
      p.fill(255, 215, 0);
      p.noStroke();
      drawStar(p, x, y, 8, 15, 5);
    }
  }
}

function drawMomo(p, x, y, scale = 1, happy = true) {
  p.push();
  p.translate(x, y);
  p.scale(scale);
  
  // Body
  p.fill(255, 200, 100);
  p.noStroke();
  p.ellipse(0, 0, 60, 80);
  
  // Head
  p.fill(255, 220, 150);
  p.ellipse(0, -40, 70, 70);
  
  // Eyes
  p.fill(50);
  const eyeY = happy ? -45 : -43;
  p.ellipse(-15, eyeY, 8, happy ? 8 : 10);
  p.ellipse(15, eyeY, 8, happy ? 8 : 10);
  
  // Mouth
  p.noFill();
  p.stroke(50);
  p.strokeWeight(2);
  if (happy) {
    p.arc(0, -30, 30, 20, 0, p.PI);
  } else {
    p.arc(0, -25, 30, 20, p.PI, 0);
  }
  
  // Ears
  p.fill(255, 220, 150);
  p.noStroke();
  p.ellipse(-30, -50, 20, 30);
  p.ellipse(30, -50, 20, 30);
  
  p.pop();
}

function drawCloud(p, x, y, size) {
  p.fill(255, 255, 255, 200);
  p.noStroke();
  p.ellipse(x, y, size * 1.2, size * 0.8);
  p.ellipse(x - size * 0.4, y, size * 0.8, size * 0.6);
  p.ellipse(x + size * 0.4, y, size * 0.8, size * 0.6);
}

function drawWordImage(p, x, y, word, scale = 1) {
  p.push();
  p.translate(x, y);
  p.scale(scale);
  
  // Simple iconic representations
  const lowerWord = word.toLowerCase();
  
  if (lowerWord === 'apple') {
    p.fill(255, 0, 0);
    p.ellipse(0, 0, 40, 45);
    p.fill(139, 69, 19);
    p.rect(-2, -25, 4, 10);
    p.fill(0, 200, 0);
    p.ellipse(8, -22, 15, 10);
  } else if (lowerWord === 'cat') {
    p.fill(255, 180, 100);
    p.ellipse(0, 0, 50, 40);
    p.triangle(-25, -15, -30, -30, -20, -20);
    p.triangle(25, -15, 30, -30, 20, -20);
    p.fill(50);
    p.ellipse(-10, -5, 6, 8);
    p.ellipse(10, -5, 6, 8);
  } else if (lowerWord === 'house') {
    p.fill(200, 150, 100);
    p.rect(-25, -5, 50, 40);
    p.fill(150, 50, 50);
    p.triangle(-30, -5, 0, -35, 30, -5);
    p.fill(100, 150, 200);
    p.rect(-10, 5, 20, 20);
  } else if (lowerWord === 'tree') {
    p.fill(139, 69, 19);
    p.rect(-5, 0, 10, 30);
    p.fill(0, 200, 0);
    p.ellipse(0, -15, 40, 40);
    p.ellipse(-15, -5, 30, 30);
    p.ellipse(15, -5, 30, 30);
  } else if (lowerWord === 'car') {
    p.fill(255, 0, 0);
    p.rect(-25, -5, 50, 20, 5);
    p.rect(-15, -20, 30, 15);
    p.fill(50);
    p.ellipse(-15, 15, 15, 15);
    p.ellipse(15, 15, 15, 15);
  } else if (lowerWord === 'sun') {
    p.fill(255, 215, 0);
    p.ellipse(0, 0, 40, 40);
    for (let i = 0; i < 8; i++) {
      const angle = i * p.PI / 4;
      const x1 = Math.cos(angle) * 25;
      const y1 = Math.sin(angle) * 25;
      const x2 = Math.cos(angle) * 35;
      const y2 = Math.sin(angle) * 35;
      p.strokeWeight(3);
      p.stroke(255, 215, 0);
      p.line(x1, y1, x2, y2);
    }
  } else if (lowerWord === 'book') {
    p.fill(100, 150, 200);
    p.rect(-20, -25, 40, 50, 3);
    p.fill(255);
    p.rect(-15, -20, 30, 5);
    p.rect(-15, -10, 30, 5);
    p.rect(-15, 0, 30, 5);
  } else if (lowerWord === 'ball') {
    p.fill(255, 100, 100);
    p.ellipse(0, 0, 45, 45);
    p.noFill();
    p.stroke(255);
    p.strokeWeight(2);
    p.arc(0, 0, 45, 45, -p.PI / 4, p.PI / 4);
    p.arc(0, 0, 45, 45, 3 * p.PI / 4, 5 * p.PI / 4);
  } else if (lowerWord === 'bicycle') {
    p.noFill();
    p.stroke(50);
    p.strokeWeight(2);
    p.ellipse(-15, 10, 30, 30);
    p.ellipse(15, 10, 30, 30);
    p.line(-15, -10, 15, -10);
    p.line(-15, 10, -15, -10);
    p.line(15, 10, 0, -10);
  } else if (lowerWord === 'instrument') {
    p.fill(150, 100, 50);
    p.ellipse(0, 10, 40, 50);
    p.rect(-5, -30, 10, 40);
    p.fill(255);
    for (let i = 0; i < 4; i++) {
      p.ellipse(-10 + i * 7, 10, 3, 15);
    }
  } else if (lowerWord === 'mountain') {
    p.fill(100, 100, 100);
    p.triangle(-30, 30, 0, -30, 30, 30);
    p.triangle(-10, 30, 20, -15, 40, 30);
    p.fill(255);
    p.triangle(-5, -15, 0, -30, 5, -15);
  } else if (lowerWord === 'library') {
    p.fill(180, 140, 100);
    p.rect(-30, -10, 60, 40);
    p.fill(100, 50, 50);
    p.rect(-30, -25, 60, 15);
    p.fill(150);
    for (let i = 0; i < 4; i++) {
      p.rect(-25 + i * 15, -5, 10, 30);
    }
  } else if (lowerWord === 'universe') {
    p.fill(20, 20, 60);
    p.ellipse(0, 0, 60, 60);
    p.fill(255, 255, 0);
    p.ellipse(0, 0, 25, 25);
    for (let i = 0; i < 5; i++) {
      const angle = i * p.TWO_PI / 5;
      drawStar(p, Math.cos(angle) * 30, Math.sin(angle) * 30, 3, 6, 5);
    }
  } else if (lowerWord === 'pyramid') {
    p.fill(220, 180, 120);
    p.triangle(-30, 30, 0, -25, 30, 30);
    p.fill(180, 140, 80);
    p.quad(0, -25, 30, 30, 30, 35, 0, -20);
  } else if (lowerWord === 'telescope') {
    p.fill(100);
    p.rect(-30, 0, 60, 10);
    p.triangle(-30, 5, -40, 0, -40, 10);
    p.ellipse(30, 5, 15, 15);
    p.fill(150);
    p.rect(-10, 10, 5, 15);
  } else if (lowerWord === 'castle') {
    p.fill(150, 150, 150);
    p.rect(-30, -10, 60, 40);
    p.rect(-35, -20, 20, 10);
    p.rect(15, -20, 20, 10);
    p.rect(-10, -30, 20, 20);
    p.fill(100, 100, 150);
    p.rect(-5, 5, 10, 15);
  } else if (lowerWord === 'volcano') {
    p.fill(100, 50, 50);
    p.triangle(-35, 30, 0, -30, 35, 30);
    p.fill(255, 100, 0);
    p.triangle(-5, -30, 0, -40, 5, -30);
    p.fill(255, 200, 0);
    p.ellipse(0, -35, 8, 8);
  } else if (lowerWord === 'compass') {
    p.fill(200);
    p.ellipse(0, 0, 50, 50);
    p.fill(255, 0, 0);
    p.triangle(-3, 0, 3, 0, 0, -20);
    p.fill(255);
    p.triangle(-3, 0, 3, 0, 0, 20);
  } else if (lowerWord === 'fountain') {
    p.fill(100, 150, 200);
    p.ellipse(0, 20, 50, 20);
    for (let i = 0; i < 5; i++) {
      p.noFill();
      p.stroke(100, 150, 255);
      p.strokeWeight(2);
      p.arc(-15 + i * 8, 20, 10, 20, p.PI, 0);
    }
  } else if (lowerWord === 'lighthouse') {
    p.fill(200, 200, 200);
    p.rect(-10, -25, 20, 50);
    p.fill(255, 0, 0);
    p.rect(-15, -30, 30, 5);
    p.fill(255, 255, 0);
    p.rect(-12, -20, 24, 10);
  } else {
    // Default: text representation
    p.fill(100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(20);
    p.text(word, 0, 0);
  }
  
  p.pop();
}

function drawStar(p, x, y, innerRadius, outerRadius, points) {
  p.push();
  p.translate(x, y);
  p.beginShape();
  for (let i = 0; i < points * 2; i++) {
    const angle = i * p.PI / points - p.PI / 2;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;
    p.vertex(px, py);
  }
  p.endShape(p.CLOSE);
  p.pop();
}