// ui.js - UI rendering and game screens

import { 
  gameState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  getCurrentTask,
  DAILY_TASKS
} from './globals.js';

export function renderUI(p) {
  switch (gameState.gamePhase) {
    case PHASE_START:
      renderStartScreen(p);
      break;
    case PHASE_PLAYING:
      renderHUD(p);
      renderTaskPrompt(p);
      renderDayTransition(p);
      break;
    case PHASE_PAUSED:
      renderHUD(p);
      renderPausedOverlay(p);
      break;
    case PHASE_GAME_OVER_WIN:
      renderHUD(p);
      renderGameOverWin(p);
      break;
    case PHASE_GAME_OVER_LOSE:
      renderHUD(p);
      renderGameOverLose(p);
      break;
  }
}

function renderStartScreen(p) {
  p.background(20, 20, 30);
  
  // Draw white door in background
  p.push();
  p.fill(255, 255, 255, 50);
  p.rectMode(p.CENTER);
  p.rect(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 120, 180, 10);
  p.pop();
  
  // Title
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(42);
  p.text('THE WHITE DOOR', CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.textSize(16);
  p.fill(200, 200, 200);
  p.text('A Rusty Lake Mental Facility', CANVAS_WIDTH / 2, 115);
  
  // Description
  p.textSize(14);
  p.fill(180, 180, 180);
  const lines = [
    'Help Robert Hill recover his memories',
    'Complete daily routines to restore color',
    'Navigate through reality and dreams',
    'Unlock the white door to freedom'
  ];
  for (let i = 0; i < lines.length; i++) {
    p.text(lines[i], CANVAS_WIDTH / 2, 160 + i * 25);
  }
  
  // Controls
  p.textSize(12);
  p.fill(150, 150, 150);
  const controls = [
    'Arrow Keys: Move',
    'Space/Z: Interact',
    'ESC: Pause',
    'R: Restart'
  ];
  for (let i = 0; i < controls.length; i++) {
    p.text(controls[i], CANVAS_WIDTH / 2, 290 + i * 18);
  }
  
  // Start prompt
  p.textSize(20);
  p.fill(255, 255, 0, 150 + p.sin(p.frameCount * 0.1) * 100);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
}

function renderHUD(p) {
  // Semi-transparent overlay at top
  p.push();
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 70);
  p.pop();
  
  // Day counter
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(18);
  p.text(`Day ${gameState.currentDay}/${gameState.totalDaysRequired}`, 10, 10);
  
  // Current task
  p.textSize(14);
  const currentTask = getCurrentTask();
  if (currentTask) {
    p.text(`Current: ${formatTaskName(currentTask)}`, 10, 35);
  }
  
  // Task progress
  const tasksToday = gameState.tasksCompletedToday;
  const totalTasks = DAILY_TASKS.length;
  p.text(`Today's Progress: ${tasksToday}/${totalTasks}`, 10, 52);
  
  // Color restoration bar
  const barX = CANVAS_WIDTH - 210;
  const barY = 15;
  const barWidth = 200;
  const barHeight = 40;
  
  // Background
  p.fill(50, 50, 50);
  p.rect(barX, barY, barWidth, barHeight, 5);
  
  // Color fill with gradient
  const colorRatio = gameState.colorPercentage / 100;
  for (let i = 0; i < barWidth * colorRatio; i++) {
    const t = i / (barWidth * colorRatio);
    const r = p.lerp(100, 255, t);
    const g = p.lerp(100, 200, t);
    const b = p.lerp(100, 150, t);
    p.fill(r, g, b);
    p.noStroke();
    p.rect(barX + i, barY, 1, barHeight);
  }
  
  // Border
  p.noFill();
  p.stroke(255);
  p.strokeWeight(2);
  p.rect(barX, barY, barWidth, barHeight, 5);
  
  // Text
  p.fill(255);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.text(`Color: ${Math.floor(gameState.colorPercentage)}%`, 
         barX + barWidth / 2, barY + barHeight / 2);
  
  // Memory fragments
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(12);
  p.text(`Memories: ${gameState.memoryFragments.length}`, CANVAS_WIDTH - 10, 60);
}

function renderTaskPrompt(p) {
  if (!gameState.showTaskPrompt) return;
  
  p.push();
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 200);
  p.rect(0, CANVAS_HEIGHT / 2 - 50, CANVAS_WIDTH, 100);
  
  // Task text
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.text(gameState.taskPromptText, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
  
  // Progress bar
  const barWidth = 300;
  const barHeight = 20;
  const barX = (CANVAS_WIDTH - barWidth) / 2;
  const barY = CANVAS_HEIGHT / 2 + 20;
  
  p.fill(50);
  p.rect(barX, barY, barWidth, barHeight, 5);
  
  p.fill(100, 255, 100);
  const progress = (gameState.taskProgress / 120) * barWidth;
  p.rect(barX, barY, progress, barHeight, 5);
  
  p.noFill();
  p.stroke(255);
  p.strokeWeight(2);
  p.rect(barX, barY, barWidth, barHeight, 5);
  
  p.pop();
}

function renderDayTransition(p) {
  if (!gameState.showDayTransition) return;
  
  gameState.dayTransitionTimer--;
  if (gameState.dayTransitionTimer <= 0) {
    gameState.showDayTransition = false;
    return;
  }
  
  p.push();
  
  // Full screen overlay
  const alpha = (gameState.dayTransitionTimer / 60) * 200;
  p.fill(0, 0, 0, alpha);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Day text
  p.fill(255, 255, 255, alpha);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(`Day ${gameState.currentDay - 1} Complete`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  
  p.textSize(24);
  p.text('Moving to next day...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  
  p.pop();
}

function renderPausedOverlay(p) {
  p.push();
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 180);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Paused text
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  
  p.textSize(20);
  p.text('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  
  p.pop();
}

function renderGameOverWin(p) {
  p.push();
  
  // Bright white overlay
  const pulseAlpha = 150 + p.sin(p.frameCount * 0.05) * 50;
  p.fill(255, 255, 255, pulseAlpha);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Victory text
  p.fill(0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('THE DOOR OPENS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
  
  p.textSize(24);
  p.text('Memories Restored', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  
  // Score
  p.textSize(20);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  p.text(`Days Survived: ${gameState.currentDay - 1}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
  
  // Restart prompt
  p.fill(50, 50, 50);
  p.textSize(18);
  p.text('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  
  p.pop();
}

function renderGameOverLose(p) {
  p.push();
  
  // Dark overlay
  p.fill(0, 0, 0, 220);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Game over text
  p.fill(150, 0, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('MEMORY LOST', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
  
  p.fill(200, 200, 200);
  p.textSize(20);
  p.text('The routine was broken', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
  p.text(`Day ${gameState.currentDay} - Task Failed`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  
  // Restart prompt
  p.fill(255);
  p.textSize(18);
  p.text('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  
  p.pop();
}

function formatTaskName(task) {
  return task.replace('_', ' ').toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}