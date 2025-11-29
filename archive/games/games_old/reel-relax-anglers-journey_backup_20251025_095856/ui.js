import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, LOCATIONS, GEAR_DATA, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, STATE_LOCATION_SELECT, STATE_SHOP, STATE_HOME_BASE, STATE_CASTING, STATE_WAITING_BITE, STATE_REELING, STATE_FISH_CAUGHT, STATE_LINE_SNAPPED, STATE_LEVEL_COMPLETE } from './globals.js';

export class UI {
  constructor(p) {
    this.p = p;
  }
  
  drawStartScreen() {
    const p = this.p;
    p.background(20, 30, 50);
    
    // Title
    p.fill(100, 200, 255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("REEL RELAX", CANVAS_WIDTH / 2, 80);
    p.textSize(24);
    p.text("Angler's Journey", CANVAS_WIDTH / 2, 120);
    
    // Description
    p.fill(200);
    p.textSize(14);
    p.text("Master the art of fishing across 4 stunning locations", CANVAS_WIDTH / 2, 170);
    p.text("Charge your cast, manage tension, catch rare fish!", CANVAS_WIDTH / 2, 190);
    p.text("Upgrade gear and unlock new waters", CANVAS_WIDTH / 2, 210);
    
    // Controls
    p.fill(180);
    p.textSize(12);
    p.text("SPACE: Cast/Reel  |  ARROWS: Navigate  |  ESC: Pause  |  R: Restart", CANVAS_WIDTH / 2, 250);
    p.text("S: Select Gear  |  D: Details/Unlock", CANVAS_WIDTH / 2, 270);
    
    // Start prompt
    p.fill(255, 255, 100);
    p.textSize(20);
    const alpha = Math.floor(128 + 127 * Math.sin(p.frameCount * 0.1));
    p.fill(255, 255, 100, alpha);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 330);
    
    // High score
    if (gameState.highScore > 0) {
      p.fill(255, 200, 100);
      p.textSize(16);
      p.text(`High Score: ${gameState.highScore}`, CANVAS_WIDTH / 2, 370);
    }
  }
  
  drawLocationSelect() {
    const p = this.p;
    p.background(40, 60, 80);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(24);
    p.text("SELECT LOCATION", CANVAS_WIDTH / 2, 30);
    
    p.textSize(14);
    p.text(`Cash: $${gameState.cash}`, CANVAS_WIDTH / 2, 60);
    
    // Draw locations
    const startY = 100;
    const spacing = 60;
    
    LOCATIONS.forEach((loc, index) => {
      const y = startY + index * spacing;
      const isUnlocked = gameState.unlockedLocations.includes(loc.id);
      const isSelected = gameState.selectedMenuIndex === index;
      
      p.push();
      
      if (isSelected) {
        p.fill(100, 150, 200, 100);
        p.rect(50, y - 20, CANVAS_WIDTH - 100, 45, 5);
      }
      
      if (isUnlocked) {
        p.fill(100, 255, 100);
      } else {
        p.fill(150, 150, 150);
      }
      
      p.textAlign(p.LEFT, p.CENTER);
      p.textSize(16);
      p.text(`${loc.id}. ${loc.name}`, 70, y);
      
      if (isUnlocked) {
        p.textSize(12);
        p.fill(200);
        p.text(`Goal: ${loc.objectiveFish} fish OR ${loc.objectiveScore} pts`, 70, y + 15);
      } else {
        p.textSize(12);
        p.fill(255, 200, 100);
        p.text(`Unlock: $${loc.unlockCost}`, 70, y + 15);
      }
      
      p.pop();
    });
    
    // Menu options
    const menuY = startY + LOCATIONS.length * spacing + 20;
    p.fill(200);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text("[SPACE/ENTER] Fish Here  [D] Unlock  [S] Shop  [H] Home  [R] Restart", CANVAS_WIDTH / 2, menuY);
  }
  
