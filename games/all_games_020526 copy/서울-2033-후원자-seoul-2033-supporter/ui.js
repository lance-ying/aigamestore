// ui.js - UI rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES } from './globals.js';
import { achievements } from './achievements.js';

export function renderStartScreen(p) {
  p.background(20, 20, 30);
  
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  // Replace title and description with "press enter to begin"
  p.fill(150, 200, 255); // A nice blueish color for the text
  p.textSize(40); // Larger size for the main instruction
  const flash = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(150, 200, 255, 255 * flash); // Apply flashing to the new title
  p.text("press enter to begin", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50); // Centered, slightly above middle
  
  // Controls
  p.fill(40, 40, 50);
  p.rect(50, 330, CANVAS_WIDTH - 100, 60, 8);
  
  p.fill(150, 200, 255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  p.text("CONTROLS:", 70, 342);
  p.fill(200, 200, 220);
  p.text("↑↓ Navigate | SPACE Select | Z Quick-select | ESC Pause | R Restart", 70, 364);
  
  // The old "PRESS ENTER TO START" prompt is removed as the new central message serves this purpose.
  
  p.pop();
}

export function renderGameOverScreen(p) {
  p.background(20, 20, 30);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title
  p.fill(isWin ? [100, 255, 150] : [255, 100, 100]);
  p.textSize(46);
  p.text(isWin ? "SURVIVED" : "GAME OVER", CANVAS_WIDTH / 2, 80);
  
  // Stats box
  p.fill(30, 30, 40);
  p.rect(100, 130, CANVAS_WIDTH - 200, 200, 8);
  
  p.fill(200, 200, 220);
  p.textSize(18);
  p.textAlign(p.LEFT, p.TOP);
  
  const finalStats = [
    `Days Survived: ${gameState.day}`,
    `Final Score: ${gameState.score}`,
    `Events Completed: ${gameState.eventsCompleted}`,
    ``,
    `Final Stats:`,
    `  Health: ${Math.max(0, gameState.health)}`,
    `  Stress: ${Math.min(100, gameState.stress)}`,
    `  Money: ${gameState.money}`,
    `  STR: ${gameState.strength} | INT: ${gameState.intelligence} | CHA: ${gameState.charisma}`
  ];
  
  let y = 148;
  for (let stat of finalStats) {
    p.text(stat, 120, y);
    y += 20;
  }
  
  // Achievements
  if (gameState.achievements.length > 0) {
    p.fill(40, 40, 50);
    p.rect(100, 345, CANVAS_WIDTH - 200, 55, 8);
    
    p.fill(255, 215, 0);
    p.textSize(16);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`Achievements Unlocked: ${gameState.achievements.length}`, 120, 357);
    
    p.fill(200, 200, 220);
    p.textSize(13);
    const achText = gameState.achievements.slice(-3).map(id => {
      const ach = achievements.find(a => a.id === id);
      return ach ? ach.name : id;
    }).join(", ");
    p.text(achText, 120, 380, CANVAS_WIDTH - 240);
  }
  
  // Restart prompt
  p.fill(150, 200, 255);
  p.textSize(20);
  p.textAlign(p.CENTER, p.CENTER);
  const flash = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(150, 200, 255, 255 * flash);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 460);
  
  p.pop();
}

export function renderPlayingScreen(p) {
  p.background(25, 25, 35);
  
  // Top stats bar
  renderStatsBar(p);
  
  // Event display
  if (gameState.currentEvent) {
    renderEvent(p);
  }
  
  // Messages
  renderMessages(p);
  
  // Stat change animations
  renderStatAnimations(p);
  
  // Processing indicator
  if (gameState.isProcessingChoice) {
    renderProcessingIndicator(p);
  }
}

