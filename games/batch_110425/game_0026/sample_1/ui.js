// ui.js - UI rendering

import { CANVAS_WIDTH, CANVAS_HEIGHT, ATTRACTION_TYPES, RESEARCH_TREE, MASCOTS, GAME_PHASES } from './globals.js';

export function renderStartScreen(p, gameState) {
  p.background(20, 30, 50);
  
  // Title
  p.fill(255, 220, 100);
  p.textSize(36);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("ゆうえんち夢物語", CANVAS_WIDTH / 2, 60);
  
  p.fill(200, 200, 200);
  p.textSize(16);
  p.text("Amusement Park Story", CANVAS_WIDTH / 2, 90);
  
  // Instructions
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    "BUILD your dream amusement park!",
    "",
    "• Place attractions to attract guests",
    "• Guests generate income & satisfaction",
    "• Research new attractions and upgrades",
    "• Recruit mascots for themed zones",
    "• Climb to Rank #1!",
    "",
    "Controls:",
    "Arrow Keys - Navigate menu/camera",
    "Space - Open menu / Confirm",
    "Z - Remove attraction",
    "Shift - Fast forward (hold)",
    "",
    "Goal: Reach Rank 1 with 90%+ satisfaction"
  ];
  
  let yPos = 130;
  for (const line of instructions) {
    p.text(line, 80, yPos);
    yPos += 16;
  }
  
  // Prompt
  p.fill(255, 255, 0);
  p.textSize(16);
  p.textAlign(p.CENTER, p.CENTER);
  const blink = Math.floor(p.frameCount / 30) % 2 === 0;
  if (blink) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  }
}

