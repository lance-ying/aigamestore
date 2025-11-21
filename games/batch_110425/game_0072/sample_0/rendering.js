// rendering.js - Rendering functions
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderGame(p) {
  // Clear background
  p.background(20, 25, 35);

  if (gameState.gamePhase === GAME_PHASES.START) {
    renderStartScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    renderGameplay(p);
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    renderGameplay(p);
    renderPauseOverlay(p);
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
             gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    renderGameplay(p);
    renderGameOverScreen(p);
  }
}

function renderStartScreen(p) {
  // Background gradient
  for (let i = 0; i < CANVAS_HEIGHT; i++) {
    const inter = i / CANVAS_HEIGHT;
    const c = p.lerpColor(p.color(30, 40, 60), p.color(15, 20, 30), inter);
    p.stroke(c);
    p.line(0, i, CANVAS_WIDTH, i);
  }

  // Title
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(150, 220, 255);
  p.noStroke();
  p.textSize(48);
  p.text("KIWANUKA", CANVAS_WIDTH / 2, 80);

  // Subtitle with glow
  p.fill(100, 180, 220, 150);
  p.textSize(16);
  p.text("GUIDE THE GLOWING CITIZENS", CANVAS_WIDTH / 2, 120);

  // Instructions box
  p.fill(40, 50, 70, 200);
  p.stroke(80, 100, 130);
  p.strokeWeight(2);
  p.rect(80, 150, CANVAS_WIDTH - 160, 170, 10);

  // Instructions
  p.noStroke();
  p.fill(200, 220, 240);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  
  const instructions = [
    "OBJECTIVE: Guide 70%+ citizens to the exit portal",
    "",
    "CONTROLS:",
    "  Arrow Keys - Move guide staff / Topple tower",
    "  Z - Select citizen to build tower (max 5)",
    "  Space - Release selected citizen",
    "  Shift - Speed up movement",
    "",
    "Build towers and topple them to create bridges!"
  ];

  let y = 160;
  for (let line of instructions) {
    p.text(line, 100, y);
    y += 18;
  }

  // Start prompt with pulse
  const pulse = p.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(150, 255, 150, 255 * pulse);
  p.textSize(20);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
}

function renderGameplay(p) {
  // Game background
  p.background(25, 30, 40);

  // Render platforms
  for (let platform of gameState.platforms) {
    platform.render();
  }

  // Render bridges
  for (let bridge of gameState.bridges) {
    bridge.render();
  }

  // Render exit portal
  if (gameState.exitPortal) {
    gameState.exitPortal.render();
  }

  // Render citizens (not in tower or bridge)
  for (let citizen of gameState.citizens) {
    if (citizen.state !== "tower" && citizen.state !== "bridge") {
      citizen.render();
    }
  }

  // Render tower
  if (gameState.tower) {
    gameState.tower.render();
    // Render tower citizens
    for (let citizen of gameState.tower.citizens) {
      citizen.render();
    }
  }

  // Render bridge citizens
  for (let bridge of gameState.bridges) {
    for (let citizen of bridge.citizens) {
      citizen.render();
    }
  }

  // Render staff on top
  if (gameState.player) {
    gameState.player.render();
  }

  // UI - Top bar
  renderUI(p);
}

function renderUI(p) {
  // Semi-transparent top bar
  p.noStroke();
  p.fill(15, 20, 30, 200);
  p.rect(0, 0, CANVAS_WIDTH, 35);

  // Level info
  p.fill(150, 200, 255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.CENTER);
  p.text(`Level ${gameState.currentLevel + 1}`, 10, 17);

  // Citizens counter
  const aliveCitizens = gameState.citizens.filter(c => c.state !== "dead").length;
  const minRequired = gameState.currentLevelData.minCitizensToWin;
  const citizenText = `Citizens: ${gameState.citizensReachedExit}/${minRequired} (${aliveCitizens} alive)`;
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(150, 255, 150);
  p.text(citizenText, CANVAS_WIDTH / 2, 17);

  // Score
  p.textAlign(p.RIGHT, p.CENTER);
  p.fill(255, 220, 150);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 17);

  // Selected citizen indicator
  if (gameState.selectedCitizen) {
    p.fill(255, 200, 100);
    p.textSize(12);
    p.textAlign(p.CENTER, p.TOP);
    p.text("Citizen Selected - Press Z near another to stack", CANVAS_WIDTH / 2, 40);
  }

  // Tower indicator
  if (gameState.tower) {
    p.fill(200, 180, 255);
    p.textSize(12);
    p.textAlign(p.CENTER, p.TOP);
    p.text(`Tower: ${gameState.tower.citizens.length}/5 - Use Arrow Keys to Topple`, CANVAS_WIDTH / 2, 40);
  }
}

function renderPauseOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  p.fill(255, 255, 255);
  p.textSize(18);
  p.textAlign(p.RIGHT, p.TOP);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

function renderGameOverScreen(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Result box
  p.fill(40, 50, 70, 230);
  p.stroke(100, 120, 150);
  p.strokeWeight(3);
  p.rect(150, 120, 300, 180, 15);

  p.textAlign(p.CENTER, p.CENTER);
  p.noStroke();

  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    // Win screen
    p.fill(150, 255, 150);
    p.textSize(36);
    p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, 160);

    p.fill(200, 220, 240);
    p.textSize(16);
    p.text(`Citizens Saved: ${gameState.citizensReachedExit}/${gameState.totalCitizens}`, 
           CANVAS_WIDTH / 2, 200);
    p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 225);
  } else {
    // Lose screen
    p.fill(255, 150, 150);
    p.textSize(36);
    p.text("LEVEL FAILED", CANVAS_WIDTH / 2, 160);

    p.fill(200, 220, 240);
    p.textSize(16);
    const minRequired = gameState.currentLevelData.minCitizensToWin;
    p.text(`Need ${minRequired} citizens to win`, CANVAS_WIDTH / 2, 200);
    p.text(`Only ${gameState.citizensReachedExit} reached exit`, CANVAS_WIDTH / 2, 225);
  }

  // Restart prompt
  const pulse = p.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(200, 200, 255, 255 * pulse);
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 260);
}