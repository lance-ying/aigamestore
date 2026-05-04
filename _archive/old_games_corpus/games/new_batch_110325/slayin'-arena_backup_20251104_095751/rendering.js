// rendering.js - Rendering functions for all game states

import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_LOSE, CANVAS_WIDTH, CANVAS_HEIGHT, HERO_CLASSES } from './globals.js';
import { drawShop } from './shop.js';

export function renderGame(p) {
  // Clear background
  p.background(40, 30, 50);
  
  switch (gameState.gamePhase) {
    case PHASE_START:
      renderStartScreen(p);
      break;
    case PHASE_PLAYING:
      renderPlayingScreen(p);
      break;
    case PHASE_PAUSED:
      renderPlayingScreen(p);
      renderPauseOverlay(p);
      break;
    case PHASE_GAME_OVER_LOSE:
      renderGameOverScreen(p);
      break;
  }
}

function renderStartScreen(p) {
  // Title
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER);
  p.textSize(48);
  p.text("SLAYIN' ARENA", CANVAS_WIDTH / 2, 80);
  
  // Instructions
  p.textSize(16);
  p.fill(200, 200, 200);
  p.text("Select Your Hero", CANVAS_WIDTH / 2, 130);
  
  // Hero selection
  const heroStartX = 100;
  const heroSpacing = 80;
  
  HERO_CLASSES.forEach((heroClass, index) => {
    const x = heroStartX + index * heroSpacing;
    const y = 200;
    
    // Highlight selected hero
    if (index === gameState.selectedHeroIndex) {
      p.fill(255, 255, 100, 100);
      p.noStroke();
      p.ellipse(x, y, 70, 70);
    }
    
    // Draw hero preview
    p.fill(...heroClass.color);
    p.rect(x - 15, y - 20, 30, 40, 5);
    p.ellipse(x, y - 28, 20, 20);
    
    // Hero name
    p.fill(255, 255, 255);
    p.textSize(11);
    p.text(heroClass.name, x, y + 35);
  });
  
  // Hero stats
  const selectedHero = HERO_CLASSES[gameState.selectedHeroIndex];
  p.textSize(13);
  p.textAlign(p.LEFT);
  p.fill(200, 200, 200);
  const statsX = 150;
  const statsY = 270;
  p.text(`Health: ${selectedHero.baseHealth}`, statsX, statsY);
  p.text(`Damage: ${selectedHero.baseDamage}`, statsX, statsY + 20);
  p.text(`Speed: ${selectedHero.baseSpeed.toFixed(1)}`, statsX, statsY + 40);
  p.text(`Armor: ${selectedHero.baseArmor}`, statsX, statsY + 60);
  
  // Controls
  p.textAlign(p.CENTER);
  p.fill(255, 255, 200);
  p.textSize(14);
  p.text("Arrow Keys: Select Hero | Space: Confirm", CANVAS_WIDTH / 2, 350);
  p.textSize(18);
  p.fill(100, 255, 100);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 380);
}

function renderPlayingScreen(p) {
  // Draw ground
  p.fill(60, 50, 40);
  p.noStroke();
  p.rect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 50);
  
  // Draw background elements
  drawBackground(p);
  
  // Draw merchant
  if (gameState.merchant) {
    gameState.merchant.draw(p);
  }
  
  // Draw particles
  gameState.particles.forEach(particle => particle.draw(p));
  
  // Draw enemies
  gameState.enemies.forEach(enemy => enemy.draw(p));
  
  // Draw player
  if (gameState.player) {
    gameState.player.draw(p);
  }
  
  // Draw UI
  drawUI(p);
  
  // Draw shop if open
  if (gameState.shopOpen) {
    drawShop(p);
  }
}

function drawBackground(p) {
  // Sky gradient effect
  for (let i = 0; i < CANVAS_HEIGHT - 50; i++) {
    const inter = i / (CANVAS_HEIGHT - 50);
    const c = p.lerpColor(p.color(60, 40, 80), p.color(30, 20, 40), inter);
    p.stroke(c);
    p.line(0, i, CANVAS_WIDTH, i);
  }
  
  // Stars
  p.fill(255, 255, 200);
  p.noStroke();
  for (let i = 0; i < 50; i++) {
    const x = (i * 73) % CANVAS_WIDTH;
    const y = (i * 41) % (CANVAS_HEIGHT - 50);
    p.ellipse(x, y, 2, 2);
  }
}

function drawUI(p) {
  if (!gameState.player) return;
  
  // Top bar background
  p.fill(20, 15, 25, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 40);
  
  // Player stats
  p.fill(255, 255, 255);
  p.textAlign(p.LEFT);
  p.textSize(14);
  p.text(`Level: ${gameState.player.level}`, 10, 20);
  p.text(`HP: ${Math.floor(gameState.player.health)}/${gameState.player.maxHealth}`, 10, 35);
  
  // Experience bar
  const expBarX = 100;
  const expBarY = 15;
  const expBarWidth = 150;
  const expBarHeight = 12;
  p.fill(50);
  p.rect(expBarX, expBarY, expBarWidth, expBarHeight);
  p.fill(100, 200, 255);
  const expPercent = gameState.player.experience / gameState.player.experienceToNextLevel;
  p.rect(expBarX, expBarY, expBarWidth * expPercent, expBarHeight);
  
  // Score and coins
  p.textAlign(p.RIGHT);
  p.fill(255, 220, 100);
  p.text(`Coins: ${gameState.coins}`, CANVAS_WIDTH - 10, 20);
  p.fill(255, 255, 255);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 35);
  
  // Survival time
  p.textAlign(p.CENTER);
  p.fill(200, 200, 200);
  p.textSize(12);
  p.text(`Time: ${Math.floor(gameState.survivalTime)}s`, CANVAS_WIDTH / 2, 25);
}

function renderPauseOverlay(p) {
  p.fill(255, 255, 255);
  p.textAlign(p.RIGHT);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 60);
}

function renderGameOverScreen(p) {
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 100, 100);
  p.textAlign(p.CENTER);
  p.textSize(48);
  p.text("GAME OVER", CANVAS_WIDTH / 2, 150);
  
  p.fill(255, 255, 255);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 200);
  p.text(`Enemies Slain: ${gameState.enemiesKilled}`, CANVAS_WIDTH / 2, 230);
  p.text(`Survival Time: ${Math.floor(gameState.survivalTime)}s`, CANVAS_WIDTH / 2, 260);
  p.text(`Level Reached: ${gameState.player ? gameState.player.level : 1}`, CANVAS_WIDTH / 2, 290);
  
  p.fill(200, 200, 255);
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 350);
}