export function renderGameOverScreen(p, gameState) {
  p.background(20, 20, 20, 200);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textSize(32);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(isWin ? "CONGRATULATIONS!" : "GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
  
  p.fill(255);
  p.textSize(16);
  if (isWin) {
    p.text(`You reached Rank #${gameState.ranking}!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    p.text(`Final Satisfaction: ${Math.floor(gameState.satisfaction)}%`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
  } else {
    p.text("Your park couldn't maintain guest satisfaction.", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    p.text(`Final Rank: #${gameState.ranking}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
  }
  
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  
  p.fill(255, 255, 0);
  p.textSize(14);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}

export function renderPausedIndicator(p) {
  p.fill(255, 255, 0);
  p.textSize(12);
  p.textAlign(p.RIGHT, p.TOP);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

export function renderHUD(p, gameState) {
  // Top bar
  p.fill(30, 30, 30, 200);
  p.rect(0, 0, CANVAS_WIDTH, 50);
  
  p.fill(255, 220, 100);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Money: $${gameState.money}`, 10, 10);
  p.text(`Satisfaction: ${Math.floor(gameState.satisfaction)}%`, 10, 25);
  
  p.text(`Rank: #${gameState.ranking}`, 150, 10);
  p.text(`Popularity: ${gameState.popularity}`, 150, 25);
  
  p.text(`Year ${gameState.year} Day ${gameState.day}`, 280, 10);
  p.text(`Score: ${gameState.score}`, 280, 25);
  
  p.text(`Attractions: ${gameState.attractions.filter(a => a.isBuilt).length}`, 420, 10);
  p.text(`Guests: ${gameState.guests.length}`, 420, 25);
  
  // Instructions hint
  p.fill(200, 200, 200);
  p.textSize(9);
  p.textAlign(p.RIGHT, p.TOP);
  p.text("Space:Menu | Z:Remove | Shift:Fast", CANVAS_WIDTH - 10, 10);
}

export function renderMenu(p, gameState) {
  if (!gameState.menuOpen) return;
  
  const menuX = 50;
  const menuY = 80;
  const menuWidth = 500;
  const menuHeight = 280;
  
  p.fill(40, 40, 60, 240);
  p.rect(menuX, menuY, menuWidth, menuHeight);
  
  p.fill(255, 220, 100);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  p.text("Build Menu (Arrow Keys to select, Space to confirm, Z to close)", menuX + 10, menuY + 10);
  
  // Attractions
  p.fill(200, 200, 200);
  p.textSize(12);
  p.text("Attractions:", menuX + 10, menuY + 35);
  
  let yPos = menuY + 55;
  let index = 0;
  const attractionKeys = Object.keys(ATTRACTION_TYPES);
  
  for (const key of attractionKeys) {
    const attraction = ATTRACTION_TYPES[key];
    const unlocked = gameState.unlockedAttractions.includes(key);
    
    if (index === gameState.menuIndex && unlocked) {
      p.fill(255, 255, 0);
      p.rect(menuX + 5, yPos - 2, menuWidth - 10, 18);
    }
    
    p.fill(unlocked ? [255, 255, 255] : [100, 100, 100]);
    p.textSize(10);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`${attraction.name} - $${attraction.cost} (${attraction.size}x${attraction.size})`, menuX + 10, yPos);
    
    if (unlocked) {
      p.fill(150, 255, 150);
      p.text(`+$${attraction.income}/min +${attraction.satisfaction} sat`, menuX + 300, yPos);
    } else {
      p.fill(255, 100, 100);
      p.text("LOCKED - Research Required", menuX + 300, yPos);
    }
    
    yPos += 20;
    index++;
  }
  
  // Research
  p.fill(200, 200, 200);
  p.textSize(12);
  p.text("Research:", menuX + 10, yPos + 10);
  yPos += 30;
  
  for (const research of RESEARCH_TREE) {
    const researched = gameState.researchedItems.includes(research.id);
    
    if (index === gameState.menuIndex && !researched) {
      p.fill(255, 255, 0);
      p.rect(menuX + 5, yPos - 2, menuWidth - 10, 18);
    }
    
    p.fill(researched ? [100, 255, 100] : [255, 255, 255]);
    p.textSize(10);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`${research.name} - $${research.cost}`, menuX + 10, yPos);
    
    if (researched) {
      p.fill(100, 255, 100);
      p.text("COMPLETED", menuX + 300, yPos);
    } else {
      p.fill(200, 200, 200);
      p.text(`Tier ${research.tier}`, menuX + 300, yPos);
    }
    
    yPos += 20;
    index++;
  }
  
  // Mascots
  if (gameState.year >= 2) {
    p.fill(200, 200, 200);
    p.textSize(12);
    p.text("Mascots:", menuX + 10, yPos + 10);
    yPos += 30;
    
    for (const mascot of MASCOTS) {
      const recruited = gameState.mascots.some(m => m.id === mascot.id);
      
      if (index === gameState.menuIndex && !recruited) {
        p.fill(255, 255, 0);
        p.rect(menuX + 5, yPos - 2, menuWidth - 10, 18);
      }
      
      p.fill(recruited ? [100, 255, 100] : [255, 200, 255]);
      p.textSize(10);
      p.textAlign(p.LEFT, p.TOP);
      p.text(`${mascot.name} - $${mascot.cost} (+${mascot.popularity} pop)`, menuX + 10, yPos);
      
      if (recruited) {
        p.fill(100, 255, 100);
        p.text("RECRUITED", menuX + 300, yPos);
      } else {
        p.fill(200, 200, 200);
        p.text(`Theme: ${mascot.theme}`, menuX + 300, yPos);
      }
      
      yPos += 20;
      index++;
    }
  }
}

export function renderSNSFeed(p, gameState) {
  if (gameState.snsMessages.length === 0) return;
  
  const feedX = 10;
  const feedY = CANVAS_HEIGHT - 80;
  const feedWidth = 200;
  const feedHeight = 70;
  
  p.fill(30, 30, 50, 220);
  p.rect(feedX, feedY, feedWidth, feedHeight);
  
  p.fill(255, 200, 100);
  p.textSize(10);
  p.textAlign(p.LEFT, p.TOP);
  p.text("Guest Feedback:", feedX + 5, feedY + 5);
  
  p.fill(255);
  p.textSize(8);
  let msgY = feedY + 20;
  const recentMessages = gameState.snsMessages.slice(-3);
  
  for (const msg of recentMessages) {
    p.text(msg, feedX + 5, msgY);
    msgY += 12;
  }
}