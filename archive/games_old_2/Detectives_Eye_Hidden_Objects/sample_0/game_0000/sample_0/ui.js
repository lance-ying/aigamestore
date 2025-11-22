import { gameState, GAME_PHASES, LEVELS, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function drawStartScreen(p) {
  p.background(20, 30, 40);
  
  // Title
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("Detective's Eye", CANVAS_WIDTH / 2, 80);
  p.textSize(32);
  p.text("Hidden Objects", CANVAS_WIDTH / 2, 120);
  
  // Description
  p.fill(200, 200, 220);
  p.textSize(14);
  p.text("Find all hidden objects before time runs out!", CANVAS_WIDTH / 2, 170);
  p.text("Search through 3 increasingly challenging scenes.", CANVAS_WIDTH / 2, 190);
  
  // Instructions
  p.fill(180, 220, 255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.CENTER);
  
  const instructions = [
    "Click on objects from the list to find them",
    "Wrong clicks cost you time!",
    "",
    "ARROW KEYS - Pan camera view",
    "Z - Zoom in  |  SHIFT - Zoom out",
    "SPACE - Use hint (limited per level)",
    "ESC - Pause  |  R - Return to menu"
  ];
  
  let yPos = 230;
  for (const instruction of instructions) {
    p.text(instruction, 120, yPos);
    yPos += 18;
  }
  
  // High score
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(16);
  p.text(`HIGH SCORE: ${gameState.highScore}`, CANVAS_WIDTH / 2, 360);
  
  // Start prompt
  p.fill(100, 255, 100);
  p.textSize(18);
  const alpha = 150 + Math.sin(p.frameCount * 0.1) * 100;
  p.fill(100, 255, 100, alpha);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 385);
}

export function drawGameUI(p) {
  // Level indicator (top-left)
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`LEVEL: ${gameState.currentLevelIndex + 1}`, 10, 10);
  
  // Timer (top-center)
  const timeColor = gameState.levelTimer < 20 ? [255, 100, 100] : [255, 255, 255];
  p.fill(...timeColor);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(18);
  const timeStr = Math.ceil(gameState.levelTimer).toString();
  p.text(`TIME: ${timeStr}`, CANVAS_WIDTH / 2, 10);
  
  // Score (top-right)
  p.fill(255, 215, 0);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text(`SCORE: ${gameState.totalScore}`, CANVAS_WIDTH - 10, 10);
  
  // Hints (top-right, below score)
  p.fill(150, 200, 255);
  p.textSize(14);
  p.text(`HINTS: ${gameState.remainingHints}`, CANVAS_WIDTH - 10, 30);
  
  // Objects to find list (bottom)
  drawObjectList(p);
}

export function drawObjectList(p) {
  const listY = CANVAS_HEIGHT - 60;
  const listHeight = 55;
  
  // Background
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, listY, CANVAS_WIDTH, listHeight);
  
  // Title
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text("FIND:", 10, listY + 5);
  
  // Object names
  const startX = 10;
  const startY = listY + 22;
  const itemWidth = 110;
  const itemsPerRow = 5;
  
  gameState.objectsToFind.forEach((objName, index) => {
    const col = index % itemsPerRow;
    const row = Math.floor(index / itemsPerRow);
    const x = startX + col * itemWidth;
    const y = startY + row * 16;
    
    const isFound = gameState.foundObjects.includes(objName);
    
    if (isFound) {
      p.fill(100, 100, 100);
      p.textSize(11);
      p.text(objName, x, y);
      p.stroke(100, 100, 100);
      p.strokeWeight(1);
      p.line(x, y + 6, x + p.textWidth(objName), y + 6);
      p.noStroke();
    } else {
      p.fill(255, 255, 200);
      p.textSize(11);
      p.text(objName, x, y);
    }
  });
}

export function drawPausedIndicator(p) {
  p.fill(255, 255, 0);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 50);
}

