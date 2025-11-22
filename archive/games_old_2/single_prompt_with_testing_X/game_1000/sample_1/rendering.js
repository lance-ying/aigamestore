import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, CONTAINER_X, CONTAINER_Y, CONTAINER_WIDTH, CONTAINER_HEIGHT, DANGER_LINE_Y, FRUIT_TYPES } from './globals.js';

export function drawStartScreen(p) {
  p.background(240, 248, 255);
  
  // Title
  p.push();
  p.fill(255, 100, 100);
  p.stroke(200, 50, 50);
  p.strokeWeight(4);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("FRUIT FUSION", CANVAS_WIDTH / 2, 60);
  
  // Subtitle
  p.noStroke();
  p.fill(100, 100, 255);
  p.textSize(20);
  p.text("Merge fruits to create a watermelon!", CANVAS_WIDTH / 2, 110);
  
  // Game description
  p.fill(60, 60, 60);
  p.textSize(14);
  p.text("Drop fruits and merge matching ones", CANVAS_WIDTH / 2, 150);
  p.text("Create bigger fruits to score more points", CANVAS_WIDTH / 2, 170);
  p.text("Don't let fruits pile above the red line!", CANVAS_WIDTH / 2, 190);
  
  // Fruit progression preview
  p.textSize(12);
  p.fill(80, 80, 80);
  p.text("Fruit Evolution Chain:", CANVAS_WIDTH / 2, 220);
  
  const startX = 100;
  const spacing = 50;
  for (let i = 0; i < 10; i++) {
    const x = startX + i * spacing;
    const y = 260;
    const fruit = FRUIT_TYPES[i];
    
    p.fill(...fruit.color);
    p.stroke(0, 0, 0, 100);
    p.strokeWeight(1);
    p.ellipse(x, y, fruit.radius * 1.2, fruit.radius * 1.2);
    
    if (i < 9) {
      p.noStroke();
      p.fill(150, 150, 150);
      p.textSize(16);
      p.text("→", x + spacing / 2, y);
    }
  }
  
  // Controls
  p.fill(40, 40, 40);
  p.textSize(16);
  p.text("CONTROLS", CANVAS_WIDTH / 2, 310);
  p.textSize(14);
  p.text("← → : Move fruit", CANVAS_WIDTH / 2, 335);
  p.text("SPACE: Drop fruit", CANVAS_WIDTH / 2, 355);
  
  // Start prompt
  p.fill(255, 150, 0);
  p.textSize(20);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 385);
  
  p.pop();
}

export function drawGame(p) {
  p.background(200, 220, 240);
  
  // Draw container
  drawContainer(p);
  
  // Draw all fruits
  for (const fruit of gameState.entities) {
    fruit.draw();
  }
  
  // Draw preview fruit
  if (gameState.canDrop && gameState.previewFruit) {
    drawPreviewFruit(p);
  }
  
  // Draw UI
  drawUI(p);
  
  // Draw paused indicator
  if (gameState.gamePhase === "PAUSED") {
    p.push();
    p.fill(255, 255, 255, 200);
    p.noStroke();
    p.rect(CANVAS_WIDTH - 100, 5, 90, 25, 5);
    p.fill(50, 50, 50);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.text("PAUSED", CANVAS_WIDTH - 55, 17);
    p.pop();
  }
}

export function drawContainer(p) {
  p.push();
  
  // Container background
  p.fill(255, 255, 255);
  p.stroke(100, 100, 100);
  p.strokeWeight(3);
  p.rect(CONTAINER_X, CONTAINER_Y, CONTAINER_WIDTH, CONTAINER_HEIGHT);
  
  // Danger line
  p.stroke(255, 50, 50);
  p.strokeWeight(2);
  p.line(CONTAINER_X, DANGER_LINE_Y, CONTAINER_X + CONTAINER_WIDTH, DANGER_LINE_Y);
  
  // Danger zone shading
  p.noStroke();
  p.fill(255, 50, 50, 30);
  p.rect(CONTAINER_X, CONTAINER_Y, CONTAINER_WIDTH, DANGER_LINE_Y - CONTAINER_Y);
  
  p.pop();
}

