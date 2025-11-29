import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  SPACE_TYPES
} from './globals.js';
import { getSpaceScreenPosition, getColorForGroup } from './board.js';
import { getCurrentPlayer } from './game_logic.js';

export function renderGame(p) {
  if (gameState.gamePhase === PHASE_START) {
    renderStartScreen(p);
  } else if (gameState.gamePhase === PHASE_PLAYING) {
    renderPlayingScreen(p);
    if (gameState.gamePhase === PHASE_PAUSED) {
      renderPauseOverlay(p);
    }
  } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
    renderGameOverScreen(p);
  }
}

function renderStartScreen(p) {
  p.background(20, 60, 40);
  
  // Title
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("MONOPOLY", CANVAS_WIDTH / 2, 80);
  
  // Description
  p.fill(255);
  p.textSize(14);
  p.text("Roll dice, buy properties, collect rent!", CANVAS_WIDTH / 2, 140);
  p.text("Build houses and hotels to increase rent", CANVAS_WIDTH / 2, 160);
  p.text("Bankrupt all opponents to win!", CANVAS_WIDTH / 2, 180);
  
  // Instructions
  p.textSize(12);
  p.fill(200, 255, 200);
  p.text("CONTROLS", CANVAS_WIDTH / 2, 220);
  p.fill(255);
  p.textSize(11);
  p.text("Space: Roll Dice / Confirm", CANVAS_WIDTH / 2, 245);
  p.text("Z: Buy Property / Build House / End Turn", CANVAS_WIDTH / 2, 265);
  p.text("Shift: Decline Property", CANVAS_WIDTH / 2, 285);
  p.text("ESC: Pause  |  R: Restart", CANVAS_WIDTH / 2, 305);
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textSize(16);
  const flash = Math.sin(p.frameCount * 0.1) > 0;
  if (flash) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 350);
  }
}

function renderPlayingScreen(p) {
  p.background(220, 240, 220);
  
  // Draw board
  renderBoard(p);
  
  // Draw players
  renderPlayers(p);
  
  // Draw dice if showing
  if (gameState.showingDice && gameState.diceRolled) {
    renderDice(p);
  }
  
  // Draw UI
  renderUI(p);
  
  // Draw messages
  renderMessages(p);
  
  // Draw property details if selected
  if (gameState.selectedProperty) {
    renderPropertyCard(p, gameState.selectedProperty);
  }
}

function renderBoard(p) {
  // Draw board outline
  p.stroke(80, 40, 20);
  p.strokeWeight(3);
  p.fill(180, 220, 180);
  p.rect(40, 40, 520, 320);
  
  // Draw center area
  p.fill(240, 250, 240);
  p.rect(90, 90, 420, 220);
  
  // Draw board title in center
  p.fill(20, 80, 40);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.text("MONOPOLY", 300, 180);
  
  // Draw spaces
  gameState.board.forEach((space, idx) => {
    renderSpace(p, space, idx);
  });
}

function renderSpace(p, space, idx) {
  const pos = getSpaceScreenPosition(idx);
  const size = 30;
  
  // Space background
  p.stroke(60);
  p.strokeWeight(1);
  
  if (space.type === SPACE_TYPES.PROPERTY) {
    const groupColor = getColorForGroup(space.group);
    p.fill(groupColor[0], groupColor[1], groupColor[2]);
    p.rect(pos.x - size/2, pos.y - size/2, size, size);
    
    // Houses/hotels indicator
    if (space.houses > 0) {
      p.fill(0, 200, 0);
      for (let i = 0; i < Math.min(space.houses, 4); i++) {
        p.rect(pos.x - 10 + i * 5, pos.y - 10, 4, 4);
      }
      if (space.houses === 5) {
        p.fill(255, 0, 0);
        p.rect(pos.x - 5, pos.y - 10, 10, 8);
      }
    }
  } else if (space.type === SPACE_TYPES.RAILROAD) {
    p.fill(40, 40, 40);
    p.rect(pos.x - size/2, pos.y - size/2, size, size);
  } else if (space.type === SPACE_TYPES.UTILITY) {
    p.fill(220, 220, 100);
    p.rect(pos.x - size/2, pos.y - size/2, size, size);
  } else if (space.type === SPACE_TYPES.GO) {
    p.fill(0, 200, 0);
    p.rect(pos.x - size/2, pos.y - size/2, size, size);
  } else if (space.type === SPACE_TYPES.JAIL) {
    p.fill(255, 140, 0);
    p.rect(pos.x - size/2, pos.y - size/2, size, size);
  } else if (space.type === SPACE_TYPES.FREE_PARKING) {
    p.fill(200, 100, 255);
    p.rect(pos.x - size/2, pos.y - size/2, size, size);
  } else if (space.type === SPACE_TYPES.GO_TO_JAIL) {
    p.fill(255, 0, 0);
    p.rect(pos.x - size/2, pos.y - size/2, size, size);
  } else if (space.type === SPACE_TYPES.CHANCE) {
    p.fill(255, 100, 100);
    p.rect(pos.x - size/2, pos.y - size/2, size, size);
  } else if (space.type === SPACE_TYPES.COMMUNITY_CHEST) {
    p.fill(100, 150, 255);
    p.rect(pos.x - size/2, pos.y - size/2, size, size);
  } else if (space.type === SPACE_TYPES.TAX) {
    p.fill(150, 150, 150);
    p.rect(pos.x - size/2, pos.y - size/2, size, size);
  }
  
  // Owner indicator
  if (space.owner && (space.type === SPACE_TYPES.PROPERTY || space.type === SPACE_TYPES.RAILROAD || space.type === SPACE_TYPES.UTILITY)) {
    p.fill(space.owner.color[0], space.owner.color[1], space.owner.color[2]);
    p.noStroke();
    p.circle(pos.x, pos.y, 8);
  }
}

