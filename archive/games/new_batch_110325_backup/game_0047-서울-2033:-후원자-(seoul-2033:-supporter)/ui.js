// ui.js - UI rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES } from './globals.js';
import { achievements } from './achievements.js';

export function renderStartScreen(p) {
  p.background(20, 20, 30);
  
  // Title with glow effect
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  // Glow
  p.fill(100, 150, 200, 30);
  p.textSize(48);
  p.text("서울 2033", CANVAS_WIDTH / 2 + 2, 80 + 2);
  
  // Main title
  p.fill(150, 200, 255);
  p.textSize(48);
  p.text("서울 2033", CANVAS_WIDTH / 2, 80);
  
  p.fill(180, 180, 200);
  p.textSize(24);
  p.text("후원자 (Supporter)", CANVAS_WIDTH / 2, 115);
  
  // Description box
  p.fill(30, 30, 40);
  p.rect(50, 145, CANVAS_WIDTH - 100, 140, 8);
  
  p.fill(200, 200, 220);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  const desc = "Post-apocalyptic Seoul, 2033. Survive by making critical\nchoices. Manage Health, Stress, Money, and abilities.\n\nEvery decision matters. Resource management is key.\nUnlock achievements and discover story branches.\n\nGame ends at 0 Health, 100 Stress, or story ending.";
  p.text(desc, 70, 160, CANVAS_WIDTH - 140);
  
  // Controls
  p.fill(40, 40, 50);
  p.rect(50, 300, CANVAS_WIDTH - 100, 55, 8);
  
  p.fill(150, 200, 255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  p.text("CONTROLS:", 70, 310);
  p.fill(200, 200, 220);
  p.text("↑↓ Navigate | SPACE Select | Z Quick-select | ESC Pause | R Restart", 70, 330);
  
  // Prompt
  p.fill(100, 255, 150);
  p.textSize(18);
  p.textAlign(p.CENTER, p.CENTER);
  const flash = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(100, 255, 150, 255 * flash);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 375);
  
  p.pop();
}

export function renderGameOverScreen(p) {
  p.background(20, 20, 30);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title
  p.fill(isWin ? [100, 255, 150] : [255, 100, 100]);
  p.textSize(42);
  p.text(isWin ? "SURVIVED" : "GAME OVER", CANVAS_WIDTH / 2, 70);
  
  // Stats box
  p.fill(30, 30, 40);
  p.rect(100, 110, CANVAS_WIDTH - 200, 180, 8);
  
  p.fill(200, 200, 220);
  p.textSize(16);
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
  
  let y = 125;
  for (let stat of finalStats) {
    p.text(stat, 120, y);
    y += 18;
  }
  
  // Achievements
  if (gameState.achievements.length > 0) {
    p.fill(40, 40, 50);
    p.rect(100, 300, CANVAS_WIDTH - 200, 50, 8);
    
    p.fill(255, 215, 0);
    p.textSize(14);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`Achievements Unlocked: ${gameState.achievements.length}`, 120, 310);
    
    p.fill(200, 200, 220);
    p.textSize(11);
    const achText = gameState.achievements.slice(-3).map(id => {
      const ach = achievements.find(a => a.id === id);
      return ach ? ach.name : id;
    }).join(", ");
    p.text(achText, 120, 330, CANVAS_WIDTH - 240);
  }
  
  // Restart prompt
  p.fill(150, 200, 255);
  p.textSize(18);
  p.textAlign(p.CENTER, p.CENTER);
  const flash = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(150, 200, 255, 255 * flash);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 375);
  
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
}

function renderStatsBar(p) {
  const barHeight = 60;
  
  // Background
  p.fill(15, 15, 25);
  p.rect(0, 0, CANVAS_WIDTH, barHeight);
  
  // Stats
  p.push();
  p.textSize(11);
  p.textAlign(p.LEFT, p.TOP);
  
  // Day and Score
  p.fill(200, 200, 220);
  p.text(`Day ${gameState.day}`, 10, 8);
  p.text(`Score: ${gameState.score}`, 10, 24);
  p.text(`Events: ${gameState.eventsCompleted}`, 10, 40);
  
  // Health
  const healthColor = gameState.health > 60 ? [100, 255, 150] : 
                      gameState.health > 30 ? [255, 200, 100] : [255, 100, 100];
  p.fill(...healthColor);
  p.text(`Health: ${Math.max(0, Math.floor(gameState.health))}`, 110, 8);
  drawBar(p, 110, 20, 80, 8, gameState.health, gameState.maxHealth, healthColor);
  
  // Stress
  const stressColor = gameState.stress < 50 ? [100, 200, 255] :
                      gameState.stress < 75 ? [255, 200, 100] : [255, 100, 100];
  p.fill(...stressColor);
  p.text(`Stress: ${Math.floor(gameState.stress)}`, 110, 36);
  drawBar(p, 110, 48, 80, 8, gameState.stress, gameState.maxStress, stressColor);
  
  // Money
  p.fill(255, 215, 0);
  p.text(`Money: ${gameState.money}`, 210, 8);
  
  // Abilities
  p.fill(255, 150, 150);
  p.text(`STR: ${gameState.strength}`, 210, 24);
  p.fill(150, 200, 255);
  p.text(`INT: ${gameState.intelligence}`, 210, 36);
  p.fill(200, 150, 255);
  p.text(`CHA: ${gameState.charisma}`, 210, 48);
  
  // Achievements indicator
  if (gameState.achievements.length > 0) {
    p.fill(255, 215, 0);
    p.textAlign(p.RIGHT, p.TOP);
    p.text(`🏆 ${gameState.achievements.length}`, CANVAS_WIDTH - 10, 8);
  }
  
  p.pop();
}

