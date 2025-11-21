// renderer.js - Rendering functions

import { gameState, GAME_PHASES, DRAWING_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
  p.background(40, 40, 60);
  
  p.fill(255, 200, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('SUGAR, SUGAR', CANVAS_WIDTH / 2, 100);
  
  p.fill(200);
  p.textSize(16);
  p.text('Guide falling sugar particles into cups by drawing barriers!', CANVAS_WIDTH / 2, 160);
  p.text('Use color filters, gravity switches, and teleporters strategically.', CANVAS_WIDTH / 2, 185);
  
  p.textSize(14);
  p.fill(150, 200, 255);
  p.text('CONTROLS:', CANVAS_WIDTH / 2, 220);
  
  p.fill(180);
  p.textSize(12);
  p.text('SPACE: Activate cursor / Place drawing points', CANVAS_WIDTH / 2, 245);
  p.text('ARROW KEYS: Move cursor or adjust curve', CANVAS_WIDTH / 2, 265);
  p.text('D: Delete the most recently drawn barrier', CANVAS_WIDTH / 2, 285);
  p.text('ESC: Pause/Unpause or cancel drawing', CANVAS_WIDTH / 2, 305);
  
  p.fill(100, 255, 100);
  p.textSize(20);
  const pulse = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(100 * pulse, 255 * pulse, 100 * pulse);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 350);
}

