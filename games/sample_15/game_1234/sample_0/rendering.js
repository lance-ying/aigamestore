// rendering.js - All rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, LEVELS } from './globals.js';

export function renderStartScreen(p) {
  p.background(135, 206, 235);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title
  p.textSize(48);
  p.fill(50, 50, 50);
  p.text("HILL CLIMB", CANVAS_WIDTH / 2 + 2, 80 + 2);
  p.fill(255, 200, 0);
  p.text("HILL CLIMB", CANVAS_WIDTH / 2, 80);
  
  p.textSize(36);
  p.fill(50, 50, 50);
  p.text("RACING", CANVAS_WIDTH / 2 + 2, 120 + 2);
  p.fill(255, 100, 0);
  p.text("RACING", CANVAS_WIDTH / 2, 120);
  
  // Description
  p.textSize(14);
  p.fill(50);
  p.text("Navigate treacherous terrain across 3 challenging stages!", CANVAS_WIDTH / 2, 170);
  p.text("Collect fuel and coins while avoiding crashes.", CANVAS_WIDTH / 2, 190);
  
  // Instructions
  p.textSize(16);
  p.fill(100);
  p.text("Controls:", CANVAS_WIDTH / 2, 230);
  p.textSize(14);
  p.text("→ Arrow Right: Accelerate", CANVAS_WIDTH / 2, 255);
  p.text("← Arrow Left: Brake/Reverse", CANVAS_WIDTH / 2, 275);
  p.text("ESC: Pause | R: Restart", CANVAS_WIDTH / 2, 295);
  
  // High score
  if (gameState.highScore > 0) {
    p.textSize(18);
    p.fill(255, 200, 0);
    p.text(`HIGH SCORE: ${gameState.highScore}`, CANVAS_WIDTH / 2, 330);
  }
  
  // Start prompt
  p.textSize(20);
  p.fill(0, 255, 0);
  const flash = Math.floor(p.frameCount / 30) % 2 === 0;
  if (flash) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
  }
}

export function renderGame(p) {
  // Sky background
  p.background(135, 206, 235);
  
  // Save transform state
  p.push();
  
  // Apply camera translation
  p.translate(-gameState.cameraX, 0);
  
  // Draw terrain
  drawTerrain(p);
  
  // Draw obstacles
  drawObstacles(p);
  
  // Draw collectibles
  drawCollectibles(p);
  
  // Draw vehicle
  drawVehicle(p);
  
  // Draw finish line
  drawFinishLine(p);
  
  p.pop();
  
  // Draw UI (not affected by camera)
  drawUI(p);
}

function drawTerrain(p) {
  p.fill(34, 139, 34);
  p.stroke(25, 100, 25);
  p.strokeWeight(2);
  
  gameState.terrainSegments.forEach(segment => {
    if (!segment.vertices) return;
    
    p.beginShape();
    segment.vertices.forEach(v => {
      p.vertex(v.x, v.y);
    });
    p.endShape(p.CLOSE);
  });
  
  p.strokeWeight(1);
}

function drawObstacles(p) {
  p.fill(100, 100, 100);
  p.stroke(80, 80, 80);
  p.strokeWeight(2);
  
  gameState.obstacles.forEach(obstacle => {
    if (obstacle.circleRadius) {
      p.circle(obstacle.position.x, obstacle.position.y, obstacle.circleRadius * 2);
    }
  });
  
  p.strokeWeight(1);
}

function drawCollectibles(p) {
  // Fuel canisters
  gameState.fuelCanisters.forEach(canister => {
    if (canister.collected) return;
    
    p.push();
    p.translate(canister.position.x, canister.position.y);
    
    // Red barrel with yellow stripe
    p.fill(200, 0, 0);
    p.stroke(150, 0, 0);
    p.strokeWeight(1);
    p.rect(-7.5, -10, 15, 20, 2);
    
    p.fill(255, 200, 0);
    p.noStroke();
    p.rect(-7.5, -2, 15, 4);
    
    p.pop();
  });
  
  // Coins
  gameState.coins.forEach(coin => {
    if (coin.collected) return;
    
    p.push();
    p.translate(coin.position.x, coin.position.y);
    
    // Yellow coin
    p.fill(255, 215, 0);
    p.stroke(200, 170, 0);
    p.strokeWeight(2);
    p.circle(0, 0, 20);
    
    p.fill(200, 170, 0);
    p.noStroke();
    p.textSize(12);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("$", 0, 0);
    
    p.pop();
  });
}

function drawVehicle(p) {
  if (!gameState.vehicleBody) return;
  
  // Draw rear wheel
  drawWheel(p, gameState.rearWheel);
  
  // Draw front wheel
  drawWheel(p, gameState.frontWheel);
  
  // Draw chassis
  p.push();
  p.translate(gameState.vehicleBody.position.x, gameState.vehicleBody.position.y);
  p.rotate(gameState.vehicleBody.angle);
  
  p.fill(80, 80, 80);
  p.stroke(60, 60, 60);
  p.strokeWeight(2);
  
  // Draw trapezoid chassis
  p.beginShape();
  gameState.vehicleBody.vertices.forEach(v => {
    const vx = v.x - gameState.vehicleBody.position.x;
    const vy = v.y - gameState.vehicleBody.position.y;
    p.vertex(vx, vy);
  });
  p.endShape(p.CLOSE);
  
  p.pop();
  
  // Draw driver head
  p.fill(255, 0, 0);
  p.stroke(200, 0, 0);
  p.strokeWeight(1);
  p.circle(gameState.driverHead.position.x, gameState.driverHead.position.y, 15);
}