function renderPlayers(p) {
  gameState.players.forEach(player => {
    if (!player.isBankrupt) {
      const pos = player.getScreenPosition();
      p.fill(player.color[0], player.color[1], player.color[2]);
      p.stroke(0);
      p.strokeWeight(2);
      p.circle(pos.x, pos.y, 12);
      
      // Current player indicator
      if (player === getCurrentPlayer()) {
        p.noFill();
        p.stroke(255, 255, 0);
        p.strokeWeight(2);
        p.circle(pos.x, pos.y, 18);
      }
    }
  });
}

function renderDice(p) {
  const centerX = CANVAS_WIDTH / 2;
  const centerY = 200;
  
  // Dice 1
  p.fill(255);
  p.stroke(0);
  p.strokeWeight(2);
  p.rect(centerX - 40, centerY - 15, 30, 30, 5);
  
  // Dice 2
  p.rect(centerX + 10, centerY - 15, 30, 30, 5);
  
  // Draw dots
  p.fill(0);
  p.noStroke();
  drawDiceDots(p, centerX - 25, centerY, gameState.diceValues[0]);
  drawDiceDots(p, centerX + 25, centerY, gameState.diceValues[1]);
  
  // Total
  p.fill(0);
  p.textSize(14);
  p.textAlign(p.CENTER);
  p.text(`Total: ${gameState.diceValues[0] + gameState.diceValues[1]}`, centerX, centerY + 35);
}

function drawDiceDots(p, x, y, value) {
  const r = 3;
  
  if (value === 1) {
    p.circle(x, y, r * 2);
  } else if (value === 2) {
    p.circle(x - 6, y - 6, r * 2);
    p.circle(x + 6, y + 6, r * 2);
  } else if (value === 3) {
    p.circle(x - 6, y - 6, r * 2);
    p.circle(x, y, r * 2);
    p.circle(x + 6, y + 6, r * 2);
  } else if (value === 4) {
    p.circle(x - 6, y - 6, r * 2);
    p.circle(x + 6, y - 6, r * 2);
    p.circle(x - 6, y + 6, r * 2);
    p.circle(x + 6, y + 6, r * 2);
  } else if (value === 5) {
    p.circle(x - 6, y - 6, r * 2);
    p.circle(x + 6, y - 6, r * 2);
    p.circle(x, y, r * 2);
    p.circle(x - 6, y + 6, r * 2);
    p.circle(x + 6, y + 6, r * 2);
  } else if (value === 6) {
    p.circle(x - 6, y - 8, r * 2);
    p.circle(x + 6, y - 8, r * 2);
    p.circle(x - 6, y, r * 2);
    p.circle(x + 6, y, r * 2);
    p.circle(x - 6, y + 8, r * 2);
    p.circle(x + 6, y + 8, r * 2);
  }
}

