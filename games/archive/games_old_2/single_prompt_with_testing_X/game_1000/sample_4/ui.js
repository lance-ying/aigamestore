// ui.js - UI rendering
import { GAME_PHASES } from './globals.js';

export function renderUI(p, gameState) {
  const player = gameState.player;
  
  if (gameState.gamePhase === GAME_PHASES.START) {
    renderStartScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    renderGameUI(p, gameState);
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    renderGameUI(p, gameState);
    renderPausedOverlay(p);
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
             gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    renderGameOverScreen(p, gameState);
  }

  // Render messages
  renderMessages(p, gameState);
}

function renderStartScreen(p) {
  p.background(20, 30, 50);
  
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER);
  p.textSize(32);
  p.text("TERRARIA-LIKE ADVENTURE", 300, 80);
  
  p.fill(200);
  p.textSize(14);
  p.text("Explore, mine, craft, and conquer!", 300, 120);
  
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.LEFT);
  const instructions = [
    "OBJECTIVE:",
    "- Mine resources and craft better equipment",
    "- Defeat 5 bosses to unlock new materials",
    "- Craft the ultimate Mythril gear",
    "- Defeat the final Mythril Titan to WIN!",
    "",
    "CONTROLS:",
    "Arrow Keys - Move and Jump",
    "Z - Mine/Attack (hold to charge)",
    "SPACE - Place blocks",
    "Shift - Open/Close crafting menu",
    "ESC - Pause",
    "",
    "TIPS:",
    "- Nights are dangerous, more enemies spawn!",
    "- Bosses spawn after defeating the previous tier",
    "- Better tools mine faster and deal more damage"
  ];
  
  let y = 160;
  for (const line of instructions) {
    p.text(line, 80, y);
    y += 16;
  }
  
  p.fill(0, 255, 0);
  p.textAlign(p.CENTER);
  p.textSize(16);
  p.text("PRESS ENTER TO START", 300, 380);
}

function renderGameUI(p, gameState) {
  const player = gameState.player;
  
  // Background for UI
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, 600, 30);
  
  // Health
  p.fill(255);
  p.textAlign(p.LEFT);
  p.textSize(12);
  p.text(`HP: ${Math.floor(player.health)}/${player.maxHealth}`, 10, 20);
  
  // Score
  p.text(`Score: ${gameState.score}`, 120, 20);
  
  // Time of day
  const timeInDay = gameState.time % gameState.dayLength;
  const isDay = timeInDay < gameState.dayLength / 2;
  const timeStr = isDay ? "DAY" : "NIGHT";
  p.fill(...(isDay ? [255, 255, 0] : [100, 100, 200]));
  p.text(timeStr, 230, 20);
  
  // Boss count
  p.fill(255);
  p.text(`Bosses: ${gameState.defeatedBosses.length}/5`, 290, 20);
  
  // Equipped items
  p.textSize(10);
  p.text(`Tool: ${player.equippedPickaxe || 'None'}`, 400, 15);
  p.text(`Weapon: ${player.equippedSword || 'None'}`, 400, 25);
  
  // Inventory preview (top items)
  p.text("Inventory:", 10, 390);
  let x = 80;
  let count = 0;
  for (const item in player.inventory) {
    if (count >= 5) break;
    p.text(`${item}: ${player.inventory[item]}`, x, 390);
    x += 100;
    count++;
  }
}

function renderPausedOverlay(p) {
  p.fill(255, 255, 0);
  p.textAlign(p.RIGHT);
  p.textSize(14);
  p.text("PAUSED", 590, 20);
}

function renderGameOverScreen(p, gameState) {
  p.background(0, 0, 0, 200);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  p.fill(...(isWin ? [0, 255, 0] : [255, 0, 0]));
  p.textAlign(p.CENTER);
  p.textSize(48);
  p.text(isWin ? "VICTORY!" : "GAME OVER", 300, 150);
  
  p.fill(255);
  p.textSize(16);
  p.text(`Final Score: ${gameState.score}`, 300, 200);
  p.text(`Bosses Defeated: ${gameState.defeatedBosses.length}`, 300, 230);
  
  if (isWin) {
    p.fill(255, 215, 0);
    p.textSize(20);
    p.text("You are the ultimate craftsman!", 300, 270);
  } else {
    p.fill(200);
    p.textSize(14);
    p.text("Don't give up! Try again!", 300, 270);
  }
  
  p.fill(0, 255, 0);
  p.textSize(16);
  p.text("PRESS R TO RESTART", 300, 350);
}

function renderMessages(p, gameState) {
  let y = 350;
  const currentTime = Date.now();
  
  // Filter out old messages
  gameState.messageQueue = gameState.messageQueue.filter(msg => 
    currentTime - msg.timestamp < 3000
  );
  
  for (const msg of gameState.messageQueue) {
    const alpha = Math.max(0, 255 - (currentTime - msg.timestamp) / 3000 * 255);
    p.fill(msg.color[0], msg.color[1], msg.color[2], alpha);
    p.textAlign(p.CENTER);
    p.textSize(14);
    p.text(msg.text, 300, y);
    y -= 20;
  }
}

export function addMessage(gameState, text, color = [255, 255, 255]) {
  gameState.messageQueue.push({
    text,
    color,
    timestamp: Date.now()
  });
}