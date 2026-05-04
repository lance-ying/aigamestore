// rendering.js - All rendering functions

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, COLOR_MAP } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 30, 50);
  
  // Title
  p.push();
  p.fill(100, 200, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('AquaSort Puzzle', CANVAS_WIDTH / 2, 80);
  p.pop();
  
  // Description
  p.push();
  p.fill(200, 220, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(16);
  p.text('Sort all colored liquids into separate tubes!', CANVAS_WIDTH / 2, 150);
  p.text('Each tube must contain only one color.', CANVAS_WIDTH / 2, 175);
  p.text('Get partial scores when you complete individual tubes!', CANVAS_WIDTH / 2, 195);
  p.pop();
  
  // Instructions
  p.push();
  p.fill(180, 200, 220);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(14);
  const instructY = 220;
  p.text('← → : Navigate between tubes', 100, instructY);
  p.text('SPACE : Select tube / Pour', 100, instructY + 25);
  p.text('Z : Undo last move', 100, instructY + 50);
  p.text('ESC : Pause game', 100, instructY + 75);
  p.pop();
  
  // Start prompt
  p.push();
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  const pulse = p.sin(p.frameCount * 0.1) * 20 + 235;
  p.fill(pulse, 200, 100);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 350);
  p.pop();
}

export function renderPlayingScreen(p) {
  p.background(30, 40, 60);
  
  // Draw UI
  renderUI(p);
  
  // Draw tubes
  for (let i = 0; i < gameState.tubes.length; i++) {
    const tube = gameState.tubes[i];
    const isHighlighted = i === gameState.highlightedTubeIndex;
    const isSelected = i === gameState.selectedTubeIndex;
    const isCompleted = gameState.tubesCompleted.has(i);
    
    tube.draw(isHighlighted, isSelected);
    
    // Draw completion indicator
    if (isCompleted) {
      p.push();
      p.fill(100, 255, 100);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(16);
      p.text('✓', tube.x + tube.width / 2, tube.y - 20);
      p.pop();
    }
  }
  
  // Draw animation
  if (gameState.isAnimating) {
    renderPourAnimation(p);
  }
}

function renderUI(p) {
  p.push();
  p.fill(255);
  p.textSize(18);
  
  // Score - top left
  p.textAlign(p.LEFT, p.TOP);
  p.text(`SCORE: ${gameState.totalScore}`, 10, 10);
  
  // Level score - below total score
  p.textSize(14);
  p.fill(150, 255, 150);
  p.text(`Level: +${gameState.levelScore}`, 10, 35);
  
  // Level - top center
  p.fill(255);
  p.textSize(18);
  p.textAlign(p.CENTER, p.TOP);
  p.text(`LEVEL: ${gameState.currentLevel}`, CANVAS_WIDTH / 2, 10);
  
  // Progress indicator
  const totalTubes = gameState.tubes.length;
  const completedTubes = gameState.tubesCompleted.size;
  p.textSize(14);
  p.fill(200, 200, 255);
  p.text(`Tubes: ${completedTubes}/${totalTubes}`, CANVAS_WIDTH / 2, 35);
  
  // Moves - top right
  p.fill(255);
  p.textSize(18);
  p.textAlign(p.RIGHT, p.TOP);
  const movesColor = gameState.levelMovesMade >= gameState.levelMaxMoves ? [255, 100, 100] : [255, 255, 255];
  p.fill(...movesColor);
  p.text(`MOVES: ${gameState.levelMovesMade}/${gameState.levelMaxMoves}`, CANVAS_WIDTH - 10, 10);
  
  p.pop();
}

function renderPourAnimation(p) {
  const progress = gameState.animationProgress / gameState.animationDuration;
  const sourceTube = gameState.tubes[gameState.animationSourceIndex];
  const destTube = gameState.tubes[gameState.animationDestIndex];
  
  const rgb = COLOR_MAP[gameState.animationWaterColor] || [200, 200, 200];
  
  // Draw flowing water effect
  p.push();
  p.noStroke();
  p.fill(...rgb, 200);
  
  // Calculate positions
  const sourceTop = sourceTube.y + sourceTube.totalHeight - (sourceTube.colors.length + 1) * sourceTube.layerHeight;
  const destTop = destTube.y + destTube.totalHeight - destTube.colors.length * sourceTube.layerHeight;
  
  const currentY = p.lerp(sourceTop, destTop, progress);
  const currentX = p.lerp(sourceTube.x + sourceTube.width / 2, destTube.x + destTube.width / 2, progress);
  
  // Draw water stream
  p.ellipse(currentX, currentY, 15, 30);
  
  p.pop();
  
  // Draw partial layers
  if (progress < 0.5) {
    // Leaving source
    const removeAmount = gameState.animationWaterAmount * progress * 2;
    sourceTube.drawPartialLayer(gameState.animationWaterColor, gameState.animationWaterAmount - removeAmount);
  } else {
    // Entering destination
    const addAmount = gameState.animationWaterAmount * (progress - 0.5) * 2;
    destTube.drawPartialLayer(gameState.animationWaterColor, addAmount);
  }
}

