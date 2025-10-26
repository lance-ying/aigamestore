import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, gameState, LEVELS } from './globals.js';

export function renderGame(p, leftImage, rightImage) {
  p.background(30, 30, 40);
  
  if (gameState.gamePhase === GAME_PHASES.START) {
    renderStartScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    renderPlayingScreen(p, leftImage, rightImage);
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    renderPlayingScreen(p, leftImage, rightImage);
    renderPausedOverlay(p);
  } else if (gameState.gamePhase === GAME_PHASES.LEVEL_COMPLETE) {
    renderLevelCompleteScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    renderGameOverScreen(p, true);
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    renderGameOverScreen(p, false);
  }
}

function renderStartScreen(p) {
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title
  p.textSize(48);
  p.fill(100, 200, 255);
  p.text("PIXEL PONDER", CANVAS_WIDTH / 2, 60);
  
  // Description
  p.textSize(14);
  p.fill(200, 200, 200);
  p.text("Find all the differences between two images", CANVAS_WIDTH / 2, 120);
  p.text("before time runs out!", CANVAS_WIDTH / 2, 140);
  
  // Instructions
  p.textSize(12);
  p.fill(180, 180, 180);
  p.text("OBJECTIVE:", CANVAS_WIDTH / 2, 180);
  p.textSize(11);
  p.fill(160, 160, 160);
  p.text("Click on differences in either image to mark them", CANVAS_WIDTH / 2, 200);
  p.text("Complete all 3 levels by finding every difference", CANVAS_WIDTH / 2, 215);
  p.text("Each level gets harder with more differences and less time", CANVAS_WIDTH / 2, 230);
  
  // Controls
  p.textSize(12);
  p.fill(180, 180, 180);
  p.text("CONTROLS:", CANVAS_WIDTH / 2, 260);
  p.textSize(11);
  p.fill(160, 160, 160);
  p.text("ARROW KEYS: Navigate (keyboard-only mode)", CANVAS_WIDTH / 2, 280);
  p.text("SPACE: Use hint (when available)", CANVAS_WIDTH / 2, 295);
  p.text("ESC: Pause game", CANVAS_WIDTH / 2, 310);
  p.text("R: Restart to main menu", CANVAS_WIDTH / 2, 325);
  
  // Start prompt
  p.textSize(18);
  p.fill(255, 255, 100);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 365);
}

function renderPlayingScreen(p, leftImage, rightImage) {
  // Draw images
  const imageY = 45;
  const leftX = 10;
  const rightX = 310;
  
  // Borders for images
  p.stroke(100, 150, 200);
  p.strokeWeight(2);
  p.noFill();
  p.rect(leftX - 2, imageY - 2, 284, 354);
  p.rect(rightX - 2, imageY - 2, 284, 354);
  p.noStroke();
  
  // Draw the generated images
  if (leftImage) {
    p.image(leftImage, leftX, imageY);
  }
  if (rightImage) {
    p.image(rightImage, rightX, imageY);
  }
  
  // Draw found markers
  for (let marker of gameState.foundMarkers) {
    drawMarker(p, leftX + marker.x, imageY + marker.y, marker.opacity);
    drawMarker(p, rightX + marker.x, imageY + marker.y, marker.opacity);
  }
  
  // Draw hint highlight if active
  if (gameState.hintActive && gameState.hintTargetIndex >= 0) {
    const diff = gameState.differences[gameState.hintTargetIndex];
    const pulseSize = 5 + 10 * Math.sin(p.frameCount * 0.3);
    p.noFill();
    p.stroke(255, 255, 0, 200);
    p.strokeWeight(3);
    p.circle(leftX + diff.x, imageY + diff.y, diff.radius * 2 + pulseSize);
    p.circle(rightX + diff.x, imageY + diff.y, diff.radius * 2 + pulseSize);
    p.noStroke();
  }
  
  // UI elements
  renderUI(p);
}

function drawMarker(p, x, y, opacity) {
  p.push();
  
  // Outer circle
  p.noFill();
  p.stroke(0, 255, 0, opacity);
  p.strokeWeight(3);
  p.circle(x, y, 30);
  
  // Checkmark
  p.stroke(0, 255, 0, opacity);
  p.strokeWeight(4);
  p.line(x - 8, y, x - 3, y + 8);
  p.line(x - 3, y + 8, x + 8, y - 8);
  
  p.pop();
}