function renderStatsBar(p) {
  const barHeight = 90;
  
  // Background
  p.fill(15, 15, 25);
  p.rect(0, 0, CANVAS_WIDTH, barHeight);
  
  // Stats
  p.push();
  
  // Day and Score - Top left
  p.textAlign(p.LEFT, p.TOP);
  p.fill(180, 200, 220);
  p.textSize(15);
  p.text(`Day ${gameState.day}`, 12, 8);
  p.textSize(13);
  p.text(`Score: ${gameState.score}`, 12, 28);
  p.text(`Events: ${gameState.eventsCompleted}`, 12, 46);
  
  // Achievements indicator
  if (gameState.achievements.length > 0) {
    p.fill(255, 215, 0);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(14);
    p.text(`🏆 ${gameState.achievements.length}`, 12, 66);
  }
  
  // Health - Large and prominent
  const healthX = 120;
  const healthY = 10;
  const healthColor = gameState.health > 60 ? [100, 255, 150] : 
                      gameState.health > 30 ? [255, 200, 100] : [255, 100, 100];
  p.fill(...healthColor);
  p.textSize(18);
  p.textAlign(p.LEFT, p.TOP);
  p.textStyle(p.BOLD);
  p.text(`HEALTH: ${Math.max(0, Math.floor(gameState.health))}`, healthX, healthY);
  p.textStyle(p.NORMAL);
  drawBar(p, healthX, healthY + 24, 120, 14, gameState.health, gameState.maxHealth, healthColor);
  
  // Stress - Large and prominent
  const stressX = 120;
  const stressY = 52;
  const stressColor = gameState.stress < 50 ? [100, 200, 255] :
                      gameState.stress < 75 ? [255, 200, 100] : [255, 100, 100];
  p.fill(...stressColor);
  p.textSize(18);
  p.textAlign(p.LEFT, p.TOP);
  p.textStyle(p.BOLD);
  p.text(`STRESS: ${Math.floor(gameState.stress)}`, stressX, stressY);
  p.textStyle(p.NORMAL);
  drawBar(p, stressX, stressY + 24, 120, 14, gameState.stress, gameState.maxStress, stressColor);
  
  // Money - Larger display
  const moneyX = 280;
  const moneyY = 10;
  p.fill(255, 215, 0);
  p.textSize(18);
  p.textAlign(p.LEFT, p.TOP);
  p.textStyle(p.BOLD);
  p.text(`MONEY`, moneyX, moneyY);
  p.textSize(22);
  p.text(`$${gameState.money}`, moneyX, moneyY + 22);
  p.textStyle(p.NORMAL);
  
  // Abilities - Larger display with icons
  const abilityX = 280;
  const abilityY = 57;
  p.textSize(16);
  p.textAlign(p.LEFT, p.TOP);
  
  p.fill(255, 150, 150);
  p.textStyle(p.BOLD);
  p.text(`STR ${gameState.strength}`, abilityX, abilityY);
  
  p.fill(150, 200, 255);
  p.text(`INT ${gameState.intelligence}`, abilityX + 70, abilityY);
  
  p.fill(200, 150, 255);
  p.text(`CHA ${gameState.charisma}`, abilityX + 140, abilityY);
  
  p.textStyle(p.NORMAL);
  
  p.pop();
  
  // Separator line
  p.stroke(60, 60, 80);
  p.strokeWeight(2);
  p.line(0, barHeight - 1, CANVAS_WIDTH, barHeight - 1);
  p.noStroke();
}

function drawBar(p, x, y, width, height, value, maxValue, color) {
  // Background
  p.fill(40, 40, 50);
  p.rect(x, y, width, height, 3);
  
  // Fill
  const fillWidth = Math.max(0, (value / maxValue) * width);
  p.fill(...color);
  p.rect(x, y, fillWidth, height, 3);
  
  // Border
  p.noFill();
  p.stroke(80, 80, 90);
  p.strokeWeight(2);
  p.rect(x, y, width, height, 3);
  p.noStroke();
}

function drawSmallBar(p, x, y, width, height, value, maxValue, color) {
  // Background
  p.fill(40, 40, 50);
  p.rect(x, y, width, height, 2);
  
  // Fill
  const fillWidth = Math.max(0, (value / maxValue) * width);
  p.fill(...color);
  p.rect(x, y, fillWidth, height, 2);
  
  // Border
  p.noFill();
  p.stroke(60, 60, 70);
  p.strokeWeight(1);
  p.rect(x, y, width, height, 2);
  p.noStroke();
}

function renderEvent(p) {
  const event = gameState.currentEvent;
  const startY = 100;
  
  // Event box
  p.fill(35, 35, 45);
  p.rect(20, startY, CANVAS_WIDTH - 40, 140, 8);
  
  // Event title
  p.push();
  p.fill(150, 200, 255);
  p.textSize(20);
  p.textAlign(p.CENTER, p.TOP);
  p.text(event.title, CANVAS_WIDTH / 2, startY + 14);
  
  // Event description
  p.fill(200, 200, 220);
  p.textSize(15);
  p.textAlign(p.LEFT, p.TOP);
  p.text(event.description, 35, startY + 46, CANVAS_WIDTH - 70);
  p.pop();
  
  // Choices
  const choicesStartY = startY + 150;
  for (let i = 0; i < event.choices.length; i++) {
    renderChoice(p, event.choices[i], i, choicesStartY + i * 42);
  }
}

