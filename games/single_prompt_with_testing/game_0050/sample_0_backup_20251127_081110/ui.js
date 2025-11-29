// ui.js - UI rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';
import { renderEvolutionMenu } from './evolution.js';

export function renderStartScreen(p) {
  p.background(20, 10, 10);
  
  // Biohazard background pattern
  for (let i = 0; i < 5; i++) {
    p.push();
    p.translate(p.random(CANVAS_WIDTH), p.random(CANVAS_HEIGHT));
    p.rotate(p.random(p.TWO_PI));
    p.noFill();
    p.stroke(100, 20, 20, 50);
    p.strokeWeight(2);
    drawBiohazard(p, 0, 0, 40);
    p.pop();
  }
  
  // Title
  p.fill(200, 50, 50);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text('PLAGUE EVOLUTION', CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(255, 100, 100);
  p.textSize(16);
  p.text('End Humanity. Evolve Your Pathogen.', CANVAS_WIDTH / 2, 120);
  
  // Description
  p.fill(200);
  p.textSize(12);
  const desc = [
    'Your pathogen has infected Patient Zero.',
    'Spread across the globe and eliminate humanity',
    'before they develop a cure.',
    '',
    'Balance infectivity, severity, and lethality.',
    'Evolve transmissions, symptoms, and abilities.'
  ];
  
  for (let i = 0; i < desc.length; i++) {
    p.text(desc[i], CANVAS_WIDTH / 2, 160 + i * 18);
  }
  
  // Controls
  p.fill(150, 150, 200);
  p.textSize(11);
  const controls = [
    'Arrow Keys: Navigate menu',
    'Space: Purchase evolution',
    'Shift: Speed up time',
    'Z: Toggle info panel',
    'ESC: Pause'
  ];
  
  for (let i = 0; i < controls.length; i++) {
    p.text(controls[i], CANVAS_WIDTH / 2, 280 + i * 16);
  }
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textSize(18);
  const pulse = p.sin(gameState.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(255, 255, 100, pulse * 255);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}

export function renderPlayingScreen(p) {
  p.background(15, 15, 25);
  
  // Draw world connections
  renderWorldConnections(p);
  
  // Draw countries
  for (let i = 0; i < gameState.countries.length; i++) {
    const country = gameState.countries[i];
    const isSelected = i === gameState.selectedCountryIndex;
    country.render(p, isSelected);
  }
  
  // Draw DNA bubbles
  for (let i = gameState.dnaBubbles.length - 1; i >= 0; i--) {
    const bubble = gameState.dnaBubbles[i];
    renderDNABubble(p, bubble);
    
    bubble.age++;
    bubble.pulse += 0.1;
    
    if (bubble.age >= bubble.lifetime) {
      gameState.dnaBubbles.splice(i, 1);
    }
  }
  
  // Draw HUD
  renderHUD(p);
  
  // Draw info panel if open
  if (gameState.showInfoPanel) {
    renderInfoPanel(p);
  }
  
  // Draw evolution menu if open
  if (gameState.evolutionMenuOpen) {
    renderEvolutionMenu(p);
  }
}

export function renderHUD(p) {
  // Top bar background
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 50);
  
  // DNA Points
  p.fill(255, 200, 50);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text(`DNA: ${gameState.dnaPoints}`, 10, 10);
  
  // Stats
  p.fill(255, 100, 100);
  p.text(`Infectivity: ${gameState.infectivity}`, 10, 28);
  
  p.fill(255, 150, 50);
  p.text(`Severity: ${gameState.severity}`, 120, 28);
  
  p.fill(200, 50, 50);
  p.text(`Lethality: ${gameState.lethality}`, 240, 28);
  
  // Population stats
  const infectedPercent = ((gameState.infectedPopulation / gameState.totalPopulation) * 100).toFixed(1);
  const deadPercent = ((gameState.deadPopulation / gameState.totalPopulation) * 100).toFixed(1);
  
  p.fill(255, 200, 100);
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`Infected: ${infectedPercent}%`, CANVAS_WIDTH - 10, 10);
  
  p.fill(200, 100, 100);
  p.text(`Dead: ${deadPercent}%`, CANVAS_WIDTH - 10, 28);
  
  // Cure progress bar
  const barX = 10;
  const barY = CANVAS_HEIGHT - 30;
  const barWidth = CANVAS_WIDTH - 20;
  const barHeight = 20;
  
  p.fill(50, 50, 50);
  p.rect(barX, barY, barWidth, barHeight);
  
  p.fill(100, 150, 255);
  p.rect(barX, barY, barWidth * (gameState.cureProgress / 100), barHeight);
  
  p.stroke(150, 150, 200);
  p.strokeWeight(2);
  p.noFill();
  p.rect(barX, barY, barWidth, barHeight);
  
  p.fill(255);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(12);
  p.text(`Cure Research: ${gameState.cureProgress.toFixed(1)}%`, CANVAS_WIDTH / 2, barY + barHeight / 2);
  
  // Controls hint
  p.fill(150);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.textSize(10);
  p.text('Z: Evolution Menu | Shift: Speed Up', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 35);
}

