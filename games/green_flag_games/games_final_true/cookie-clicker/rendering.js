// rendering.js - All rendering functions
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, WIN_CONDITION } from './globals.js';

export function drawStartScreen(p) {
  p.background(30, 20, 40);
  
  // Decorative cookies in background
  p.push();
  p.noStroke();
  for (let i = 0; i < 5; i++) {
    const x = (i * 120 + 60);
    const y = 80 + Math.sin(p.frameCount * 0.02 + i) * 10;
    drawCookieIcon(p, x, y, 30, 100);
  }
  p.pop();
  
  // Title
  p.fill(255, 220, 150);
  p.textAlign(p.CENTER);
  p.textSize(48);
  p.text("COOKIE CLICKER", CANVAS_WIDTH / 2, 120);
  
  // Subtitle
  p.fill(200, 180, 130);
  p.textSize(16);
  p.text("An Idle Game About Baking Cookies", CANVAS_WIDTH / 2, 150);
  
  // Instructions
  p.fill(220, 200, 170);
  p.textSize(14);
  p.textAlign(p.LEFT);
  const instructions = [
    "OBJECTIVE:",
    "• Reach 10,000 cookies to win!",
    "",
    "HOW TO PLAY:",
    "• Press SPACE to click the cookie and earn cookies",
    "• Use Arrow UP/DOWN to navigate buildings/upgrades",
    "• Press Z to purchase selected building or upgrade",
    "• Press SHIFT to switch between Buildings and Upgrades",
    "• Buildings automatically generate cookies over time",
    "• Watch for golden cookies and click them for bonuses!"
  ];
  
  let yPos = 190;
  for (let line of instructions) {
    p.text(line, 80, yPos);
    yPos += 18;
  }
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER);
  p.textSize(20);
  const blink = Math.sin(p.frameCount * 0.1) > 0;
  if (blink) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
  }
}

export function drawPlayingScreen(p) {
  p.background(45, 35, 55);
  
  // Main cookie area (left side)
  drawMainCookieArea(p);
  
  // Shop area (right side)
  drawShopArea(p);
  
  // Top HUD
  drawHUD(p);
  
  // Golden cookies
  for (let gc of gameState.goldenCookies) {
    gc.draw();
  }
  
  // Click animations
  for (let anim of gameState.cookieClickAnimations) {
    anim.draw(p);
  }
}

export function drawPausedScreen(p) {
  drawPlayingScreen(p);
  
  // Pause overlay
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER);
  p.textSize(48);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  p.textSize(16);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
}

export function drawGameOverScreen(p) {
  p.background(30, 20, 40);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Animated cookies
  p.push();
  p.noStroke();
  for (let i = 0; i < 8; i++) {
    const x = (i * 75 + 37.5);
    const y = 60 + Math.sin(p.frameCount * 0.05 + i) * 15;
    drawCookieIcon(p, x, y, 25, 150);
  }
  p.pop();
  
  // Title
  if (isWin) {
    p.fill(100, 255, 100);
    p.textSize(56);
  } else {
    p.fill(255, 100, 100);
    p.textSize(48);
  }
  p.textAlign(p.CENTER);
  p.text(isWin ? "VICTORY!" : "GAME OVER", CANVAS_WIDTH / 2, 140);
  
  // Stats
  p.fill(255, 230, 180);
  p.textSize(24);
  p.text(`Total Cookies: ${formatNumber(gameState.totalCookiesEarned)}`, CANVAS_WIDTH / 2, 190);
  
  p.textSize(18);
  p.text(`Final CPS: ${formatNumber(gameState.cookiesPerSecond)}`, CANVAS_WIDTH / 2, 220);
  p.text(`Manual Clicks: ${gameState.manualClicks}`, CANVAS_WIDTH / 2, 245);
  
  // Building stats
  p.textSize(14);
  p.fill(220, 200, 170);
  p.textAlign(p.LEFT);
  let yPos = 280;
  p.text("Buildings Owned:", 150, yPos);
  yPos += 20;
  
  for (let building of gameState.buildings) {
    if (building.count > 0) {
      p.text(`  ${building.name}: ${building.count}`, 150, yPos);
      yPos += 18;
    }
  }
  
  // Restart prompt
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER);
  p.textSize(20);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 370);
}

