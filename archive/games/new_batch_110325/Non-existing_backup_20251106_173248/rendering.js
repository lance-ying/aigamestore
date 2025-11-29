// rendering.js - Visual rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES } from './globals.js';
import { getNodeData } from './story_data.js';

export function renderStartScreen(p) {
  p.background(10, 10, 20);
  
  // Title with glitch effect
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.fill(200, 200, 255);
  
  // Glitch effect on title
  const glitchOffset = p.sin(p.frameCount * 0.1) * 2;
  p.fill(255, 0, 0, 100);
  p.text("存在/しないあなた、と私", CANVAS_WIDTH / 2 + glitchOffset, 80);
  p.fill(0, 255, 0, 100);
  p.text("存在/しないあなた、と私", CANVAS_WIDTH / 2 - glitchOffset, 80);
  p.fill(200, 200, 255);
  p.text("存在/しないあなた、と私", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.textSize(16);
  p.fill(180, 180, 200);
  p.text("You and I, Existing/Non-existing", CANVAS_WIDTH / 2, 120);
  
  // Description
  p.textSize(14);
  p.fill(160, 160, 180);
  const desc = "A psychological narrative exploring\nthe nature of existence and reality.";
  p.text(desc, CANVAS_WIDTH / 2, 170);
  
  // Instructions
  p.textSize(13);
  p.fill(140, 140, 160);
  p.text("Use ARROW KEYS to navigate choices", CANVAS_WIDTH / 2, 230);
  p.text("Press SPACE to advance dialogue", CANVAS_WIDTH / 2, 250);
  p.text("Press ESC to pause, R to restart", CANVAS_WIDTH / 2, 270);
  
  // Progress indicator with score
  if (gameState.player && gameState.player.getProgress() > 0) {
    p.textSize(14);
    p.fill(255, 215, 0);
    p.text(`SCORE: ${gameState.player.getScore()}`, CANVAS_WIDTH / 2, 295);
    p.textSize(12);
    p.fill(100, 255, 100);
    p.text(`Endings Discovered: ${gameState.player.getProgress()}`, CANVAS_WIDTH / 2, 315);
  }
  
  // Start prompt
  p.textSize(18);
  const alpha = p.map(p.sin(p.frameCount * 0.05), -1, 1, 100, 255);
  p.fill(255, 255, 255, alpha);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
  
  p.pop();
}

export function renderPlayingScreen(p) {
  // Background with subtle animation
  const bgPulse = p.map(p.sin(p.frameCount * 0.02), -1, 1, 245, 255);
  
  if (gameState.glitchEffect) {
    // Glitch background
    p.background(
      p.random(200, 255),
      p.random(200, 255),
      p.random(200, 255)
    );
  } else {
    p.background(bgPulse, bgPulse, bgPulse);
  }
  
  const currentNodeData = getNodeData(gameState.currentNode);
  
  if (!currentNodeData) {
    p.fill(255, 0, 0);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("ERROR: Invalid story node", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    return;
  }
  
  // Draw character silhouette (the girl)
  drawCharacter(p);
  
  // Draw dialogue box
  drawDialogueBox(p, currentNodeData);
  
  // Draw choices if available
  if (currentNodeData.choices && gameState.textFullyDisplayed) {
    drawChoices(p, currentNodeData.choices);
  }
  
  // Draw progress and score indicator
  drawProgressIndicator(p);
}

function drawCharacter(p) {
  p.push();
  
  const x = CANVAS_WIDTH / 2;
  const y = CANVAS_HEIGHT / 2 - 20;
  
  // Fade effect based on story progression
  const fadeAmount = gameState.glitchEffect ? p.random(50, 200) : 150;
  
  // Girl's silhouette
  p.fill(50, 50, 80, fadeAmount);
  p.noStroke();
  
  // Head
  p.ellipse(x, y - 60, 40, 50);
  
  // Body
  p.beginShape();
  p.vertex(x - 15, y - 35);
  p.vertex(x + 15, y - 35);
  p.vertex(x + 20, y + 20);
  p.vertex(x - 20, y + 20);
  p.endShape(p.CLOSE);
  
  // Arms
  p.rect(x - 35, y - 30, 20, 8);
  p.rect(x + 15, y - 30, 20, 8);
  
  // Glitch effect on character
  if (gameState.glitchEffect && p.frameCount % 10 < 3) {
    p.fill(255, 0, 0, 100);
    p.ellipse(x + 2, y - 60, 40, 50);
  }
  
  p.pop();
}

function drawDialogueBox(p, nodeData) {
  p.push();
  
  // Box background
  p.fill(20, 20, 30, 230);
  p.stroke(100, 100, 150);
  p.strokeWeight(2);
  p.rect(40, CANVAS_HEIGHT - 140, CANVAS_WIDTH - 80, 100, 5);
  
  // Text
  p.noStroke();
  p.fill(240, 240, 255);
  p.textSize(13);
  p.textAlign(p.LEFT, p.TOP);
  
  const textX = 60;
  const textY = CANVAS_HEIGHT - 130;
  const textWidth = CANVAS_WIDTH - 120;
  
  p.text(gameState.textToDisplay, textX, textY, textWidth);
  
  // Continue indicator
  if (gameState.textFullyDisplayed && !nodeData.choices) {
    const alpha = p.map(p.sin(p.frameCount * 0.1), -1, 1, 100, 255);
    p.fill(255, 255, 255, alpha);
    p.textAlign(p.RIGHT, p.BOTTOM);
    p.textSize(11);
    p.text("▼", CANVAS_WIDTH - 50, CANVAS_HEIGHT - 50);
  }
  
  p.pop();
}

function drawChoices(p, choices) {
  p.push();
  
  const startY = CANVAS_HEIGHT - 150;
  const choiceHeight = 30;
  const choiceWidth = 500;
  const spacing = 10;
  
  for (let i = 0; i < choices.length; i++) {
    const x = CANVAS_WIDTH / 2 - choiceWidth / 2;
    const y = startY - (choices.length - i) * (choiceHeight + spacing);
    
    // Highlight selected choice
    if (i === gameState.choiceIndex) {
      p.fill(80, 80, 120, 200);
      p.stroke(150, 150, 200);
      p.strokeWeight(3);
    } else {
      p.fill(40, 40, 60, 180);
      p.stroke(80, 80, 100);
      p.strokeWeight(1);
    }
    
    p.rect(x, y, choiceWidth, choiceHeight, 5);
    
    // Choice text
    p.noStroke();
    p.fill(i === gameState.choiceIndex ? 255 : 200);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(12);
    p.text(choices[i].text, x + 15, y + choiceHeight / 2);
  }
  
  p.pop();
}

function drawProgressIndicator(p) {
  p.push();
  p.textAlign(p.RIGHT, p.TOP);
  
  // Score display - larger and more prominent
  p.textSize(14);
  p.fill(255, 215, 0);
  p.noStroke();
  p.text(`Score: ${gameState.player.getScore()}`, CANVAS_WIDTH - 20, 15);
  
  // Endings counter
  p.textSize(11);
  p.fill(100, 100, 120);
  p.text(`Endings: ${gameState.player.getProgress()}`, CANVAS_WIDTH - 20, 35);
  p.pop();
}

export function renderPausedScreen(p) {
  // Draw game screen first
  renderPlayingScreen(p);
  
  // Overlay
  p.push();
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Paused text
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  p.textSize(14);
  p.fill(200);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  
  p.pop();
}

export function renderGameOverScreen(p) {
  p.background(10, 10, 20);
  
  const currentNodeData = getNodeData(gameState.currentNode);
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title
  p.textSize(28);
  p.fill(isWin ? 100 : 150, isWin ? 255 : 100, isWin ? 100 : 100);
  p.text(isWin ? "TRUTH REVEALED" : "AN ENDING", CANVAS_WIDTH / 2, 60);
  
  // Ending text
  p.textSize(13);
  p.fill(220);
  p.textAlign(p.CENTER, p.TOP);
  const textY = 120;
  p.text(currentNodeData ? currentNodeData.text : "", CANVAS_WIDTH / 2 - 220, textY, 440);
  
  // Score display - prominent
  p.textSize(20);
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(`FINAL SCORE: ${gameState.player.getScore()}`, CANVAS_WIDTH / 2, 300);
  
  // Progress
  p.textSize(16);
  p.fill(100, 200, 255);
  p.text(`Endings Discovered: ${gameState.player.getProgress()}`, CANVAS_WIDTH / 2, 330);
  
  if (isWin) {
    p.textSize(14);
    p.fill(150, 255, 150);
    p.text("You have discovered the truth!", CANVAS_WIDTH / 2, 355);
  } else {
    p.textSize(12);
    p.fill(180);
    p.text("There are more paths to explore...", CANVAS_WIDTH / 2, 355);
  }
  
  // Restart prompt
  p.textSize(16);
  const alpha = p.map(p.sin(p.frameCount * 0.05), -1, 1, 100, 255);
  p.fill(255, 255, 255, alpha);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 380);
  
  p.pop();
}

export default {
  renderStartScreen,
  renderPlayingScreen,
  renderPausedScreen,
  renderGameOverScreen
};