function renderUI(p) {
  // Level
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.fill(200, 200, 255);
  p.text(`LEVEL: ${gameState.currentLevel}`, 10, 10);
  
  // Score
  p.textAlign(p.RIGHT, p.TOP);
  p.fill(255, 255, 150);
  p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  
  // Time
  p.textAlign(p.CENTER, p.TOP);
  p.fill(255, 150, 150);
  const timeColor = gameState.timeRemaining < 20 ? [255, 100, 100] : [255, 200, 200];
  p.fill(...timeColor);
  p.text(`TIME: ${Math.ceil(gameState.timeRemaining)}s`, CANVAS_WIDTH / 2, 10);
  
  // Differences found
  p.textAlign(p.LEFT, p.TOP);
  p.fill(150, 255, 150);
  const currentLevelData = LEVELS[gameState.currentLevel - 1];
  p.text(`Found: ${gameState.differencesFound}/${currentLevelData.totalDifferences}`, 10, 28);
  
  // Hints
  p.textAlign(p.RIGHT, p.TOP);
  p.fill(255, 200, 100);
  p.text(`Hints: ${gameState.hintsRemaining}`, CANVAS_WIDTH - 10, 28);
}

function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  
  p.textSize(14);
  p.text("Press ESC to continue", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
  p.text("Press R to restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  
  // Small indicator in top right
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(12);
  p.fill(255, 255, 0);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

function renderLevelCompleteScreen(p) {
  p.background(40, 50, 40);
  
  p.fill(100, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(42);
  p.text(`LEVEL ${gameState.currentLevel} COMPLETE!`, CANVAS_WIDTH / 2, 80);
  
  const levelData = LEVELS[gameState.currentLevel - 1];
  p.textSize(18);
  p.fill(200, 200, 200);
  p.text(`"${levelData.name}"`, CANVAS_WIDTH / 2, 130);
  
  // Stats
  p.textSize(16);
  p.fill(255, 255, 150);
  p.text(`Level Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
  p.text(`Total Score: ${gameState.totalScore}`, CANVAS_WIDTH / 2, 210);
  
  // Next action
  p.textSize(14);
  p.fill(150, 255, 150);
  if (gameState.currentLevel < LEVELS.length) {
    p.text("Press ENTER for Next Level", CANVAS_WIDTH / 2, 280);
  } else {
    p.text("All Levels Complete!", CANVAS_WIDTH / 2, 280);
    p.text("Press ENTER to see final score", CANVAS_WIDTH / 2, 305);
  }
  
  p.fill(200, 200, 200);
  p.textSize(12);
  p.text("Press R to restart", CANVAS_WIDTH / 2, 340);
  p.text("Press Z for main menu", CANVAS_WIDTH / 2, 360);
}

function renderGameOverScreen(p, isWin) {
  if (isWin) {
    p.background(30, 50, 70);
    p.fill(100, 200, 255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("GAME COMPLETE!", CANVAS_WIDTH / 2, 80);
    
    p.textSize(24);
    p.fill(255, 255, 100);
    p.text("Congratulations!", CANVAS_WIDTH / 2, 140);
  } else {
    p.background(50, 30, 30);
    p.fill(255, 100, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("TIME'S UP!", CANVAS_WIDTH / 2, 80);
    
    p.textSize(20);
    p.fill(255, 200, 200);
    p.text("Better luck next time!", CANVAS_WIDTH / 2, 140);
  }
  
  // Final score
  p.textSize(22);
  p.fill(255, 255, 255);
  p.text(`Final Score: ${gameState.totalScore}`, CANVAS_WIDTH / 2, 200);
  
  // Instructions
  p.textSize(16);
  p.fill(200, 200, 200);
  p.text("Press ENTER to play again", CANVAS_WIDTH / 2, 280);
  p.text("Press R to restart", CANVAS_WIDTH / 2, 310);
  p.text("Press Z for main menu", CANVAS_WIDTH / 2, 340);
}