function renderChoice(p, choice, index, y) {
  const isSelected = index === gameState.selectedChoiceIndex;
  const canChoose = choice.canChoose();
  const isProcessing = gameState.isProcessingChoice;
  
  // Background
  if (isSelected && !isProcessing) {
    p.fill(60, 80, 120);
  } else if (isProcessing) {
    p.fill(50, 50, 60);
  } else {
    p.fill(40, 40, 50);
  }
  p.rect(20, y, CANVAS_WIDTH - 40, 38, 6);
  
  // Border for selected
  if (isSelected && !isProcessing) {
    p.noFill();
    p.stroke(100, 150, 255);
    p.strokeWeight(3);
    p.rect(20, y, CANVAS_WIDTH - 40, 38, 6);
    p.noStroke();
  }
  
  // Choice text
  p.push();
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(15);
  
  if (!canChoose) {
    p.fill(100, 100, 100);
    p.text(`${index + 1}. ${choice.text} [LOCKED]`, 30, y + 19);
  } else {
    p.fill(canChoose ? [200, 200, 220] : [100, 100, 100]);
    p.text(`${index + 1}. ${choice.text}`, 30, y + 19);
  }
  
  // Requirements display
  if (choice.requirements && !canChoose) {
    p.fill(255, 150, 150);
    p.textSize(13);
    let reqText = "";
    if (choice.requirements.str) reqText += `STR ${choice.requirements.str} `;
    if (choice.requirements.int) reqText += `INT ${choice.requirements.int} `;
    if (choice.requirements.cha) reqText += `CHA ${choice.requirements.cha} `;
    if (choice.requirements.money) reqText += `$${choice.requirements.money} `;
    p.textAlign(p.RIGHT, p.CENTER);
    p.text(reqText, CANVAS_WIDTH - 30, y + 19);
  }
  
  p.pop();
}

function renderMessages(p) {
  if (gameState.messageQueue.length > 0) {
    const msg = gameState.messageQueue[0];
    
    p.push();
    p.fill(0, 0, 0, 200);
    p.rect(0, CANVAS_HEIGHT - 70, CANVAS_WIDTH, 70);
    
    p.fill(255, 255, 255);
    p.textSize(17);
    p.textAlign(p.CENTER, p.CENTER);
    p.textStyle(p.BOLD);
    p.text(msg.text, 20, CANVAS_HEIGHT - 35, CANVAS_WIDTH - 40);
    p.textStyle(p.NORMAL);
    p.pop();
    
    msg.timer--;
    if (msg.timer <= 0) {
      gameState.messageQueue.shift();
    }
  }
}

function renderStatAnimations(p) {
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.textStyle(p.BOLD);
  
  for (let i = gameState.statChangeAnimations.length - 1; i >= 0; i--) {
    const anim = gameState.statChangeAnimations[i];
    
    const alpha = Math.max(0, 255 * (anim.timer / anim.maxTimer));
    
    if (anim.value > 0) {
      p.fill(100, 255, 150, alpha);
      p.text(`+${anim.value} ${anim.stat}`, anim.x, anim.y);
    } else {
      p.fill(255, 100, 100, alpha);
      p.text(`${anim.value} ${anim.stat}`, anim.x, anim.y);
    }
    
    anim.y -= 1.2;
    anim.timer--;
    
    if (anim.timer <= 0) {
      gameState.statChangeAnimations.splice(i, 1);
    }
  }
  
  p.textStyle(p.NORMAL);
  p.pop();
}

function renderProcessingIndicator(p) {
  p.push();
  
  // Subtle overlay
  p.fill(0, 0, 0, 30);
  p.rect(0, 90, CANVAS_WIDTH, CANVAS_HEIGHT - 90);
  
  // Processing text
  p.fill(150, 200, 255, 200);
  p.textSize(16);
  p.textAlign(p.CENTER, p.TOP);
  p.text("Processing choice...", CANVAS_WIDTH / 2, 280);
  
  p.pop();
}

export function addMessage(text, duration = 90) {
  gameState.messageQueue.push({
    text: text,
    timer: duration,
    maxTimer: duration
  });
}

export function addStatAnimation(stat, value, x, y) {
  gameState.statChangeAnimations.push({
    stat: stat,
    value: value,
    x: x,
    y: y,
    timer: 70,
    maxTimer: 70
  });
}