function drawMainCookieArea(p) {
  // Background panel
  p.fill(60, 50, 70);
  p.noStroke();
  p.rect(10, 50, 280, 340, 10);
  
  // Big cookie
  const cookieX = 150;
  const cookieY = 220;
  const cookieSize = 120;
  
  // Cookie click effect
  const clickScale = 1 + Math.max(0, (30 - (p.frameCount - gameState.lastClickTime)) * 0.01);
  
  p.push();
  p.translate(cookieX, cookieY);
  p.scale(clickScale);
  drawCookieIcon(p, 0, 0, cookieSize, 255);
  p.pop();
  
  // Cookie count under cookie
  p.fill(255, 230, 180);
  p.textAlign(p.CENTER);
  p.textSize(20);
  p.text(formatNumber(gameState.cookies), cookieX, 310);
  p.textSize(12);
  p.fill(200, 180, 150);
  p.text("cookies", cookieX, 325);
  
  // Per second
  p.textSize(16);
  p.fill(150, 255, 150);
  p.text(`${formatNumber(gameState.cookiesPerSecond)} per second`, cookieX, 345);
}

function drawShopArea(p) {
  // Background panel
  p.fill(60, 50, 70);
  p.noStroke();
  p.rect(300, 50, 290, 340, 10);
  
  // Tabs
  const tab1X = 315;
  const tab2X = 445;
  const tabY = 60;
  const tabW = 120;
  const tabH = 30;
  
  // Buildings tab
  p.fill(...(gameState.currentTab === "BUILDINGS" ? [100, 80, 120] : [70, 60, 90]));
  p.rect(tab1X, tabY, tabW, tabH, 5);
  p.fill(255, 230, 180);
  p.textAlign(p.CENTER);
  p.textSize(14);
  p.text("Buildings", tab1X + tabW / 2, tabY + 20);
  
  // Upgrades tab
  p.fill(...(gameState.currentTab === "UPGRADES" ? [100, 80, 120] : [70, 60, 90]));
  p.rect(tab2X, tabY, tabW, tabH, 5);
  p.fill(255, 230, 180);
  p.text("Upgrades", tab2X + tabW / 2, tabY + 20);
  
  // Content area
  if (gameState.currentTab === "BUILDINGS") {
    drawBuildingsList(p);
  } else {
    drawUpgradesList(p);
  }
}

function drawBuildingsList(p) {
  const startY = 100;
  const itemHeight = 60;
  const maxVisible = 4;
  
  p.push();
  p.fill(50, 40, 60);
  p.rect(310, startY, 270, maxVisible * itemHeight + 10, 5);
  
  // Clip content
  const visibleBuildings = gameState.buildings.slice(
    gameState.scrollOffset,
    gameState.scrollOffset + maxVisible
  );
  
  for (let i = 0; i < visibleBuildings.length; i++) {
    const building = visibleBuildings[i];
    const globalIndex = gameState.scrollOffset + i;
    const y = startY + 10 + i * itemHeight;
    const isSelected = globalIndex === gameState.selectedIndex;
    const canAfford = gameState.cookies >= building.getCost();
    
    // Background
    if (isSelected) {
      p.fill(80, 70, 100);
    } else {
      p.fill(60, 50, 80);
    }
    p.rect(315, y, 260, itemHeight - 5, 5);
    
    // Icon
    drawBuildingIcon(p, 330, y + 25, building.icon);
    
    // Name and count
    p.fill(...(canAfford ? [255, 230, 180] : [150, 130, 110]));
    p.textAlign(p.LEFT);
    p.textSize(14);
    p.text(`${building.name} (${building.count})`, 360, y + 15);
    
    // Cost
    p.textSize(12);
    p.fill(...(canAfford ? [100, 255, 100] : [255, 100, 100]));
    p.text(`Cost: ${formatNumber(building.getCost())}`, 360, y + 30);
    
    // CPS
    p.fill(150, 200, 255);
    p.textSize(11);
    p.text(`+${formatNumber(building.baseCps * building.multiplier)}/s`, 360, y + 45);
  }
  
  p.pop();
  
  // Scroll indicators
  if (gameState.scrollOffset > 0) {
    p.fill(255, 255, 100);
    p.textAlign(p.CENTER);
    p.textSize(16);
    p.text("▲", 445, startY - 5);
  }
  
  if (gameState.scrollOffset + maxVisible < gameState.buildings.length) {
    p.fill(255, 255, 100);
    p.textAlign(p.CENTER);
    p.textSize(16);
    p.text("▼", 445, startY + maxVisible * itemHeight + 20);
  }
}

