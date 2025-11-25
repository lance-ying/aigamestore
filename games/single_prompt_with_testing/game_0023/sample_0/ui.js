// ui.js - UI rendering functions

import { 
  gameState, CANVAS_WIDTH, CANVAS_HEIGHT,
  PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE,
  STATE_MAIN_MENU, STATE_CREATING_GAME, STATE_ALLOCATING_POINTS, STATE_DEVELOPING, 
  STATE_REVIEWING, STATE_RESEARCH_MENU, STATE_VIEW_STATS
} from './globals.js';

export function drawStartScreen(p) {
  p.background(20, 20, 40);
  
  // Title with glow effect
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(100, 150, 255, 100);
  p.textSize(48);
  p.text("GAME DEV TYCOON", CANVAS_WIDTH / 2 + 2, 80 + 2);
  p.fill(150, 200, 255);
  p.text("GAME DEV TYCOON", CANVAS_WIDTH / 2, 80);
  
  // Description
  p.fill(200, 200, 220);
  p.textSize(14);
  p.text("Build your game development empire!", CANVAS_WIDTH / 2, 140);
  p.text("Start in the 1980s and create hit games.", CANVAS_WIDTH / 2, 160);
  
  // Instructions
  p.fill(180, 180, 200);
  p.textSize(12);
  p.text("OBJECTIVE:", CANVAS_WIDTH / 2, 200);
  p.text("Reach $50,000 while maintaining your reputation", CANVAS_WIDTH / 2, 220);
  
  p.text("CONTROLS:", CANVAS_WIDTH / 2, 250);
  p.textSize(11);
  p.text("Arrow Keys: Navigate menus", CANVAS_WIDTH / 2, 270);
  p.text("Space: Select / Confirm", CANVAS_WIDTH / 2, 285);
  p.text("Z: Fast-forward development", CANVAS_WIDTH / 2, 300);
  p.text("Shift: View stats (hold)", CANVAS_WIDTH / 2, 315);
  p.text("ESC: Pause", CANVAS_WIDTH / 2, 330);
  
  // Start prompt (pulsing)
  const pulse = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(255, 255, 100, pulse * 255);
  p.textSize(16);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
  
  // Decorative elements
  drawDecorativeComputers(p);
}

function drawDecorativeComputers(p) {
  // Draw small computers in corners
  for (let i = 0; i < 3; i++) {
    const x = 50 + i * 250;
    const y = 100;
    
    p.push();
    p.translate(x, y);
    
    // Monitor
    p.fill(40, 40, 60);
    p.rect(-20, -15, 40, 30);
    p.fill(60, 100, 120);
    p.rect(-17, -12, 34, 24);
    
    // Base
    p.fill(40, 40, 60);
    p.rect(-10, 16, 20, 5);
    
    p.pop();
  }
}

export function drawPlayingScreen(p) {
  p.background(30, 30, 50);
  
  // Draw based on current playing state
  switch (gameState.playingState) {
    case STATE_MAIN_MENU:
      drawMainMenu(p);
      break;
    case STATE_CREATING_GAME:
      drawGameCreationMenu(p);
      break;
    case STATE_ALLOCATING_POINTS:
      drawAllocationMenu(p);
      break;
    case STATE_DEVELOPING:
      drawDevelopmentScreen(p);
      break;
    case STATE_REVIEWING:
      drawReviewScreen(p);
      break;
    case STATE_RESEARCH_MENU:
      drawResearchMenu(p);
      break;
  }
  
  // Always draw status bar
  drawStatusBar(p);
  
  // Draw stats overlay if holding Shift
  if (gameState.showingStats) {
    drawStatsOverlay(p);
  }
}

function drawStatusBar(p) {
  p.fill(20, 20, 30, 230);
  p.rect(0, 0, CANVAS_WIDTH, 40);
  
  p.fill(255, 215, 0);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(14);
  p.text(`$${gameState.money}`, 10, 20);
  
  p.fill(150, 200, 255);
  p.text(`Rep: ${Math.floor(gameState.reputation)}`, 120, 20);
  
  p.fill(200, 200, 200);
  p.text(`Week ${gameState.week}, ${gameState.year}`, 240, 20);
  
  p.fill(180, 180, 200);
  p.textSize(12);
  p.text(`Games: ${gameState.gamesCreated}`, 400, 20);
  
  p.fill(150, 150, 170);
  p.textSize(10);
  p.textAlign(p.RIGHT, p.CENTER);
  p.text("[Shift] Stats", CANVAS_WIDTH - 10, 20);
}

