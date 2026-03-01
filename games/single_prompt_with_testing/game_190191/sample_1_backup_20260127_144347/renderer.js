import { gameState, PALETTE } from './globals.js';

export function drawBody(p, body) {
  p.beginShape();
  const vertices = body.vertices;
  for (let i = 0; i < vertices.length; i++) {
    p.vertex(vertices[i].x, vertices[i].y);
  }
  p.endShape(p.CLOSE);
}

export function renderGame(p) {
  // Clear background
  p.background(PALETTE.background);
  
  p.push();
  // Apply Camera
  // For this simple prototype, we might keep camera static unless we want to support panning
  // Let's implement simple centering if needed, but 600x400 fits our levels
  // p.translate(-gameState.camera.x, -gameState.camera.y);

  // Draw input line (spawn area)
  renderSpawnLine(p);

  // Draw obstacles
  gameState.obstacles.forEach(obs => obs.render(p));

  // Draw targets
  gameState.targets.forEach(target => target.render(p));

  // Draw active letters
  p.fill(PALETTE.letter);
  p.stroke(PALETTE.letterStroke);
  p.strokeWeight(1);
  
  if (gameState.isSimulating) {
    gameState.activeBodies.forEach(body => {
      // Handle compound bodies
      if (body.parts && body.parts.length > 1) {
        body.parts.forEach(part => {
          if (part !== body) drawBody(p, part);
        });
      } else {
        drawBody(p, body);
      }
    });
  } else {
    // Render text preview
    renderInputPreview(p);
  }

  p.pop();

  // Draw UI Overlay
  renderUI(p);
}

function renderSpawnLine(p) {
  const currentLevel = getCurrentLevel();
  if (!currentLevel) return;

  p.stroke(255, 255, 255, 50);
  p.strokeWeight(1);
  p.line(0, currentLevel.spawnY, 600, currentLevel.spawnY);
  
  // Marker for start text pos
  p.fill(255, 255, 255, 50);
  p.noStroke();
  p.circle(currentLevel.spawnXStart, currentLevel.spawnY, 4);
}

function renderInputPreview(p) {
  const currentLevel = getCurrentLevel();
  if (!currentLevel) return;

  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(30);
  p.noStroke();
  p.fill(PALETTE.text);
  
  // Monospace font for alignment with physics spacing roughly
  p.textFont('monospace'); 
  
  // Draw text at spawn line
  // We need to match the spacing we use for spawning
  // Spacing = 20px per char roughly?
  const charWidth = 25;
  
  let x = currentLevel.spawnXStart;
  const y = currentLevel.spawnY;
  
  for (let i = 0; i < gameState.inputString.length; i++) {
    const char = gameState.inputString[i];
    p.text(char, x, y - 15); // Draw slightly above line
    x += charWidth;
  }
  
  // Cursor
  if (p.frameCount % 60 < 30) {
    const cursorX = currentLevel.spawnXStart + (gameState.inputString.length * charWidth);
    p.rect(cursorX, y - 30, 2, 30);
  }
}

function renderUI(p) {
  // Top bar
  p.noStroke();
  p.fill(0, 0, 0, 100);
  p.rect(0, 0, 600, 40);
  
  p.fill(PALETTE.text);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(16);
  p.text(`Level ${gameState.currentLevelIndex + 1}`, 10, 20);
  
  const levelDesc = getCurrentLevel()?.description || "";
  p.textAlign(p.CENTER, p.CENTER);
  p.text(levelDesc, 300, 20);
  
  p.textAlign(p.RIGHT, p.CENTER);
  p.text(`Score: ${gameState.score}`, 590, 20);

  // Instructions at bottom if empty input
  if (!gameState.isSimulating && gameState.inputString.length === 0) {
    p.textAlign(p.CENTER, p.BOTTOM);
    p.textSize(14);
    p.fill(150);
    p.text("Type letters (a-z). Press ENTER to drop.", 300, 390);
  }
}

import { LEVELS } from './levels.js';
function getCurrentLevel() {
  return LEVELS[gameState.currentLevelIndex];
}

export function renderStartScreen(p) {
  p.background(PALETTE.background);
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(PALETTE.text);
  
  p.textSize(48);
  p.text("PhysiType", 300, 150);
  
  p.textSize(18);
  p.text("Where words have weight.", 300, 200);
  
  p.textSize(24);
  if (p.frameCount % 60 < 40) {
    p.text("PRESS ENTER TO START", 300, 300);
  }
  
  p.textSize(14);
  p.fill(150);
  p.text("Controls: A-Z to type, ENTER to drop, R to retry level", 300, 350);
}

export function renderGameOver(p, win) {
  p.push();
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, 600, 400);
  
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(win ? PALETTE.target : '#ff5555');
  p.textSize(48);
  p.text(win ? "ALL LEVELS CLEARED!" : "GAME OVER", 300, 180);
  
  p.fill(PALETTE.text);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, 300, 230);
  
  p.textSize(18);
  p.text("Press R to Restart", 300, 280);
  p.pop();
}

export function renderPaused(p) {
  p.push();
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, 600, 400);
  p.fill(PALETTE.text);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("PAUSED", 300, 200);
  p.pop();
}