function drawUpgradesList(p) {
  const startY = 100;
  const itemHeight = 60;
  const maxVisible = 4;
  
  // Filter available upgrades
  const availableUpgrades = gameState.upgrades.filter(u => u.isAvailable());
  
  p.push();
  p.fill(50, 40, 60);
  p.rect(310, startY, 270, maxVisible * itemHeight + 10, 5);
  
  if (availableUpgrades.length === 0) {
    p.fill(180, 160, 140);
    p.textAlign(p.CENTER);
    p.textSize(14);
    p.text("No upgrades available yet", 445, startY + 120);
    p.textSize(12);
    p.fill(150, 130, 110);
    p.text("Buy more buildings to unlock!", 445, startY + 140);
    p.pop();
    return;
  }
  
  const visibleUpgrades = availableUpgrades.slice(
    gameState.scrollOffset,
    gameState.scrollOffset + maxVisible
  );
  
  for (let i = 0; i < visibleUpgrades.length; i++) {
    const upgrade = visibleUpgrades[i];
    const globalIndex = gameState.scrollOffset + i;
    const y = startY + 10 + i * itemHeight;
    const isSelected = globalIndex === gameState.selectedIndex;
    const canAfford = upgrade.canAfford();
    
    // Background
    if (isSelected) {
      p.fill(80, 70, 100);
    } else {
      p.fill(60, 50, 80);
    }
    p.rect(315, y, 260, itemHeight - 5, 5);
    
    // Icon (upgrade badge)
    p.fill(255, 215, 0);
    p.circle(330, y + 25, 20);
    p.fill(200, 150, 0);
    p.textSize(14);
    p.textAlign(p.CENTER);
    p.text("↑", 330, y + 30);
    
    // Name
    p.fill(...(canAfford ? [255, 230, 180] : [150, 130, 110]));
    p.textAlign(p.LEFT);
    p.textSize(13);
    p.text(upgrade.name, 350, y + 15);
    
    // Cost
    p.textSize(12);
    p.fill(...(canAfford ? [100, 255, 100] : [255, 100, 100]));
    p.text(`Cost: ${formatNumber(upgrade.cost)}`, 350, y + 30);
    
    // Description
    p.fill(180, 160, 140);
    p.textSize(10);
    p.text(upgrade.description, 350, y + 45);
  }
  
  p.pop();
  
  // Scroll indicators
  if (gameState.scrollOffset > 0) {
    p.fill(255, 255, 100);
    p.textAlign(p.CENTER);
    p.textSize(16);
    p.text("▲", 445, startY - 5);
  }
  
  if (gameState.scrollOffset + maxVisible < availableUpgrades.length) {
    p.fill(255, 255, 100);
    p.textAlign(p.CENTER);
    p.textSize(16);
    p.text("▼", 445, startY + maxVisible * itemHeight + 20);
  }
}