function drawMainMenu(p) {
  p.fill(200, 200, 220);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.text("MAIN MENU", CANVAS_WIDTH / 2, 80);
  
  const menuOptions = ["Create New Game", "Research Technology", "View Statistics"];
  
  for (let i = 0; i < menuOptions.length; i++) {
    const y = 150 + i * 60;
    const isSelected = gameState.menuSelection === i;
    
    // Selection box
    if (isSelected) {
      p.fill(100, 150, 255, 100);
      p.rect(CANVAS_WIDTH / 2 - 150, y - 20, 300, 40);
    }
    
    // Text
    p.fill(isSelected ? [255, 255, 255] : [180, 180, 200]);
    p.textSize(16);
    p.text(menuOptions[i], CANVAS_WIDTH / 2, y);
  }
  
  // Instructions
  p.fill(150, 150, 170);
  p.textSize(12);
  p.text("Arrow Keys to navigate, Space to select", CANVAS_WIDTH / 2, 350);
  
  // Draw player character
  if (gameState.player) {
    gameState.player.x = 100;
    gameState.player.y = 200;
    gameState.player.draw(p);
  }
}

function drawGameCreationMenu(p) {
  p.fill(200, 200, 220);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.text("SELECT GAME TYPE", CANVAS_WIDTH / 2, 60);
  
  const availableTypes = gameState.gameTypes.filter(gt => gt.unlocked);
  
  let displayIndex = 0;
  for (let i = 0; i < gameState.gameTypes.length; i++) {
    if (!gameState.gameTypes[i].unlocked) continue;
    
    const y = 120 + displayIndex * 50;
    const isSelected = gameState.menuSelection === displayIndex;
    
    if (isSelected) {
      p.fill(100, 150, 255, 100);
      p.rect(CANVAS_WIDTH / 2 - 120, y - 18, 240, 36);
    }
    
    p.fill(isSelected ? [255, 255, 255] : [180, 180, 200]);
    p.textSize(16);
    p.text(gameState.gameTypes[i].name, CANVAS_WIDTH / 2, y);
    
    displayIndex++;
  }
  
  p.fill(150, 150, 170);
  p.textSize(12);
  p.text("Space to select, ESC to cancel", CANVAS_WIDTH / 2, 360);
  
  p.fill(255, 200, 100);
  p.textSize(11);
  p.text("Base Cost: $500 + development points", CANVAS_WIDTH / 2, 380);
}

function drawAllocationMenu(p) {
  p.fill(200, 200, 220);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.text("ALLOCATE DEVELOPMENT POINTS", CANVAS_WIDTH / 2, 60);
  
  p.fill(180, 180, 200);
  p.textSize(14);
  p.text(`Creating: ${gameState.currentGame.type} Game`, CANVAS_WIDTH / 2, 90);
  
  const categories = [
    { name: "Design", points: gameState.designPoints, color: [255, 100, 100] },
    { name: "Technology", points: gameState.techPoints, color: [100, 255, 100] },
    { name: "Marketing", points: gameState.marketingPoints, color: [100, 100, 255] }
  ];
  
  const remaining = gameState.totalPointsAvailable - 
    (gameState.designPoints + gameState.techPoints + gameState.marketingPoints);
  
  p.fill(255, 215, 0);
  p.textSize(16);
  p.text(`Points Remaining: ${remaining}`, CANVAS_WIDTH / 2, 120);
  
  for (let i = 0; i < categories.length; i++) {
    const y = 170 + i * 70;
    const isSelected = gameState.allocationFocus === i;
    
    if (isSelected) {
      p.fill(100, 150, 255, 80);
      p.rect(150, y - 25, 300, 50);
    }
    
    // Category name
    p.fill(...categories[i].color);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(14);
    p.text(categories[i].name, 160, y - 10);
    
    // Points
    p.fill(255, 255, 255);
    p.textAlign(p.RIGHT, p.CENTER);
    p.text(categories[i].points, 430, y - 10);
    
    // Bar
    const barWidth = (categories[i].points / gameState.totalPointsAvailable) * 270;
    p.fill(...categories[i].color);
    p.rect(160, y + 5, barWidth, 15);
    p.noFill();
    p.stroke(...categories[i].color);
    p.rect(160, y + 5, 270, 15);
  }
  
  // Instructions
  p.fill(150, 150, 170);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(12);
  p.text("Arrow Up/Down: Select category", CANVAS_WIDTH / 2, 360);
  p.text("Arrow Left/Right: Adjust points (-10/+10)", CANVAS_WIDTH / 2, 375);
  p.text("Space: Confirm and start development", CANVAS_WIDTH / 2, 390);
  
  // Cost estimate
  const estimatedCost = 500 + gameState.designPoints * 2 + 
    gameState.techPoints * 2 + gameState.marketingPoints * 2;
  p.fill(255, 200, 100);
  p.textSize(11);
  p.text(`Estimated Cost: $${estimatedCost}`, CANVAS_WIDTH / 2, 340);
}

