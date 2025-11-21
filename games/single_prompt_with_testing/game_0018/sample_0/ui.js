// ui.js - UI rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 30, 50);
  
  // Title
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("EXTREME LANDINGS PRO", CANVAS_WIDTH / 2, 80);
  
  // Instructions
  p.textSize(14);
  p.fill(200);
  p.text("Navigate your aircraft to a safe landing", CANVAS_WIDTH / 2, 140);
  p.text("Manage systems and respond to emergencies", CANVAS_WIDTH / 2, 165);
  
  // Controls
  p.textSize(12);
  p.textAlign(p.LEFT);
  p.fill(180);
  p.text("W/S: Pitch Control", 50, 220);
  p.text("A/D: Roll Control", 50, 240);
  p.text("←/→: Rudder", 50, 260);
  p.text("↑/↓: Throttle", 50, 280);
  
  p.text("SPACE: Landing Gear", 320, 220);
  p.text("SHIFT: Flaps", 320, 240);
  p.text("Z: Spoilers", 320, 260);
  
  // Start prompt
  p.textAlign(p.CENTER);
  p.textSize(16);
  p.fill(100, 255, 100);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 340);
}

export function renderHUD(p) {
  // Background panel
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 80);
  
  // Primary Flight Display (left side)
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.LEFT);
  
  // Altitude
  p.text(`ALT: ${Math.floor(gameState.altitude)} ft`, 10, 15);
  
  // Speed
  const speedColor = gameState.speed < 110 ? [255, 100, 100] : 
                     gameState.speed > 180 ? [255, 200, 100] : [100, 255, 100];
  p.fill(speedColor);
  p.text(`SPD: ${Math.floor(gameState.speed)} kts`, 10, 30);
  
  // Vertical Speed
  const vsColor = Math.abs(gameState.verticalSpeed) > 500 ? [255, 100, 100] : [255, 255, 255];
  p.fill(vsColor);
  const vsSign = gameState.verticalSpeed > 0 ? "+" : "";
  p.text(`V/S: ${vsSign}${Math.floor(gameState.verticalSpeed)} fpm`, 10, 45);
  
  // Heading
  p.fill(255);
  p.text(`HDG: ${Math.floor(gameState.heading)}°`, 10, 60);
  
  // Systems status (middle)
  p.textAlign(p.CENTER);
  p.textSize(11);
  
  // Throttle
  p.fill(255);
  p.text(`THROTTLE: ${Math.floor(gameState.throttle * 100)}%`, CANVAS_WIDTH / 2, 15);
  
  // Gear
  const gearColor = gameState.gearDeployed ? [100, 255, 100] : [150, 150, 150];
  p.fill(gearColor);
  p.text(gameState.gearDeployed ? "GEAR DOWN" : "GEAR UP", CANVAS_WIDTH / 2, 30);
  
  // Flaps
  p.fill(255);
  p.text(`FLAPS: ${gameState.flapSetting}`, CANVAS_WIDTH / 2, 45);
  
  // Spoilers
  if (gameState.spoilersDeployed) {
    p.fill(255, 200, 100);
    p.text("SPOILERS DEPLOYED", CANVAS_WIDTH / 2, 60);
  }
  
  // Fuel and engines (right side)
  p.textAlign(p.RIGHT);
  
  // Fuel
  const fuelColor = gameState.fuel < 20 ? [255, 100, 100] : 
                    gameState.fuel < 50 ? [255, 200, 100] : [100, 255, 100];
  p.fill(fuelColor);
  p.text(`FUEL: ${Math.floor(gameState.fuel)}%`, CANVAS_WIDTH - 10, 15);
  
  // Engines
  p.fill(gameState.engine1Running ? [100, 255, 100] : [255, 100, 100]);
  p.text(`ENG1: ${gameState.engine1Running ? "ON" : "OFF"}`, CANVAS_WIDTH - 10, 30);
  
  p.fill(gameState.engine2Running ? [100, 255, 100] : [255, 100, 100]);
  p.text(`ENG2: ${gameState.engine2Running ? "ON" : "OFF"}`, CANVAS_WIDTH - 10, 45);
  
  // Score
  p.fill(255);
  p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 10, 65);
  
  // Emergency alerts
  if (gameState.activeEmergencies.length > 0) {
    p.fill(255, 0, 0);
    p.textAlign(p.CENTER);
    p.textSize(14);
    p.text(`⚠ ${gameState.activeEmergencies[0]} ⚠`, CANVAS_WIDTH / 2, 75);
  }
}