function drawHUD(p) {
  // Top bar background
  p.fill(40, 30, 50);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 45);
  
  // Title
  p.fill(255, 220, 150);
  p.textAlign(p.LEFT);
  p.textSize(20);
  p.text("Cookie Clicker", 15, 28);
  
  // Goal progress
  const progress = Math.min(1, gameState.cookies / WIN_CONDITION);
  p.fill(80, 70, 90);
  p.rect(250, 15, 200, 20, 10);
  p.fill(100, 255, 100);
  p.rect(252, 17, 196 * progress, 16, 8);
  
  p.fill(255, 255, 255);
  p.textSize(12);
  p.textAlign(p.CENTER);
  p.text(`${formatNumber(gameState.cookies)} / ${formatNumber(WIN_CONDITION)}`, 350, 29);
  
  // Pause indicator (small)
  if (gameState.gamePhase === "PAUSED") {
    p.fill(255, 255, 100);
    p.textAlign(p.RIGHT);
    p.textSize(12);
    p.text("PAUSED", CANVAS_WIDTH - 15, 28);
  }
}

function drawCookieIcon(p, x, y, size, alpha) {
  p.push();
  p.noStroke();
  
  // Cookie base
  p.fill(210, 180, 140, alpha);
  p.circle(x, y, size);
  
  // Edge shading
  p.fill(180, 150, 110, alpha * 0.5);
  p.circle(x, y, size * 0.95);
  
  // Chocolate chips
  const chipCount = Math.floor(size / 15);
  p.fill(90, 60, 40, alpha);
  for (let i = 0; i < chipCount; i++) {
    const angle = (i / chipCount) * Math.PI * 2;
    const radius = size * 0.25;
    const chipX = x + Math.cos(angle) * radius;
    const chipY = y + Math.sin(angle) * radius;
    p.circle(chipX, chipY, size * 0.12);
  }
  
  p.pop();
}

function drawBuildingIcon(p, x, y, iconType) {
  p.push();
  p.noStroke();
  
  switch (iconType) {
    case "cursor":
      // Hand cursor
      p.fill(255, 220, 180);
      p.rect(x - 6, y - 8, 4, 12);
      p.rect(x - 2, y - 10, 4, 10);
      p.rect(x + 2, y - 8, 4, 8);
      break;
    case "grandma":
      // Grandma face
      p.fill(255, 220, 190);
      p.circle(x, y, 18);
      p.fill(100, 80, 70);
      p.circle(x - 4, y - 2, 3);
      p.circle(x + 4, y - 2, 3);
      p.fill(200, 100, 100);
      p.arc(x, y + 3, 8, 5, 0, Math.PI);
      break;
    case "farm":
      // Farm building
      p.fill(200, 80, 80);
      p.triangle(x - 8, y, x, y - 10, x + 8, y);
      p.fill(180, 160, 140);
      p.rect(x - 6, y, 12, 8);
      break;
    case "mine":
      // Mine cart
      p.fill(100, 100, 120);
      p.rect(x - 8, y - 3, 16, 8);
      p.fill(60, 60, 80);
      p.circle(x - 5, y + 5, 5);
      p.circle(x + 5, y + 5, 5);
      break;
    case "factory":
      // Factory with smokestacks
      p.fill(140, 140, 160);
      p.rect(x - 8, y - 2, 16, 10);
      p.fill(100, 100, 120);
      p.rect(x - 6, y - 8, 3, 6);
      p.rect(x + 3, y - 10, 3, 8);
      break;
    default:
      p.fill(255, 255, 255);
      p.circle(x, y, 15);
  }
  
  p.pop();
}

function formatNumber(num) {
  if (num === 0) {
    return "0";
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  } else if (num > 0 && num < 1) {
    // For very small positive numbers (e.g., 0.1 CPS), show at least one decimal place.
    // This ensures 0.1 is displayed as "0.1" instead of "0".
    return num.toFixed(1);
  }
  // For numbers between 1 and 999 (inclusive), display as integer.
  // This maintains the original behavior for whole numbers like 1, 8, 47 for CPS
  // and floors cookie counts and costs.
  return Math.floor(num).toString();
}

export function drawFrame(p) {
  switch (gameState.gamePhase) {
    case "START":
      drawStartScreen(p);
      break;
    case "PLAYING":
      drawPlayingScreen(p);
      break;
    case "PAUSED":
      drawPausedScreen(p);
      break;
    case "GAME_OVER_WIN":
    case "GAME_OVER_LOSE":
      drawGameOverScreen(p);
      break;
  }
}