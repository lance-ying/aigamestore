// rendering.js - Main rendering functions
import { drawStartScreen, drawGameOverScreen, drawPausedIndicator, drawUI, drawPanel, drawHeart } from './ui.js';
import { COLORS, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, STATE_CLIENT_SELECT, STATE_DATE_SELECT, STATE_DATE_VENUE, STATE_MINIGAME, STATE_DATE_RESULT } from './globals.js';

export function render(p, gameState) {
  if (gameState.gamePhase === PHASE_START) {
    drawStartScreen(p, gameState);
  } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
    drawGameOverScreen(p, gameState);
  } else if (gameState.gamePhase === PHASE_PLAYING) {
    p.background(...COLORS.background);
    
    drawUI(p, gameState);
    
    if (gameState.playState === STATE_CLIENT_SELECT) {
      drawClientSelection(p, gameState);
    } else if (gameState.playState === STATE_DATE_SELECT) {
      drawDateSelection(p, gameState);
    } else if (gameState.playState === STATE_DATE_VENUE) {
      drawVenueSelection(p, gameState);
    } else if (gameState.playState === STATE_MINIGAME) {
      drawMiniGame(p, gameState);
    } else if (gameState.playState === STATE_DATE_RESULT) {
      drawDateResult(p, gameState);
    }
  }
  
  if (gameState.gamePhase === PHASE_PAUSED) {
    drawPausedIndicator(p);
  }
}

function drawClientSelection(p, gameState) {
  drawPanel(p, 50, 80, 500, 280, "Select a Client");
  
  p.fill(...COLORS.text);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text("Choose a client to match with a date:", 70, 120);
  
  for (let i = 0; i < gameState.clients.length; i++) {
    const client = gameState.clients[i];
    const y = 150 + i * 70;
    const isSelected = i === gameState.menuSelection;
    
    // Client card
    if (isSelected) {
      p.fill(...COLORS.secondary);
    } else {
      p.fill(...COLORS.white);
    }
    p.stroke(...COLORS.text);
    p.strokeWeight(2);
    p.rect(70, y, 460, 60, 5);
    
    // Client avatar
    p.fill(...client.color);
    p.noStroke();
    p.circle(100, y + 30, 40);
    
    // Client info
    p.fill(...COLORS.text);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(16);
    p.text(client.name, 130, y + 10);
    
    p.textSize(12);
    p.text(`Traits: ${client.traits.join(", ")}`, 130, y + 30);
    p.text(`Prefers: ${client.preferences.join(", ")}`, 130, y + 45);
  }
  
  // Instructions
  p.fill(...COLORS.textLight);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(12);
  p.text("↑/↓ to navigate, SPACE to select", CANVAS_WIDTH / 2, 340);
}

function drawDateSelection(p, gameState) {
  drawPanel(p, 50, 80, 500, 280, "Select a Date");
  
  p.fill(...COLORS.text);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text(`Finding a match for ${gameState.selectedClient.name}...`, 70, 120);
  
  for (let i = 0; i < gameState.dates.length; i++) {
    const date = gameState.dates[i];
    const y = 150 + i * 50;
    const isSelected = i === gameState.menuSelection;
    const compatibility = gameState.selectedClient.getCompatibility(date);
    
    // Only show 4 dates at a time
    if (i >= 4) break;
    
    // Date card
    if (isSelected) {
      p.fill(...COLORS.secondary);
    } else {
      p.fill(...COLORS.white);
    }
    p.stroke(...COLORS.text);
    p.strokeWeight(2);
    p.rect(70, y, 460, 40, 5);
    
    // Date avatar
    p.fill(...date.color);
    p.noStroke();
    p.circle(90, y + 20, 30);
    
    // Date info
    p.fill(...COLORS.text);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(14);
    p.text(date.name, 115, y + 20);
    
    p.textSize(11);
    p.text(`Traits: ${date.traits.join(", ")}`, 200, y + 20);
    
    // Compatibility
    const compatColor = compatibility >= 0.7 ? COLORS.success : compatibility >= 0.4 ? COLORS.secondary : COLORS.failure;
    p.fill(...compatColor);
    p.text(`${Math.floor(compatibility * 100)}%`, 480, y + 20);
    drawHeart(p, 465, y + 20, 8, compatColor);
  }
  
  // Instructions
  p.fill(...COLORS.textLight);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(12);
  p.text("↑/↓ to navigate, SPACE to select", CANVAS_WIDTH / 2, 340);
}

