import { gameState, PHASE, CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE, GRID_COLS, GRID_ROWS, COMMAND_TYPES } from './globals.js';
import { getLevelData } from './levels.js';

export function drawGame(p) {
  p.background(20, 20, 30);

  if (gameState.gamePhase === PHASE.START) {
    drawStartScreen(p);
  } else if (gameState.gamePhase === PHASE.PLAYING) {
    drawPlayingScreen(p);
  } else if (gameState.gamePhase === PHASE.PAUSED) {
    drawPlayingScreen(p);
    drawPausedOverlay(p);
  } else if (gameState.gamePhase === PHASE.GAME_OVER_WIN || gameState.gamePhase === PHASE.GAME_OVER_LOSE) {
    drawGameOverScreen(p);
  }
}

function drawStartScreen(p) {
  p.fill(100, 150, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("异常", CANVAS_WIDTH / 2, 80);

  p.fill(255);
  p.textSize(16);
  p.text("AI PROGRAMMING CHALLENGE", CANVAS_WIDTH / 2, 130);

  p.textSize(14);
  p.fill(200);
  const lines = [
    "Program robots to complete mission objectives.",
    "Navigate menus with ARROW KEYS.",
    "Add commands with SPACE, remove with SHIFT.",
    "Switch robots with UP/DOWN arrows.",
    "Execute your program with Z.",
    "",
    "Complete all levels to win!"
  ];
  
  lines.forEach((line, i) => {
    p.text(line, CANVAS_WIDTH / 2, 180 + i * 22);
  });

  p.fill(100, 255, 100);
  p.textSize(20);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
}

function drawPlayingScreen(p) {
  // Draw grid
  drawGrid(p);

  // Draw exit
  if (gameState.exit) {
    gameState.exit.update(p);
    gameState.exit.draw(p);
  }

  // Draw entities
  gameState.entities.forEach(entity => {
    if (entity.draw) {
      entity.draw(p);
    }
  });

  // Draw UI
  drawUI(p);
  
  // Draw programming interface
  if (!gameState.simulation.running) {
    drawProgrammingInterface(p);
  } else {
    drawSimulationStatus(p);
  }
}

function drawGrid(p) {
  p.stroke(40, 40, 60);
  p.strokeWeight(1);
  
  for (let x = 0; x <= GRID_COLS; x++) {
    p.line(x * GRID_SIZE, 0, x * GRID_SIZE, CANVAS_HEIGHT);
  }
  
  for (let y = 0; y <= GRID_ROWS; y++) {
    p.line(0, y * GRID_SIZE, CANVAS_WIDTH, y * GRID_SIZE);
  }
}

function drawUI(p) {
  // Level info
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  const levelData = getLevelData(gameState.currentLevel);
  if (levelData) {
    p.text(`Level ${gameState.currentLevel + 1}: ${levelData.name}`, 5, 5);
    p.textSize(11);
    p.fill(200);
    p.text(levelData.description, 5, 25);
  }

  // Score
  p.fill(100, 255, 100);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 5, 5);
}

function drawProgrammingInterface(p) {
  const prog = gameState.programming;
  const panelY = CANVAS_HEIGHT - 100;
  const panelHeight = 100;

  // Background panel
  p.fill(30, 30, 40, 230);
  p.noStroke();
  p.rect(0, panelY, CANVAS_WIDTH, panelHeight);

  // Current robot indicator
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text(`Robot ${prog.selectedRobot + 1}/${gameState.robots.length}`, 10, panelY + 5);

  // Command menu
  const menuY = panelY + 25;
  const commandWidth = 100;
  const spacing = 10;
  const startX = 10;

  prog.commandMenu.forEach((cmd, i) => {
    const x = startX + i * (commandWidth + spacing);
    const y = menuY;
    
    // Highlight selected
    if (i === prog.selectedCommand) {
      p.fill(100, 150, 255);
    } else {
      p.fill(60, 60, 80);
    }
    p.stroke(100);
    p.strokeWeight(2);
    p.rect(x, y, commandWidth, 25, 3);

    // Command text
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    const cmdName = cmd.replace(/_/g, ' ');
    p.text(cmdName, x + commandWidth / 2, y + 12);
  });

  // Current robot's command sequence
  const currentRobot = gameState.robots[prog.selectedRobot];
  if (currentRobot) {
    p.fill(200);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(11);
    p.text(`Commands: ${currentRobot.commands.length}`, 10, panelY + 60);

    const cmdY = panelY + 75;
    currentRobot.commands.forEach((cmd, i) => {
      const cmdX = 10 + i * 55;
      if (cmdX + 50 > CANVAS_WIDTH - 10) return;
      
      p.fill(80, 80, 100);
      p.stroke(120);
      p.rect(cmdX, cmdY, 50, 18, 2);
      
      p.fill(255);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(8);
      const shortName = getShortCommandName(cmd.type);
      p.text(shortName, cmdX + 25, cmdY + 9);
    });
  }
}

function drawSimulationStatus(p) {
  const y = CANVAS_HEIGHT - 30;
  p.fill(30, 30, 40, 230);
  p.noStroke();
  p.rect(0, y, CANVAS_WIDTH, 30);

  p.fill(255, 200, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.text("SIMULATION RUNNING...", CANVAS_WIDTH / 2, y + 15);

  // Progress bar
  const progress = gameState.simulation.timeElapsed / gameState.simulation.maxTime;
  const barWidth = 200;
  const barX = CANVAS_WIDTH / 2 - barWidth / 2;
  const barY = y + 5;
  
  p.stroke(100);
  p.noFill();
  p.rect(barX, barY, barWidth, 5);
  
  p.fill(100, 255, 100);
  p.noStroke();
  p.rect(barX, barY, barWidth * progress, 5);
}

function drawPausedOverlay(p) {
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

function drawGameOverScreen(p) {
  p.fill(30, 30, 40, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const isWin = gameState.gamePhase === PHASE.GAME_OVER_WIN;

  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "MISSION SUCCESS" : "MISSION FAILED", CANVAS_WIDTH / 2, 120);

  p.fill(255);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 200);

  if (isWin) {
    p.textSize(16);
    p.fill(200);
    p.text("All levels completed!", CANVAS_WIDTH / 2, 250);
    p.text("You are a master programmer!", CANVAS_WIDTH / 2, 280);
  }

  p.fill(100, 150, 255);
  p.textSize(20);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);
}

function getShortCommandName(commandType) {
  switch (commandType) {
    case COMMAND_TYPES.MOVE_FORWARD:
      return "MOVE";
    case COMMAND_TYPES.TURN_LEFT:
      return "LEFT";
    case COMMAND_TYPES.TURN_RIGHT:
      return "RIGHT";
    case COMMAND_TYPES.ATTACK:
      return "ATTACK";
    case COMMAND_TYPES.WAIT:
      return "WAIT";
    default:
      return "???";
  }
}

export function logPlayerInfo(p) {
  if (gameState.robots.length > 0 && gameState.robots[0]) {
    const player = gameState.robots[0];
    p.logs.player_info.push({
      screen_x: player.x,
      screen_y: player.y,
      game_x: player.gridX,
      game_y: player.gridY,
      framecount: p.frameCount
    });
  }
}