function drawDevelopmentScreen(p) {
  p.fill(200, 200, 220);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.text("DEVELOPING GAME...", CANVAS_WIDTH / 2, 80);
  
  const game = gameState.gameInDevelopment;
  p.fill(180, 180, 200);
  p.textSize(16);
  p.text(`${game.type} Game`, CANVAS_WIDTH / 2, 120);
  
  // Progress bar
  const progress = gameState.developmentProgress / gameState.developmentDuration;
  p.fill(50, 50, 70);
  p.rect(150, 180, 300, 30);
  
  p.fill(100, 200, 100);
  p.rect(150, 180, 300 * progress, 30);
  
  p.fill(255, 255, 255);
  p.textSize(14);
  p.text(`${Math.floor(progress * 100)}%`, CANVAS_WIDTH / 2, 195);
  
  // Development stages
  const stages = ["Planning", "Coding", "Testing", "Polishing"];
  const currentStage = Math.min(3, Math.floor(progress * 4));
  
  for (let i = 0; i < stages.length; i++) {
    const y = 240 + i * 30;
    const completed = i < currentStage;
    const current = i === currentStage;
    
    p.fill(completed ? [100, 255, 100] : current ? [255, 215, 0] : [100, 100, 120]);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(12);
    p.text(`${completed ? "✓" : current ? "→" : "○"} ${stages[i]}`, 180, y);
  }
  
  // Show allocation breakdown
  p.fill(180, 180, 200);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(12);
  p.text(`Design: ${game.design} | Tech: ${game.tech} | Marketing: ${game.marketing}`, 
    CANVAS_WIDTH / 2, 360);
  
  // Fast forward hint
  p.fill(150, 150, 170);
  p.textSize(11);
  const ffText = gameState.fastForward ? "[Z] Fast-forwarding..." : "[Z] Hold to fast-forward";
  p.text(ffText, CANVAS_WIDTH / 2, 385);
}

function drawReviewScreen(p) {
  p.fill(200, 200, 220);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.text("GAME RELEASED!", CANVAS_WIDTH / 2, 70);
  
  const game = gameState.currentGame;
  
  p.fill(180, 180, 200);
  p.textSize(18);
  p.text(`${game.type} Game`, CANVAS_WIDTH / 2, 110);
  
  // Review score with star rating
  p.fill(255, 215, 0);
  p.textSize(48);
  p.text(Math.floor(game.score), CANVAS_WIDTH / 2, 170);
  
  p.fill(200, 200, 220);
  p.textSize(14);
  p.text("/ 100", CANVAS_WIDTH / 2, 195);
  
  // Stars
  const stars = Math.floor(game.score / 20);
  let starX = CANVAS_WIDTH / 2 - stars * 15;
  p.fill(255, 215, 0);
  p.textSize(24);
  for (let i = 0; i < stars; i++) {
    p.text("★", starX, 220);
    starX += 30;
  }
  
  // Review text
  p.fill(180, 180, 200);
  p.textSize(12);
  p.text(gameState.reviewText, CANVAS_WIDTH / 2, 260);
  
  // Financial results
  p.fill(100, 255, 100);
  p.textSize(16);
  p.text(`Revenue: $${game.revenue}`, CANVAS_WIDTH / 2, 300);
  
  p.fill(255, 100, 100);
  p.text(`Cost: $${game.developmentCost}`, CANVAS_WIDTH / 2, 325);
  
  const profit = game.revenue - game.developmentCost;
  p.fill(profit >= 0 ? [100, 255, 100] : [255, 100, 100]);
  p.text(`Profit: $${profit}`, CANVAS_WIDTH / 2, 350);
  
  // Continue prompt
  p.fill(150, 150, 170);
  p.textSize(12);
  p.text("Press Space to continue", CANVAS_WIDTH / 2, 385);
}

