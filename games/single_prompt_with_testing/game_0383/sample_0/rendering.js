// rendering.js
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 20, 40);
  
  // Animated background
  p.noStroke();
  for (let i = 0; i < 20; i++) {
    const x = (p.frameCount * 2 + i * 50) % (CANVAS_WIDTH + 100);
    p.fill(40, 40, 60, 100);
    p.rect(x - 50, 0, 30, CANVAS_HEIGHT);
  }
  
  // Title
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("JAZZPUNK OFFICE", CANVAS_WIDTH / 2, 60);
  
  p.textSize(16);
  p.fill(200, 200, 250);
  p.text("A COMEDY ESPIONAGE ADVENTURE", CANVAS_WIDTH / 2, 95);
  
  // Description
  p.textSize(12);
  p.fill(180, 180, 200);
  const desc = [
    "You are Agent Polyblank, spy extraordinaire.",
    "Infiltrate the absurd office building filled with",
    "corporate espionage and sentient martinis.",
    "",
    "Collect 5 intelligence items and reach the exit!",
    "Avoid guards and interact with quirky NPCs."
  ];
  
  for (let i = 0; i < desc.length; i++) {
    p.text(desc[i], CANVAS_WIDTH / 2, 130 + i * 18);
  }
  
  // Controls
  p.textSize(11);
  p.fill(150, 255, 150);
  p.text("CONTROLS:", CANVAS_WIDTH / 2, 270);
  
  p.fill(200, 200, 200);
  p.textAlign(p.LEFT, p.CENTER);
  const controls = [
    "Arrow Keys: Move",
    "SHIFT: Sprint",
    "SPACE: Interact",
    "Z: Use Gadget",
    "ESC: Pause"
  ];
  
  for (let i = 0; i < controls.length; i++) {
    p.text(controls[i], 180, 295 + i * 16);
  }
  
  // Start prompt
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(16);
  const flash = Math.sin(p.frameCount * 0.1) * 0.5 + 0.5;
  p.fill(255, 255, 100, 200 + flash * 55);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
}

export function renderPlayingScreen(p) {
  p.background(40, 45, 50);
  
  // Floor pattern
  p.stroke(50, 55, 60);
  p.strokeWeight(1);
  for (let x = 0; x < CANVAS_WIDTH; x += 30) {
    for (let y = 0; y < CANVAS_HEIGHT; y += 30) {
      p.line(x, y, x + 30, y);
      p.line(x, y, x, y + 30);
    }
  }
  
  // Render walls
  for (const wall of gameState.walls) {
    wall.render(p);
  }
  
  // Render doors
  for (const door of gameState.doors) {
    door.render(p);
  }
  
  // Render exit
  if (gameState.exitZone) {
    gameState.exitZone.render(p);
  }
  
  // Render entities
  for (const entity of gameState.entities) {
    entity.render(p);
  }
  
  // UI
  renderUI(p);
  
  // Dialog
  if (gameState.currentDialog && gameState.dialogTimer > 0) {
    renderDialog(p);
  }
}

export function renderPausedScreen(p) {
  renderPlayingScreen(p);
  
  // Overlay
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 255, 255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.text("GAME PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  p.textSize(12);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

export function renderGameOverScreen(p) {
  p.background(20, 20, 30);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Animated background
  for (let i = 0; i < 30; i++) {
    const angle = (p.frameCount * 0.02 + i * 0.2);
    const x = CANVAS_WIDTH / 2 + Math.cos(angle) * 200;
    const y = CANVAS_HEIGHT / 2 + Math.sin(angle) * 150;
    p.fill(isWin ? [100, 255, 100, 30] : [255, 100, 100, 30]);
    p.noStroke();
    p.ellipse(x, y, 50, 50);
  }
  
  p.fill(isWin ? [150, 255, 150] : [255, 150, 150]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text(isWin ? "MISSION SUCCESS!" : "MISSION FAILED", CANVAS_WIDTH / 2, 100);
  
  p.textSize(16);
  p.fill(200, 200, 200);
  if (isWin) {
    p.text("You successfully gathered the intelligence", CANVAS_WIDTH / 2, 150);
    p.text("and escaped the absurd office building!", CANVAS_WIDTH / 2, 170);
  } else {
    p.text("You were caught too many times.", CANVAS_WIDTH / 2, 150);
    p.text("The guards have compromised your mission.", CANVAS_WIDTH / 2, 170);
  }
  
  // Stats
  p.textSize(14);
  p.fill(255, 255, 100);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  p.text(`Intelligence Collected: ${gameState.itemsCollected}`, CANVAS_WIDTH / 2, 240);
  
  // Restart prompt
  p.textSize(16);
  const flash = Math.sin(p.frameCount * 0.1) * 0.5 + 0.5;
  p.fill(255, 255, 255, 200 + flash * 55);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
}

function renderUI(p) {
  // Score
  p.fill(255, 255, 100);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text(`Score: ${gameState.score}`, 10, 10);
  
  // Items collected
  p.text(`Intel: ${gameState.itemsCollected}/5`, 10, 30);
  
  // Lives
  p.fill(255, 100, 100);
  p.text(`Lives: ${gameState.lives}`, 10, 50);
  
  // Gadget status
  if (gameState.player && gameState.player.hasGadget) {
    p.fill(100, 255, 100);
    p.text(`Gadget: ${gameState.player.gadgetType} [Z]`, 10, 70);
  }
  
  if (gameState.gadgetCooldown > 0) {
    p.fill(150, 150, 150);
    p.text(`Cooldown: ${Math.ceil(gameState.gadgetCooldown / 60)}s`, 10, 90);
  }
}

function renderDialog(p) {
  const boxHeight = 80;
  const boxY = CANVAS_HEIGHT - boxHeight - 10;
  
  // Dialog box
  p.fill(20, 20, 40, 230);
  p.stroke(100, 150, 255);
  p.strokeWeight(2);
  p.rect(10, boxY, CANVAS_WIDTH - 20, boxHeight);
  
  // Speaker name
  p.noStroke();
  p.fill(100, 150, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text(gameState.currentDialog.speaker, 20, boxY + 10);
  
  // Dialog text
  p.fill(255, 255, 255);
  p.textSize(11);
  const words = gameState.currentDialog.text.split(' ');
  let line = '';
  let y = boxY + 35;
  
  for (const word of words) {
    const testLine = line + word + ' ';
    if (p.textWidth(testLine) > CANVAS_WIDTH - 60) {
      p.text(line, 20, y);
      line = word + ' ';
      y += 16;
    } else {
      line = testLine;
    }
  }
  p.text(line, 20, y);
}