export function drawPreviewFruit(p) {
  p.push();
  
  const x = gameState.previewX;
  const y = CONTAINER_Y + 20;
  const fruit = gameState.previewFruit;
  
  // Drop line indicator
  p.stroke(100, 100, 100, 100);
  p.strokeWeight(1);
  p.drawingContext.setLineDash([5, 5]);
  p.line(x, y + fruit.radius, x, CONTAINER_Y + CONTAINER_HEIGHT);
  p.drawingContext.setLineDash([]);
  
  // Preview fruit with transparency
  p.fill(...fruit.color, 180);
  p.stroke(0, 0, 0, 100);
  p.strokeWeight(2);
  p.ellipse(x, y, fruit.radius * 2, fruit.radius * 2);
  
  // Highlight
  p.noStroke();
  p.fill(255, 255, 255, 150);
  p.ellipse(x - fruit.radius * 0.3, y - fruit.radius * 0.3, fruit.radius * 0.6, fruit.radius * 0.6);
  
  p.pop();
}

export function drawUI(p) {
  p.push();
  
  // Score panel
  p.fill(255, 255, 255, 220);
  p.stroke(100, 100, 100);
  p.strokeWeight(2);
  p.rect(10, 10, 150, 70, 5);
  
  p.noStroke();
  p.fill(50, 50, 50);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text("SCORE", 20, 20);
  p.textSize(28);
  p.fill(255, 100, 50);
  p.text(gameState.score, 20, 45);
  
  // High score
  if (gameState.highScore > 0) {
    p.fill(150, 150, 150);
    p.textSize(12);
    p.text(`Best: ${gameState.highScore}`, 20, 75);
  }
  
  // Next fruit indicator
  p.fill(255, 255, 255, 220);
  p.stroke(100, 100, 100);
  p.strokeWeight(2);
  p.rect(CANVAS_WIDTH - 100, CONTAINER_Y, 90, 90, 5);
  
  p.noStroke();
  p.fill(50, 50, 50);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(12);
  p.text("NEXT", CANVAS_WIDTH - 55, CONTAINER_Y + 10);
  
  const nextFruit = FRUIT_TYPES[gameState.nextFruitType];
  p.fill(...nextFruit.color);
  p.stroke(0, 0, 0, 100);
  p.strokeWeight(2);
  p.ellipse(CANVAS_WIDTH - 55, CONTAINER_Y + 55, nextFruit.radius * 2, nextFruit.radius * 2);
  
  p.pop();
}

export function drawGameOverScreen(p) {
  p.background(240, 248, 255);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  p.push();
  
  // Title
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(isWin ? [100, 200, 100] : [200, 100, 100]);
  p.stroke(isWin ? [50, 150, 50] : [150, 50, 50]);
  p.strokeWeight(4);
  p.textSize(48);
  p.text(isWin ? "VICTORY!" : "GAME OVER", CANVAS_WIDTH / 2, 80);
  
  // Message
  p.noStroke();
  p.fill(60, 60, 60);
  p.textSize(20);
  if (isWin) {
    p.text("You created a watermelon!", CANVAS_WIDTH / 2, 140);
    p.text("🍉 FRUIT MASTER 🍉", CANVAS_WIDTH / 2, 170);
  } else {
    p.text("Fruits piled too high!", CANVAS_WIDTH / 2, 140);
    p.text("Try again!", CANVAS_WIDTH / 2, 170);
  }
  
  // Final score
  p.fill(255, 255, 255);
  p.stroke(100, 100, 100);
  p.strokeWeight(3);
  p.rect(CANVAS_WIDTH / 2 - 120, 210, 240, 80, 10);
  
  p.noStroke();
  p.fill(80, 80, 80);
  p.textSize(18);
  p.text("FINAL SCORE", CANVAS_WIDTH / 2, 235);
  p.fill(255, 150, 50);
  p.textSize(36);
  p.text(gameState.score, CANVAS_WIDTH / 2, 265);
  
  // High score
  if (gameState.highScore > 0) {
    p.fill(100, 100, 100);
    p.textSize(16);
    p.text(`High Score: ${gameState.highScore}`, CANVAS_WIDTH / 2, 310);
  }
  
  // Restart prompt
  p.fill(100, 100, 255);
  p.textSize(20);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 360);
  
  p.pop();
}