  drawShop() {
    const p = this.p;
    p.background(30, 40, 60);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(24);
    p.text("TACKLE SHOP", CANVAS_WIDTH / 2, 30);
    
    p.textSize(14);
    p.text(`Cash: $${gameState.cash}`, CANVAS_WIDTH / 2, 60);
    
    // Category tabs
    const categories = ["rods", "reels", "lines", "lures"];
    const tabWidth = 120;
    const startX = (CANVAS_WIDTH - tabWidth * 4) / 2;
    
    categories.forEach((cat, i) => {
      const x = startX + i * tabWidth;
      const isSelected = gameState.shopCategory === cat;
      
      p.fill(isSelected ? 80 : 50, isSelected ? 120 : 80, isSelected ? 160 : 120);
      p.rect(x, 80, tabWidth - 5, 30, 5);
      
      p.fill(255);
      p.textSize(12);
      p.text(cat.toUpperCase(), x + tabWidth / 2 - 2.5, 95);
    });
    
    // Draw gear items
    const items = GEAR_DATA[gameState.shopCategory];
    const startY = 130;
    const spacing = 55;
    
    items.forEach((item, index) => {
      const y = startY + index * spacing;
      const isSelected = gameState.selectedMenuIndex === index;
      const isOwned = gameState.ownedGear.some(g => g.id === item.id);
      const isEquipped = gameState.equippedGear[gameState.shopCategory.slice(0, -1)]?.id === item.id;
      const canAfford = gameState.cash >= item.cost;
      
      p.push();
      
      if (isSelected) {
        p.fill(100, 150, 200, 100);
        p.rect(30, y - 18, CANVAS_WIDTH - 60, 45, 5);
      }
      
      p.textAlign(p.LEFT, p.CENTER);
      p.textSize(14);
      
      if (isEquipped) {
        p.fill(100, 255, 100);
        p.text("✓", 40, y);
      } else if (isOwned) {
        p.fill(200, 200, 100);
        p.text("○", 40, y);
      }
      
      p.fill(isOwned ? 200 : (canAfford ? 255 : 150));
      p.text(item.name, 60, y - 5);
      
      p.textSize(10);
      p.fill(180);
      p.text(item.description, 60, y + 10);
      
      if (!isOwned) {
        p.fill(canAfford ? 255 : 255, canAfford ? 220 : 100, canAfford ? 100 : 100);
        p.textAlign(p.RIGHT, p.CENTER);
        p.text(`$${item.cost}`, CANVAS_WIDTH - 40, y);
      }
      
      p.pop();
    });
    
    // Instructions
    p.fill(200);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(11);
    p.text("[←→] Change Category  [↑↓] Select  [S] Buy/Equip  [ESC] Back", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20);
  }
  
  drawHomeBase() {
    const p = this.p;
    
    // Background based on home level
    const bgColors = [
      [60, 80, 60],
      [80, 100, 80],
      [100, 120, 100]
    ];
    const bgColor = bgColors[Math.min(gameState.homeLevel, 2)];
    p.background(...bgColor);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(24);
    p.text("HOME BASE", CANVAS_WIDTH / 2, 30);
    
    // Draw simple home
    const homeSize = 80 + gameState.homeLevel * 40;
    p.fill(120, 80, 40);
    p.rect(CANVAS_WIDTH / 2 - homeSize / 2, 150, homeSize, homeSize);
    p.fill(150, 100, 50);
    p.triangle(CANVAS_WIDTH / 2, 120, CANVAS_WIDTH / 2 - homeSize / 2 - 10, 150, CANVAS_WIDTH / 2 + homeSize / 2 + 10, 150);
    
    // Upgrade info
    p.textSize(14);
    p.fill(200);
    const upgradeCost = (gameState.homeLevel + 1) * 500;
    if (gameState.homeLevel < 2) {
      p.text(`Upgrade Home: $${upgradeCost}`, CANVAS_WIDTH / 2, 280);
      p.textSize(12);
      p.fill(150);
      p.text("Press S to upgrade (visual only)", CANVAS_WIDTH / 2, 300);
    } else {
      p.text("Home fully upgraded!", CANVAS_WIDTH / 2, 280);
    }
    
    // Trophy case
    p.textSize(12);
    p.fill(200);
    p.text(`Unique Fish Caught: ${new Set(gameState.caughtFish.map(f => f.species)).size}`, CANVAS_WIDTH / 2, 330);
    
    p.fill(180);
    p.textSize(11);
    p.text("[ESC] Back to Locations", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20);
  }
  