function drawVenueSelection(p, gameState) {
  drawPanel(p, 50, 80, 500, 280, "Choose a Venue");
  
  p.fill(...COLORS.text);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text("Where should this date take place?", 70, 120);
  
  const unlockedVenues = gameState.venues.filter(v => v.unlocked);
  
  for (let i = 0; i < unlockedVenues.length; i++) {
    const venue = unlockedVenues[i];
    const y = 150 + i * 50;
    const isSelected = i === gameState.menuSelection;
    
    // Venue card
    if (isSelected) {
      p.fill(...COLORS.secondary);
    } else {
      p.fill(...COLORS.white);
    }
    p.stroke(...COLORS.text);
    p.strokeWeight(2);
    p.rect(70, y, 460, 40, 5);
    
    // Venue info
    p.fill(...COLORS.text);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(14);
    p.text(venue.name, 90, y + 20);
    
    p.textSize(11);
    p.text(`Ambiance: ${venue.ambiance}`, 280, y + 20);
  }
  
  // Instructions
  p.fill(...COLORS.textLight);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(12);
  p.text("↑/↓ to navigate, SPACE to select", CANVAS_WIDTH / 2, 340);
}

function drawMiniGame(p, gameState) {
  const miniGame = gameState.currentMiniGame;
  
  // Background scene
  drawDateScene(p, gameState);
  
  // Mini-game panel
  drawPanel(p, 75, 180, 450, 180, null);
  
  // Timer
  const timeLeft = Math.ceil(miniGame.timeRemaining / 60);
  p.fill(...COLORS.text);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(14);
  p.text(`Time: ${timeLeft}s`, CANVAS_WIDTH / 2, 190);
  
  // Question/Prompt
  p.textSize(16);
  const prompt = miniGame.options.question || miniGame.options.prompt;
  p.text(prompt, CANVAS_WIDTH / 2, 220);
  
  // Choices
  const choices = miniGame.options.choices;
  for (let i = 0; i < choices.length; i++) {
    const y = 250 + i * 25;
    const isSelected = i === gameState.menuSelection;
    
    if (isSelected) {
      p.fill(...COLORS.primary);
    } else {
      p.fill(...COLORS.text);
    }
    
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(14);
    p.text(`${i + 1}. ${choices[i]}`, 100, y);
  }
  
  // Instructions
  p.fill(...COLORS.textLight);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.textSize(12);
  p.text("↑/↓ to navigate, SPACE to select", CANVAS_WIDTH / 2, 350);
}

function drawDateScene(p, gameState) {
  // Venue background
  p.fill(240, 220, 200);
  p.noStroke();
  p.rect(0, 80, CANVAS_WIDTH, 120);
  
  // Table
  p.fill(150, 100, 70);
  p.rect(200, 140, 200, 40, 5);
  
  // Client avatar
  const client = gameState.currentCouple.client;
  p.fill(...client.color);
  p.circle(180, 120, 50);
  p.fill(...COLORS.text);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.textSize(10);
  p.text(client.name, 180, 100);
  
  // Date avatar
  const date = gameState.currentCouple.date;
  p.fill(...date.color);
  p.circle(420, 120, 50);
  p.fill(...COLORS.text);
  p.text(date.name, 420, 100);
  
  // Hearts for love
  if (gameState.loveMeter > 25) {
    drawHeart(p, 300, 110, 10, [255, 192, 203]);
  }
  if (gameState.loveMeter > 50) {
    drawHeart(p, 320, 105, 12, [255, 105, 180]);
  }
  if (gameState.loveMeter > 75) {
    drawHeart(p, 280, 105, 12, [255, 20, 147]);
  }
}

function drawDateResult(p, gameState) {
  drawPanel(p, 100, 120, 400, 200, "Date Complete!");
  
  const success = gameState.loveMeter >= 60;
  
  p.fill(success ? ...COLORS.success : ...COLORS.failure);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(24);
  p.text(success ? "Perfect Match!" : "Not Quite Right...", CANVAS_WIDTH / 2, 160);
  
  p.fill(...COLORS.text);
  p.textSize(16);
  p.text(`Final Love Meter: ${Math.floor(gameState.loveMeter)}%`, CANVAS_WIDTH / 2, 200);
  
  if (success) {
    const reputationGain = Math.floor(30 + gameState.loveMeter / 2);
    p.text(`+${reputationGain} Reputation`, CANVAS_WIDTH / 2, 230);
  } else {
    p.text("-10 Reputation", CANVAS_WIDTH / 2, 230);
  }
  
  p.fill(...COLORS.textLight);
  p.textSize(14);
  p.text("Press SPACE to continue", CANVAS_WIDTH / 2, 280);
}