export function renderPausedScreen(p) {
  renderPlayingScreen(p);
  
  // Overlay
  p.push();
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  p.pop();
  
  // Paused text
  p.push();
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(20);
  p.text('PAUSED', CANVAS_WIDTH - 10, 10);
  p.pop();
  
  // Instructions
  p.push();
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.text('PRESS ESC TO RESUME', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  p.pop();
}

export function renderLevelComplete(p) {
  p.background(30, 40, 60);
  
  // Celebration effect
  for (let i = 0; i < 20; i++) {
    const x = (p.frameCount * 2 + i * 30) % CANVAS_WIDTH;
    const y = p.random(50, 150);
    const size = p.random(5, 15);
    const colors = [[255, 220, 100], [100, 200, 255], [255, 100, 150]];
    const col = colors[i % 3];
    
    p.push();
    p.noStroke();
    p.fill(...col, 200);
    p.ellipse(x, y, size, size);
    p.pop();
  }
  
  // Level complete text
  p.push();
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text(`LEVEL ${gameState.currentLevel} COMPLETE!`, CANVAS_WIDTH / 2, 120);
  p.pop();
  
  // Score breakdown
  const levelScore = calculateLevelScore();
  const partialScore = gameState.levelScore;
  p.push();
  p.fill(200, 220, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  p.text(`Partial Scores: +${partialScore}`, CANVAS_WIDTH / 2, 180);
  p.text(`Completion Bonus: +${levelScore}`, CANVAS_WIDTH / 2, 205);
  p.text(`Total Score: ${gameState.totalScore}`, CANVAS_WIDTH / 2, 235);
  p.pop();
  
  // Continue prompt
  p.push();
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  const pulse = p.sin(p.frameCount * 0.1) * 20 + 235;
  p.fill(pulse, 200, 100);
  
  if (gameState.currentLevel < 5) {
    p.text('PRESS SPACE FOR NEXT LEVEL', CANVAS_WIDTH / 2, 320);
  } else {
    p.text('PRESS SPACE TO FINISH', CANVAS_WIDTH / 2, 320);
  }
  p.pop();
}

export function renderGameOverWin(p) {
  p.background(30, 40, 60);
  
  // Celebration particles
  for (let i = 0; i < 50; i++) {
    const x = (p.frameCount * 3 + i * 12) % CANVAS_WIDTH;
    const y = p.random(0, CANVAS_HEIGHT);
    const size = p.random(3, 10);
    const colors = [[255, 220, 100], [100, 200, 255], [255, 100, 150], [100, 255, 150]];
    const col = colors[i % 4];
    
    p.push();
    p.noStroke();
    p.fill(...col, 180);
    p.ellipse(x, y, size, size);
    p.pop();
  }
  
  // Win text
  p.push();
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('CONGRATULATIONS!', CANVAS_WIDTH / 2, 100);
  p.pop();
  
  p.push();
  p.fill(200, 220, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.text('You completed all levels!', CANVAS_WIDTH / 2, 160);
  p.text(`Final Score: ${gameState.totalScore}`, CANVAS_WIDTH / 2, 210);
  p.pop();
  
  // Restart prompt
  p.push();
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 320);
  p.pop();
}

export function renderGameOverLose(p) {
  p.background(40, 20, 30);
  
  // Game over text
  p.push();
  p.fill(255, 100, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('GAME OVER', CANVAS_WIDTH / 2, 120);
  p.pop();
  
  p.push();
  p.fill(200, 150, 150);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.text(`Level ${gameState.currentLevel} - Out of moves!`, CANVAS_WIDTH / 2, 180);
  p.text(`Score: ${gameState.totalScore}`, CANVAS_WIDTH / 2, 220);
  p.pop();
  
  // Restart prompt
  p.push();
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 320);
  p.pop();
}

function calculateLevelScore() {
  const baseScore = 100;
  const moveBonus = Math.max(0, (gameState.levelMaxMoves - gameState.levelMovesMade) * 5);
  const undoBonus = gameState.levelUndoCount === 0 ? 50 : 0;
  
  return baseScore + moveBonus + undoBonus;
}