export function renderAttitudeIndicator(p) {
  // Artificial horizon (simplified)
  const centerX = CANVAS_WIDTH / 2;
  const centerY = CANVAS_HEIGHT / 2;
  const size = 60;
  
  p.push();
  p.translate(centerX, centerY);
  p.rotate(gameState.player.body.angle);
  
  // Sky
  p.fill(100, 150, 255);
  p.noStroke();
  p.rect(-size, -size, size * 2, size);
  
  // Ground
  p.fill(139, 90, 43);
  p.rect(-size, 0, size * 2, size);
  
  // Horizon line
  p.stroke(255);
  p.strokeWeight(2);
  p.line(-size, 0, size, 0);
  
  p.pop();
  
  // Aircraft reference
  p.stroke(255, 255, 0);
  p.strokeWeight(3);
  p.noFill();
  p.line(centerX - 30, centerY, centerX - 10, centerY);
  p.line(centerX + 10, centerY, centerX + 30, centerY);
  p.line(centerX, centerY - 5, centerX, centerY + 5);
}

export function renderILS(p) {
  // ILS guidance (when near runway)
  const distanceToRunway = Math.abs(gameState.player.body.position.x - gameState.runway.body.position.x);
  
  if (distanceToRunway < 200 && gameState.altitude < 500) {
    const ilsX = 500;
    const ilsY = CANVAS_HEIGHT / 2;
    const ilsSize = 40;
    
    // Background
    p.fill(0, 0, 0, 180);
    p.noStroke();
    p.rect(ilsX - ilsSize, ilsY - ilsSize, ilsSize * 2, ilsSize * 2);
    
    // Cross
    p.stroke(100);
    p.strokeWeight(1);
    p.line(ilsX - ilsSize, ilsY, ilsX + ilsSize, ilsY);
    p.line(ilsX, ilsY - ilsSize, ilsX, ilsY + ilsSize);
    
    // Localizer (horizontal alignment)
    const localizerOffset = (gameState.player.body.position.x - gameState.runway.body.position.x) / 50;
    p.fill(255, 100, 255);
    p.noStroke();
    p.circle(ilsX + localizerOffset * ilsSize, ilsY, 8);
    
    // Glideslope (vertical alignment)
    const targetAltitude = (distanceToRunway / 200) * 300; // 3 degree glideslope approximation
    const glideOffset = (gameState.altitude - targetAltitude) / 100;
    p.fill(255, 100, 255);
    p.circle(ilsX, ilsY - glideOffset * ilsSize, 8);
    
    // Center dot
    p.fill(255);
    p.circle(ilsX, ilsY, 4);
    
    // Label
    p.textSize(10);
    p.textAlign(p.CENTER);
    p.text("ILS", ilsX, ilsY - ilsSize - 5);
  }
}

export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  p.textSize(16);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
}

export function renderGameOver(p) {
  p.background(20, 30, 50);
  
  p.textAlign(p.CENTER, p.CENTER);
  
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    // Success
    p.fill(100, 255, 100);
    p.textSize(36);
    p.text("LANDING SUCCESSFUL", CANVAS_WIDTH / 2, 100);
    
    p.fill(255);
    p.textSize(16);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 160);
    
    p.textSize(14);
    p.fill(200);
    p.text(`Touchdown Speed: ${Math.floor(gameState.touchdownSpeed)} kts`, CANVAS_WIDTH / 2, 200);
    p.text(`Vertical Speed: ${Math.floor(gameState.touchdownVerticalSpeed)} fpm`, CANVAS_WIDTH / 2, 220);
    p.text(`Centerline Deviation: ${Math.floor(gameState.touchdownAlignment)} ft`, CANVAS_WIDTH / 2, 240);
    
    // Rating
    let rating = "EXCELLENT";
    if (gameState.touchdownVerticalSpeed > 200 || gameState.touchdownAlignment > 20) {
      rating = "GOOD";
    }
    if (gameState.touchdownVerticalSpeed > 250 || gameState.touchdownAlignment > 30) {
      rating = "FAIR";
    }
    
    p.fill(255, 255, 100);
    p.textSize(20);
    p.text(`Landing Rating: ${rating}`, CANVAS_WIDTH / 2, 280);
    
  } else {
    // Failure
    p.fill(255, 100, 100);
    p.textSize(36);
    p.text("CRASH", CANVAS_WIDTH / 2, 100);
    
    p.fill(255);
    p.textSize(16);
    p.text(gameState.crashReason || "Aircraft crashed", CANVAS_WIDTH / 2, 160);
    
    p.textSize(14);
    p.fill(200);
    if (gameState.touchdownSpeed > 0) {
      p.text(`Impact Speed: ${Math.floor(gameState.touchdownSpeed)} kts`, CANVAS_WIDTH / 2, 200);
      p.text(`Vertical Speed: ${Math.floor(gameState.touchdownVerticalSpeed)} fpm`, CANVAS_WIDTH / 2, 220);
    }
  }
  
  p.fill(100, 255, 255);
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);
}