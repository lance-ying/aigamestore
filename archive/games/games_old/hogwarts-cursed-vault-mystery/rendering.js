import { gameState, GAME_PHASES, PLAY_SUBSTATES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 20, 40);
  
  for (let i = 0; i < 50; i++) {
    const x = (i * 137.5) % CANVAS_WIDTH;
    const y = (i * 73.2) % CANVAS_HEIGHT;
    p.fill(255, 255, 200, 100);
    p.noStroke();
    p.ellipse(x, y, 3, 3);
  }
  
  p.fill(255, 220, 100);
  p.textSize(42);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("HOGWARTS", 300, 80);
  
  p.textSize(24);
  p.fill(200, 180, 220);
  p.text("Cursed Vault Mystery", 300, 120);
  
  p.fill(255);
  p.textSize(16);
  p.textAlign(p.CENTER, p.TOP);
  const instructions = [
    "Uncover the secrets of the Cursed Vaults",
    "hidden within Hogwarts!",
    "",
    "Complete tasks by interacting with glowing objects.",
    "Manage your energy and develop your attributes.",
    "Win duels and make wise choices to progress.",
    "",
    "Controls:",
    "Arrow Keys: Navigate menus and choices",
    "SPACE/Z: Confirm selection",
    "SHIFT: Toggle attribute panel",
    "ESC: Pause  |  R: Restart",
    "",
    "PRESS ENTER TO START"
  ];
  
  let yPos = 160;
  for (const line of instructions) {
    p.text(line, 300, yPos);
    yPos += 18;
  }
}

export function renderPlayingScreen(p) {
  p.background(40, 35, 50);
  
  renderScene(p);
  renderUI(p);
  
  if (gameState.playSubstate === PLAY_SUBSTATES.DIALOGUE && gameState.currentDialogue) {
    gameState.currentDialogue.render(p);
  } else if (gameState.playSubstate === PLAY_SUBSTATES.DUEL && gameState.currentDuel) {
    gameState.currentDuel.render(p);
  } else if (gameState.playSubstate === PLAY_SUBSTATES.LEVEL_TRANSITION) {
    renderLevelTransition(p);
  }
}

export function renderScene(p) {
  p.fill(50, 45, 60);
  p.rect(0, 0, CANVAS_WIDTH, 260);
  
  p.fill(70, 65, 80);
  p.rect(50, 50, 500, 180);
  
  p.fill(255);
  p.textSize(20);
  p.textAlign(p.CENTER, p.TOP);
  if (gameState.currentScene < gameState.interactiveObjects.length) {
    const sceneName = ["Great Hall", "Charms", "Potions", "Library", "Corridor", 
                       "Courtyard", "Defense", "Forbidden", "Vault Entrance",
                       "Adv. Potions", "Secret", "Chamber", "Runes", "Antechamber", "Final Vault"][gameState.currentScene] || "Scene";
    p.text(sceneName, 300, 60);
  }
  
  for (const obj of gameState.interactiveObjects) {
    obj.update(p);
    obj.render(p);
  }
}

export function renderUI(p) {
  if (gameState.showAttributePanel) {
    p.fill(0, 0, 0, 180);
    p.rect(10, 10, 180, 100);
    
    p.fill(255);
    p.textSize(12);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`Year ${gameState.currentYear}`, 20, 20);
    p.text(`Courage: ${gameState.courage}`, 20, 40);
    p.text(`Empathy: ${gameState.empathy}`, 20, 55);
    p.text(`Knowledge: ${gameState.knowledge}`, 20, 70);
    p.text(`Tasks: ${gameState.tasksCompletedThisYear}/${gameState.tasksRequiredPerYear[gameState.currentYear - 1]}`, 20, 90);
  }
  
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`House Points: ${gameState.housePoints}`, CANVAS_WIDTH - 10, 10);
  
  const barWidth = 200;
  const barHeight = 20;
  const barX = (CANVAS_WIDTH - barWidth) / 2;
  const barY = 10;
  
  p.fill(50, 50, 50);
  p.rect(barX, barY, barWidth, barHeight);
  
  const energyFill = (gameState.currentEnergy / gameState.maxEnergy) * barWidth;
  p.fill(100, 200, 100);
  p.rect(barX, barY, energyFill, barHeight);
  
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(`Energy: ${Math.floor(gameState.currentEnergy)}/${gameState.maxEnergy}`, barX + barWidth / 2, barY + barHeight / 2);
  
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.fill(255, 220, 100);
    p.textSize(16);
    p.textAlign(p.RIGHT, p.TOP);
    p.text("PAUSED", CANVAS_WIDTH - 10, 35);
  }
}

export function renderLevelTransition(p) {
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 220, 100);
  p.textSize(32);
  p.textAlign(p.CENTER, p.CENTER);
  
  if (gameState.currentYear > 1) {
    p.text(`Year ${gameState.currentYear - 1} Completed!`, 300, 160);
    p.textSize(24);
    p.fill(200, 200, 255);
    p.text(`Welcome to Year ${gameState.currentYear}!`, 300, 220);
  } else {
    p.text(`Welcome to Year ${gameState.currentYear}!`, 300, 200);
  }
}

export function renderPausedScreen(p) {
  renderPlayingScreen(p);
}

export function renderGameOverScreen(p) {
  p.background(20, 20, 40);
  
  p.fill(255);
  p.textSize(48);
  p.textAlign(p.CENTER, p.CENTER);
  
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    p.fill(100, 255, 100);
    p.text("VICTORY!", 300, 120);
    p.fill(255);
    p.textSize(20);
    p.text("You solved the Cursed Vault Mystery!", 300, 180);
  } else {
    p.fill(255, 100, 100);
    p.text("GAME OVER", 300, 120);
    p.fill(255);
    p.textSize(16);
    p.text(gameState.gameOverReason, 300, 180);
  }
  
  p.textSize(20);
  p.text(`Final House Points: ${gameState.housePoints}`, 300, 240);
  
  p.textSize(18);
  p.fill(255, 220, 100);
  p.text("PRESS R TO RESTART", 300, 320);
}