function drawWheel(p, wheel) {
  if (!wheel) return;
  
  p.push();
  p.translate(wheel.position.x, wheel.position.y);
  p.rotate(wheel.angle);
  
  // Black tire
  p.fill(40, 40, 40);
  p.stroke(20, 20, 20);
  p.strokeWeight(2);
  p.circle(0, 0, wheel.circleRadius * 2);
  
  // Gray rim
  p.fill(120, 120, 120);
  p.noStroke();
  p.circle(0, 0, wheel.circleRadius * 1.2);
  
  // Spoke indicator
  p.stroke(80, 80, 80);
  p.strokeWeight(2);
  p.line(0, 0, wheel.circleRadius * 0.8, 0);
  
  p.pop();
}

function drawFinishLine(p) {
  const finishX = gameState.levelEndX;
  
  // Checkered flag pattern
  p.push();
  p.translate(finishX, 0);
  
  // Pole
  p.fill(100);
  p.noStroke();
  p.rect(-2, 100, 4, 200);
  
  // Flag
  const squareSize = 10;
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      if ((row + col) % 2 === 0) {
        p.fill(255);
      } else {
        p.fill(0);
      }
      p.rect(col * squareSize, 100 + row * squareSize, squareSize, squareSize);
    }
  }
  
  p.pop();
}

function drawUI(p) {
  // Fuel gauge
  p.fill(50, 50, 50, 200);
  p.rect(10, 10, 154, 19);
  
  const fuelWidth = (gameState.fuelLevel / gameState.maxFuel) * 150;
  let fuelColor;
  if (gameState.fuelLevel > 60) {
    fuelColor = p.color(0, 255, 0);
  } else if (gameState.fuelLevel > 30) {
    fuelColor = p.color(255, 255, 0);
  } else {
    fuelColor = p.color(255, 0, 0);
  }
  
  p.fill(fuelColor);
  p.noStroke();
  p.rect(12, 12, fuelWidth, 15);
  
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text("FUEL", 170, 12);
  
  // Distance
  p.fill(255);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(18);
  p.text(`DIST: ${Math.floor(gameState.currentDistance)}m`, CANVAS_WIDTH / 2, 10);
  
  // Coins
  p.fill(255, 215, 0);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(18);
  p.text(`COINS: ${gameState.currentCoins}`, CANVAS_WIDTH - 10, 10);
  
  // Score
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(24);
  p.text(`SCORE: ${gameState.currentScore}`, CANVAS_WIDTH - 10, 35);
  
  // Level indicator
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`STAGE: ${gameState.currentLevel}/3`, 10, 35);
}

export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  
  p.textSize(20);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  p.text("Press R to restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
}

export function renderGameOver(p) {
  p.background(50, 50, 50);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    p.textSize(48);
    p.fill(0, 255, 0);
    p.text("VICTORY!", CANVAS_WIDTH / 2, 100);
    
    p.fill(255);
    p.textSize(24);
    p.text("You completed all stages!", CANVAS_WIDTH / 2, 160);
  } else {
    p.textSize(48);
    p.fill(255, 0, 0);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 100);
    
    p.fill(255);
    p.textSize(20);
    if (gameState.fuelLevel <= 0) {
      p.text("Out of fuel!", CANVAS_WIDTH / 2, 160);
    } else {
      p.text("Your vehicle crashed!", CANVAS_WIDTH / 2, 160);
    }
  }
  
  p.fill(255, 215, 0);
  p.textSize(32);
  p.text(`FINAL SCORE: ${gameState.currentScore}`, CANVAS_WIDTH / 2, 220);
  
  if (gameState.currentScore > gameState.highScore) {
    p.fill(255, 100, 0);
    p.textSize(24);
    p.text("NEW HIGH SCORE!", CANVAS_WIDTH / 2, 260);
  }
  
  p.fill(255);
  p.textSize(20);
  p.text("Press R to restart", CANVAS_WIDTH / 2, 320);
}

export function renderLevelComplete(p) {
  p.background(50, 50, 100);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  
  const levelConfig = LEVELS[gameState.currentLevel - 1];
  
  p.textSize(48);
  p.fill(255, 215, 0);
  p.text(`STAGE ${gameState.currentLevel} COMPLETE!`, CANVAS_WIDTH / 2, 100);
  
  p.fill(255);
  p.textSize(24);
  p.text(levelConfig.name, CANVAS_WIDTH / 2, 150);
  
  p.textSize(28);
  p.fill(0, 255, 0);
  p.text("BONUS: 1000", CANVAS_WIDTH / 2, 200);
  
  p.fill(255, 215, 0);
  p.textSize(32);
  p.text(`TOTAL SCORE: ${gameState.currentScore}`, CANVAS_WIDTH / 2, 250);
  
  if (gameState.currentLevel < 3) {
    p.fill(255);
    p.textSize(20);
    const flash = Math.floor(p.frameCount / 30) % 2 === 0;
    if (flash) {
      p.text("Press SPACE for next stage", CANVAS_WIDTH / 2, 320);
    }
  } else {
    p.fill(0, 255, 0);
    p.textSize(24);
    p.text("ALL STAGES COMPLETE!", CANVAS_WIDTH / 2, 310);
    p.fill(255);
    p.textSize(18);
    p.text("Press R to restart", CANVAS_WIDTH / 2, 350);
  }
}