export function renderGame(p) {
  // Background gradient
  for (let y = 0; y < CANVAS_HEIGHT; y++) {
    const inter = y / CANVAS_HEIGHT;
    const c = p.lerpColor(p.color(180, 220, 240), p.color(240, 240, 250), inter);
    p.stroke(c);
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Render all entities
  gameState.entities.forEach(entity => {
    if (entity && entity.render) {
      entity.render(p);
    }
  });
  
  // Render drawing in progress
  renderDrawingPreview(p);
  
  // Render cursor
  if (gameState.cursor.active) {
    renderCursor(p);
  }
  
  // UI
  renderUI(p);
}

function renderDrawingPreview(p) {
  if (gameState.drawingPhase === DRAWING_PHASES.IDLE) return;
  
  p.push();
  
  // Render first point
  if (gameState.firstPoint) {
    p.fill(100, 255, 100, 200);
    p.noStroke();
    p.circle(gameState.firstPoint.x, gameState.firstPoint.y, 12);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text('1', gameState.firstPoint.x, gameState.firstPoint.y);
  }
  
  // Render second point
  if (gameState.secondPoint) {
    p.fill(100, 100, 255, 200);
    p.noStroke();
    p.circle(gameState.secondPoint.x, gameState.secondPoint.y, 12);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text('2', gameState.secondPoint.x, gameState.secondPoint.y);
  }
  
  // Render curve preview
  if (gameState.firstPoint && gameState.secondPoint && gameState.controlPoint) {
    // Draw control point
    p.fill(255, 200, 100, 200);
    p.noStroke();
    p.circle(gameState.controlPoint.x, gameState.controlPoint.y, 12);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text('C', gameState.controlPoint.x, gameState.controlPoint.y);
    
    // Draw guide lines
    p.stroke(150, 150, 150, 100);
    p.strokeWeight(1);
    p.line(gameState.firstPoint.x, gameState.firstPoint.y, gameState.controlPoint.x, gameState.controlPoint.y);
    p.line(gameState.controlPoint.x, gameState.controlPoint.y, gameState.secondPoint.x, gameState.secondPoint.y);
    
    // Draw curve preview
    p.stroke(255, 200, 100, 200);
    p.strokeWeight(2);
    p.noFill();
    p.beginShape();
    for (let t = 0; t <= 1; t += 0.05) {
      const x = Math.pow(1 - t, 2) * gameState.firstPoint.x + 
                2 * (1 - t) * t * gameState.controlPoint.x + 
                Math.pow(t, 2) * gameState.secondPoint.x;
      const y = Math.pow(1 - t, 2) * gameState.firstPoint.y + 
                2 * (1 - t) * t * gameState.controlPoint.y + 
                Math.pow(t, 2) * gameState.secondPoint.y;
      p.vertex(x, y);
    }
    p.endShape();
  }
  
  p.pop();
}

function renderCursor(p) {
  p.push();
  
  const pulse = Math.sin(p.frameCount * 0.15) * 0.3 + 0.7;
  
  // Determine cursor color based on drawing phase
  let cursorColor, modeText;
  switch (gameState.drawingPhase) {
    case DRAWING_PHASES.FIRST_POINT:
      cursorColor = [100, 255, 100];
      modeText = 'Point 1';
      break;
    case DRAWING_PHASES.SECOND_POINT:
      cursorColor = [100, 100, 255];
      modeText = 'Point 2';
      break;
    case DRAWING_PHASES.CONTROL_POINT:
      cursorColor = [255, 200, 100];
      modeText = 'Curve';
      break;
    default:
      if (gameState.cursor.drawingMode) {
        cursorColor = [255, 100, 100];
        modeText = 'DRAW';
      } else {
        cursorColor = [100, 200, 255];
        modeText = 'MOVE';
      }
  }
  
  p.stroke(cursorColor[0], cursorColor[1], cursorColor[2], 200 * pulse);
  p.strokeWeight(3);
  p.fill(cursorColor[0], cursorColor[1], cursorColor[2], 100 * pulse);
  
  const size = 15;
  const cursorX = gameState.drawingPhase === DRAWING_PHASES.CONTROL_POINT ? 
                  gameState.controlPoint.x : gameState.cursor.x;
  const cursorY = gameState.drawingPhase === DRAWING_PHASES.CONTROL_POINT ? 
                  gameState.controlPoint.y : gameState.cursor.y;
  
  // Crosshair lines
  p.line(cursorX - size, cursorY, cursorX + size, cursorY);
  p.line(cursorX, cursorY - size, cursorX, cursorY + size);
  
  // Center circle
  p.circle(cursorX, cursorY, 8);
  
  // Outer ring
  p.noFill();
  p.strokeWeight(2);
  p.circle(cursorX, cursorY, 20 + pulse * 5);
  
  // Mode indicator text
  p.fill(255);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(10);
  p.text(modeText, cursorX, cursorY + 25);
  
  p.pop();
}

function renderUI(p) {
  // Top bar background
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 35);
  
  // Level and score
  p.fill(255);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(16);
  p.text(`Level: ${gameState.currentLevel}`, 10, 18);
  
  p.textAlign(p.CENTER, p.CENTER);
  p.text(`Spawned: ${gameState.sugarSpawned}`, CANVAS_WIDTH / 2, 18);
  
  p.textAlign(p.RIGHT, p.CENTER);
  p.text(`In Cups: ${gameState.sugarInCups}`, CANVAS_WIDTH - 10, 18);
  
  // Barriers count and cursor status
  const nonStaticBarriers = gameState.barriers.filter(b => !b.isStatic).length;
  p.fill(200, 200, 100);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(12);
  p.text(`Barriers: ${nonStaticBarriers}`, 10, CANVAS_HEIGHT - 10);
  
  // Cursor status
  if (gameState.cursor.active) {
    p.textAlign(p.RIGHT, p.CENTER);
    let statusText = 'Press SPACE to activate drawing';
    let statusColor = [150, 200, 255];
    
    switch (gameState.drawingPhase) {
      case DRAWING_PHASES.FIRST_POINT:
        statusText = 'Place first point with SPACE';
        statusColor = [100, 255, 100];
        break;
      case DRAWING_PHASES.SECOND_POINT:
        statusText = 'Place second point with SPACE';
        statusColor = [100, 100, 255];
        break;
      case DRAWING_PHASES.CONTROL_POINT:
        statusText = 'Adjust curve, press SPACE to finish';
        statusColor = [255, 200, 100];
        break;
      default:
        if (gameState.cursor.drawingMode) {
          statusText = 'Press SPACE to start drawing';
          statusColor = [255, 150, 150];
        }
    }
    
    p.fill(statusColor[0], statusColor[1], statusColor[2]);
    p.text(statusText, CANVAS_WIDTH - 10, CANVAS_HEIGHT - 10);
  } else {
    p.textAlign(p.RIGHT, p.CENTER);
    p.fill(150);
    p.text('Press SPACE to activate cursor', CANVAS_WIDTH - 10, CANVAS_HEIGHT - 10);
  }
}

export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  
  p.textSize(16);
  p.text('Press ESC to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

export function renderGameOver(p) {
  renderGame(p);
  
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    p.fill(100, 255, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text('LEVEL COMPLETE!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
    
    p.fill(255);
    p.textSize(20);
    p.text(`Sugar Collected: ${gameState.sugarInCups}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
    p.text(`Barriers Used: ${gameState.barriers.filter(b => !b.isStatic).length}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    
    p.fill(150, 200, 255);
    p.textSize(16);
    const pulse = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
    p.fill(150 * pulse, 200 * pulse, 255 * pulse);
    p.text('Press R to continue to next level', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    p.fill(255, 100, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text('CUP OVERFLOW!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
    
    p.fill(255);
    p.textSize(16);
    p.text('A cup has exceeded its maximum capacity', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
    
    p.fill(150, 200, 255);
    const pulse = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
    p.fill(150 * pulse, 200 * pulse, 255 * pulse);
    p.text('Press R to restart level', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
  }
}