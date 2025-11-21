// rendering.js - Rendering functions

import { PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, CAMERA_LOCATIONS } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 15, 25);
  
  // Title
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(180, 50, 50);
  p.textSize(36);
  p.text("FIVE NIGHTS", 300, 80);
  p.text("AT FREDDY'S 3", 300, 120);
  
  // Instructions
  p.fill(200, 200, 220);
  p.textSize(14);
  p.text("Survive from 12 AM to 6 AM", 300, 180);
  p.text("Track Springtrap on cameras", 300, 205);
  p.text("Use audio lures to distract him", 300, 225);
  p.text("Seal vents to block his entry", 300, 245);
  p.text("Reboot systems when phantoms appear", 300, 265);
  
  // Controls
  p.textSize(12);
  p.fill(150, 150, 170);
  p.text("Z: Toggle Tablet  |  Arrows: Navigate  |  Space: Activate", 300, 305);
  p.text("ESC: Pause  |  R: Restart", 300, 325);
  
  // Prompt
  p.fill(255, 255, 100);
  p.textSize(18);
  p.text("PRESS ENTER TO START", 300, 360);
  p.pop();
}

export function renderGameOverScreen(p, gameState) {
  p.background(15, 10, 20);
  
  const isWin = gameState.gamePhase === PHASE_GAME_OVER_WIN;
  
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  if (isWin) {
    p.fill(100, 255, 100);
    p.textSize(42);
    p.text("6 AM", 300, 120);
    p.textSize(24);
    p.fill(200, 255, 200);
    p.text("You Survived Night " + gameState.currentNight, 300, 170);
    
    if (gameState.currentNight >= 5) {
      p.textSize(28);
      p.fill(255, 255, 100);
      p.text("ALL NIGHTS COMPLETE!", 300, 210);
    }
  } else {
    p.fill(255, 50, 50);
    p.textSize(42);
    p.text("GAME OVER", 300, 120);
    p.textSize(18);
    p.fill(255, 150, 150);
    p.text("Night " + gameState.currentNight, 300, 170);
    p.text("Springtrap got you...", 300, 195);
  }
  
  // Stats
  p.fill(180, 180, 200);
  p.textSize(14);
  const hour = Math.floor(gameState.timeElapsed / 60);
  p.text("Time Survived: " + hour + " AM", 300, 250);
  p.text("Audio Lures Used: " + gameState.audioLureUsed, 300, 275);
  p.text("Vent Seals Used: " + gameState.ventSealsUsed, 300, 295);
  
  // Restart prompt
  p.fill(255, 255, 100);
  p.textSize(18);
  p.text("PRESS R TO RESTART", 300, 360);
  p.pop();
}

export function renderPausedIndicator(p) {
  p.push();
  p.fill(255, 255, 100);
  p.textSize(16);
  p.textAlign(p.RIGHT, p.TOP);
  p.text("PAUSED", 580, 10);
  p.pop();
}

export function renderOfficeView(p, gameState) {
  // Office background
  p.push();
  p.fill(40, 35, 45);
  p.noStroke();
  p.rect(0, 0, 600, 400);
  
  // Desk
  p.fill(60, 50, 55);
  p.rect(0, 320, 600, 80);
  
  // Monitor glow
  p.fill(80, 90, 120, 100);
  p.ellipse(300, 250, 200, 150);
  
  // Vent indicators
  renderVentIndicators(p, gameState);
  
  // Render player
  if (gameState.player) {
    gameState.player.render(p);
  }
  
  // Render Springtrap if in office
  if (gameState.springtrap) {
    gameState.springtrap.renderInOffice(p);
  }
  
  p.pop();
}

export function renderVentIndicators(p, gameState) {
  // Left vent
  p.push();
  p.fill(gameState.vents.left.sealed ? [100, 255, 100] : [255, 100, 100]);
  p.rect(20, 180, 40, 30);
  p.fill(20);
  p.textSize(10);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("L", 40, 195);
  p.pop();
  
  // Right vent
  p.push();
  p.fill(gameState.vents.right.sealed ? [100, 255, 100] : [255, 100, 100]);
  p.rect(540, 180, 40, 30);
  p.fill(20);
  p.textSize(10);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("R", 560, 195);
  p.pop();
}

export function renderTablet(p, gameState) {
  // Tablet background
  p.push();
  p.fill(30, 40, 50, 240);
  p.rect(50, 50, 500, 320);
  
  // Header
  p.fill(60, 80, 100);
  p.rect(50, 50, 500, 40);
  p.fill(200, 220, 240);
  p.textSize(16);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("SECURITY TABLET", 300, 70);
  
  // Current view mode
  if (gameState.selectedSystem === 'maintenance') {
    renderMaintenancePanel(p, gameState);
  } else {
    renderCameraView(p, gameState);
  }
  
  // Bottom menu
  renderTabletMenu(p, gameState);
  
  p.pop();
}

