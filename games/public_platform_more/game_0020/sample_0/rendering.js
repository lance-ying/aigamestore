import { CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE, DIRECTIONS, gameState } from './globals.js';
import { availableCommands } from './commands.js';

export function renderStartScreen(p) {
  p.background(20, 25, 35);
  
  // Title
  p.fill(100, 200, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("异常 (EXCEPTION)", CANVAS_WIDTH / 2, 80);
  
  // Description
  p.fill(200, 220, 240);
  p.textSize(14);
  p.text("Program robots to complete objectives", CANVAS_WIDTH / 2, 140);
  
  // Instructions box
  p.fill(30, 35, 45);
  p.noStroke();
  p.rect(100, 170, 400, 160, 5);
  
  p.fill(180, 200, 220);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text("HOW TO PLAY:", 120, 185);
  p.text("• Use ARROW KEYS to select commands", 120, 210);
  p.text("• Press SPACE to add command to program", 120, 230);
  p.text("• Press SHIFT to remove last command", 120, 250);
  p.text("• Press Z to execute your program", 120, 270);
  p.text("• Complete objectives to advance levels", 120, 290);
  
  // Start prompt
  p.fill(100, 255, 150);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(16);
  const pulse = p.sin(p.frameCount * 0.05) * 0.3 + 0.7;
  p.fill(100 * pulse, 255 * pulse, 150 * pulse);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
}

export function renderPlayingScreen(p) {
  p.background(25, 30, 40);
  
  // Draw grid background
  drawGrid(p);
  
  // Draw entities
  drawObstacles(p);
  drawExits(p);
  drawEnemies(p);
  drawRobots(p);
  
  // Draw UI
  drawProgrammingPanel(p);
  drawLevelInfo(p);
  drawScore(p);
}

function drawGrid(p) {
  p.stroke(40, 50, 65);
  p.strokeWeight(1);
  
  // Draw grid lines
  for (let i = 0; i <= 10; i++) {
    const x = 10 + i * GRID_SIZE;
    p.line(x, 50, x, 50 + 6 * GRID_SIZE);
  }
  for (let i = 0; i <= 6; i++) {
    const y = 50 + i * GRID_SIZE;
    p.line(10, y, 10 + 10 * GRID_SIZE, y);
  }
}

function drawObstacles(p) {
  p.noStroke();
  for (let obstacle of gameState.obstacles) {
    const x = obstacle.getScreenX();
    const y = obstacle.getScreenY();
    
    p.fill(60, 60, 70);
    p.rect(x - 18, y - 18, 36, 36, 3);
    
    p.fill(80, 80, 90);
    p.rect(x - 14, y - 14, 28, 28, 2);
  }
}

function drawExits(p) {
  for (let exit of gameState.exits) {
    const x = exit.getScreenX();
    const y = exit.getScreenY();
    
    const pulse = p.sin(p.frameCount * 0.1) * 0.2 + 0.8;
    p.fill(100 * pulse, 255 * pulse, 100 * pulse);
    p.noStroke();
    
    // Draw exit portal
    p.ellipse(x, y, 30 * pulse, 30 * pulse);
    p.fill(150 * pulse, 255 * pulse, 150 * pulse, 150);
    p.ellipse(x, y, 20 * pulse, 20 * pulse);
  }
}

function drawEnemies(p) {
  p.noStroke();
  for (let enemy of gameState.enemies) {
    if (!enemy.isActive) continue;
    
    const x = enemy.getScreenX();
    const y = enemy.getScreenY();
    
    // Enemy body
    const colorMult = enemy.type === 'tough' ? 1.3 : 1.0;
    p.fill(255 * colorMult, 80, 80);
    p.rect(x - 15, y - 15, 30, 30, 4);
    
    // Enemy eye
    p.fill(255, 200, 200);
    p.ellipse(x, y - 3, 12, 12);
    p.fill(200, 50, 50);
    p.ellipse(x, y - 3, 6, 6);
    
    // Health indicator
    const healthPercent = enemy.health / enemy.maxHealth;
    p.fill(255, 0, 0);
    p.rect(x - 12, y + 18, 24, 3);
    p.fill(0, 255, 0);
    p.rect(x - 12, y + 18, 24 * healthPercent, 3);
  }
}

function drawRobots(p) {
  p.noStroke();
  for (let i = 0; i < gameState.robots.length; i++) {
    const robot = gameState.robots[i];
    if (!robot.isActive) continue;
    
    const x = robot.getScreenX();
    const y = robot.getScreenY();
    
    // Robot body
    const isCurrentRobot = gameState.isExecuting && i === gameState.currentRobotIndex;
    const bodyColor = isCurrentRobot ? [150, 220, 255] : [100, 180, 255];
    p.fill(...bodyColor);
    p.rect(x - 14, y - 14, 28, 28, 3);
    
    // Robot direction indicator
    p.fill(255, 255, 255);
    p.push();
    p.translate(x, y);
    p.rotate(robot.direction * p.PI / 2);
    p.triangle(0, -16, -8, -8, 8, -8);
    p.pop();
    
    // Health indicator
    const healthPercent = robot.health / robot.maxHealth;
    p.fill(255, 0, 0);
    p.rect(x - 12, y + 18, 24, 3);
    p.fill(0, 255, 0);
    p.rect(x - 12, y + 18, 24 * healthPercent, 3);
    
    // Robot number
    p.fill(255);
    p.textSize(10);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(i + 1, x, y);
  }
}

function drawProgrammingPanel(p) {
  const ui = gameState.programUI;
  
  // Panel background
  p.fill(30, 35, 50);
  p.noStroke();
  p.rect(ui.x, ui.y, ui.width, ui.height, 5);
  
  // Title
  p.fill(200, 220, 240);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(14);
  p.text("PROGRAM", ui.x + ui.width / 2, ui.y + 10);
  
  // Available commands
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(10);
  p.text("COMMANDS:", ui.x + 10, ui.y + 35);
  
  for (let i = 0; i < availableCommands.length; i++) {
    const cmd = availableCommands[i];
    const cmdY = ui.y + 55 + i * 25;
    
    const isSelected = i === gameState.selectedCommandIndex && !gameState.isExecuting;
    
    if (isSelected) {
      p.fill(80, 90, 110);
      p.rect(ui.x + 5, cmdY - 2, ui.width - 10, 20, 3);
    }
    
    p.fill(...cmd.color);
    p.rect(ui.x + 10, cmdY, 15, 15, 2);
    
    p.fill(200, 220, 240);
    p.textSize(9);
    p.text(cmd.label, ui.x + 30, cmdY + 3);
  }
  
  // Current program
  const progY = ui.y + 200;
  p.fill(200, 220, 240);
  p.textSize(10);
  p.text("SEQUENCE:", ui.x + 10, progY);
  
  if (gameState.currentProgram.length === 0) {
    p.fill(120, 130, 150);
    p.textSize(8);
    p.text("(empty)", ui.x + 10, progY + 20);
  } else {
    for (let i = 0; i < Math.min(gameState.currentProgram.length, 4); i++) {
      const cmd = gameState.currentProgram[i];
      const cmdData = availableCommands.find(c => c.type === cmd.type);
      const cmdY = progY + 20 + i * 18;
      
      p.fill(...cmdData.color);
      p.rect(ui.x + 10, cmdY, 12, 12, 2);
      
      p.fill(200, 220, 240);
      p.textSize(8);
      p.text(cmdData.label, ui.x + 25, cmdY + 2);
    }
    
    if (gameState.currentProgram.length > 4) {
      p.fill(120, 130, 150);
      p.textSize(8);
      p.text(`+${gameState.currentProgram.length - 4} more`, ui.x + 10, progY + 92);
    }
  }
}

function drawLevelInfo(p) {
  p.fill(200, 220, 240);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text(`Level ${gameState.currentLevel + 1}`, 15, 15);
  
  // Objective
  p.textSize(10);
  p.fill(180, 200, 220);
  const level = gameState.entities.find(e => e.objective);
  if (level && level.objective) {
    p.text(`Goal: ${level.objective}`, 15, 32);
  }
}

function drawScore(p) {
  p.fill(100, 255, 150);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 15, 15);
}

export function renderPausedScreen(p) {
  // Dim overlay
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Paused text
  p.fill(255, 255, 255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text("PAUSED", CANVAS_WIDTH - 15, 15);
}

export function renderGameOverScreen(p) {
  p.background(20, 25, 35);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Title
  p.fill(isWin ? [100, 255, 150] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "SUCCESS!" : "MISSION FAILED", CANVAS_WIDTH / 2, 120);
  
  // Message
  p.fill(200, 220, 240);
  p.textSize(16);
  if (isWin) {
    p.text("All objectives completed!", CANVAS_WIDTH / 2, 180);
  } else {
    p.text("Your robots were destroyed", CANVAS_WIDTH / 2, 180);
  }
  
  // Score
  p.textSize(20);
  p.fill(100, 200, 255);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 240);
  
  // Restart prompt
  p.fill(180, 200, 220);
  p.textSize(14);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
}