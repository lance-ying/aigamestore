// rendering.js - All rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, ROOM_NAMES, ANOMALY_TYPES, SHIFT_END_HOUR } from './globals.js';

// Render start screen
export function renderStartScreen(p) {
  p.background(10, 10, 15);
  
  // Glitch effect
  if (p.frameCount % 180 < 5) {
    p.push();
    p.fill(255, 0, 0, 50);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.pop();
  }
  
  // Title
  p.fill(200, 50, 50);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text('NIGHT WATCH', CANVAS_WIDTH / 2, 80);
  
  p.fill(180, 180, 180);
  p.textSize(16);
  p.text('SECURITY MONITORING SYSTEM v2.4', CANVAS_WIDTH / 2, 120);
  
  // Description
  p.fill(220, 220, 220);
  p.textSize(14);
  p.textAlign(p.CENTER, p.TOP);
  const desc = 'Monitor surveillance cameras and report anomalies.\nSurvive until 6 AM. Don\'t miss anomalies.\nToo many mistakes = termination.';
  p.text(desc, CANVAS_WIDTH / 2, 160);
  
  // Instructions
  p.fill(150, 150, 150);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    'Arrow Keys: Navigate cameras/menu',
    'Space: Confirm selection',
    'Shift: Open/Close report menu',
    'Z: Quick switch to previous camera',
    'ESC: Pause'
  ];
  
  let yPos = 240;
  for (let line of instructions) {
    p.text(line, 50, yPos);
    yPos += 18;
  }
  
  // Start prompt
  p.fill(255, 255, 0);
  p.textSize(20);
  p.textAlign(p.CENTER, p.CENTER);
  const flash = Math.sin(p.frameCount * 0.1) > 0;
  if (flash) {
    p.text('PRESS ENTER TO START SHIFT', CANVAS_WIDTH / 2, 360);
  }
}

// Render main game screen
export function renderGame(p) {
  // Dark background
  p.background(5, 5, 10);
  
  // Camera feed area
  renderCameraFeed(p);
  
  // UI overlay
  renderHUD(p);
  
  // Report menu
  if (gameState.reportMenuOpen) {
    renderReportMenu(p);
  }
  
  // Alert message
  if (gameState.uiAlertTimer > 0) {
    renderAlert(p);
  }
  
  // Particles
  renderParticles(p);
}

// Render camera feed
function renderCameraFeed(p) {
  const feedX = 50;
  const feedY = 50;
  const feedWidth = 500;
  const feedHeight = 280;
  
  // Border/monitor frame
  p.fill(30, 30, 35);
  p.rect(feedX - 5, feedY - 5, feedWidth + 10, feedHeight + 10);
  
  // Static/noise during transition
  if (gameState.cameraTransitioning) {
    gameState.cameraTransitionProgress += 0.15;
    
    if (gameState.cameraTransitionProgress < 1) {
      p.fill(0);
      p.rect(feedX, feedY, feedWidth, feedHeight);
      
      // Static effect
      for (let i = 0; i < 200; i++) {
        const x = feedX + Math.random() * feedWidth;
        const y = feedY + Math.random() * feedHeight;
        const brightness = Math.random() * 255;
        p.stroke(brightness);
        p.point(x, y);
      }
      p.noStroke();
      return;
    } else {
      gameState.cameraTransitioning = false;
    }
  }
  
  // Render room
  const room = gameState.roomStates[gameState.currentCamera];
  renderRoom(p, room, feedX, feedY, feedWidth, feedHeight);
  
  // Camera label
  p.fill(255, 255, 255, 200);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text(`CAM ${gameState.currentCamera + 1}: ${room.roomName}`, feedX + 10, feedY + 10);
  
  // Scanline effect
  p.stroke(0, 255, 0, 20);
  const scanY = feedY + (p.frameCount % feedHeight);
  p.line(feedX, scanY, feedX + feedWidth, scanY);
  p.noStroke();
  
  // Vignette
  p.push();
  p.noFill();
  for (let i = 0; i < 20; i++) {
    p.stroke(0, 0, 0, i * 3);
    p.strokeWeight(2);
    p.rect(feedX - i, feedY - i, feedWidth + i * 2, feedHeight + i * 2);
  }
  p.pop();
}