export function renderCameraView(p, gameState) {
  p.push();
  
  // Camera feed background
  p.fill(20, 30, 40);
  p.rect(70, 110, 460, 200);
  
  // Camera label
  const cam = CAMERA_LOCATIONS[gameState.selectedCamera];
  p.fill(200, 220, 240);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  p.text(cam.name, 80, 120);
  
  // Camera static effect
  for (let i = 0; i < 50; i++) {
    p.stroke(p.random(100, 150), p.random(100), 100);
    p.point(p.random(70, 530), p.random(110, 310));
  }
  
  // Render Springtrap if at this camera
  if (gameState.springtrap && !gameState.systems.camera.working) {
    // Camera broken - show static
    p.fill(255, 100, 100);
    p.textSize(20);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("CAMERA OFFLINE", 300, 210);
  } else if (gameState.springtrap) {
    gameState.springtrap.render(p, gameState.selectedCamera);
  }
  
  p.pop();
}

export function renderMaintenancePanel(p, gameState) {
  p.push();
  
  p.fill(40, 50, 60);
  p.rect(70, 110, 460, 200);
  
  p.fill(200, 220, 240);
  p.textSize(18);
  p.textAlign(p.CENTER, p.TOP);
  p.text("MAINTENANCE PANEL", 300, 120);
  
  // System status
  const systems = ['audio', 'camera', 'ventilation'];
  let y = 160;
  
  systems.forEach(sys => {
    const working = gameState.systems[sys].working;
    p.fill(working ? [100, 255, 100] : [255, 100, 100]);
    p.textSize(14);
    p.textAlign(p.LEFT, p.TOP);
    p.text(sys.toUpperCase() + ": " + (working ? "ONLINE" : "OFFLINE"), 100, y);
    
    if (!working) {
      p.fill(200, 200, 100);
      p.textSize(12);
      p.text("Press SPACE to reboot", 100, y + 20);
    }
    
    y += 45;
  });
  
  // Reboot progress
  if (gameState.rebootingSystem) {
    p.fill(255, 255, 100);
    p.textSize(14);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.text("REBOOTING " + gameState.rebootingSystem.toUpperCase() + "...", 300, 300);
    
    // Progress bar
    const progress = gameState.rebootProgress / 120;
    p.fill(100, 100, 120);
    p.rect(150, 310, 300, 20);
    p.fill(100, 200, 255);
    p.rect(150, 310, 300 * progress, 20);
  }
  
  p.pop();
}

export function renderTabletMenu(p, gameState) {
  p.push();
  
  p.fill(50, 70, 90);
  p.rect(50, 330, 500, 40);
  
  // Menu options
  const menuItems = [
    { label: "CAMERAS", mode: null },
    { label: "AUDIO", mode: 'audio' },
    { label: "VENTS", mode: 'vents' },
    { label: "SYSTEMS", mode: 'maintenance' }
  ];
  
  const itemWidth = 125;
  let x = 50;
  
  menuItems.forEach(item => {
    const selected = gameState.selectedSystem === item.mode;
    p.fill(selected ? [80, 120, 160] : [50, 70, 90]);
    p.rect(x, 330, itemWidth, 40);
    
    p.fill(selected ? [255, 255, 255] : [180, 200, 220]);
    p.textSize(12);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(item.label, x + itemWidth / 2, 350);
    
    x += itemWidth;
  });
  
  p.pop();
}

export function renderHUD(p, gameState) {
  p.push();
  
  // Night indicator
  p.fill(200, 200, 220);
  p.textSize(16);
  p.textAlign(p.LEFT, p.TOP);
  p.text("NIGHT " + gameState.currentNight, 10, 10);
  
  // Time
  const hour = Math.floor(gameState.timeElapsed / 60);
  p.textAlign(p.RIGHT, p.TOP);
  p.text((hour + 12) % 12 + " AM", 590, 10);
  
  // System status icons
  const systems = ['audio', 'camera', 'ventilation'];
  let iconX = 10;
  const iconY = 35;
  
  systems.forEach(sys => {
    const working = gameState.systems[sys].working;
    p.fill(working ? [100, 255, 100, 150] : [255, 100, 100, 150]);
    p.rect(iconX, iconY, 12, 12);
    iconX += 17;
  });
  
  // Instructions
  if (!gameState.tabletOpen) {
    p.fill(150, 150, 170);
    p.textSize(11);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.text("Press Z to open tablet", 300, 390);
  }
  
  p.pop();
}

export function renderPhantoms(p, gameState) {
  gameState.entities.forEach(entity => {
    if (entity instanceof Object && entity.type) {
      entity.render(p);
    }
  });
}