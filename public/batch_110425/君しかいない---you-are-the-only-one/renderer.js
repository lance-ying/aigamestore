// renderer.js - Rendering functions
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES } from './globals.js';

export function renderStartScreen(p) {
  p.background(10, 10, 15);
  
  // Title with glow effect
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(255, 50, 50, 100);
  p.textSize(48);
  p.text("君しかいない", CANVAS_WIDTH / 2 + 2, 80 + 2);
  p.fill(255, 100, 100);
  p.textSize(48);
  p.text("君しかいない", CANVAS_WIDTH / 2, 80);
  
  p.fill(200, 200, 220);
  p.textSize(20);
  p.text("You Are The Only One", CANVAS_WIDTH / 2, 120);
  
  // Description
  p.fill(180, 180, 200);
  p.textSize(14);
  p.text("Navigate the abandoned facility", CANVAS_WIDTH / 2, 170);
  p.text("Find keycards to unlock doors", CANVAS_WIDTH / 2, 190);
  p.text("Discover the truth and escape", CANVAS_WIDTH / 2, 210);
  
  // Controls
  p.fill(150, 150, 170);
  p.textSize(12);
  p.text("Arrow Keys: Move and Turn", CANVAS_WIDTH / 2, 250);
  p.text("Space: Interact with Objects", CANVAS_WIDTH / 2, 270);
  p.text("Shift: Sprint (drains stamina)", CANVAS_WIDTH / 2, 290);
  p.text("Z: Use Keycard at Doors", CANVAS_WIDTH / 2, 310);
  
  // Start prompt with pulse
  const pulse = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(100, 255, 100, pulse * 255);
  p.textSize(16);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 350);
}

export function renderGameOver(p) {
  p.background(0, 0, 0, 200);
  
  p.textAlign(p.CENTER, p.CENTER);
  
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    p.fill(100, 255, 100);
    p.textSize(40);
    p.text("ESCAPED!", CANVAS_WIDTH / 2, 150);
    
    p.fill(200, 255, 200);
    p.textSize(16);
    p.text("You found all the keycards and escaped the facility.", CANVAS_WIDTH / 2, 200);
  } else {
    p.fill(255, 100, 100);
    p.textSize(40);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 150);
    
    p.fill(255, 200, 200);
    p.textSize(16);
    p.text("Something went wrong...", CANVAS_WIDTH / 2, 200);
  }
  
  p.fill(255, 255, 255);
  p.textSize(14);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 250);
  p.text(`Journal Entries: ${gameState.journalEntries.length}/4`, CANVAS_WIDTH / 2, 275);
  
  p.fill(150, 150, 200);
  p.textSize(16);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 330);
}

export function renderGame(p) {
  // Background
  p.background(20, 20, 25);
  
  // Get current room
  const room = gameState.rooms[gameState.currentRoom];
  
  // Calculate camera offset to center player
  const offsetX = CANVAS_WIDTH / 2 - gameState.player.x;
  const offsetY = CANVAS_HEIGHT / 2 - gameState.player.y;
  
  // Draw floor
  p.fill(30, 30, 35);
  p.noStroke();
  p.rect(offsetX, offsetY, room.width, room.height);
  
  // Draw walls
  p.fill(50, 50, 60);
  p.stroke(70, 70, 80);
  p.strokeWeight(1);
  for (let wall of room.walls) {
    p.rect(wall.x + offsetX, wall.y + offsetY, wall.w, wall.h);
  }
  
  // Draw doors/connections
  for (let conn of room.connections) {
    if (conn.locked) {
      if (conn.keycardType === "red" && !gameState.redDoorUnlocked) {
        p.fill(150, 30, 30);
      } else if (conn.keycardType === "blue" && !gameState.blueDoorUnlocked) {
        p.fill(30, 30, 150);
      } else if (conn.keycardType === "green" && !gameState.greenDoorUnlocked) {
        p.fill(30, 150, 30);
      } else {
        p.fill(60, 100, 60); // unlocked
      }
    } else {
      p.fill(60, 80, 60);
    }
    p.stroke(100);
    p.strokeWeight(2);
    
    // Draw door based on position
    if (conn.y === 0 || conn.y >= room.height - 10) { // top or bottom door
      p.rect(conn.x + offsetX - 20, conn.y + offsetY, 40, 10);
    } else { // left or right door
      p.rect(conn.x + offsetX, conn.y + offsetY - 20, 10, 40);
    }
  }
  
  // Draw interactables
  for (let interactable of gameState.interactables) {
    interactable.render(p, gameState.currentRoom, offsetX, offsetY);
  }
  
  // Draw player
  p.fill(100, 200, 255);
  p.stroke(150, 220, 255);
  p.strokeWeight(2);
  p.circle(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 20);
  
  // Draw player direction indicator
  const dirX = CANVAS_WIDTH / 2 + Math.cos(gameState.player.angle) * 15;
  const dirY = CANVAS_HEIGHT / 2 + Math.sin(gameState.player.angle) * 15;
  p.stroke(200, 240, 255);
  p.strokeWeight(3);
  p.line(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, dirX, dirY);
  
  // Draw UI
  renderUI(p);
  
  // Draw message if showing
  if (gameState.showingMessage) {
    renderMessage(p, gameState.messageText);
  }
  
  // Draw interaction prompt
  if (gameState.nearestInteractable && !gameState.showingMessage) {
    p.fill(255, 255, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.text("[SPACE] to interact", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 80);
  }
  
  // Paused overlay
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.fill(255, 255, 255);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }
}

function renderUI(p) {
  // Room name
  p.fill(200, 200, 220);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text(gameState.rooms[gameState.currentRoom].name, 10, 10);
  
  // Score
  p.fill(255, 220, 100);
  p.text(`Score: ${gameState.score}`, 10, 30);
  
  // Stamina bar
  p.fill(100, 100, 120);
  p.noStroke();
  p.rect(10, 50, 100, 10);
  const staminaPercent = gameState.stamina / gameState.maxStamina;
  p.fill(100, 200, 255);
  p.rect(10, 50, 100 * staminaPercent, 10);
  p.fill(200, 200, 220);
  p.textSize(10);
  p.text("Stamina", 115, 52);
  
  // Inventory
  p.fill(200, 200, 220);
  p.textSize(12);
  p.text("Inventory:", 10, 70);
  let yPos = 85;
  for (let item of gameState.inventory) {
    if (item.includes("Red")) p.fill(255, 100, 100);
    else if (item.includes("Blue")) p.fill(100, 100, 255);
    else if (item.includes("Green")) p.fill(100, 255, 100);
    else p.fill(200, 200, 220);
    p.textSize(11);
    p.text(`• ${item}`, 15, yPos);
    yPos += 15;
  }
  
  // Journal entries
  p.fill(200, 200, 220);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(12);
  p.text(`Journals: ${gameState.journalEntries.length}/4`, CANVAS_WIDTH - 10, 10);
}

function renderMessage(p, message) {
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(50, CANVAS_HEIGHT - 120, CANVAS_WIDTH - 100, 70, 5);
  
  p.fill(255, 255, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  
  // Word wrap
  const words = message.split(' ');
  let line = '';
  let y = CANVAS_HEIGHT - 110;
  const maxWidth = CANVAS_WIDTH - 120;
  
  for (let word of words) {
    const testLine = line + word + ' ';
    const testWidth = p.textWidth(testLine);
    if (testWidth > maxWidth && line.length > 0) {
      p.text(line, 60, y);
      line = word + ' ';
      y += 16;
    } else {
      line = testLine;
    }
  }
  p.text(line, 60, y);
}