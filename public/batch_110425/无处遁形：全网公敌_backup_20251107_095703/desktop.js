import { gameState, APP_TYPES, CASE_DATA } from './globals.js';
import { DesktopApp, Window } from './entities.js';

export function initializeDesktop() {
  const apps = [
    new DesktopApp("Browser", APP_TYPES.BROWSER, 50, 100, 80, 80, "🌐"),
    new DesktopApp("Database", APP_TYPES.DATABASE, 150, 100, 80, 80, "📊"),
    new DesktopApp("Chat", APP_TYPES.CHAT, 250, 100, 80, 80, "💬"),
    new DesktopApp("Email", APP_TYPES.EMAIL, 350, 100, 80, 80, "📧")
  ];
  
  return apps;
}

export function renderDesktop(p, apps) {
  // Desktop background
  p.background(30, 30, 40);
  
  // Render taskbar
  p.fill(20, 20, 30);
  p.noStroke();
  p.rect(0, 0, 600, 30);
  
  // System info
  p.fill(200, 200, 220);
  p.textSize(11);
  p.textAlign(p.LEFT, p.CENTER);
  p.text(`HACKER OS v2.0 | Case ${gameState.currentCase}/${gameState.totalCases}`, 10, 15);
  
  // Objectives completed
  const caseData = CASE_DATA[gameState.currentCase];
  if (caseData) {
    p.textAlign(p.RIGHT, p.CENTER);
    p.text(`Objectives: ${gameState.objectivesCompleted}/${caseData.objectives.length}`, 590, 15);
  }
  
  // Render desktop apps
  apps.forEach((app, index) => {
    app.render(p, index === gameState.selectedAppIndex);
  });
  
  // Case info panel
  renderCaseInfo(p);
}

export function renderCaseInfo(p) {
  const caseData = CASE_DATA[gameState.currentCase];
  if (!caseData) return;
  
  p.push();
  p.fill(40, 40, 50, 230);
  p.stroke(80, 80, 100);
  p.strokeWeight(2);
  p.rect(420, 50, 170, 140, 4);
  
  p.fill(220, 220, 240);
  p.noStroke();
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  p.text("CASE BRIEF:", 430, 60);
  
  p.textSize(10);
  p.text(caseData.title, 430, 80, 150);
  
  p.textSize(9);
  p.fill(180, 180, 200);
  p.text("OBJECTIVES:", 430, 110);
  
  caseData.objectives.forEach((obj, i) => {
    const completed = i < gameState.objectivesCompleted;
    p.fill(completed ? [100, 200, 100] : [180, 180, 200]);
    const marker = completed ? "✓" : "○";
    p.text(`${marker} ${obj}`, 430, 125 + i * 12, 150);
  });
  
  p.pop();
}

export function handleDesktopInput(p, apps) {
  if (gameState.openApp) return;
  
  // Arrow keys to navigate apps
  if (p.keyCode === 37) { // LEFT
    gameState.selectedAppIndex = Math.max(0, gameState.selectedAppIndex - 1);
  } else if (p.keyCode === 39) { // RIGHT
    gameState.selectedAppIndex = Math.min(apps.length - 1, gameState.selectedAppIndex + 1);
  } else if (p.keyCode === 32) { // SPACE to open
    gameState.openApp = apps[gameState.selectedAppIndex].type;
    gameState.selectedChoiceIndex = 0;
    gameState.browserSearchInput = "";
    gameState.databaseQueryInput = "";
    gameState.passwordInput = "";
  }
}