  drawGamePlaying() {
    const p = this.p;
    
    // Background (water)
    const loc = LOCATIONS.find(l => l.id === gameState.currentLocation);
    if (loc) {
      const bgColor = loc.backgroundColor;
      p.background(...bgColor);
      
      // Water effect
      p.noStroke();
      for (let y = 200; y < CANVAS_HEIGHT; y += 10) {
        const wave = Math.sin((y + p.frameCount * 2) * 0.05) * 5;
        p.fill(bgColor[0] - 20, bgColor[1] - 20, bgColor[2] - 20, 100);
        p.rect(0, y + wave, CANVAS_WIDTH, 10);
      }
      
      // Horizon
      p.fill(bgColor[0] - 40, bgColor[1] - 40, bgColor[2] - 40);
      p.rect(0, 180, CANVAS_WIDTH, 20);
    }
    
    // Draw player
    if (gameState.player) {
      gameState.player.draw(p);
    }
    
    // Draw fishing line and bobber
    if (gameState.internalState === STATE_WAITING_BITE || gameState.internalState === STATE_REELING) {
      p.stroke(60, 40, 20);
      p.strokeWeight(2);
      p.line(gameState.player.x + 40, gameState.player.y - 50, gameState.bobberX, gameState.bobberY);
      
      if (gameState.internalState === STATE_WAITING_BITE) {
        // Draw bobber
        p.fill(255, 50, 50);
        p.noStroke();
        p.ellipse(gameState.bobberX, gameState.bobberY, 10, 10);
        p.fill(255);
        p.ellipse(gameState.bobberX, gameState.bobberY - 2, 10, 5);
      }
    }
    
    // Draw UI elements
    this.drawGameUI();
    
    // Draw state-specific UI
    if (gameState.internalState === STATE_CASTING) {
      this.drawCastingUI();
    } else if (gameState.internalState === STATE_REELING) {
      this.drawReelingUI();
    } else if (gameState.internalState === STATE_FISH_CAUGHT) {
      this.drawFishCaughtUI();
    } else if (gameState.internalState === STATE_LINE_SNAPPED) {
      this.drawLineSnappedUI();
    } else if (gameState.internalState === STATE_LEVEL_COMPLETE) {
      this.drawLevelCompleteUI();
    }
    
    // Draw message
    if (gameState.messageText && gameState.messageTimer > 0) {
      p.fill(255, 255, 100);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(20);
      p.text(gameState.messageText, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
    }
  }
  
  drawGameUI() {
    const p = this.p;
    
    // Score and cash
    p.fill(255);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(14);
    p.text(`Score: ${gameState.score}`, 10, 10);
    p.text(`Cash: $${gameState.cash}`, 10, 30);
    
    // Level info
    const loc = LOCATIONS.find(l => l.id === gameState.currentLocation);
    if (loc) {
      p.textAlign(p.CENTER, p.TOP);
      p.text(`Level ${loc.id}: ${loc.name}`, CANVAS_WIDTH / 2, 10);
      p.textSize(11);
      p.text(`Goal: ${loc.objectiveFish} fish OR ${loc.objectiveScore} pts (Caught: ${gameState.fishCaughtThisLevel})`, CANVAS_WIDTH / 2, 30);
    }
    
    // Gear info
    p.textAlign(p.LEFT, p.BOTTOM);
    p.textSize(10);
    p.fill(200);
    const gearText = `Rod: ${gameState.equippedGear.rod?.name || 'None'} | Line: ${gameState.equippedGear.line?.name || 'None'}`;
    p.text(gearText, 10, CANVAS_HEIGHT - 5);
  }
  
  drawCastingUI() {
    const p = this.p;
    
    // Power meter
    const meterX = 30;
    const meterY = 150;
    const meterW = 30;
    const meterH = 150;
    
    p.fill(50);
    p.rect(meterX, meterY, meterW, meterH);
    
    // Fill based on power
    const fillHeight = (gameState.castingPower / 100) * meterH;
    p.fill(100, 200, 100);
    p.rect(meterX, meterY + meterH - fillHeight, meterW, fillHeight);
    
    // Perfect zone
    const perfectZoneHeight = meterH * 0.05;
    p.fill(255, 255, 100, 100);
    p.rect(meterX, meterY, meterW, perfectZoneHeight);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(10);
    p.text("POWER", meterX + meterW / 2, meterY + meterH + 5);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.fill(255, 255, 100);
    p.text("Hold SPACE to charge", CANVAS_WIDTH / 2, 250);
    p.text("Release to cast!", CANVAS_WIDTH / 2, 270);
  }
  
  drawReelingUI() {
    const p = this.p;
    
    // Tension meter
    const meterX = 100;
    const meterY = CANVAS_HEIGHT - 80;
    const meterW = 400;
    const meterH = 30;
    
    // Background
    p.fill(50);
    p.rect(meterX, meterY, meterW, meterH);
    
    // Danger zones (red)
    p.fill(200, 50, 50);
    p.rect(meterX, meterY, meterW * 0.15, meterH); // Left danger
    p.rect(meterX + meterW * 0.85, meterY, meterW * 0.15, meterH); // Right danger
    
    // Sweet spot (green)
    const sweetSpotSize = 0.2 + (gameState.equippedGear.reel?.sweetSpotBonus || 0) * 0.01;
    const sweetSpotStart = 0.4;
    p.fill(50, 200, 50);
    p.rect(meterX + meterW * sweetSpotStart, meterY, meterW * sweetSpotSize, meterH);
    
    // Tension indicator
    const indicatorX = meterX + (gameState.tensionValue / 100) * meterW;
    p.fill(255, 255, 100);
    p.triangle(indicatorX - 5, meterY - 5, indicatorX + 5, meterY - 5, indicatorX, meterY + meterH + 5);
    
    // Fish stamina bar
    const staminaBarX = meterX;
    const staminaBarY = meterY - 25;
    const staminaBarW = meterW;
    const staminaBarH = 15;
    
    p.fill(50);
    p.rect(staminaBarX, staminaBarY, staminaBarW, staminaBarH);
    
    const staminaPercent = gameState.fishStamina / 100;
    p.fill(255, 100, 100);
    p.rect(staminaBarX, staminaBarY, staminaBarW * staminaPercent, staminaBarH);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text("FISH STAMINA", staminaBarX + staminaBarW / 2, staminaBarY + staminaBarH / 2);
    
    // Line durability
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(11);
    p.fill(200);
    p.text(`Line: ${Math.floor(gameState.lineDurability)}%`, meterX, meterY + meterH + 15);
    
    // Instructions
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.fill(255, 255, 100);
    p.text("Hold SPACE to reel! Keep in GREEN zone!", CANVAS_WIDTH / 2, 100);
  }
  
  drawFishCaughtUI() {
    const p = this.p;
    
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(100, 255, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(32);
    p.text("FISH CAUGHT!", CANVAS_WIDTH / 2, 100);
    
    if (gameState.currentFish) {
      // Draw fish
      gameState.currentFish.draw(p, CANVAS_WIDTH / 2, 180, 60);
      
      p.fill(255);
      p.textSize(20);
      p.text(gameState.currentFish.species, CANVAS_WIDTH / 2, 240);
      
      p.textSize(14);
      p.fill(200);
      p.text(`Rarity: ${gameState.currentFish.rarity.toUpperCase()}`, CANVAS_WIDTH / 2, 265);
      p.text(`Value: $${gameState.currentFish.value}`, CANVAS_WIDTH / 2, 285);
    }
    
    p.fill(255, 255, 100);
    p.textSize(16);
    p.text("Press SPACE to continue", CANVAS_WIDTH / 2, 340);
  }
  
  drawLineSnappedUI() {
    const p = this.p;
    
    p.fill(200, 50, 50);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(28);
    p.text("LINE SNAPPED!", CANVAS_WIDTH / 2, 150);
    
    p.fill(255);
    p.textSize(14);
    p.text("The fish got away...", CANVAS_WIDTH / 2, 190);
    p.text("Press SPACE to try again", CANVAS_WIDTH / 2, 220);
  }
  
  drawLevelCompleteUI() {
    const p = this.p;
    
    p.fill(0, 0, 0, 180);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    const loc = LOCATIONS.find(l => l.id === gameState.currentLocation);
    const isGameWon = loc && loc.id === 4;
    
    if (isGameWon) {
      p.fill(255, 215, 0);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(36);
      p.text("GAME COMPLETED!", CANVAS_WIDTH / 2, 100);
      
      p.fill(255);
      p.textSize(20);
      p.text("You've mastered all waters!", CANVAS_WIDTH / 2, 150);
    } else {
      p.fill(100, 255, 100);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(32);
      p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, 100);
      
      if (loc) {
        p.fill(255);
        p.textSize(18);
        p.text(`${loc.name} conquered!`, CANVAS_WIDTH / 2, 150);
      }
    }
    
    p.fill(200);
    p.textSize(16);
    p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 200);
    p.text(`Fish Caught: ${gameState.fishCaughtThisLevel}`, CANVAS_WIDTH / 2, 225);
    
    if (isGameWon) {
      p.fill(255, 255, 100);
      p.textSize(16);
      p.text("Press SPACE to return to menu", CANVAS_WIDTH / 2, 280);
    } else {
      p.fill(255, 255, 100);
      p.textSize(16);
      p.text("Press SPACE to return to locations", CANVAS_WIDTH / 2, 280);
      
      const nextLoc = LOCATIONS.find(l => l.id === gameState.currentLocation + 1);
      if (nextLoc) {
        p.fill(150);
        p.textSize(12);
        p.text(`Next: ${nextLoc.name} unlocked!`, CANVAS_WIDTH / 2, 310);
      }
    }
  }
  
