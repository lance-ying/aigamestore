// render.js - Rendering functions

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE } from './globals.js';

export function renderGame(p) {
  p.background(40, 40, 40);

  if (gameState.gamePhase === GAME_PHASES.START) {
    renderStartScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    renderGameplay(p);
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    renderGameplay(p);
    renderPauseOverlay(p);
  } else if (gameState.gamePhase === GAME_PHASES.UPGRADE_SELECTION) {
    renderUpgradeSelection(p);
  } else if (gameState.gamePhase === GAME_PHASES.LEVEL_TRANSITION) {
    renderLevelTransition(p);
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    renderGameOver(p, true);
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    renderGameOver(p, false);
  }
}

function renderStartScreen(p) {
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("DUNGEON DASHER", CANVAS_WIDTH / 2, 80);

  p.textSize(16);
  p.fill(200);
  const instructions = [
    "Navigate grid-based dungeons and defeat enemies!",
    "",
    "CONTROLS:",
    "Arrow Keys - Move",
    "Stand Still - Auto-attack nearest enemy",
    "ESC - Pause",
    "",
    "Clear rooms to earn upgrades.",
    "Survive 5 levels to win!",
    "",
    "PRESS ENTER TO START"
  ];

  let y = 150;
  for (const line of instructions) {
    p.text(line, CANVAS_WIDTH / 2, y);
    y += 24;
  }

  if (gameState.highScore > 0) {
    p.textSize(20);
    p.fill(255, 215, 0);
    p.text(`HIGH SCORE: ${gameState.highScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
  }
}

function renderGameplay(p) {
  // Render floor
  p.fill(50, 50, 50);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Render walls
  p.fill(80, 80, 80);
  for (const wall of gameState.walls) {
    p.rect(wall.x * GRID_SIZE, wall.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
  }

  // Render projectiles
  for (const proj of gameState.projectiles) {
    proj.render(p);
  }

  // Render entities
  for (const entity of gameState.entities) {
    if (entity && entity.render) {
      entity.render(p);
    }
  }

  // Render UI
  renderUI(p);
}

function renderUI(p) {
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(20);
  p.text(`LEVEL: ${gameState.currentLevel}`, 10, 10);
  
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 10, 10);

  // Room progress
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(16);
  const roomsInLevel = gameState.roomsPerLevel[gameState.currentLevel - 1];
  p.text(`Room ${gameState.currentRoom}/${roomsInLevel}`, CANVAS_WIDTH / 2, 10);
}

function renderPauseOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

  p.textSize(20);
  p.text("ESC or SPACE to Resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  p.text("R to Restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);

  // Small indicator in top right
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.fill(255, 255, 100);
  p.text("PAUSED", CANVAS_WIDTH - 10, 40);
}

function renderUpgradeSelection(p) {
  p.background(30, 30, 40);

  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("CHOOSE AN UPGRADE", CANVAS_WIDTH / 2, 50);

  const boxWidth = 160;
  const boxHeight = 180;
  const spacing = 20;
  const startX = (CANVAS_WIDTH - (boxWidth * 3 + spacing * 2)) / 2;

  for (let i = 0; i < 3; i++) {
    const upgrade = gameState.availableUpgrades[i];
    const x = startX + i * (boxWidth + spacing);
    const y = 120;

    // Box background
    if (i === gameState.selectedUpgradeIndex) {
      p.fill(255, 215, 0, 100);
      p.stroke(255, 215, 0);
      p.strokeWeight(4);
    } else {
      p.fill(60, 70, 90);
      p.stroke(100, 110, 130);
      p.strokeWeight(2);
    }
    p.rect(x, y, boxWidth, boxHeight, 10);

    // Icon
    p.textSize(48);
    p.fill(255);
    p.noStroke();
    p.text(upgrade.icon, x + boxWidth / 2, y + 50);

    // Name
    p.textSize(16);
    p.text(upgrade.name, x + boxWidth / 2, y + 100);

    // Description
    p.textSize(12);
    p.fill(200);
    const words = upgrade.description.split(' ');
    let line = '';
    let yPos = y + 130;
    for (const word of words) {
      const testLine = line + word + ' ';
      if (p.textWidth(testLine) > boxWidth - 20 && line !== '') {
        p.text(line, x + boxWidth / 2, yPos);
        line = word + ' ';
        yPos += 15;
      } else {
        line = testLine;
      }
    }
    p.text(line, x + boxWidth / 2, yPos);
  }

  p.fill(255);
  p.textSize(18);
  p.text("Use LEFT/RIGHT arrows to select, SPACE to confirm", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
}

function renderLevelTransition(p) {
  p.background(20, 20, 30);

  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text(`LEVEL ${gameState.currentLevel - 1} COMPLETE!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

  p.fill(200);
  p.textSize(24);
  p.text(`Preparing for Level ${gameState.currentLevel}...`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
}

function renderGameOver(p, isWin) {
  p.background(isWin ? [30, 50, 30] : [50, 30, 30]);

  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "YOU WIN!" : "GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

  p.fill(255);
  p.textSize(24);
  p.text(`FINAL SCORE: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

  if (gameState.highScore > 0) {
    p.textSize(20);
    p.fill(255, 215, 0);
    p.text(`HIGH SCORE: ${gameState.highScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  }

  p.fill(200);
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
}