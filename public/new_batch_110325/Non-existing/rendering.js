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
  
  // Objective box
  p.push();
  p.fill(40, 40, 60, 200);
  p.stroke(255, 215, 0);
  p.strokeWeight(2);
  p.rect(CANVAS_WIDTH / 2 - 250, 150, 500, 60, 5);
  
  p.noStroke();
  p.textSize(16);
  p.fill(255, 215, 0);
  p.text("OBJECTIVE: Discover 8 Endings to Win!", CANVAS_WIDTH / 2, 170);
  
  const progress = gameState.player ? gameState.player.getProgress() : 0;
  const progressColor = progress >= 8 ? [100, 255, 100] : [255, 255, 255];
  p.fill(progressColor[0], progressColor[1], progressColor[2]);
  p.textSize(14);
  p.text(`Current Progress: ${progress} / 8 Endings`, CANVAS_WIDTH / 2, 195);
  p.pop();
  
  // Instructions
  p.textSize(13);
  p.fill(140, 140, 160);
  p.text("Each playthrough reveals a different ending", CANVAS_WIDTH / 2, 230);
  p.text("Make different choices to discover new paths", CANVAS_WIDTH / 2, 250);
  p.text("Collect all endings to unlock the TRUE ENDING", CANVAS_WIDTH / 2, 270);
  
  // Score display
  if (gameState.player && gameState.player.getScore() > 0) {
    p.textSize(16);
    p.fill(255, 215, 0);
    p.text(`Total Score: ${gameState.player.getScore()}`, CANVAS_WIDTH / 2, 300);
  }
  
  // Win status
  if (progress >= 8) {
    p.textSize(14);
    p.fill(100, 255, 100);
    p.text("★ READY TO UNLOCK TRUE ENDING ★", CANVAS_WIDTH / 2, 325);
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
  
  // Draw objectives and progress indicator
  drawObjectivesPanel(p);
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

function drawObjectivesPanel(p) {
  p.push();
  
  // Objectives panel background
  p.fill(20, 20, 40, 220);
  p.stroke(255, 215, 0);
  p.strokeWeight(2);
  p.rect(10, 10, 200, 80, 5);
  
  // Title
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.fill(255, 215, 0);
  p.text("OBJECTIVE", 20, 20);
  
  // Progress bar
  const progress = gameState.player.getProgress();
  const barWidth = 180;
  const barHeight = 20;
  const barX = 20;
  const barY = 45;
  
  // Progress bar background
  p.fill(40, 40, 60);
  p.stroke(100, 100, 120);
  p.strokeWeight(1);
  p.rect(barX, barY, barWidth, barHeight, 3);
  
  // Progress bar fill
  const fillWidth = (progress / 8) * barWidth;
  const barColor = progress >= 8 ? [100, 255, 100] : [255, 215, 0];
  p.fill(barColor[0], barColor[1], barColor[2]);
  p.noStroke();
  p.rect(barX, barY, fillWidth, barHeight, 3);
  
  // Progress text
  p.textSize(12);
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(`${progress} / 8 Endings`, barX + barWidth / 2, barY + barHeight / 2);
  
  // Status text
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(10);
  if (progress >= 8) {
    p.fill(100, 255, 100);
    p.text("★ READY TO WIN! ★", 20, 73);
  } else {
    p.fill(200, 200, 220);
    p.text(`${8 - progress} more to win!`, 20, 73);
  }
  
  // Score display
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(13);
  p.fill(255, 215, 0);
  p.text(`Score: ${gameState.player.getScore()}`, CANVAS_WIDTH - 20, 20);
  
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
  p.text("Press R to restart playthrough", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 65);
  
  p.pop();
}

export function renderGameOverScreen(p) {
  p.background(10, 10, 20);
  
  const currentNodeData = getNodeData(gameState.currentNode);
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  const progress = gameState.player.getProgress();
  
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title
  p.textSize(32);
  if (isWin) {
    p.fill(100, 255, 100);
    p.text("★ VICTORY ★", CANVAS_WIDTH / 2, 50);
    p.textSize(20);
    p.fill(255, 215, 0);
    p.text("TRUE ENDING UNLOCKED!", CANVAS_WIDTH / 2, 80);
  } else {
    p.fill(150, 150, 200);
    p.text("ENDING REACHED", CANVAS_WIDTH / 2, 50);
    p.textSize(16);
    p.fill(255, 215, 0);
    p.text("+100 POINTS - New Ending Discovered!", CANVAS_WIDTH / 2, 80);
  }
  
  // Ending text
  p.textSize(13);
  p.fill(220);
  p.textAlign(p.CENTER, p.TOP);
  const textY = 110;
  const endingText = currentNodeData ? currentNodeData.text : "";
  p.text(endingText, CANVAS_WIDTH / 2 - 220, textY, 440, 140);
  
  // Progress box
  p.push();
  p.fill(30, 30, 50, 230);
  p.stroke(isWin ? [100, 255, 100] : [255, 215, 0]);
  p.strokeWeight(3);
  p.rect(CANVAS_WIDTH / 2 - 240, 260, 480, 90, 8);
  p.pop();
  
  // Score display
  p.textSize(22);
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(`SCORE: ${gameState.player.getScore()}`, CANVAS_WIDTH / 2, 280);
  
  // Progress display
  p.textSize(18);
  if (isWin) {
    p.fill(100, 255, 100);
    p.text(`🎉 ALL ENDINGS COLLECTED: ${progress} 🎉`, CANVAS_WIDTH / 2, 310);
    p.textSize(14);
    p.fill(200, 255, 200);
    p.text("You have discovered the complete truth!", CANVAS_WIDTH / 2, 335);
  } else {
    const barColor = progress >= 8 ? [100, 255, 100] : [255, 255, 255];
    p.fill(barColor[0], barColor[1], barColor[2]);
    p.text(`Endings Discovered: ${progress} / 8`, CANVAS_WIDTH / 2, 310);
    
    p.textSize(14);
    if (progress >= 8) {
      p.fill(100, 255, 100);
      p.text("★ You can now unlock the TRUE ENDING! ★", CANVAS_WIDTH / 2, 335);
    } else {
      p.fill(180, 180, 220);
      p.text(`${8 - progress} more ending${(8 - progress) !== 1 ? 's' : ''} needed to win!`, CANVAS_WIDTH / 2, 335);
    }
  }
  
  // Instructions
  p.textSize(16);
  const alpha = p.map(p.sin(p.frameCount * 0.05), -1, 1, 100, 255);
  p.fill(255, 255, 255, alpha);
  if (isWin) {
    p.text("PRESS R TO PLAY AGAIN", CANVAS_WIDTH / 2, 375);
  } else {
    p.text("PRESS R TO START NEW PLAYTHROUGH", CANVAS_WIDTH / 2, 370);
    p.textSize(13);
    p.fill(200, 200, 220);
    p.text("(Make different choices to find new endings!)", CANVAS_WIDTH / 2, 390);
  }
  
  p.pop();
}

export default {
  renderStartScreen,
  renderPlayingScreen,
  renderPausedScreen,
  renderGameOverScreen
};