// Render individual room
function renderRoom(p, room, x, y, width, height) {
  // Background with lighting
  const brightness = room.lighting * 100 + 20;
  p.fill(brightness * 0.3, brightness * 0.3, brightness * 0.4);
  p.rect(x, y, width, height);
  
  // Floor
  p.fill(brightness * 0.5, brightness * 0.4, brightness * 0.3);
  p.rect(x, y + height * 0.6, width, height * 0.4);
  
  // Wall details
  p.stroke(brightness * 0.2, brightness * 0.2, brightness * 0.3);
  p.strokeWeight(1);
  p.line(x, y + height * 0.6, x + width, y + height * 0.6);
  p.noStroke();
  
  // Render objects
  for (let obj of room.objects) {
    renderObject(p, obj, room.lighting, x, y);
  }
  
  // Render intruder if present
  if (room.hasIntruder && room.intruderPosition) {
    renderIntruder(p, room.intruderPosition.x + x, room.intruderPosition.y + y, room.lighting);
  }
  
  // Door indicator
  if (room.doorOpen) {
    p.fill(255, 100, 100, 150);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(12);
    p.text('[DOOR OPEN]', x + 10, y + height - 25);
  }
}

// Render room object
function renderObject(p, obj, lighting, offsetX, offsetY) {
  const adjustedColor = [
    obj.color[0] * lighting,
    obj.color[1] * lighting,
    obj.color[2] * lighting
  ];
  
  p.fill(...adjustedColor);
  p.stroke(0, 0, 0, 100);
  p.strokeWeight(1);
  
  // Different shapes for different object types
  if (obj.type === 'lamp' || obj.type === 'light') {
    // Draw lamp with glow
    p.circle(offsetX + obj.x, offsetY + obj.y, obj.width);
    if (lighting > 0.7) {
      p.fill(255, 255, 200, 100);
      p.circle(offsetX + obj.x, offsetY + obj.y, obj.width * 2);
    }
  } else if (obj.type === 'mirror') {
    // Draw reflective surface
    p.fill(180 * lighting, 200 * lighting, 220 * lighting);
    p.rect(offsetX + obj.x, offsetY + obj.y, obj.width, obj.height);
    p.fill(200 * lighting, 220 * lighting, 240 * lighting, 150);
    p.rect(offsetX + obj.x + 5, offsetY + obj.y + 5, obj.width - 10, obj.height - 10);
  } else if (obj.type === 'painting') {
    // Draw frame
    p.fill(...adjustedColor);
    p.rect(offsetX + obj.x, offsetY + obj.y, obj.width, obj.height);
    p.fill(100 * lighting, 80 * lighting, 60 * lighting);
    p.rect(offsetX + obj.x + 5, offsetY + obj.y + 5, obj.width - 10, obj.height - 10);
  } else {
    // Default rectangle
    p.rect(offsetX + obj.x, offsetY + obj.y, obj.width, obj.height);
  }
  
  p.noStroke();
}

// Render intruder (shadowy figure)
function renderIntruder(p, x, y, lighting) {
  // Shadow figure
  p.push();
  p.translate(x, y);
  
  // Body
  p.fill(0, 0, 0, 200 - lighting * 100);
  p.ellipse(0, 0, 40, 60);
  
  // Head
  p.ellipse(0, -30, 30, 30);
  
  // Eyes (glowing red)
  p.fill(255, 0, 0, 255);
  p.circle(-8, -32, 6);
  p.circle(8, -32, 6);
  
  // Glitch effect
  if (p.frameCount % 30 < 3) {
    p.fill(255, 0, 0, 100);
    p.rect(-20, -50, 40, 80);
  }
  
  p.pop();
}

// Render HUD
function renderHUD(p) {
  const hudX = 10;
  const hudY = 340;
  
  // Background panel
  p.fill(20, 20, 25, 230);
  p.rect(hudX, hudY, 580, 50);
  
  // Time
  const hours = Math.floor(gameState.gameTime / 60);
  const minutes = Math.floor(gameState.gameTime % 60);
  const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  
  p.fill(0, 255, 0);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`TIME: ${timeStr}`, hudX + 10, hudY + 8);
  
  // Score
  p.fill(255, 255, 255);
  p.text(`SCORE: ${gameState.score}`, hudX + 150, hudY + 8);
  
  // Strikes
  const strikeColor = gameState.strikes >= 2 ? [255, 0, 0] : [255, 255, 0];
  p.fill(...strikeColor);
  p.text(`STRIKES: ${gameState.strikes}/3`, hudX + 300, hudY + 8);
  
  // Anomalies detected
  p.fill(200, 200, 200);
  p.textSize(12);
  p.text(`Detected: ${gameState.anomaliesDetected}`, hudX + 10, hudY + 28);
  p.text(`Missed: ${gameState.anomaliesMissed}`, hudX + 120, hudY + 28);
  p.text(`Active: ${gameState.activeAnomalies.length}`, hudX + 220, hudY + 28);
  
  // Controls hint
  p.fill(150, 150, 150);
  p.textAlign(p.RIGHT, p.TOP);
  p.text('[SHIFT] Report', hudX + 570, hudY + 28);
}

