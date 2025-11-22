// ui.js
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderUI(p) {
  if (gameState.gamePhase === GAME_PHASES.START) {
    renderStartScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    renderGameUI(p);
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    renderGameUI(p);
    renderPausedOverlay(p);
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
             gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    renderGameOverScreen(p);
  }
}

function renderStartScreen(p) {
  p.background(20, 15, 10);
  
  // Title
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("ESCAPE THE NEST", CANVAS_WIDTH/2, 80);
  
  // Subtitle
  p.fill(200, 200, 180);
  p.textSize(16);
  p.text("A Puzzle Adventure", CANVAS_WIDTH/2, 130);
  
  // Instructions
  p.fill(220);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  
  let instructions = [
    "OBJECTIVE:",
    "Guide the child through dangerous mansion rooms.",
    "Solve puzzles, avoid enemies, and reach the exit.",
    "",
    "CONTROLS:",
    "Arrow Keys - Move character",
    "Space - Push/Pull crates",
    "Shift - Sprint (makes noise!)",
    "Down Arrow - Hide in cabinets",
    "Z - Interact with levers",
    "",
    "TIPS:",
    "- Stay out of enemy vision cones (red)",
    "- Use crates on pressure plates to open doors",
    "- Hide when enemies are near",
    "- Avoid spikes and pits - instant death!",
  ];
  
  let y = 170;
  for (let line of instructions) {
    if (line.startsWith("OBJECTIVE:") || line.startsWith("CONTROLS:") || line.startsWith("TIPS:")) {
      p.fill(255, 255, 100);
      p.textSize(16);
    } else {
      p.fill(220);
      p.textSize(14);
    }
    p.text(line, 50, y);
    y += 20;
  }
  
  // Start prompt
  p.fill(100, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  let alpha = 128 + Math.sin(p.frameCount * 0.1) * 127;
  p.fill(100, 255, 100, alpha);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT - 40);
}

function renderGameUI(p) {
  // Room number
  p.fill(220);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`Room ${gameState.currentRoom + 1}/${gameState.totalRooms}`, 10, 10);
  
  // Score
  p.text(`Score: ${gameState.score}`, 10, 35);
  
  // Instructions reminder (small)
  p.fill(180);
  p.textSize(11);
  p.textAlign(p.RIGHT, p.TOP);
  p.text("ESC: Pause | R: Restart", CANVAS_WIDTH - 10, 10);
}

function renderPausedOverlay(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Paused text
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
  
  p.textSize(16);
  p.text("Press ESC to resume", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 50);
  
  // Small indicator in top right
  p.fill(255, 255, 100);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text("PAUSED", CANVAS_WIDTH - 10, 30);
}

function renderGameOverScreen(p) {
  p.background(20, 15, 10);
  
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    p.fill(100, 255, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("ESCAPED!", CANVAS_WIDTH/2, 100);
    
    p.fill(220);
    p.textSize(20);
    p.text("You successfully escaped The Nest!", CANVAS_WIDTH/2, 160);
  } else {
    p.fill(255, 100, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("CAUGHT", CANVAS_WIDTH/2, 100);
    
    p.fill(220);
    p.textSize(20);
    p.text("The enemy found you...", CANVAS_WIDTH/2, 160);
  }
  
  // Final score
  p.fill(255, 255, 100);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, 220);
  
  // Stats
  p.fill(200);
  p.textSize(16);
  p.text(`Rooms Completed: ${gameState.currentRoom}/${gameState.totalRooms}`, CANVAS_WIDTH/2, 260);
  
  // Restart prompt
  p.fill(100, 255, 255);
  p.textSize(20);
  let alpha = 128 + Math.sin(p.frameCount * 0.1) * 127;
  p.fill(100, 255, 255, alpha);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH/2, CANVAS_HEIGHT - 60);
}