import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, CAMERA_LOCATIONS } from './globals.js';
import { getAnimatronicsAtLocation } from './animatronics.js';
import { getPowerUsageLevel } from './power.js';
import { getTimeDisplay } from './time.js';

export function renderGame(p) {
  p.background(20, 20, 30);
  
  switch (gameState.gamePhase) {
    case GAME_PHASES.START:
      renderStartScreen(p);
      break;
    case GAME_PHASES.PLAYING:
      if (gameState.jumpscareActive) {
        renderJumpscare(p);
      } else if (gameState.cameraOpen) {
        renderCameraView(p);
      } else {
        renderOfficeView(p);
      }
      renderHUD(p);
      break;
    case GAME_PHASES.PAUSED:
      if (gameState.cameraOpen) {
        renderCameraView(p);
      } else {
        renderOfficeView(p);
      }
      renderHUD(p);
      renderPauseOverlay(p);
      break;
    case GAME_PHASES.GAME_OVER_WIN:
    case GAME_PHASES.GAME_OVER_LOSE:
      renderGameOverScreen(p);
      break;
  }
}

function renderStartScreen(p) {
  p.fill(150, 0, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("FIVE NIGHTS AT FREDDY'S", CANVAS_WIDTH / 2, 80);
  
  p.fill(200, 200, 200);
  p.textSize(16);
  p.text("Survive from 12 AM to 6 AM", CANVAS_WIDTH / 2, 140);
  p.text("Monitor animatronics and manage power", CANVAS_WIDTH / 2, 165);
  
  p.textSize(14);
  p.fill(255, 255, 150);
  p.text("CONTROLS:", CANVAS_WIDTH / 2, 200);
  
  p.fill(200, 200, 200);
  p.textSize(12);
  p.text("SPACE: Toggle Camera Monitor", CANVAS_WIDTH / 2, 225);
  p.text("ARROW KEYS: Switch Cameras", CANVAS_WIDTH / 2, 245);
  p.text("Z: Toggle Left Door", CANVAS_WIDTH / 2, 265);
  p.text("SHIFT: Toggle Right Door", CANVAS_WIDTH / 2, 285);
  p.text("LEFT/RIGHT: Check Hallway Lights (when not in camera)", CANVAS_WIDTH / 2, 305);
  
  p.fill(255, 255, 100);
  p.textSize(16);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 350);
  
  p.fill(180, 180, 180);
  p.textSize(11);
  p.text(`Night ${gameState.currentNight}`, CANVAS_WIDTH / 2, 375);
}

function renderOfficeView(p) {
  // Office background
  p.fill(40, 35, 45);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Desk
  p.fill(60, 50, 40);
  p.rect(0, CANVAS_HEIGHT - 100, CANVAS_WIDTH, 100);
  
  // Left door
  const leftDoorX = 50;
  const leftDoorY = 150;
  const leftDoorWidth = 80;
  const leftDoorHeight = 150;
  
  p.fill(...(gameState.leftDoorClosed ? [100, 100, 120] : [40, 40, 50]));
  p.stroke(80, 80, 90);
  p.strokeWeight(2);
  p.rect(leftDoorX, leftDoorY, leftDoorWidth, leftDoorHeight);
  
  // Left door indicator
  p.noStroke();
  p.fill(...(gameState.leftDoorClosed ? [0, 255, 0] : [255, 0, 0]));
  p.circle(leftDoorX + 10, leftDoorY + 10, 8);
  
  // Right door
  const rightDoorX = CANVAS_WIDTH - 130;
  const rightDoorY = 150;
  
  p.fill(...(gameState.rightDoorClosed ? [100, 100, 120] : [40, 40, 50]));
  p.stroke(80, 80, 90);
  p.strokeWeight(2);
  p.rect(rightDoorX, rightDoorY, leftDoorWidth, leftDoorHeight);
  
  // Right door indicator
  p.noStroke();
  p.fill(...(gameState.rightDoorClosed ? [0, 255, 0] : [255, 0, 0]));
  p.circle(rightDoorX + leftDoorWidth - 10, rightDoorY + 10, 8);
  
  // Left hallway light effect
  if (gameState.leftLightOn) {
    p.fill(255, 255, 150, 100);
    p.noStroke();
    p.rect(leftDoorX - 40, leftDoorY, 40, leftDoorHeight);
    
    // Show animatronic if present
    const leftAnim = gameState.animatronics.find(a => a.atLeftDoor);
    if (leftAnim) {
      p.fill(...leftAnim.color);
      p.circle(leftDoorX - 20, leftDoorY + 75, 30);
      p.fill(255, 0, 0);
      p.textSize(10);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("!", leftDoorX - 20, leftDoorY + 75);
    }
  }
  
  // Right hallway light effect
  if (gameState.rightLightOn) {
    p.fill(255, 255, 150, 100);
    p.noStroke();
    p.rect(rightDoorX + leftDoorWidth, rightDoorY, 40, leftDoorHeight);
    
    const rightAnim = gameState.animatronics.find(a => a.atRightDoor);
    if (rightAnim) {
      p.fill(...rightAnim.color);
      p.circle(rightDoorX + leftDoorWidth + 20, rightDoorY + 75, 30);
      p.fill(255, 0, 0);
      p.textSize(10);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("!", rightDoorX + leftDoorWidth + 20, rightDoorY + 75);
    }
  }
  
  // Camera button
  const camButtonX = CANVAS_WIDTH / 2 - 40;
  const camButtonY = CANVAS_HEIGHT - 60;
  p.fill(...(gameState.cameraButtonHighlight ? [100, 255, 100] : [80, 200, 80]));
  p.stroke(50, 150, 50);
  p.strokeWeight(2);
  p.rect(camButtonX, camButtonY, 80, 30);
  p.fill(0);
  p.noStroke();
  p.textSize(12);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("CAMERA", camButtonX + 40, camButtonY + 15);
}

