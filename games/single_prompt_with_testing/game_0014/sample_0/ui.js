// ui.js
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function drawUI(p) {
  const player = gameState.player;

  p.push();

  // Health bar
  drawBar(p, 10, 10, 150, 15, player.health, 100, [255, 50, 50], [100, 20, 20], "Health");

  // Stamina bar
  drawBar(p, 10, 30, 150, 12, player.stamina, 100, [50, 255, 50], [20, 100, 20], "Stamina");

  // Energy bar
  drawBar(p, 10, 47, 150, 12, player.energy, 100, [100, 200, 255], [20, 80, 120], "Energy");

  // Score
  p.fill(255, 255, 255);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`Score: ${gameState.score}`, 10, 65);

  // Memories collected
  p.textSize(14);
  p.fill(255, 220, 100);
  p.text(`Memories: ${gameState.memoriesCollected}/20`, 10, 85);

  // Portal status
  if (gameState.portal.active) {
    p.fill(200, 150, 255);
    p.text("Portal Active!", 10, 105);
  } else {
    p.fill(150, 150, 150);
    p.text(`Portal: ${gameState.memoriesCollected}/10 needed`, 10, 105);
  }

  // Path indicator
  if (gameState.playerPath !== "neutral") {
    p.fill(150, 255, 150);
    p.textSize(12);
    p.text(`Path: ${gameState.playerPath}`, 10, 125);
  }

  // Paused indicator
  if (gameState.gamePhase === "PAUSED") {
    p.fill(255, 255, 255, 200);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(18);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }

  p.pop();
}

function drawBar(p, x, y, width, height, value, maxValue, fillColor, bgColor, label) {
  const percent = Math.max(0, Math.min(1, value / maxValue));

  // Background
  p.fill(...bgColor);
  p.noStroke();
  p.rect(x, y, width, height);

  // Fill
  p.fill(...fillColor);
  p.rect(x, y, width * percent, height);

  // Border
  p.noFill();
  p.stroke(255, 255, 255, 150);
  p.strokeWeight(1);
  p.rect(x, y, width, height);

  // Label
  if (label) {
    p.fill(255, 255, 255);
    p.noStroke();
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(10);
    p.text(label, x + 2, y + height / 2);
  }
}

export function drawStartScreen(p) {
  p.push();
  p.background(20, 20, 35);

  // Title
  p.fill(200, 150, 255);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("THE FORGOTTEN PATH", CANVAS_WIDTH / 2, 60);

  // Subtitle
  p.fill(150, 200, 255);
  p.textSize(16);
  p.text("A Journey Through Memory and Choice", CANVAS_WIDTH / 2, 100);

  // Instructions
  p.fill(255, 255, 255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    "OBJECTIVE:",
    "• Collect 10 Memory Fragments to activate the Portal",
    "• Navigate through a world of friends and foes",
    "• Your choices shape your destiny",
    "",
    "CONTROLS:",
    "• Arrow Keys: Move through the world",
    "• SPACE: Interact with NPCs & collect memories",
    "• SHIFT: Sprint (drains stamina)",
    "• Z: Activate shield (blocks damage)",
    "",
    "TIPS:",
    "• Avoid red hostile entities",
    "• Interact with colorful NPCs for bonuses",
    "• Watch your health and resources",
    "• Use the minimap to navigate"
  ];

  let yPos = 140;
  for (const line of instructions) {
    if (line.startsWith("•")) {
      p.fill(200, 200, 200);
      p.text(line, 60, yPos);
    } else if (line === "") {
      // Skip
    } else {
      p.fill(255, 220, 100);
      p.text(line, 50, yPos);
    }
    yPos += 18;
  }

  // Start prompt
  p.fill(100, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  const alpha = 150 + Math.sin(p.frameCount * 0.1) * 100;
  p.fill(100, 255, 100, alpha);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);

  p.pop();
}

export function drawGameOverScreen(p, won) {
  p.push();
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  p.textAlign(p.CENTER, p.CENTER);

  if (won) {
    // Win screen
    p.fill(150, 255, 150);
    p.textSize(40);
    p.text("DESTINY REVEALED", CANVAS_WIDTH / 2, 100);

    p.fill(255, 255, 255);
    p.textSize(16);
    p.text("You have uncovered the truth", CANVAS_WIDTH / 2, 150);
    
    // Path-specific message
    let pathMessage = "";
    if (gameState.playerPath === "kind") {
      pathMessage = "Your kindness has brought hope to this realm.";
      p.fill(150, 255, 150);
    } else if (gameState.playerPath === "neutral") {
      pathMessage = "You walked a balanced path through uncertainty.";
      p.fill(200, 200, 255);
    } else {
      pathMessage = "You forged your own way through the darkness.";
      p.fill(255, 200, 150);
    }
    p.textSize(14);
    p.text(pathMessage, CANVAS_WIDTH / 2, 180);

  } else {
    // Lose screen
    p.fill(255, 100, 100);
    p.textSize(40);
    p.text("LOST TO TIME", CANVAS_WIDTH / 2, 100);

    p.fill(255, 255, 255);
    p.textSize(16);
    p.text("Your journey ends here...", CANVAS_WIDTH / 2, 150);
  }

  // Stats
  p.fill(255, 220, 100);
  p.textSize(18);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  p.textSize(14);
  p.text(`Memories Collected: ${gameState.memoriesCollected}/20`, CANVAS_WIDTH / 2, 245);
  p.text(`NPCs Helped: ${gameState.npcInteractions}`, CANVAS_WIDTH / 2, 265);

  // Restart prompt
  p.fill(200, 200, 255);
  p.textSize(18);
  const alpha = 150 + Math.sin(p.frameCount * 0.1) * 100;
  p.fill(200, 200, 255, alpha);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);

  p.pop();
}