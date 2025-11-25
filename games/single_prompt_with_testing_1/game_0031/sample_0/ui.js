// ui.js - UI rendering functions
import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, BUS_TYPES, ROUTE_TIME_LIMIT } from './globals.js';

export function drawStartScreen(p) {
  p.background(20, 30, 50);
  
  // Title
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER);
  p.textSize(36);
  p.text("HAVENSBURG BUS SIMULATOR", 300, 60);
  
  // Subtitle
  p.fill(200, 200, 255);
  p.textSize(14);
  p.text("Build Your Transit Empire", 300, 85);
  
  // Description
  p.fill(220, 220, 220);
  p.textSize(12);
  p.textAlign(p.CENTER);
  const desc = [
    "Welcome to Havensburg Public Transit!",
    "",
    "OBJECTIVE:",
    "Complete routes by picking up and dropping off passengers",
    "at designated stops. Follow the route markers and maintain",
    "a clean safety record. Earn credits to unlock new buses!",
    "",
    "CONTROLS:",
    "↑/↓: Accelerate / Brake",
    "←/→: Steer Left / Right",
    "SPACE: Emergency Brake",
    "SHIFT: Honk Horn",
    "ESC: Pause Game",
    "",
    "TIPS:",
    "• Stop precisely at bus stops to pick up passengers",
    "• Complete routes within the time limit",
    "• Avoid accidents with obstacles",
    "• Earn 500 credits to unlock your next bus!"
  ];
  
  for (let i = 0; i < desc.length; i++) {
    p.text(desc[i], 300, 120 + i * 16);
  }
  
  // Press Enter prompt
  p.fill(255, 255, 100);
  p.textSize(18);
  if (p.frameCount % 60 < 30) {
    p.text("PRESS ENTER TO START", 300, 370);
  }
}

export function drawPauseOverlay(p) {
  p.push();
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, 600, 400);
  
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text("PAUSED", 590, 10);
  p.pop();
}

export function drawGameOverScreen(p, won) {
  p.push();
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, 600, 400);
  
  p.textAlign(p.CENTER);
  
  if (won) {
    p.fill(100, 255, 100);
    p.textSize(32);
    p.text("ROUTE COMPLETED!", 300, 150);
    
    p.fill(255, 255, 255);
    p.textSize(16);
    p.text(`Credits Earned: ${gameState.credits}`, 300, 200);
    p.text(`Routes Completed: ${gameState.completedRoutes}`, 300, 225);
    p.text(`Accidents: ${gameState.accidents}`, 300, 250);
    
    const nextBusCost = BUS_TYPES[gameState.unlockedBuses]?.cost || 0;
    if (gameState.unlockedBuses < BUS_TYPES.length) {
      if (gameState.credits >= nextBusCost) {
        p.fill(100, 255, 100);
        p.text(`NEW BUS UNLOCKED: ${BUS_TYPES[gameState.unlockedBuses].name}!`, 300, 285);
      } else {
        p.fill(255, 255, 100);
        p.text(`Next unlock at ${nextBusCost} credits`, 300, 285);
      }
    } else {
      p.fill(255, 215, 0);
      p.text("ALL BUSES UNLOCKED - TRANSIT MASTER!", 300, 285);
    }
  } else {
    p.fill(255, 100, 100);
    p.textSize(32);
    p.text("ROUTE FAILED", 300, 150);
    
    p.fill(255, 255, 255);
    p.textSize(16);
    p.text("Time ran out or too many accidents!", 300, 200);
    p.text(`Credits: ${gameState.credits}`, 300, 230);
  }
  
  p.fill(255, 255, 100);
  p.textSize(18);
  p.text("PRESS R TO RESTART", 300, 350);
  
  p.pop();
}

export function drawHUD(p) {
  p.push();
  
  // Top bar background
  p.fill(20, 20, 40, 220);
  p.noStroke();
  p.rect(0, 0, 600, 50);
  
  // Credits
  p.fill(255, 215, 0);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text(`Credits: ${gameState.credits}`, 10, 10);
  
  // Current bus
  const busType = BUS_TYPES[gameState.currentBusType];
  p.fill(...busType.color);
  p.text(`Bus: ${busType.name}`, 10, 30);
  
  // Passengers
  p.fill(255, 255, 255);
  p.textAlign(p.CENTER, p.TOP);
  p.text(`Passengers: ${gameState.passengers}/${gameState.maxPassengers}`, 300, 10);
  
  // Route progress
  p.text(`Stop ${gameState.routeProgress + 1}/${gameState.currentRoute.length}`, 300, 30);
  
  // Time remaining
  const timeLeft = Math.ceil(gameState.timeRemaining / 60);
  p.fill(timeLeft < 10 ? [255, 100, 100] : [255, 255, 255]);
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`Time: ${timeLeft}s`, 590, 10);
  
  // Accidents
  p.fill(gameState.accidents > 0 ? [255, 100, 100] : [100, 255, 100]);
  p.text(`Accidents: ${gameState.accidents}`, 590, 30);
  
  p.pop();
}

export function drawRouteArrow(p, fromX, fromY, toX, toY) {
  p.push();
  p.stroke(255, 255, 100, 150);
  p.strokeWeight(3);
  p.fill(255, 255, 100, 100);
  
  // Draw line
  p.line(fromX, fromY, toX, toY);
  
  // Draw arrow head
  const angle = p.atan2(toY - fromY, toX - fromX);
  p.translate(toX, toY);
  p.rotate(angle);
  p.triangle(-15, -8, -15, 8, 0, 0);
  
  p.pop();
}