function renderCameraView(p) {
  // Camera monitor background
  p.fill(30, 40, 30);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Static effect
  for (let i = 0; i < 50; i++) {
    p.stroke(p.random(100, 200), p.random(100));
    p.point(p.random(CANVAS_WIDTH), p.random(CANVAS_HEIGHT));
  }
  
  // Camera feed area
  const feedX = 50;
  const feedY = 50;
  const feedW = CANVAS_WIDTH - 100;
  const feedH = CANVAS_HEIGHT - 150;
  
  p.fill(20, 30, 20);
  p.stroke(0, 255, 0);
  p.strokeWeight(2);
  p.rect(feedX, feedY, feedW, feedH);
  
  // Current camera location
  const currentCam = CAMERA_LOCATIONS[gameState.currentCamera];
  
  // Draw camera name
  p.fill(0, 255, 0);
  p.noStroke();
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`CAM ${gameState.currentCamera}: ${currentCam.name}`, feedX + 10, feedY + 10);
  
  // Draw animatronics in this location
  const animsHere = getAnimatronicsAtLocation(gameState.currentCamera);
  
  if (animsHere.length > 0) {
    animsHere.forEach((anim, idx) => {
      const animX = feedX + feedW / 2 + (idx - animsHere.length / 2) * 60;
      const animY = feedY + feedH / 2;
      
      // Draw animatronic
      p.fill(...anim.color);
      p.noStroke();
      p.circle(animX, animY, 50);
      
      // Eyes
      p.fill(255, 0, 0);
      p.circle(animX - 10, animY - 5, 8);
      p.circle(animX + 10, animY - 5, 8);
      
      // Name
      p.fill(0, 255, 0);
      p.textSize(10);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(anim.name, animX, animY + 35);
    });
  } else {
    p.fill(0, 200, 0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text("No activity", feedX + feedW / 2, feedY + feedH / 2);
  }
  
  // Camera selection UI
  p.fill(40, 60, 40);
  p.noStroke();
  p.rect(0, CANVAS_HEIGHT - 80, CANVAS_WIDTH, 80);
  
  // Draw camera buttons
  const buttonY = CANVAS_HEIGHT - 60;
  const buttonSpacing = 90;
  const startX = 30;
  
  CAMERA_LOCATIONS.forEach((cam, idx) => {
    const buttonX = startX + (idx % 3) * buttonSpacing;
    const buttonYPos = buttonY + Math.floor(idx / 3) * 35;
    
    p.fill(...(gameState.currentCamera === idx ? [0, 255, 0] : [0, 150, 0]));
    p.stroke(0, 100, 0);
    p.strokeWeight(1);
    p.rect(buttonX, buttonYPos, 80, 25);
    
    p.fill(0);
    p.noStroke();
    p.textSize(10);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(`CAM ${idx}`, buttonX + 40, buttonYPos + 12);
  });
  
  // Close camera hint
  p.fill(255, 255, 100);
  p.textSize(11);
  p.textAlign(p.RIGHT, p.BOTTOM);
  p.text("SPACE: Close Monitor", CANVAS_WIDTH - 10, CANVAS_HEIGHT - 5);
}