function drawBar(p, x, y, width, height, value, maxValue, color) {
  // Background
  p.fill(40, 40, 50);
  p.rect(x, y, width, height, 2);
  
  // Fill
  const fillWidth = (value / maxValue) * width;
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
  const startY = 75;
  
  // Event box
  p.fill(35, 35, 45);
  p.rect(20, startY, CANVAS_WIDTH - 40, 140, 8);
  
  // Event title
  p.push();
  p.fill(150, 200, 255);
  p.textSize(18);
  p.textAlign(p.CENTER, p.TOP);
  p.text(event.title, CANVAS_WIDTH / 2, startY + 12);
  
  // Event description
  p.fill(200, 200, 220);
  p.textSize(13);
  p.textAlign(p.LEFT, p.TOP);
  p.text(event.description, 35, startY + 42, CANVAS_WIDTH - 70);
  p.pop();
  
  // Choices
  const choicesStartY = startY + 150;
  for (let i = 0; i < event.choices.length; i++) {
    renderChoice(p, event.choices[i], i, choicesStartY + i * 35);
  }
}

function renderChoice(p, choice, index, y) {
  const isSelected = index === gameState.selectedChoiceIndex;
  const canChoose = choice.canChoose();
  
  // Background
  if (isSelected) {
    p.fill(60, 80, 120);
  } else {
    p.fill(40, 40, 50);
  }
  p.rect(20, y, CANVAS_WIDTH - 40, 30, 6);
  
  // Border for selected
  if (isSelected) {
    p.noFill();
    p.stroke(100, 150, 255);
    p.strokeWeight(2);
    p.rect(20, y, CANVAS_WIDTH - 40, 30, 6);
    p.noStroke();
  }
  
  // Choice text
  p.push();
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(12);
  
  if (!canChoose) {
    p.fill(100, 100, 100);
    p.text(`${index + 1}. ${choice.text} [LOCKED]`, 30, y + 15);
  } else {
    p.fill(canChoose ? [200, 200, 220] : [100, 100, 100]);
    p.text(`${index + 1}. ${choice.text}`, 30, y + 15);
  }
  
  // Requirements display
  if (choice.requirements && !canChoose) {
    p.fill(255, 150, 150);
    p.textSize(10);
    let reqText = "";
    if (choice.requirements.str) reqText += `STR ${choice.requirements.str} `;
    if (choice.requirements.int) reqText += `INT ${choice.requirements.int} `;
    if (choice.requirements.cha) reqText += `CHA ${choice.requirements.cha} `;
    if (choice.requirements.money) reqText += `$${choice.requirements.money} `;
    p.textAlign(p.RIGHT, p.CENTER);
    p.text(reqText, CANVAS_WIDTH - 30, y + 15);
  }
  
  p.pop();
}

function renderMessages(p) {
  if (gameState.messageQueue.length > 0) {
    const msg = gameState.messageQueue[0];
    
    p.push();
    p.fill(0, 0, 0, 180);
    p.rect(0, CANVAS_HEIGHT - 60, CANVAS_WIDTH, 60);
    
    p.fill(255, 255, 255);
    p.textSize(14);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(msg.text, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30, CANVAS_WIDTH - 40);
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
  p.textSize(16);
  
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
    
    anim.y -= 0.8;
    anim.timer--;
    
    if (anim.timer <= 0) {
      gameState.statChangeAnimations.splice(i, 1);
    }
  }
  
  p.pop();
}

export function renderPauseOverlay(p) {
  p.push();
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 255, 255);
  p.textSize(32);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  p.textSize(14);
  p.text("Press ESC to continue", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
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
    timer: 60,
    maxTimer: 60
  });
}