// Render report menu
function renderReportMenu(p) {
  const menuX = 150;
  const menuY = 100;
  const menuWidth = 300;
  const menuHeight = 250;
  
  // Background
  p.fill(30, 30, 40, 240);
  p.stroke(0, 255, 0);
  p.strokeWeight(2);
  p.rect(menuX, menuY, menuWidth, menuHeight);
  p.noStroke();
  
  // Title
  p.fill(0, 255, 0);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(18);
  p.text('FILE ANOMALY REPORT', menuX + menuWidth / 2, menuY + 10);
  
  // Room selection
  p.fill(200, 200, 200);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  p.text('LOCATION:', menuX + 15, menuY + 40);
  
  // Room buttons
  const roomButtonY = menuY + 60;
  const roomButtonWidth = 80;
  const roomButtonHeight = 25;
  
  for (let i = 0; i < Math.min(6, ROOM_NAMES.length); i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const btnX = menuX + 15 + col * (roomButtonWidth + 10);
    const btnY = roomButtonY + row * (roomButtonHeight + 5);
    
    if (i === gameState.selectedReportRoom) {
      p.fill(0, 255, 0, 150);
    } else {
      p.fill(60, 60, 70);
    }
    
    p.rect(btnX, btnY, roomButtonWidth, roomButtonHeight);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    const roomName = ROOM_NAMES[i].replace('_', ' ');
    p.text(roomName, btnX + roomButtonWidth / 2, btnY + roomButtonHeight / 2);
  }
  
  // Anomaly type selection
  p.fill(200, 200, 200);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text('ANOMALY TYPE:', menuX + 15, menuY + 130);
  
  // Type list
  const typeListY = menuY + 150;
  for (let i = 0; i < ANOMALY_TYPES.length; i++) {
    const btnY = typeListY + i * 15;
    
    if (i === gameState.selectedReportType) {
      p.fill(0, 255, 0);
      p.text('>', menuX + 15, btnY);
    } else {
      p.fill(150, 150, 150);
    }
    
    const typeName = ANOMALY_TYPES[i].replace(/_/g, ' ');
    p.text(typeName, menuX + 30, btnY);
  }
  
  // Submit button
  p.fill(255, 255, 0);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.textSize(12);
  p.text('[SPACE] Submit Report', menuX + menuWidth / 2, menuY + menuHeight - 10);
  
  p.fill(150, 150, 150);
  p.text('[SHIFT] Cancel', menuX + menuWidth / 2, menuY + menuHeight - 25);
}

// Render alert message
function renderAlert(p) {
  p.push();
  p.fill(0, 0, 0, 200);
  p.rect(150, 150, 300, 60);
  
  p.fill(255, 255, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(16);
  p.text(gameState.uiAlertMessage, 300, 180);
  
  p.pop();
  
  gameState.uiAlertTimer--;
}

// Render particles
function renderParticles(p) {
  for (let particle of gameState.particles) {
    particle.render(p);
  }
}

// Render paused overlay
export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 255, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  
  p.textSize(20);
  p.text('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
}

// Render game over screen
export function renderGameOver(p) {
  p.fill(0, 0, 0, 220);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Title
  if (isWin) {
    p.fill(0, 255, 0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text('SHIFT COMPLETE', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
    
    p.fill(200, 200, 200);
    p.textSize(18);
    p.text('You survived until 6 AM!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  } else {
    p.fill(255, 0, 0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text('TERMINATED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
    
    p.fill(200, 200, 200);
    p.textSize(18);
    
    if (gameState.strikes >= 3) {
      p.text('Too many mistakes.', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
    } else {
      p.text('Performance unacceptable.', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
    }
  }
  
  // Stats
  p.fill(220, 220, 220);
  p.textSize(16);
  p.textAlign(p.LEFT, p.CENTER);
  
  const statsX = 200;
  let statsY = CANVAS_HEIGHT / 2;
  
  p.text(`Final Score: ${gameState.score}`, statsX, statsY);
  statsY += 25;
  p.text(`Anomalies Detected: ${gameState.anomaliesDetected}`, statsX, statsY);
  statsY += 25;
  p.text(`Anomalies Missed: ${gameState.anomaliesMissed}`, statsX, statsY);
  statsY += 25;
  p.text(`False Reports: ${gameState.falseReports}`, statsX, statsY);
  
  // Restart prompt
  p.fill(255, 255, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.text('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 120);
}