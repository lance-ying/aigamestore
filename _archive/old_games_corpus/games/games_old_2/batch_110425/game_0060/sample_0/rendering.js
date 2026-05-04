import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, CASE_DATA } from './globals.js';
import { renderDesktop } from './desktop.js';
import { renderBrowser } from './browser.js';
import { renderDatabase } from './database.js';
import { renderEmail } from './email.js';
import { renderChat } from './chat.js';

export function renderStartScreen(p) {
  p.background(20, 20, 30);
  
  // Title with glow effect
  p.push();
  p.fill(100, 200, 255, 100);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("无处遁形", CANVAS_WIDTH / 2 + 2, 80 + 2);
  
  p.fill(100, 200, 255);
  p.textSize(48);
  p.text("无处遁形", CANVAS_WIDTH / 2, 80);
  
  p.fill(180, 220, 255);
  p.textSize(20);
  p.text("UNSEEN: HACKER'S PREY", CANVAS_WIDTH / 2, 115);
  p.pop();
  
  // Description
  p.push();
  p.fill(200, 200, 220);
  p.textSize(11);
  p.textAlign(p.CENTER, p.CENTER);
  const desc = "You are a skilled hacker investigating a dangerous conspiracy.\nUse your tools to uncover the truth.";
  p.text(desc, CANVAS_WIDTH / 2, 160);
  p.pop();
  
  // Instructions box
  p.push();
  p.fill(40, 40, 50);
  p.stroke(80, 80, 100);
  p.strokeWeight(2);
  p.rect(100, 200, 400, 140, 8);
  
  p.fill(220, 220, 240);
  p.noStroke();
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  p.text("HOW TO PLAY:", 115, 215);
  
  p.textSize(10);
  p.fill(180, 180, 200);
  const instructions = `• Navigate desktop apps with ARROW KEYS
• SPACE to select/open applications
• Z to go back/close windows
• Search for clues in the Browser
• Query the Database for connections
• Crack passwords to access Email accounts
• Use Chat to social engineer suspects
• Complete all objectives to solve the case!`;
  p.text(instructions, 115, 235, 370);
  p.pop();
  
  // Start prompt
  p.push();
  const pulseAlpha = 150 + Math.sin(p.frameCount * 0.1) * 100;
  p.fill(100, 255, 100, pulseAlpha);
  p.textSize(16);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
  p.pop();
}

export function renderPlayingScreen(p, apps) {
  renderDesktop(p, apps);
  
  // Render open application window
  if (gameState.openApp) {
    switch (gameState.openApp) {
      case "browser":
        renderBrowser(p);
        break;
      case "database":
        renderDatabase(p);
        break;
      case "email":
        renderEmail(p);
        break;
      case "chat":
        renderChat(p);
        break;
    }
  }
}

export function renderPauseIndicator(p) {
  p.push();
  p.fill(255, 200, 0);
  p.textSize(14);
  p.textAlign(p.RIGHT, p.TOP);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  p.pop();
}

export function renderGameOverScreen(p) {
  p.background(20, 20, 30);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  const caseData = CASE_DATA[gameState.currentCase];
  
  p.push();
  
  // Title
  if (isWin) {
    p.fill(100, 255, 100);
    p.textSize(42);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("CASE SOLVED!", CANVAS_WIDTH / 2, 80);
    
    p.fill(200, 200, 220);
    p.textSize(16);
    p.text("Truth Uncovered", CANVAS_WIDTH / 2, 120);
  } else {
    p.fill(255, 100, 100);
    p.textSize(42);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("CASE FAILED", CANVAS_WIDTH / 2, 80);
    
    p.fill(200, 200, 220);
    p.textSize(16);
    p.text("Mission Compromised", CANVAS_WIDTH / 2, 120);
  }
  
  // Case summary box
  p.fill(40, 40, 50);
  p.stroke(80, 80, 100);
  p.strokeWeight(2);
  p.rect(100, 160, 400, 140, 8);
  
  p.fill(220, 220, 240);
  p.noStroke();
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  p.text("CASE SUMMARY:", 115, 175);
  
  p.textSize(11);
  p.fill(180, 180, 200);
  p.text(caseData.title, 115, 195);
  
  if (isWin) {
    p.fill(100, 255, 100);
    const summary = `✓ All objectives completed (${gameState.objectivesCompleted}/${caseData.objectives.length})
✓ Evidence gathered successfully
✓ Suspect confessed
✓ Victim location discovered

Score: ${gameState.score} points`;
    p.text(summary, 115, 215, 370);
  } else {
    p.fill(255, 150, 100);
    const summary = `× Objectives incomplete (${gameState.objectivesCompleted}/${caseData.objectives.length})
× Too many failed password attempts
× Investigation compromised

The truth remains hidden...`;
    p.text(summary, 115, 215, 370);
  }
  
  // Restart prompt
  const pulseAlpha = 150 + Math.sin(p.frameCount * 0.1) * 100;
  p.fill(100, 200, 255, pulseAlpha);
  p.textSize(16);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 350);
  
  p.pop();
}