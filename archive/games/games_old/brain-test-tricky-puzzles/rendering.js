// rendering.js - Rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PUZZLES } from './globals.js';
import { getInteractiveElements, getCurrentPuzzle } from './puzzle.js';

export function drawStartScreen(p) {
  p.background(40, 20, 60);
  
  // Title
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text("BRAIN TEST", CANVAS_WIDTH / 2, 80);
  
  p.textSize(32);
  p.text("Tricky Puzzles", CANVAS_WIDTH / 2, 130);
  
  // Instructions
  p.fill(255);
  p.textSize(16);
  p.textStyle(p.NORMAL);
  p.text("Think outside the box to solve each puzzle!", CANVAS_WIDTH / 2, 180);
  p.text("No timers, no pressure - just pure brain teasing fun!", CANVAS_WIDTH / 2, 205);
  
  // Controls
  p.textSize(14);
  p.textAlign(p.LEFT, p.CENTER);
  const controlsX = 150;
  p.text("← → : Select objects", controlsX, 250);
  p.text("SHIFT + Arrows: Move objects", controlsX, 275);
  p.text("SPACE: Interact with object", controlsX, 300);
  p.text("Z: Toggle hint (-25 points)", controlsX, 325);
  
  // Start prompt
  p.fill(255, 255, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.textStyle(p.BOLD);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
}

export function drawPlayingScreen(p) {
  p.background(50, 50, 80);
  
  // Draw puzzle elements
  drawPuzzleElements(p);
  
  // Draw UI
  drawUI(p);
  
  // Draw hint overlay if active
  if (gameState.showHint) {
    drawHintOverlay(p);
  }
  
  // Draw transition overlay if active
  if (gameState.showTransition) {
    drawTransitionOverlay(p);
  }
}

export function drawPausedScreen(p) {
  // Draw the game underneath
  drawPlayingScreen(p);
  
  // Overlay
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  p.textSize(20);
  p.textStyle(p.NORMAL);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
  
  // Small indicator in top right
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.fill(255, 255, 0);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

export function drawGameOverScreen(p) {
  p.background(40, 20, 60);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Title
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text(isWin ? "CONGRATULATIONS!" : "GAME OVER", CANVAS_WIDTH / 2, 100);
  
  // Message
  p.fill(255);
  p.textSize(24);
  p.textStyle(p.NORMAL);
  if (isWin) {
    p.text("You've completed all puzzles!", CANVAS_WIDTH / 2, 160);
  }
  
  // Score
  p.textSize(32);
  p.fill(255, 215, 0);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  
  if (gameState.score > gameState.highScore) {
    p.textSize(20);
    p.fill(100, 255, 100);
    p.text("NEW HIGH SCORE!", CANVAS_WIDTH / 2, 260);
  } else {
    p.textSize(20);
    p.fill(255);
    p.text(`High Score: ${gameState.highScore}`, CANVAS_WIDTH / 2, 260);
  }
  
  // Restart prompt
  p.fill(255, 255, 0);
  p.textSize(24);
  p.textStyle(p.BOLD);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);
}

function drawPuzzleElements(p) {
  const elements = gameState.interactiveElements;
  const interactiveElements = getInteractiveElements();
  const selectedElement = interactiveElements[gameState.selectedObjectIndex];
  
  for (let i = 0; i < elements.length; i++) {
    const elem = elements[i];
    
    // Skip hidden elements
    if (elem.hidden && !elem.revealed) continue;
    if (elem.visible === false) continue;
    
    const isSelected = elem === selectedElement;
    
    p.push();
    
    // Draw based on type
    switch (elem.type) {
      case "circle":
        if (isSelected) {
          p.stroke(255, 255, 0);
          p.strokeWeight(3);
        } else {
          p.noStroke();
        }
        p.fill(...elem.color);
        p.circle(elem.x, elem.y, elem.radius * 2);
        break;
        
      case "rect":
        if (isSelected) {
          p.stroke(255, 255, 0);
          p.strokeWeight(3);
        } else {
          p.noStroke();
        }
        p.fill(...elem.color);
        p.rectMode(p.CENTER);
        p.rect(elem.x, elem.y, elem.width, elem.height);
        break;
        
      case "star":
        drawStar(p, elem.x, elem.y, elem.size, elem.color, isSelected);
        break;
        
      case "key":
        drawKey(p, elem.x, elem.y, elem.size, elem.color, isSelected);
        break;
        
      case "cloud":
        drawCloud(p, elem.x, elem.y, elem.width, elem.height, elem.color, isSelected);
        if (elem.raining) {
          drawRain(p, elem.x, elem.y);
        }
        break;
        
      case "flower":
        drawFlower(p, elem.x, elem.y, elem.stemHeight, elem.petalSize, elem.color, elem.bloomed);
        break;
        
      case "background":
        p.noStroke();
        p.fill(...elem.color);
        p.rect(0, elem.offsetY || 0, elem.width, elem.height);
        break;
    }
    
    p.pop();
  }
  
  // Reveal hidden star after box is moved
  const puzzle = getCurrentPuzzle();
  if (puzzle.winCondition === "dragBoxRight") {
    const box = elements.find(e => e.id === "box");
    const star = elements.find(e => e.id === "hiddenStar");
    if (box && star && box.x > 350) {
      star.hidden = false;
      star.revealed = true;
    }
  }
}

function drawStar(p, x, y, size, color, isSelected) {
  p.push();
  if (isSelected) {
    p.stroke(255, 255, 0);
    p.strokeWeight(3);
  } else {
    p.noStroke();
  }
  p.fill(...color);
  p.translate(x, y);
  p.beginShape();
  for (let i = 0; i < 5; i++) {
    const angle = p.TWO_PI * i / 5 - p.HALF_PI;
    const sx = p.cos(angle) * size;
    const sy = p.sin(angle) * size;
    p.vertex(sx, sy);
    const innerAngle = angle + p.TWO_PI / 10;
    const isx = p.cos(innerAngle) * size * 0.5;
    const isy = p.sin(innerAngle) * size * 0.5;
    p.vertex(isx, isy);
  }
  p.endShape(p.CLOSE);
  p.pop();
}

function drawKey(p, x, y, size, color, isSelected) {
  p.push();
  if (isSelected) {
    p.stroke(255, 255, 0);
    p.strokeWeight(3);
  } else {
    p.noStroke();
  }
  p.fill(...color);
  p.translate(x, y);
  p.circle(0, 0, size);
  p.rect(size / 2, -2, size, 4);
  p.rect(size * 1.2, -6, 3, 8);
  p.rect(size * 1.4, -6, 3, 8);
  p.pop();
}

function drawCloud(p, x, y, width, height, color, isSelected) {
  p.push();
  if (isSelected) {
    p.stroke(255, 255, 0);
    p.strokeWeight(3);
  } else {
    p.noStroke();
  }
  p.fill(...color);
  p.circle(x - width / 4, y, height);
  p.circle(x + width / 4, y, height);
  p.circle(x, y - height / 4, height);
  p.pop();
}

function drawRain(p, x, y) {
  p.stroke(150, 150, 255, 150);
  p.strokeWeight(2);
  for (let i = 0; i < 5; i++) {
    const rx = x - 30 + i * 15;
    const offset = (p.frameCount + i * 10) % 60;
    p.line(rx, y + 20 + offset, rx, y + 30 + offset);
  }
}

function drawFlower(p, x, y, stemHeight, petalSize, color, bloomed) {
  p.push();
  p.noStroke();
  
  // Stem
  p.fill(50, 150, 50);
  p.rect(x - 3, y - stemHeight / 2, 6, stemHeight);
  
  // Petals
  p.fill(...color);
  const centerY = y - stemHeight;
  const numPetals = 6;
  const radius = bloomed ? petalSize : petalSize * 0.5;
  
  for (let i = 0; i < numPetals; i++) {
    const angle = p.TWO_PI * i / numPetals;
    const px = x + p.cos(angle) * radius * 0.8;
    const py = centerY + p.sin(angle) * radius * 0.8;
    p.circle(px, py, radius);
  }
  
  // Center
  p.fill(255, 200, 0);
  p.circle(x, centerY, radius * 0.6);
  
  p.pop();
}

function drawUI(p) {
  // Level indicator (top left)
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(20);
  p.textStyle(p.BOLD);
  p.text(`Level ${gameState.currentLevel}`, 10, 10);
  
  // Score (top right)
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(24);
  p.fill(255, 215, 0);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  
  // Puzzle instruction (bottom)
  const puzzle = getCurrentPuzzle();
  p.fill(255);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.textSize(16);
  p.textStyle(p.NORMAL);
  p.text(puzzle.instruction, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 10);
}

function drawHintOverlay(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Hint box
  p.fill(60, 60, 100);
  p.rectMode(p.CENTER);
  p.rect(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 400, 150, 10);
  
  // Hint text
  const puzzle = getCurrentPuzzle();
  p.fill(255, 255, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  p.textStyle(p.BOLD);
  p.text("HINT", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  
  p.fill(255);
  p.textSize(16);
  p.textStyle(p.NORMAL);
  p.text(puzzle.hint, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 380, 100);
  
  p.textSize(14);
  p.fill(200, 200, 200);
  p.text("Press Z to close", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 55);
  
  p.rectMode(p.CORNER);
}

function drawTransitionOverlay(p) {
  const progress = gameState.transitionTimer / gameState.transitionDuration;
  const alpha = progress < 0.3 ? p.map(progress, 0, 0.3, 0, 255) : 
                progress > 0.7 ? p.map(progress, 0.7, 1, 255, 0) : 255;
  
  p.fill(0, 0, 0, alpha);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  if (progress >= 0.3 && progress <= 0.7) {
    p.fill(255, 215, 0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(36);
    p.textStyle(p.BOLD);
    p.text(gameState.transitionMessage, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    
    p.textSize(24);
    p.fill(255);
    p.text(`+100 points`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
  }
}