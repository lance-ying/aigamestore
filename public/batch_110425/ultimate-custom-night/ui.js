// ui.js - UI rendering and interaction

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  UI_ELEMENTS,
  PRIZE_ITEMS,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE
} from './globals.js';

export function renderUI(p) {
  if (gameState.gamePhase === PHASE_START) {
    renderStartScreen(p);
  } else if (gameState.gamePhase === PHASE_PLAYING) {
    renderGameUI(p);
  } else if (gameState.gamePhase === PHASE_PAUSED) {
    renderGameUI(p);
    renderPauseOverlay(p);
  } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
    renderGameOverScreen(p);
  }
}

function renderStartScreen(p) {
  p.background(20, 20, 40);
  
  // Title
  p.fill(200, 50, 50);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("ULTIMATE CUSTOM NIGHT", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(180, 180, 180);
  p.textSize(14);
  p.text("Survive from 12 AM to 6 AM", CANVAS_WIDTH / 2, 120);
  
  // Instructions
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.fill(200, 200, 200);
  
  const instructions = [
    "OBJECTIVE: Survive until 6 AM by managing power and defenses",
    "",
    "CONTROLS:",
    "  Arrow Keys - Navigate UI elements",
    "  Space - Toggle selected system on/off",
    "  Z - Emergency power boost (costs power)",
    "  Shift - Open Prize Counter (buy items with Faz-Coins)",
    "",
    "SYSTEMS:",
    "  Doors/Vents/Hoses - Block animatronic entry points",
    "  Generator - Restore power (costs Faz-Coins)",
    "  Music Box - Keep it wound up to prevent attacks",
    "  Cameras - Monitor animatronic positions",
    "",
    "TIPS:",
    "  - Each active system drains power",
    "  - Earn Faz-Coins by blocking animatronics",
    "  - Use items from Prize Counter wisely",
    "  - Watch for visual/audio cues of approaching threats"
  ];
  
  let yPos = 150;
  for (const line of instructions) {
    p.text(line, 50, yPos);
    yPos += 14;
  }
  
  // Start prompt
  p.fill(100, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(16);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
}

function renderGameUI(p) {
  // Office background
  p.fill(40, 35, 45);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Office desk
  p.fill(60, 50, 40);
  p.rect(100, 250, 400, 150);
  
  // Monitor (center)
  p.fill(20, 20, 20);
  p.rect(250, 180, 100, 80);
  p.fill(50, 100, 50);
  p.rect(255, 185, 90, 70);
  
  // Render UI elements
  renderUIElements(p);
  
  // Render HUD
  renderHUD(p);
  
  // Render animatronic indicators
  renderAnimatronicIndicators(p);
  
  // Render prize counter if open
  if (gameState.prizeCounterOpen) {
    renderPrizeCounter(p);
  }
}

function renderUIElements(p) {
  for (const [key, element] of Object.entries(UI_ELEMENTS)) {
    const systemKey = getSystemKey(key);
    const isSelected = gameState.selectedElement === key;
    const isActive = systemKey && getSystemState(systemKey);
    
    // Background
    if (isActive) {
      p.fill(50, 150, 50);
    } else {
      p.fill(80, 80, 80);
    }
    
    // Highlight if selected
    if (isSelected) {
      p.stroke(255, 255, 0);
      p.strokeWeight(3);
    } else {
      p.noStroke();
    }
    
    p.rect(element.x, element.y, element.w, element.h, 5);
    
    // Label
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.noStroke();
    p.text(element.label, element.x + element.w / 2, element.y + element.h / 2);
  }
}

function renderHUD(p) {
  // Time
  p.fill(255, 255, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  const hour = gameState.currentHour === 0 ? 12 : gameState.currentHour;
  const ampm = gameState.currentHour < 12 ? "AM" : "PM";
  p.text(`${hour}:00 ${ampm}`, 10, 10);
  
  // Power
  const powerColor = gameState.power > 50 ? [100, 255, 100] : gameState.power > 20 ? [255, 255, 100] : [255, 100, 100];
  p.fill(...powerColor);
  p.text(`Power: ${Math.floor(gameState.power)}%`, 10, 30);
  
  // Power bar
  p.fill(50);
  p.rect(10, 50, 100, 10);
  p.fill(...powerColor);
  p.rect(10, 50, gameState.power, 10);
  
  // Faz-Coins
  p.fill(255, 215, 0);
  p.text(`Coins: ${gameState.fazCoins}`, 10, 70);
  
  // Score
  p.fill(200, 200, 255);
  p.text(`Score: ${gameState.score}`, 10, 90);
  
  // Music box level
  const musicBoxLevel = gameState.systems.musicBox;
  const musicColor = musicBoxLevel > 50 ? [100, 255, 100] : musicBoxLevel > 25 ? [255, 255, 100] : [255, 100, 100];
  p.fill(...musicColor);
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`Music Box: ${Math.floor(musicBoxLevel)}%`, CANVAS_WIDTH - 10, 10);
  
  // Music box bar
  p.fill(50);
  p.rect(CANVAS_WIDTH - 110, 30, 100, 10);
  p.fill(...musicColor);
  p.rect(CANVAS_WIDTH - 110, 30, musicBoxLevel, 10);
  
  // Stress indicator (player)
  if (gameState.player) {
    const stress = gameState.player.stress;
    p.fill(255, 100, 100);
    p.textAlign(p.RIGHT, p.TOP);
    p.text(`Stress: ${Math.floor(stress)}%`, CANVAS_WIDTH - 10, 50);
  }
}

function renderAnimatronicIndicators(p) {
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(10);
  
  let yPos = 110;
  for (const anim of gameState.animatronics) {
    if (anim.position > 50) {
      const threat = anim.atEntryPoint ? "AT DOOR!" : `${Math.floor(anim.position)}%`;
      const color = anim.atEntryPoint ? [255, 50, 50] : [255, 200, 100];
      p.fill(...color);
      p.text(`${anim.name}: ${threat}`, 10, yPos);
      yPos += 12;
    }
  }
}

function renderPrizeCounter(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Prize counter window
  const windowX = 100;
  const windowY = 80;
  const windowW = 400;
  const windowH = 240;
  
  p.fill(60, 40, 80);
  p.stroke(255, 215, 0);
  p.strokeWeight(3);
  p.rect(windowX, windowY, windowW, windowH, 10);
  
  // Title
  p.fill(255, 215, 0);
  p.noStroke();
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(18);
  p.text("PRIZE COUNTER", windowX + windowW / 2, windowY + 10);
  
  // Coins display
  p.textSize(14);
  p.text(`Your Faz-Coins: ${gameState.fazCoins}`, windowX + windowW / 2, windowY + 35);
  
  // Items
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  let itemY = windowY + 60;
  
  for (let i = 0; i < PRIZE_ITEMS.length; i++) {
    const item = PRIZE_ITEMS[i];
    const isSelected = gameState.selectedPrizeIndex === i;
    
    if (isSelected) {
      p.fill(255, 255, 100);
      p.text("> ", windowX + 20, itemY);
    }
    
    const canAfford = gameState.fazCoins >= item.cost;
    p.fill(canAfford ? [255, 255, 255] : [128, 128, 128]);
    p.text(`${item.name} - ${item.cost} coins`, windowX + 40, itemY);
    
    itemY += 25;
  }
  
  // Instructions
  p.fill(200, 200, 200);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.textSize(11);
  p.text("Arrow Keys: Select | Space: Buy | Shift: Close", windowX + windowW / 2, windowY + windowH - 10);
}

function renderPauseOverlay(p) {
  p.fill(255, 255, 255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

function renderGameOverScreen(p) {
  p.background(20, 20, 30);
  
  const isWin = gameState.gamePhase === PHASE_GAME_OVER_WIN;
  
  // Title
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "6 AM" : "GAME OVER", CANVAS_WIDTH / 2, 100);
  
  // Subtitle
  p.fill(200, 200, 200);
  p.textSize(20);
  p.text(isWin ? "You Survived the Night!" : "Jumpscare!", CANVAS_WIDTH / 2, 150);
  
  // Stats
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  const stats = [
    `Final Score: ${gameState.score}`,
    `Time Survived: ${gameState.currentHour} hours`,
    `Jumpscares Avoided: ${gameState.jumpscaresAvoided}`,
    `Faz-Coins Collected: ${gameState.coinsCollected}`,
    `Final Power: ${Math.floor(gameState.power)}%`
  ];
  
  let yPos = 200;
  for (const stat of stats) {
    p.text(stat, 150, yPos);
    yPos += 25;
  }
  
  // Restart prompt
  p.fill(200, 200, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(16);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}

function getSystemKey(elementKey) {
  const mapping = {
    LEFT_DOOR: "leftDoor",
    RIGHT_DOOR: "rightDoor",
    LEFT_VENT: "leftVent",
    RIGHT_VENT: "rightVent",
    LEFT_HOSE: "leftHose",
    RIGHT_HOSE: "rightHose",
    GENERATOR: "generator",
    MUSIC_BOX: "musicBox",
    LEFT_CAMERA: "leftCamera",
    RIGHT_CAMERA: "rightCamera"
  };
  return mapping[elementKey];
}

function getSystemState(systemKey) {
  const state = gameState.systems[systemKey];
  if (systemKey === "musicBox") {
    return state > 0;
  }
  return state;
}

export function getUIElementKeys() {
  return Object.keys(UI_ELEMENTS);
}

export function getNextUIElement(current, direction) {
  const keys = getUIElementKeys();
  const currentIndex = keys.indexOf(current);
  
  if (direction === "left" || direction === "up") {
    return keys[(currentIndex - 1 + keys.length) % keys.length];
  } else {
    return keys[(currentIndex + 1) % keys.length];
  }
}