function renderJumpscare(p) {
  gameState.jumpscareFrame++;
  
  // Flash effect
  const flashIntensity = Math.sin(gameState.jumpscareFrame * 0.5) * 127 + 128;
  p.background(flashIntensity, 0, 0);
  
  // Animatronic face
  if (gameState.jumpscareAnimatronic) {
    p.fill(...gameState.jumpscareAnimatronic.color);
    p.noStroke();
    const size = 200 + gameState.jumpscareFrame * 10;
    p.circle(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, Math.min(size, 400));
    
    // Scary eyes
    p.fill(255, 0, 0);
    p.circle(CANVAS_WIDTH / 2 - 40, CANVAS_HEIGHT / 2 - 20, 30);
    p.circle(CANVAS_WIDTH / 2 + 40, CANVAS_HEIGHT / 2 - 20, 30);
    
    p.fill(0);
    p.circle(CANVAS_WIDTH / 2 - 40, CANVAS_HEIGHT / 2 - 20, 15);
    p.circle(CANVAS_WIDTH / 2 + 40, CANVAS_HEIGHT / 2 - 20, 15);
  }
  
  // Game over after animation
  if (gameState.jumpscareFrame > 60) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
  }
}

function renderHUD(p) {
  // Power indicator
  p.fill(30, 30, 40);
  p.noStroke();
  p.rect(10, 10, 150, 60);
  
  p.fill(255, 255, 255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  p.text("POWER", 20, 15);
  
  // Power bar
  const powerBarWidth = 130;
  const powerBarHeight = 20;
  const powerPercent = gameState.power / 100;
  
  p.fill(50, 50, 50);
  p.rect(20, 35, powerBarWidth, powerBarHeight);
  
  const powerColor = powerPercent > 0.5 ? [0, 255, 0] : powerPercent > 0.2 ? [255, 255, 0] : [255, 0, 0];
  p.fill(...powerColor);
  p.rect(20, 35, powerBarWidth * powerPercent, powerBarHeight);
  
  p.fill(255);
  p.textSize(10);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(`${Math.ceil(gameState.power)}%`, 85, 45);
  
  // Power usage level
  p.fill(255, 255, 100);
  p.textSize(10);
  p.textAlign(p.LEFT, p.TOP);
  const usageLevel = getPowerUsageLevel();
  p.text(`Usage: ${'█'.repeat(usageLevel)}${'░'.repeat(5 - usageLevel)}`, 20, 60);
  
  // Time indicator
  p.fill(30, 30, 40);
  p.noStroke();
  p.rect(CANVAS_WIDTH - 160, 10, 150, 60);
  
  p.fill(255, 255, 255);
  p.textSize(14);
  p.textAlign(p.RIGHT, p.TOP);
  p.text("TIME", CANVAS_WIDTH - 20, 15);
  
  p.textSize(20);
  p.text(getTimeDisplay(), CANVAS_WIDTH - 20, 35);
  
  // Night indicator
  p.fill(200, 200, 200);
  p.textSize(10);
  p.text(`Night ${gameState.currentNight}`, CANVAS_WIDTH - 20, 60);
}

function renderPauseOverlay(p) {
  p.fill(255, 255, 100);
  p.textSize(14);
  p.textAlign(p.RIGHT, p.TOP);
  p.text("PAUSED", CANVAS_WIDTH - 10, 80);
}

function renderGameOverScreen(p) {
  p.background(20, 20, 30);
  
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    p.fill(0, 255, 0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(32);
    p.text("NIGHT COMPLETED!", CANVAS_WIDTH / 2, 120);
    
    p.fill(200, 200, 200);
    p.textSize(16);
    p.text(`You survived Night ${gameState.currentNight}!`, CANVAS_WIDTH / 2, 170);
    p.text("6 AM", CANVAS_WIDTH / 2, 200);
    
    // Show next night or victory message
    if (gameState.currentNight < 5) {
      p.fill(255, 255, 150);
      p.textSize(14);
      p.text(`Prepare for Night ${gameState.currentNight + 1}...`, CANVAS_WIDTH / 2, 240);
    } else {
      p.fill(255, 215, 0);
      p.textSize(20);
      p.text("YOU WIN! ALL NIGHTS COMPLETED!", CANVAS_WIDTH / 2, 240);
    }
  } else {
    p.fill(255, 0, 0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(32);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 120);
    
    p.fill(200, 200, 200);
    p.textSize(16);
    if (gameState.jumpscareAnimatronic) {
      p.text(`${gameState.jumpscareAnimatronic.name} got you!`, CANVAS_WIDTH / 2, 170);
    } else {
      p.text("You ran out of power!", CANVAS_WIDTH / 2, 170);
    }
    
    p.text(`Night ${gameState.currentNight}`, CANVAS_WIDTH / 2, 200);
    p.text(getTimeDisplay(), CANVAS_WIDTH / 2, 225);
  }
  
  p.fill(255, 255, 100);
  p.textSize(16);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
}