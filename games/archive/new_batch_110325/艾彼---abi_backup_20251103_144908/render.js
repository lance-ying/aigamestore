// render.js - Rendering functions
import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  CHAR_ABI,
  CHAR_DD
} from './globals.js';
import { getInteractableObject } from './physics.js';

export function renderStartScreen(p) {
  p.background(20, 25, 35);
  
  // Title
  p.fill(100, 200, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("艾彼 - ABI", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(180, 180, 200);
  p.textSize(18);
  p.text("Journey Through the Silence", CANVAS_WIDTH / 2, 120);
  
  // Description
  p.fill(200, 200, 220);
  p.textSize(14);
  p.textAlign(p.CENTER, p.TOP);
  const desc = [
    "Guide Abi and DD through a post-apocalyptic world.",
    "Solve environmental puzzles to uncover humanity's fate.",
    "Use Abi's agility and DD's strength to progress."
  ];
  let yPos = 160;
  for (const line of desc) {
    p.text(line, CANVAS_WIDTH / 2, yPos);
    yPos += 22;
  }
  
  // Controls
  p.fill(255, 220, 150);
  p.textSize(13);
  yPos = 250;
  p.text("CONTROLS", CANVAS_WIDTH / 2, yPos);
  yPos += 25;
  
  p.fill(200, 200, 220);
  p.textSize(12);
  const controls = [
    "Arrow Keys: Move",
    "Space: Switch Character",
    "Z: Interact",
    "Shift: Sprint"
  ];
  for (const ctrl of controls) {
    p.text(ctrl, CANVAS_WIDTH / 2, yPos);
    yPos += 18;
  }
  
  // Start prompt
  p.fill(100, 255, 100);
  p.textSize(16);
  const pulse = Math.sin(p.frameCount * 0.1) * 20 + 235;
  p.fill(100, pulse, 100);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
}

export function renderGame(p) {
  // Background gradient
  for (let y = 0; y < CANVAS_HEIGHT; y++) {
    const inter = y / CANVAS_HEIGHT;
    const c = p.lerpColor(p.color(30, 35, 50), p.color(60, 45, 70), inter);
    p.stroke(c);
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Grid overlay (subtle)
  p.stroke(255, 255, 255, 10);
  p.strokeWeight(1);
  const gridSize = 50;
  for (let x = -gameState.cameraX % gridSize; x < CANVAS_WIDTH; x += gridSize) {
    p.line(x, 0, x, CANVAS_HEIGHT);
  }
  for (let y = -gameState.cameraY % gridSize; y < CANVAS_HEIGHT; y += gridSize) {
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Render tight spaces
  if (gameState.tightSpaces) {
    for (const space of gameState.tightSpaces) {
      space.render(p, gameState.cameraX, gameState.cameraY);
    }
  }
  
  // Render crates
  for (const crate of gameState.crates) {
    crate.render(p, gameState.cameraX, gameState.cameraY);
  }
  
  // Render switches
  for (const sw of gameState.switches) {
    sw.render(p, gameState.cameraX, gameState.cameraY);
  }
  
  // Render doors
  for (const door of gameState.doors) {
    door.render(p, gameState.cameraX, gameState.cameraY);
  }
  
  // Render terminals
  for (const terminal of gameState.terminals) {
    terminal.render(p, gameState.cameraX, gameState.cameraY);
  }
  
  // Render both characters
  if (gameState.abi) {
    const isActive = gameState.activeCharacter === CHAR_ABI;
    if (isActive) {
      // Highlight active character
      p.push();
      p.noFill();
      p.stroke(255, 255, 100, 150);
      p.strokeWeight(3);
      const screenX = gameState.abi.x - gameState.cameraX;
      const screenY = gameState.abi.y - gameState.cameraY;
      p.circle(screenX, screenY, gameState.abi.width + 15);
      p.pop();
    }
    gameState.abi.render(p, gameState.cameraX, gameState.cameraY);
  }
  
  if (gameState.dd) {
    const isActive = gameState.activeCharacter === CHAR_DD;
    if (isActive) {
      // Highlight active character
      p.push();
      p.noFill();
      p.stroke(255, 255, 100, 150);
      p.strokeWeight(3);
      const screenX = gameState.dd.x - gameState.cameraX;
      const screenY = gameState.dd.y - gameState.cameraY;
      p.circle(screenX, screenY, gameState.dd.width + 15);
      p.pop();
    }
    gameState.dd.render(p, gameState.cameraX, gameState.cameraY);
  }
  
  // Interaction prompt
  const activeChar = gameState.activeCharacter === CHAR_ABI ? gameState.abi : gameState.dd;
  if (activeChar) {
    const interactable = getInteractableObject(activeChar, gameState);
    if (interactable) {
      p.push();
      p.fill(255, 255, 100);
      p.noStroke();
      p.textAlign(p.CENTER);
      p.textSize(12);
      const screenX = activeChar.x - gameState.cameraX;
      const screenY = activeChar.y - gameState.cameraY - activeChar.height - 20;
      p.text("Press Z to interact", screenX, screenY);
      p.pop();
    }
  }
  
  // UI
  renderUI(p);
  
  // Pause indicator
  if (gameState.gamePhase === PHASE_PAUSED) {
    p.fill(255, 255, 255);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }
}

function renderUI(p) {
  // Chapter indicator
  p.push();
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rectMode(p.CORNER);
  p.rect(5, 5, 200, 70, 5);
  
  p.fill(100, 200, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text(`Chapter ${gameState.currentChapter + 1} / ${gameState.totalChapters}`, 15, 15);
  
  p.fill(200, 200, 220);
  p.textSize(11);
  p.text(`Active: ${gameState.activeCharacter}`, 15, 35);
  p.text(`Stories: ${gameState.storyUnlocked.length}`, 15, 52);
  p.pop();
  
  // Latest story fragment
  if (gameState.storyUnlocked.length > 0) {
    const latestStory = gameState.storyUnlocked[gameState.storyUnlocked.length - 1];
    p.push();
    p.fill(0, 0, 0, 180);
    p.noStroke();
    p.rectMode(p.CORNER);
    p.rect(10, CANVAS_HEIGHT - 80, CANVAS_WIDTH - 20, 70, 5);
    
    p.fill(100, 255, 150);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(11);
    p.text("DATA FRAGMENT:", 20, CANVAS_HEIGHT - 70);
    
    p.fill(200, 255, 200);
    p.textSize(10);
    // Wrap text
    const maxWidth = CANVAS_WIDTH - 40;
    const words = latestStory.split(' ');
    let line = '';
    let yPos = CANVAS_HEIGHT - 52;
    for (const word of words) {
      const testLine = line + word + ' ';
      const testWidth = p.textWidth(testLine);
      if (testWidth > maxWidth && line.length > 0) {
        p.text(line, 20, yPos);
        line = word + ' ';
        yPos += 15;
      } else {
        line = testLine;
      }
    }
    p.text(line, 20, yPos);
    p.pop();
  }
}

export function renderGameOver(p) {
  p.background(20, 25, 35);
  
  if (gameState.gamePhase === PHASE_GAME_OVER_WIN) {
    // Victory screen
    p.fill(100, 255, 150);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(42);
    p.text("THE TRUTH REVEALED", CANVAS_WIDTH / 2, 80);
    
    p.fill(200, 255, 200);
    p.textSize(16);
    p.textAlign(p.CENTER, p.TOP);
    const message = [
      "Humanity didn't perish.",
      "They transcended their physical forms,",
      "uploading their consciousness to a digital realm.",
      "",
      "Abi and DD are their legacy,",
      "guardians of a world waiting for the return",
      "of those who once walked upon it."
    ];
    let yPos = 150;
    for (const line of message) {
      p.text(line, CANVAS_WIDTH / 2, yPos);
      yPos += 25;
    }
    
    p.fill(150, 220, 255);
    p.textSize(14);
    p.text(`Stories Discovered: ${gameState.storyUnlocked.length}`, CANVAS_WIDTH / 2, 340);
  }
  
  // Restart prompt
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER);
  p.textSize(16);
  const pulse = Math.sin(p.frameCount * 0.1) * 20 + 235;
  p.fill(pulse, 220, 100);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 380);
}