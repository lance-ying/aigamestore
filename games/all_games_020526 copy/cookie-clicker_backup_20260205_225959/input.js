// input.js - Input handling
import { gameState, CANVAS_WIDTH, WIN_CONDITION } from './globals.js';
import { CookieClickAnimation } from './cookie_animation.js';

let clickPower = 1;

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // Game phase transitions
  if (keyCode === 13 && gameState.gamePhase === "START") { // ENTER
    startGame(p);
    return;
  }

  if (keyCode === 82 && (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE")) { // R
    restartGame(p);
    return;
  }

  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === "PLAYING") {
      pauseGame(p);
    } else if (gameState.gamePhase === "PAUSED") {
      unpauseGame(p);
    }
    return;
  }

  // Gameplay inputs (only in PLAYING phase)
  if (gameState.gamePhase !== "PLAYING") return;

  if (keyCode === 32) { // SPACE - click cookie
    clickCookie(p);
  } else if (keyCode === 38) { // Arrow UP
    scrollUp();
  } else if (keyCode === 40) { // Arrow DOWN
    scrollDown();
  } else if (keyCode === 90) { // Z - purchase
    purchaseSelected(p);
  } else if (keyCode === 16) { // SHIFT - toggle tab
    toggleTab();
  }
}

function startGame(p) {
  gameState.gamePhase = "PLAYING";
  p.logs.game_info.push({
    data: { phase: "PLAYING" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function restartGame(p) {
  // Reset all game state
  gameState.cookies = 0;
  gameState.totalCookiesEarned = 0;
  gameState.cookiesPerSecond = 0;
  gameState.manualClicks = 0;
  gameState.currentTab = "BUILDINGS";
  gameState.scrollOffset = 0;
  gameState.selectedIndex = 0;
  gameState.goldenCookies = [];
  gameState.cookieClickAnimations = [];
  gameState.ownedUpgrades = [];
  clickPower = 1;
  
  // Reset buildings
  for (let building of gameState.buildings) {
    building.count = 0;
    building.multiplier = 1;
  }
  
  // Reset upgrades
  for (let upgrade of gameState.upgrades) {
    upgrade.purchased = false;
  }
  
  gameState.gamePhase = "START";
  p.logs.game_info.push({
    data: { phase: "START" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function pauseGame(p) {
  gameState.gamePhase = "PAUSED";
  p.logs.game_info.push({
    data: { phase: "PAUSED" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function unpauseGame(p) {
  gameState.gamePhase = "PLAYING";
  p.logs.game_info.push({
    data: { phase: "PLAYING" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function clickCookie(p) {
  const cookieValue = clickPower;
  gameState.cookies += cookieValue;
  gameState.totalCookiesEarned += cookieValue;
  gameState.manualClicks++;
  gameState.lastClickTime = p.frameCount;
  
  // Create click animation
  const anim = new CookieClickAnimation(150, 200, cookieValue);
  gameState.cookieClickAnimations.push(anim);
  
  // Check for golden cookie clicks
  for (let i = gameState.goldenCookies.length - 1; i >= 0; i--) {
    const gc = gameState.goldenCookies[i];
    if (gc.checkClick(150, 220)) {
      gameState.cookies += gc.value;
      gameState.totalCookiesEarned += gc.value;
      gameState.goldenCookies.splice(i, 1);
      
      // Create animation
      const gcAnim = new CookieClickAnimation(gc.x, gc.y, gc.value);
      gameState.cookieClickAnimations.push(gcAnim);
    }
  }
}

function scrollUp() {
  if (gameState.scrollOffset > 0) {
    gameState.scrollOffset--;
    gameState.selectedIndex = gameState.scrollOffset;
  }
}

function scrollDown() {
  const maxItems = gameState.currentTab === "BUILDINGS" 
    ? gameState.buildings.length 
    : gameState.upgrades.filter(u => u.isAvailable()).length;
  
  const maxVisible = 4;
  if (gameState.scrollOffset + maxVisible < maxItems) {
    gameState.scrollOffset++;
    gameState.selectedIndex = gameState.scrollOffset;
  }
}

function toggleTab() {
  gameState.currentTab = gameState.currentTab === "BUILDINGS" ? "UPGRADES" : "BUILDINGS";
  gameState.scrollOffset = 0;
  gameState.selectedIndex = 0;
}

function purchaseSelected(p) {
  if (gameState.currentTab === "BUILDINGS") {
    const building = gameState.buildings[gameState.selectedIndex];
    if (building && building.purchase()) {
      p.logs.game_info.push({
        data: { 
          action: "purchase_building",
          building: building.name,
          count: building.count,
          cost: building.getCost()
        },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else {
    const availableUpgrades = gameState.upgrades.filter(u => u.isAvailable());
    const upgrade = availableUpgrades[gameState.selectedIndex];
    if (upgrade && upgrade.purchase()) {
      // Apply click power upgrade if applicable
      if (upgrade.effect.type === "click_power") {
        clickPower += upgrade.effect.amount;
      }
      
      p.logs.game_info.push({
        data: { 
          action: "purchase_upgrade",
          upgrade: upgrade.name,
          cost: upgrade.cost
        },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
}

export function getClickPower() {
  return clickPower;
}