export function renderInfoPanel(p) {
  const country = gameState.countries[gameState.selectedCountryIndex];
  if (!country) return;
  
  const panelX = 400;
  const panelY = 80;
  const panelW = 180;
  const panelH = 150;
  
  p.fill(0, 0, 0, 220);
  p.stroke(200, 100, 100);
  p.strokeWeight(2);
  p.rect(panelX, panelY, panelW, panelH);
  
  p.fill(255, 200, 100);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text(country.name, panelX + 10, panelY + 10);
  
  p.fill(200);
  p.textSize(11);
  const popM = (country.population / 1000000).toFixed(1);
  p.text(`Population: ${popM}M`, panelX + 10, panelY + 30);
  
  const infectedM = (country.infected / 1000000).toFixed(2);
  p.text(`Infected: ${infectedM}M`, panelX + 10, panelY + 48);
  
  const deadM = (country.dead / 1000000).toFixed(2);
  p.text(`Dead: ${deadM}M`, panelX + 10, panelY + 66);
  
  const healthyM = (country.healthy / 1000000).toFixed(2);
  p.text(`Healthy: ${healthyM}M`, panelX + 10, panelY + 84);
  
  p.fill(150, 200, 255);
  p.text(`Climate: ${country.climate}`, panelX + 10, panelY + 102);
  
  // Infection bar
  const barY = panelY + 125;
  const barW = panelW - 20;
  p.fill(50);
  p.rect(panelX + 10, barY, barW, 10);
  
  const infectionPercent = country.infected / country.population;
  p.fill(255, 100, 100);
  p.rect(panelX + 10, barY, barW * infectionPercent, 10);
}

export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  p.textSize(18);
  p.text('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

export function renderGameOverScreen(p) {
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  const isWin = gameState.gamePhase === PHASE_GAME_OVER_WIN;
  
  if (isWin) {
    p.fill(200, 50, 50);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text('HUMANITY EXTINCT', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
    
    p.fill(255, 100, 100);
    p.textSize(24);
    p.text('Your plague has conquered the world!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  } else {
    p.fill(100, 150, 255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text('CURE DEVELOPED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
    
    p.fill(150, 200, 255);
    p.textSize(24);
    p.text('Humanity has survived...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  }
  
  // Stats
  p.fill(255);
  p.textSize(16);
  const deadPercent = ((gameState.deadPopulation / gameState.totalPopulation) * 100).toFixed(1);
  const infectedPercent = ((gameState.infectedPopulation / gameState.totalPopulation) * 100).toFixed(1);
  
  p.text(`Total Deaths: ${deadPercent}%`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  p.text(`Total Infected: ${infectedPercent}%`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 45);
  p.text(`DNA Points Earned: ${gameState.dnaPoints}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
  
  // Restart
  p.fill(255, 255, 100);
  p.textSize(20);
  p.text('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
}

function renderWorldConnections(p) {
  p.stroke(50, 50, 70, 100);
  p.strokeWeight(1);
  
  for (const country of gameState.countries) {
    for (const neighborIndex of country.neighbors) {
      const neighbor = gameState.countries[neighborIndex];
      if (neighbor) {
        p.line(country.x, country.y, neighbor.x, neighbor.y);
      }
    }
  }
}

function renderDNABubble(p, bubble) {
  const size = bubble.radius + p.sin(bubble.pulse) * 2;
  
  p.fill(255, 150, 50, 200);
  p.stroke(255, 200, 100);
  p.strokeWeight(2);
  p.circle(bubble.x, bubble.y, size * 2);
  
  p.fill(255);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(10);
  p.text(bubble.value, bubble.x, bubble.y);
}

function drawBiohazard(p, x, y, size) {
  p.push();
  p.translate(x, y);
  
  // Draw biohazard symbol
  for (let i = 0; i < 3; i++) {
    p.rotate(p.TWO_PI / 3);
    p.ellipse(0, -size * 0.4, size * 0.5, size * 0.5);
  }
  
  p.circle(0, 0, size * 0.3);
  
  p.pop();
}