function drawResearchMenu(p) {
  p.fill(200, 200, 220);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.text("RESEARCH TECHNOLOGY", CANVAS_WIDTH / 2, 60);
  
  p.fill(180, 180, 200);
  p.textSize(12);
  p.text("Unlock new game types and improve your capabilities", CANVAS_WIDTH / 2, 85);
  
  const availableTech = gameState.technologies.filter(t => !t.researched);
  
  if (availableTech.length === 0) {
    p.fill(100, 255, 100);
    p.textSize(16);
    p.text("All technologies researched!", CANVAS_WIDTH / 2, 200);
    
    p.fill(150, 150, 170);
    p.textSize(12);
    p.text("Press Space to return", CANVAS_WIDTH / 2, 380);
    return;
  }
  
  let displayIndex = 0;
  for (let i = 0; i < gameState.technologies.length; i++) {
    const tech = gameState.technologies[i];
    if (tech.researched) continue;
    
    const y = 130 + displayIndex * 70;
    const isSelected = gameState.menuSelection === displayIndex;
    const canAfford = gameState.money >= tech.cost;
    
    if (isSelected) {
      p.fill(100, 150, 255, 100);
      p.rect(100, y - 25, 400, 60);
    }
    
    // Tech name
    p.fill(canAfford ? (isSelected ? [255, 255, 255] : [200, 200, 220]) : [120, 120, 140]);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(14);
    p.text(tech.name, 120, y - 5);
    
    // Cost
    p.fill(canAfford ? [255, 215, 0] : [150, 100, 100]);
    p.textAlign(p.RIGHT, p.CENTER);
    p.text(`$${tech.cost}`, 480, y - 5);
    
    // Unlocks
    p.fill(100, 200, 255);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(11);
    p.text(`Unlocks: ${tech.unlocks}`, 120, y + 15);
    
    displayIndex++;
  }
  
  p.fill(150, 150, 170);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(12);
  p.text("Arrow Keys to navigate, Space to research, ESC to cancel", CANVAS_WIDTH / 2, 380);
}

function drawStatsOverlay(p) {
  p.fill(0, 0, 0, 200);
  p.rect(50, 50, CANVAS_WIDTH - 100, CANVAS_HEIGHT - 100);
  
  p.fill(255, 255, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  p.text("STATISTICS", CANVAS_WIDTH / 2, 75);
  
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(12);
  p.fill(200, 200, 220);
  
  const stats = [
    `Money: $${gameState.money}`,
    `Reputation: ${Math.floor(gameState.reputation)}`,
    `Games Created: ${gameState.gamesCreated}`,
    `Current Date: Week ${gameState.week}, ${gameState.year}`,
    ``,
    `Technologies Researched: ${gameState.technologies.filter(t => t.researched).length}/${gameState.technologies.length}`,
    `Game Types Unlocked: ${gameState.gameTypes.filter(t => t.unlocked).length}/${gameState.gameTypes.length}`,
    ``,
    `Recent Games:`
  ];
  
  let y = 105;
  for (const stat of stats) {
    p.text(stat, 80, y);
    y += 18;
  }
  
  // Show last 5 games
  const recentGames = gameState.completedGames.slice(-5);
  for (const game of recentGames) {
    p.fill(180, 180, 200);
    p.textSize(11);
    p.text(`  ${game.type} - Score: ${Math.floor(game.score)} - Profit: $${game.revenue - game.developmentCost}`, 
      80, y);
    y += 16;
  }
  
  p.fill(150, 150, 170);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(11);
  p.text("Release Shift to close", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 70);
}

export function drawPausedScreen(p) {
  // Draw the game state in background
  drawPlayingScreen(p);
  
  // Overlay
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 255, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  p.textSize(14);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  
  // Small indicator in top right
  p.fill(255, 255, 100);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(12);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

export function drawGameOverScreen(p) {
  p.background(20, 20, 40);
  
  const isWin = gameState.gamePhase === PHASE_GAME_OVER_WIN;
  
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "SUCCESS!" : "GAME OVER", CANVAS_WIDTH / 2, 100);
  
  p.fill(200, 200, 220);
  p.textSize(18);
  if (isWin) {
    p.text("You've built a successful game company!", CANVAS_WIDTH / 2, 160);
  } else {
    p.text("Your company has failed...", CANVAS_WIDTH / 2, 160);
  }
  
  // Stats
  p.fill(180, 180, 200);
  p.textSize(14);
  p.text(`Final Money: $${gameState.money}`, CANVAS_WIDTH / 2, 210);
  p.text(`Final Reputation: ${Math.floor(gameState.reputation)}`, CANVAS_WIDTH / 2, 235);
  p.text(`Games Created: ${gameState.gamesCreated}`, CANVAS_WIDTH / 2, 260);
  p.text(`Final Year: ${gameState.year}`, CANVAS_WIDTH / 2, 285);
  
  // Restart prompt
  const pulse = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(255, 255, 100, pulse * 255);
  p.textSize(16);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 350);
  
  // Draw confetti for win
  if (isWin && gameState.entities) {
    for (const entity of gameState.entities) {
      if (entity.draw && entity !== gameState.player) {
        entity.draw(p);
      }
    }
  }
}