  drawPausedScreen() {
    const p = this.p;
    
    // Draw game in background
    this.drawGamePlaying();
    
    // Overlay
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
    
    p.textSize(16);
    p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    p.text("Press R to restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
    
    // Paused indicator in top right
    p.fill(255, 255, 100);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }
  
  drawGameOver(isWin) {
    const p = this.p;
    p.background(20, 20, 30);
    
    if (isWin) {
      p.fill(255, 215, 0);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(48);
      p.text("VICTORY!", CANVAS_WIDTH / 2, 100);
      
      p.fill(200);
      p.textSize(18);
      p.text("All waters conquered!", CANVAS_WIDTH / 2, 160);
    } else {
      p.fill(200, 50, 50);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(48);
      p.text("GAME OVER", CANVAS_WIDTH / 2, 100);
      
      p.fill(200);
      p.textSize(16);
      p.text("Out of funds and unable to continue", CANVAS_WIDTH / 2, 160);
    }
    
    p.fill(255);
    p.textSize(20);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
    p.text(`Fish Caught: ${gameState.totalFishCaught}`, CANVAS_WIDTH / 2, 250);
    
    if (gameState.score > gameState.highScore) {
      p.fill(255, 215, 0);
      p.textSize(18);
      p.text("NEW HIGH SCORE!", CANVAS_WIDTH / 2, 290);
    }
    
    p.fill(255, 255, 100);
    p.textSize(18);
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);
  }
}