function renderUI(p) {
  // Player info panel
  const player = gameState.players[0]; // Human player
  if (!player) return;
  
  p.fill(240, 240, 255, 230);
  p.stroke(60);
  p.strokeWeight(2);
  p.rect(10, 10, 180, 25);
  
  p.fill(0);
  p.noStroke();
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(12);
  p.text(`Cash: $${player.cash}`, 15, 22);
  p.text(`Properties: ${player.properties.length}`, 100, 22);
  
  // Current player turn indicator
  const currentPlayer = getCurrentPlayer();
  p.fill(240, 240, 255, 230);
  p.stroke(60);
  p.strokeWeight(2);
  p.rect(CANVAS_WIDTH - 190, 10, 180, 25);
  
  p.fill(currentPlayer.color[0], currentPlayer.color[1], currentPlayer.color[2]);
  p.noStroke();
  p.textAlign(p.RIGHT, p.CENTER);
  p.textSize(12);
  p.text(`Turn: ${currentPlayer.name}`, CANVAS_WIDTH - 15, 22);
  
  // Action prompt
  if (gameState.actionPrompt) {
    p.fill(255, 255, 200, 240);
    p.stroke(100);
    p.strokeWeight(2);
    p.rect(100, CANVAS_HEIGHT - 50, 400, 30);
    
    p.fill(0);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(11);
    p.text(gameState.actionPrompt, 300, CANVAS_HEIGHT - 35);
  }
}

function renderMessages(p) {
  const now = Date.now();
  const messages = gameState.messageQueue.filter(m => now - m.timestamp < 3000);
  
  p.fill(0);
  p.noStroke();
  p.textAlign(p.LEFT);
  p.textSize(10);
  
  messages.slice(-3).forEach((msg, idx) => {
    const alpha = 255 - ((now - msg.timestamp) / 3000) * 155;
    p.fill(0, 0, 0, alpha);
    p.text(msg.text, 100, 100 + idx * 15);
  });
}

function renderPropertyCard(p, space) {
  if (space.type !== SPACE_TYPES.PROPERTY && 
      space.type !== SPACE_TYPES.RAILROAD && 
      space.type !== SPACE_TYPES.UTILITY) return;
  
  const cardX = 400;
  const cardY = 100;
  const cardW = 150;
  const cardH = 180;
  
  // Card background
  p.fill(255, 250, 240);
  p.stroke(60);
  p.strokeWeight(2);
  p.rect(cardX, cardY, cardW, cardH);
  
  // Color bar for properties
  if (space.type === SPACE_TYPES.PROPERTY) {
    const color = getColorForGroup(space.group);
    p.fill(color[0], color[1], color[2]);
    p.noStroke();
    p.rect(cardX, cardY, cardW, 20);
  }
  
  // Property name
  p.fill(0);
  p.textAlign(p.CENTER);
  p.textSize(11);
  p.text(space.name, cardX + cardW/2, cardY + 30);
  
  // Price
  p.textSize(10);
  p.text(`Price: $${space.price}`, cardX + cardW/2, cardY + 50);
  
  // Rent info
  if (space.type === SPACE_TYPES.PROPERTY) {
    p.textAlign(p.LEFT);
    p.textSize(9);
    p.text(`Rent: $${space.rent[0]}`, cardX + 10, cardY + 70);
    p.text(`1 House: $${space.rent[1]}`, cardX + 10, cardY + 85);
    p.text(`2 Houses: $${space.rent[2]}`, cardX + 10, cardY + 100);
    p.text(`3 Houses: $${space.rent[3]}`, cardX + 10, cardY + 115);
    p.text(`4 Houses: $${space.rent[4]}`, cardX + 10, cardY + 130);
    p.text(`Hotel: $${space.rent[5]}`, cardX + 10, cardY + 145);
  }
  
  // Owner
  if (space.owner) {
    p.textAlign(p.CENTER);
    p.fill(space.owner.color[0], space.owner.color[1], space.owner.color[2]);
    p.text(`Owned by ${space.owner.name}`, cardX + cardW/2, cardY + cardH - 15);
  }
}

function renderPauseOverlay(p) {
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

function renderGameOverScreen(p) {
  p.background(20, 20, 40);
  
  const isWin = gameState.gamePhase === PHASE_GAME_OVER_WIN;
  
  // Title
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "YOU WIN!" : "GAME OVER", CANVAS_WIDTH / 2, 120);
  
  // Message
  p.fill(255);
  p.textSize(18);
  if (isWin) {
    p.text("Congratulations!", CANVAS_WIDTH / 2, 180);
    p.text(`Final Cash: $${gameState.score}`, CANVAS_WIDTH / 2, 210);
  } else {
    p.text("You went bankrupt!", CANVAS_WIDTH / 2, 180);
  }
  
  // Restart prompt
  p.fill(200, 200, 255);
  p.textSize(16);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 300);
}