export function drawLevelCompleteScreen(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Success message
  p.fill(100, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text(`LEVEL ${gameState.currentLevelIndex + 1} COMPLETE!`, CANVAS_WIDTH / 2, 100);
  
  // Scores
  p.fill(255, 215, 0);
  p.textSize(20);
  p.text(`Level Score: ${gameState.levelScore}`, CANVAS_WIDTH / 2, 160);
  p.text(`Total Score: ${gameState.totalScore}`, CANVAS_WIDTH / 2, 190);
  
  // Next instruction
  p.fill(200, 200, 255);
  p.textSize(16);
  
  if (gameState.currentLevelIndex < LEVELS.length - 1) {
    const alpha = 150 + Math.sin(p.frameCount * 0.1) * 100;
    p.fill(150, 255, 150, alpha);
    p.text("PRESS ENTER FOR NEXT LEVEL", CANVAS_WIDTH / 2, 260);
  }
  
  p.fill(200, 200, 200);
  p.textSize(14);
  p.text("PRESS R TO RETURN TO MENU", CANVAS_WIDTH / 2, 300);
}

export function drawGameOverScreen(p, isWin) {
  p.background(20, 30, 40);
  
  if (isWin) {
    // Victory screen
    p.fill(255, 215, 0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("CONGRATULATIONS!", CANVAS_WIDTH / 2, 100);
    
    p.fill(100, 255, 100);
    p.textSize(24);
    p.text("ALL LEVELS COMPLETED!", CANVAS_WIDTH / 2, 150);
    
    p.fill(255, 215, 0);
    p.textSize(28);
    p.text(`Final Score: ${gameState.totalScore}`, CANVAS_WIDTH / 2, 200);
    
    if (gameState.totalScore > gameState.highScore) {
      p.fill(255, 100, 255);
      p.textSize(20);
      p.text("NEW HIGH SCORE!", CANVAS_WIDTH / 2, 240);
    }
  } else {
    // Lose screen
    p.fill(255, 100, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("TIME'S UP!", CANVAS_WIDTH / 2, 100);
    
    p.fill(200, 200, 200);
    p.textSize(20);
    p.text(`Level ${gameState.currentLevelIndex + 1} Failed`, CANVAS_WIDTH / 2, 160);
    p.text(`Score: ${gameState.totalScore}`, CANVAS_WIDTH / 2, 200);
  }
  
  // Instructions
  p.fill(200, 200, 255);
  p.textSize(16);
  const alpha = 150 + Math.sin(p.frameCount * 0.1) * 100;
  p.fill(150, 200, 255, alpha);
  p.text("PRESS R TO RETURN TO MENU", CANVAS_WIDTH / 2, 320);
}

export function drawIncorrectClickFeedback(p) {
  if (gameState.incorrectClickFeedback) {
    const elapsed = p.frameCount - gameState.incorrectClickFeedback.frameCount;
    if (elapsed < 30) { // Show for 0.5 seconds
      const alpha = 255 - (elapsed / 30) * 255;
      p.push();
      // Transform to screen coordinates
      p.translate(gameState.panOffsetX, gameState.panOffsetY);
      p.scale(gameState.currentZoomLevel);
      
      p.stroke(255, 0, 0, alpha);
      p.strokeWeight(3);
      p.noFill();
      const size = 20 + elapsed * 0.5;
      p.line(
        gameState.incorrectClickFeedback.x - size / 2,
        gameState.incorrectClickFeedback.y - size / 2,
        gameState.incorrectClickFeedback.x + size / 2,
        gameState.incorrectClickFeedback.y + size / 2
      );
      p.line(
        gameState.incorrectClickFeedback.x + size / 2,
        gameState.incorrectClickFeedback.y - size / 2,
        gameState.incorrectClickFeedback.x - size / 2,
        gameState.incorrectClickFeedback.y + size / 2
      );
      p.pop();
    } else {
      gameState.incorrectClickFeedback = null;
    }
  }
}

export function drawHintFeedback(p) {
  if (gameState.hintFeedback) {
    const elapsed = p.frameCount - gameState.hintFeedback.frameCount;
    if (elapsed < 120) { // Show for 2 seconds
      const alpha = 255 - Math.max(0, (elapsed - 90) / 30) * 255;
      const pulseSize = 30 + Math.sin(elapsed * 0.2) * 10;
      
      p.push();
      p.translate(gameState.panOffsetX, gameState.panOffsetY);
      p.scale(gameState.currentZoomLevel);
      
      p.noFill();
      p.stroke(255, 255, 0, alpha);
      p.strokeWeight(3);
      p.ellipse(gameState.hintFeedback.x, gameState.hintFeedback.y, pulseSize, pulseSize);
      
      p.stroke(255, 255, 100, alpha * 0.5);
      p.strokeWeight(2);
      p.ellipse(gameState.hintFeedback.x, gameState.hintFeedback.y, pulseSize + 10, pulseSize + 10);
      
      p.pop();
    } else {
      gameState.hintFeedback = null;
    }
  }
}