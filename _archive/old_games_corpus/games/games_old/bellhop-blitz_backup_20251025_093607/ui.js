// ui.js - UI rendering and upgrade menu
import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER, PHASE_LEVEL_COMPLETE, PHASE_WIN_GAME, getCurrentLevelConfig } from './globals.js';

export function drawUI(p) {
  if (gameState.gamePhase === PHASE_START) {
    drawStartScreen(p);
  } else if (gameState.gamePhase === PHASE_PLAYING) {
    drawGameUI(p);
  } else if (gameState.gamePhase === PHASE_PAUSED) {
    drawGameUI(p);
    drawPauseOverlay(p);
  } else if (gameState.gamePhase === PHASE_GAME_OVER) {
    drawGameOverScreen(p);
  } else if (gameState.gamePhase === PHASE_LEVEL_COMPLETE) {
    drawLevelCompleteScreen(p);
  } else if (gameState.gamePhase === PHASE_WIN_GAME) {
    drawWinScreen(p);
  }
}

function drawStartScreen(p) {
  p.push();
  p.fill(40, 40, 60);
  p.rect(0, 0, 600, 400);

  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('BELLHOP BLITZ', 300, 100);

  p.fill(200);
  p.textSize(16);
  p.text('Manage your hotel efficiently!', 300, 160);
  p.text('Clean rooms, check in guests, collect payments.', 300, 185);

  p.textSize(14);
  p.fill(180);
  p.text('CONTROLS:', 300, 230);
  p.text('Arrow Keys / WASD: Move', 300, 250);
  p.text('Space: Interact', 300, 270);
  p.text('Shift: Upgrades', 300, 290);
  p.text('ESC: Pause | R: Restart', 300, 310);

  p.fill(100, 255, 100);
  p.textSize(20);
  p.text('PRESS ENTER TO START', 300, 360);

  p.pop();
}

function drawGameUI(p) {
  p.push();
  
  // Score
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(18);
  p.text(`Score: ${gameState.score}`, 10, 10);
  
  p.textSize(14);
  p.fill(200);
  p.text(`High: ${gameState.highScore}`, 10, 32);

  // Level
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(18);
  p.text(`Level: ${gameState.currentLevel}`, 590, 10);

  const config = getCurrentLevelConfig();
  p.textSize(14);
  p.fill(200);
  p.text(config.name, 590, 32);

  // Money and Timer
  p.textAlign(p.CENTER, p.TOP);
  p.fill(255, 220, 0);
  p.textSize(20);
  p.text(`$${gameState.currentMoney}`, 300, 10);

  const elapsed = Math.floor((Date.now() - gameState.levelStartTime) / 1000);
  const remaining = Math.max(0, config.timeLimit - elapsed);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  p.fill(255);
  p.text(`${mins}:${secs.toString().padStart(2, '0')}`, 300, 35);

  // Targets
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.fill(200);
  p.text(`Target: $${config.revenueTarget}`, 10, 55);
  p.text(`Unhappy: ${gameState.unhappyGuestCount}/5`, 10, 70);

  p.pop();
}

function drawPauseOverlay(p) {
  p.push();
  
  if (gameState.upgrades.showMenu) {
    drawUpgradeMenu(p);
  } else {
    p.fill(255);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.text('PAUSED', 590, 60);
  }

  p.pop();
}

function drawUpgradeMenu(p) {
  p.push();
  
  p.fill(30, 30, 40, 230);
  p.rect(100, 80, 400, 280);

  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(24);
  p.text('UPGRADES', 300, 95);

  p.fill(255);
  p.textSize(16);
  p.text(`Money: $${gameState.currentMoney}`, 300, 125);

  const config = getCurrentLevelConfig();
  const upgrades = config.upgrades;
  
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  
  let yOffset = 155;
  for (let i = 0; i < upgrades.length; i++) {
    const upg = upgrades[i];
    const purchased = gameState.upgrades.purchased?.[upg.id];
    
    p.fill(...(purchased ? [100, 100, 100] : gameState.currentMoney >= upg.cost ? [100, 200, 100] : [200, 100, 100]));
    p.rect(120, yOffset, 360, 30);
    
    p.fill(255);
    p.text(upg.name, 130, yOffset + 8);
    p.text(`$${upg.cost}`, 420, yOffset + 8);
    
    if (purchased) {
      p.fill(100, 255, 100);
      p.text('✓', 460, yOffset + 8);
    }
    
    yOffset += 40;
  }

  p.fill(200);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(12);
  p.text('Press number keys 1-4 to purchase', 300, 325);
  p.text('Press Shift again to close', 300, 342);

  p.pop();
}

function drawGameOverScreen(p) {
  p.push();
  
  p.fill(60, 30, 30, 200);
  p.rect(0, 0, 600, 400);

  p.fill(255, 100, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('GAME OVER', 300, 150);

  p.fill(200);
  p.textSize(18);
  const reason = gameState.unhappyGuestCount >= 5 ? 
    'Too many unhappy guests!' : 'Time expired!';
  p.text(reason, 300, 210);

  p.textSize(20);
  p.text(`Final Score: ${gameState.score}`, 300, 250);

  p.fill(255, 220, 100);
  p.textSize(18);
  p.text('PRESS R TO RESTART', 300, 320);

  p.pop();
}

function drawLevelCompleteScreen(p) {
  p.push();
  
  p.fill(30, 60, 30, 200);
  p.rect(0, 0, 600, 400);

  p.fill(100, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('LEVEL COMPLETE!', 300, 120);

  p.fill(200);
  p.textSize(18);
  const config = getCurrentLevelConfig();
  p.text(`Revenue: $${gameState.totalRevenueEarned}`, 300, 190);
  p.text(`Score: ${gameState.score}`, 300, 220);

  const elapsed = Math.floor((Date.now() - gameState.levelStartTime) / 1000);
  const remaining = Math.max(0, config.timeLimit - elapsed);
  const timeBonus = remaining * 5;
  p.text(`Time Bonus: +${timeBonus}`, 300, 250);

  p.fill(255, 220, 100);
  p.textSize(18);
  p.text('PRESS ENTER FOR NEXT LEVEL', 300, 320);
  p.textSize(14);
  p.fill(180);
  p.text('or R to return to menu', 300, 345);

  p.pop();
}

function drawWinScreen(p) {
  p.push();
  
  p.fill(30, 30, 60, 200);
  p.rect(0, 0, 600, 400);

  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text('CONGRATULATIONS!', 300, 120);

  p.textSize(20);
  p.fill(200);
  p.text("You've built a 5-star hotel empire!", 300, 180);

  p.textSize(24);
  p.fill(255);
  p.text(`Final Score: ${gameState.score}`, 300, 230);

  p.fill(255, 220, 100);
  p.textSize(18);
  p.text('PRESS R TO RETURN TO MENU', 300, 320);

  p.pop();
}

export function drawFloatingTexts(p) {
  for (let i = gameState.floatingTexts.length - 1; i >= 0; i--) {
    const ft = gameState.floatingTexts[i];
    ft.y -= 0.5;
    ft.life--;
    ft.alpha = (ft.life / 60) * 255;

    p.push();
    p.fill(255, 220, 100, ft.alpha);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text(ft.text, ft.x, ft.y);
    p.pop();

    if (ft.life <= 0) {
      gameState.floatingTexts.splice(i, 1);
    }
  }
}